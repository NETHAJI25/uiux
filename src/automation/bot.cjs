const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

let CONFIG = {};
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const TOKEN = process.env.ACCESS_TOKEN || CONFIG.access_token;
const IG_ID = process.env.IG_USER_ID || CONFIG.ig_user_id;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || CONFIG.poll_interval_seconds || '30', 10);

let KEYWORDS = {};
try { KEYWORDS = JSON.parse(process.env.KEYWORDS_JSON || 'null') || CONFIG.keywords || {}; } catch(e) {}

const PROCESSED_FILE = path.join(__dirname, 'processed.json');
const STATS_FILE = path.join(__dirname, 'stats.json');

// Load saved stats on restart so counters survive redeploys
let stats = { startTime: Date.now(), totalPolls: 0, totalCommentsFound: 0, totalCommentsProcessed: 0, totalRepliesSent: 0, totalDMsent: 0, totalErrors: 0, totalFallbackReplies: 0, keywordsTriggered: {}, lastPollTime: null, lastActivityTime: null, lastError: null, uptime: 0 };
function loadStats() {
  try { const s = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); stats = { ...stats, ...s, startTime: s.startTime || Date.now() }; } catch(e) {}
}
function saveStats() { stats.uptime = Date.now() - stats.startTime; try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch(e) {} }

function getDuration(ms) { const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return `${d}d ${h}h ${m}m ${s%60}s`; }
function formatTime(ts) { return new Date(ts).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'}); }

const API_BASE = 'graph.facebook.com';
function apiRequest(endpoint, method='GET', body=null) {
  return new Promise((resolve,reject)=>{
    const url = new URL(`https://${API_BASE}${endpoint.startsWith('/')?'':'/'}${endpoint}`);
    if (method==='GET') url.searchParams.append('access_token', TOKEN);
    const opts = { hostname: API_BASE, path: url.pathname+url.search+(method==='GET'?'':`&access_token=${TOKEN}`), method, headers: body?{'Content-Type':'application/json'}:{} };
    const req = https.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch{resolve(d)}}); });
    req.on('error', reject); if (body) req.write(JSON.stringify(body)); req.end();
  });
}

function loadProcessed() { try { return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')); } catch { return []; } }
function saveProcessed(entry) {
  const list = loadProcessed();
  list.push(entry);
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(list.slice(-500)));
}

function extractKeyword(text) { const u=text.toUpperCase(); for (const k of Object.keys(KEYWORDS)) { if (u.includes(k)) return k; } return null; }
async function replyToComment(cId, msg) { return await apiRequest(`/${cId}/replies?message=${encodeURIComponent(msg)}&access_token=${TOKEN}`, 'POST'); }
async function sendDM(recipientId, msg) { try { return await apiRequest(`/${IG_ID}/messages?access_token=${TOKEN}`, 'POST', { recipient: { id: recipientId }, message: { text: msg } }); } catch(e) { return { error: e.message }; } }

// Track bot start time to avoid re-replying to old comments on restart
const BOT_START_TIME = Date.now();

async function processComments(mediaId) {
  const comments = await apiRequest(`/${mediaId}/comments?fields=id,text,username,timestamp,from{id,username}&limit=50`);
  if (!comments.data) return;
  const processed = loadProcessed();
  for (const c of comments.data) {
    if (processed.some(p => p.id === c.id)) continue;
    stats.totalCommentsFound++;
    const keyword = extractKeyword(c.text);
    if (!keyword) continue;
    stats.totalCommentsProcessed++;
    stats.keywordsTriggered[keyword] = (stats.keywordsTriggered[keyword]||0)+1;

    // Check if this is an old comment (before bot started) — silently mark, don't reply
    const commentTime = c.timestamp ? new Date(c.timestamp).getTime() : 0;
    const isOld = commentTime < BOT_START_TIME;

    if (isOld) {
      // Silently mark old comments as processed — no reply, no DM
      saveProcessed({ id: c.id, username: c.from?.username || '?', text: c.text, keyword, replyOk: false, dmOk: false, fallback: false, skipped: true, ts: Date.now() });
      saveStats();
      continue;
    }

    stats.lastActivityTime = Date.now();
    const dmMsg = KEYWORDS[keyword];
    const replyTxt = `\u2705 "${keyword}" received! Check your DMs \uD83D\uDCE9`;
    const replyResult = await replyToComment(c.id, replyTxt);
    let replyOk = false, dmOk = false, fb = false;
    if (replyResult.error) { stats.totalErrors++; stats.lastError=`Reply error: ${JSON.stringify(replyResult.error)}`; console.log(`  Reply error: ${JSON.stringify(replyResult.error)}`); }
    else { stats.totalRepliesSent++; replyOk = true; console.log(`  \u2705 Replied to comment ${c.id}`); }
    const dmResult = await sendDM(c.from.id, dmMsg);
    if (dmResult.error) {
      stats.totalErrors++; stats.lastError=`DM error: ${JSON.stringify(dmResult.error)}`;
      console.log(`  DM error: ${JSON.stringify(dmResult.error)}`);
      await replyToComment(c.id, dmMsg); fb = true;
      stats.totalFallbackReplies++; console.log(`  \u26A0\uFE0F Sent link as comment reply instead`);
    } else { stats.totalDMsent++; dmOk = true; console.log(`  \u2705 DM sent to ${c.from.username}`); }
    saveProcessed({ id: c.id, username: c.from?.username || '?', text: c.text, keyword, replyOk, dmOk, fallback: fb, skipped: false, ts: Date.now() });
    saveStats();
  }
}

async function run() {
  stats.totalPolls++; stats.lastPollTime = Date.now();
  console.log(`\n[${new Date().toLocaleTimeString()}] Polling Instagram...`);
  const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
  if (media.error) { stats.totalErrors++; stats.lastError=`API: ${media.error.message||JSON.stringify(media.error)}`; console.log(`  \u2757 API ERROR: ${media.error.message||JSON.stringify(media.error)}`); saveStats(); return; }
  if (!media.data||!media.data.length) { console.log('  No media found'); saveStats(); return; }
  for (const p of media.data) { console.log(`  Post ${p.id} (${p.comments_count||0} comments)...`); if ((p.comments_count||0)>0) await processComments(p.id); }
  console.log('  Done'); saveStats();
}

// ─── HTML ───
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>IG Auto-DM</title>
<style>
  :root { --bg: #0a0a0b; --surface: #141416; --border: #1f1f23; --text: #f5f5f5; --muted: #6b6b7a; --accent: #2563eb; --green: #22c55e; --red: #ef4444; --yellow: #eab308; --radius: 10px; }
  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:var(--bg); color:var(--text); min-height:100vh; font-size:14px; }
  .layout { display:flex; min-height:100vh; }
  .sidebar { width:220px; background:var(--surface); border-right:1px solid var(--border); padding:20px 0; flex-shrink:0; display:none; }
  .sidebar .brand { padding:0 20px 18px; font-size:15px; font-weight:700; border-bottom:1px solid var(--border); margin-bottom:8px; }
  .sidebar .brand small { color:var(--muted); font-weight:400; font-size:11px; }
  .sidebar .nav-item { display:flex; align-items:center; gap:10px; padding:9px 20px; font-size:13px; color:var(--muted); cursor:pointer; transition:.12s; border:none; background:none; width:100%; text-align:left; font-family:inherit; }
  .sidebar .nav-item:hover { color:var(--text); background:#1c1c20; }
  .sidebar .nav-item.active { color:var(--text); background:#0f1a0f; border-right:2px solid var(--green); }
  .sidebar .nav-item .icon { font-size:15px; }
  .sidebar .footer { padding:16px 20px 0; font-size:11px; color:var(--muted); border-top:1px solid var(--border); margin-top:16px; }
  .main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--surface); border-bottom:1px solid var(--border); }
  .topbar h1 { font-size:16px; }
  .status { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); }
  .dot { width:7px; height:7px; border-radius:50%; background:var(--green); display:inline-block; }
  .content { flex:1; overflow-y:auto; padding:16px; padding-bottom:80px; }
  @media(min-width:768px){
    .sidebar { display:block; }
    .topbar { display:none; }
    .content { padding:24px 32px; }
    .bottom-nav { display:none!important; }
  }
  .bottom-nav { position:fixed; bottom:0; left:0; right:0; background:var(--surface); border-top:1px solid var(--border); display:flex; padding-bottom:env(safe-area-inset-bottom); z-index:50; }
  .bottom-nav .nav-item { flex:1; padding:6px 4px; text-align:center; border:none; background:none; font-family:inherit; font-size:10px; color:var(--muted); cursor:pointer; }
  .bottom-nav .nav-item .icon { font-size:18px; display:block; margin-bottom:1px; }
  .bottom-nav .nav-item.active { color:var(--accent); }
  .page { display:none; } .page.active { display:block; }
  h2 { font-size:16px; font-weight:600; margin-bottom:14px; }
  .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:16px; }
  @media(min-width:768px){ .grid { grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; } }
  .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:12px; }
  .card .lbl { font-size:10px; text-transform:uppercase; color:var(--muted); letter-spacing:.3px; }
  .card .val { font-size:24px; font-weight:700; margin-top:2px; line-height:1.2; }
  .card .val.gr { color:var(--green); } .card .val.bl { color:var(--accent); } .card .val.yl { color:var(--yellow); } .card .val.rd { color:var(--red); }
  .section-label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin:18px 0 8px; }
  .box { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:12px 14px; font-size:13px; line-height:2; }
  .box .r { display:flex; justify-content:space-between; align-items:center; }
  .box .lbl { color:var(--muted); } .box .val { text-align:right; word-break:break-word; }
  table { width:100%; border-collapse:collapse; background:var(--surface); border-radius:var(--radius); overflow:hidden; border:1px solid var(--border); font-size:12px; }
  th { text-align:left; padding:8px 10px; font-size:10px; text-transform:uppercase; color:var(--muted); letter-spacing:.3px; border-bottom:1px solid var(--border); }
  td { padding:8px 10px; border-bottom:1px solid #151518; vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  .kw { background:#1e2a4a; color:#93c5fd; padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; white-space:nowrap; }
  .chip { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10px; font-weight:600; }
  .chip-done { background:#052e16; color:#86efac; } .chip-fail { background:#450a0a; color:#fca5a5; } .chip-warn { background:#422006; color:#fde68a; }
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:5px; padding:7px 14px; border:none; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; transition:.12s; font-family:inherit; }
  .btn:active { transform:scale(.97); }
  .btn-p { background:var(--accent); color:#fff; } .btn-p:hover { background:#1d4ed8; }
  .btn-d { background:var(--red); color:#fff; }
  .btn-g { background:transparent; color:var(--muted); border:1px solid var(--border); } .btn-g:hover { color:var(--text); border-color:#444; }
  .btn-s { padding:4px 9px; font-size:11px; }
  input,textarea { background:#18181b; border:1px solid var(--border); color:var(--text); padding:9px 12px; border-radius:7px; font-size:13px; width:100%; font-family:inherit; outline:none; }
  input:focus,textarea:focus { border-color:var(--accent); }
  textarea { resize:vertical; min-height:60px; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.8); display:none; align-items:flex-end; justify-content:center; z-index:100; }
  @media(min-width:768px){ .modal-overlay { align-items:center; } }
  .modal-overlay.open { display:flex; }
  .modal { background:var(--surface); border-radius:14px 14px 0 0; padding:20px 16px; width:100%; max-width:480px; max-height:85vh; overflow-y:auto; }
  @media(min-width:768px){ .modal { border-radius:14px; } }
  .modal h3 { font-size:16px; margin-bottom:14px; }
  .modal .f { margin-bottom:10px; }
  .modal .f label { display:block; font-size:12px; color:var(--muted); margin-bottom:3px; }
  .modal .actions { display:flex; gap:8px; margin-top:14px; }
  .modal .actions .btn { flex:1; }
  .empty { text-align:center; padding:30px 16px; color:var(--muted); }
  .empty .icon { font-size:28px; margin-bottom:6px; }
  .empty p { font-size:13px; line-height:1.5; }
  .toast-cont { position:fixed; top:12px; right:12px; z-index:200; display:flex; flex-direction:column; gap:5px; }
  .toast { padding:9px 14px; border-radius:8px; font-size:13px; color:#fff; animation:slideIn .2s ease; max-width:300px; box-shadow:0 4px 12px rgba(0,0,0,.5); }
  .toast.ok { background:#166534; } .toast.err { background:#7f1d1d; } .toast.info { background:#1e3a5f; }
  @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  .bar-bg { background:#222; border-radius:3px; height:6px; width:100%; }
  .bar-fill { height:6px; border-radius:3px; background:var(--accent); }
  .flex { display:flex; align-items:center; gap:6px; } .flex-wrap { flex-wrap:wrap; } .flex-1 { flex:1; } .mb-1 { margin-bottom:6px; } .mt-1 { margin-top:6px; } .w-full { width:100%; }
  .help { background:#0f1a0f; border:1px solid #22c55e22; border-radius:var(--radius); padding:12px; margin-bottom:14px; font-size:13px; line-height:1.6; }
  .help strong { color:var(--green); }
  .code { font-family:monospace; background:#222; padding:1px 4px; border-radius:3px; font-size:11px; }
  .inbox-item { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:12px; margin-bottom:8px; }
  .inbox-item .head { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
  .inbox-item .head .user { font-weight:600; font-size:13px; }
  .inbox-item .head .time { font-size:11px; color:var(--muted); }
  .inbox-item .comment { font-size:12px; color:#bbb; margin-bottom:6px; }
  .inbox-item .status { display:flex; gap:6px; flex-wrap:wrap; }
</style>
</head>
<body>
<div class="layout">
<div class="sidebar">
  <div class="brand">IG Auto-DM <small>v2</small></div>
  <button class="nav-item active" data-page="dashboard"><span class="icon">📊</span> Dashboard</button>
  <button class="nav-item" data-page="keywords"><span class="icon">⚡</span> Keywords</button>
  <button class="nav-item" data-page="inbox"><span class="icon">📨</span> Inbox</button>
  <button class="nav-item" data-page="settings"><span class="icon">⚙️</span> Settings</button>
  <div class="footer"><div id="sbUptime">--</div><div id="sbPolls">--</div></div>
</div>
<div class="main">
<div class="topbar"><h1>IG Auto-DM</h1><div class="status"><span class="dot"></span><span id="tbUptime">--</span></div></div>
<div class="content">

<!-- DASHBOARD -->
<div class="page active" id="page-dashboard">
  <div class="help"><strong>✅ How it works:</strong> When someone comments a keyword (like <span class="code">PORTFOLIO</span>) on your Instagram post, the bot replies with a teaser and sends them a DM with the link. Manage keywords in the <strong>Keywords</strong> tab.</div>
  <div class="grid">
    <div class="card"><div class="lbl">Polls</div><div class="val bl" id="totalPolls">0</div></div>
    <div class="card"><div class="lbl">Comments</div><div class="val" id="totalCommentsFound">0</div></div>
    <div class="card"><div class="lbl">Processed</div><div class="val gr" id="totalCommentsProcessed">0</div></div>
    <div class="card"><div class="lbl">Replies</div><div class="val bl" id="totalRepliesSent">0</div></div>
    <div class="card"><div class="lbl">DMs Sent</div><div class="val gr" id="totalDMsent">0</div></div>
    <div class="card"><div class="lbl">Fallbacks</div><div class="val yl" id="totalFallbackReplies">0</div></div>
    <div class="card"><div class="lbl">Errors</div><div class="val rd" id="totalErrors">0</div></div>
  </div>
  <div class="section-label">⚡ Keyword Performance</div>
  <div id="kwPerf"><div class="empty"><div class="icon">📊</div><p>No keywords triggered yet.</p></div></div>
  <div class="section-label">📋 Recent Activity</div>
  <div class="box">
    <div class="r"><span class="lbl">Last Poll</span><span class="val" id="lastPoll">--</span></div>
    <div class="r"><span class="lbl">Last Trigger</span><span class="val" id="lastActivity">--</span></div>
    <div class="r" id="lastErrorR" style="display:none;"><span class="lbl">Error</span><span class="val" style="color:var(--red);font-size:12px;" id="lastError"></span></div>
  </div>
</div>

<!-- KEYWORDS -->
<div class="page" id="page-keywords">
  <div class="help"><strong>⚡ Keywords:</strong> Each keyword = an auto-reply trigger. When someone comments that word, the bot replies instantly and sends the DM below. <strong>Test any keyword</strong> by tapping the "Test" button.</div>
  <div class="flex flex-wrap mb-1"><button class="btn btn-p flex-1" onclick="openModal()">+ Add Keyword</button></div>
  <div id="kwList"></div>
</div>

<!-- INBOX -->
<div class="page" id="page-inbox">
  <div class="help"><strong>📨 Inbox:</strong> Every keyword trigger is logged here — who commented, what they said, and whether the bot replied successfully.</div>
  <div id="inboxContent"><div class="empty"><div class="icon">📭</div><p>No activity yet.</p></div></div>
</div>

<!-- SETTINGS -->
<div class="page" id="page-settings">
  <div class="section-label">Status</div>
  <div class="box">
    <div class="r"><span class="lbl">Status</span><span class="val"><span class="chip chip-done">● Live</span></span></div>
    <div class="r"><span class="lbl">Uptime</span><span class="val" id="sUptime">--</span></div>
    <div class="r"><span class="lbl">Started</span><span class="val" id="sStart">--</span></div>
  </div>
  <div class="section-label">Config</div>
  <div class="box">
    <div class="r"><span class="lbl">Poll Interval</span><span class="val">${POLL_INTERVAL}s</span></div>
    <div class="r"><span class="lbl">Keywords</span><span class="val" id="sKwCount">${Object.keys(KEYWORDS).length}</span></div>
    <div class="r"><span class="lbl">IG ID</span><span class="val" style="font-size:11px;font-family:monospace;">${IG_ID}</span></div>
    <div class="r"><span class="lbl">Token</span><span class="val" style="font-size:11px;">${TOKEN?TOKEN.substring(0,12)+'...':'Not set'}</span></div>
  </div>
</div>

</div></div></div>

<!-- Bottom Nav -->
<div class="bottom-nav">
  <button class="nav-item active" data-page="dashboard"><span class="icon">📊</span>Dashboard</button>
  <button class="nav-item" data-page="keywords"><span class="icon">⚡</span>Keywords</button>
  <button class="nav-item" data-page="inbox"><span class="icon">📨</span>Inbox</button>
  <button class="nav-item" data-page="settings"><span class="icon">⚙️</span>Settings</button>
</div>

<!-- Modal -->
<div class="modal-overlay" id="kwModal">
  <div class="modal">
    <h3 id="modalTitle">Add Keyword</h3>
    <div class="f"><label>Keyword (what users comment)</label><input id="kwKey" placeholder="e.g. PORTFOLIO" maxlength="30" style="text-transform:uppercase;" autocomplete="off"></div>
    <div class="f"><label>DM Response (what bot sends)</label><textarea id="kwVal" rows="3" placeholder="Hey! Thanks! Here's the link: https://..."></textarea></div>
    <div class="actions"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="saveKw()">Save</button></div>
  </div>
</div>

<div class="toast-cont" id="toastCont"></div>

<script>
let KW = {}; let editKey = null;
function toast(m,t='ok'){const e=document.createElement('div');e.className='toast '+t;e.textContent=m;document.getElementById('toastCont').appendChild(e);setTimeout(()=>e.remove(),3000);}
document.querySelectorAll('.nav-item').forEach(el=>{el.addEventListener('click',()=>{
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('page-'+el.dataset.page).classList.add('active');
  if(el.dataset.page==='keywords') loadKW();
  if(el.dataset.page==='inbox') loadInbox();
})});

// DASHBOARD
async function refreshDash(){
  try{
    const r=await fetch('/api/stats'); const d=await r.json();
    ['totalPolls','totalCommentsFound','totalCommentsProcessed','totalRepliesSent','totalDMsent','totalFallbackReplies','totalErrors'].forEach(k=>{const e=document.getElementById(k);if(e)e.textContent=d[k]||0});
    const u=d.uptimeStr||'--'; document.getElementById('tbUptime').textContent=u; document.getElementById('sbUptime').textContent='Uptime: '+u; document.getElementById('sbPolls').textContent='Polls: '+(d.totalPolls||0);
    document.getElementById('lastPoll').textContent=d.lastPollStr||'--'; document.getElementById('lastActivity').textContent=d.lastActivityStr||'--';
    if(d.lastError){document.getElementById('lastErrorR').style.display='flex';document.getElementById('lastError').textContent=d.lastError;}
    else{document.getElementById('lastErrorR').style.display='none';}
    const kp=document.getElementById('kwPerf'),keys=Object.keys(d.keywordsTriggered);
    if(!keys.length){kp.innerHTML='<div class="empty"><div class="icon">📊</div><p>No keywords triggered yet.</p></div>';return;}
    const mv=Math.max(...keys.map(k=>d.keywordsTriggered[k]),1);
    let h='<table><tr><th>Keyword</th><th>Count</th><th></th></tr>';
    for(const k of keys.sort((a,b)=>d.keywordsTriggered[b]-d.keywordsTriggered[a]))
      h+='<tr><td><span class="kw">'+k+'</span></td><td>'+d.keywordsTriggered[k]+'</td><td><div class="bar-bg"><div class="bar-fill" style="width:'+(d.keywordsTriggered[k]/mv*100).toFixed(0)+'%"></div></div></td></tr>';
    h+='</table>'; kp.innerHTML=h;
  }catch(e){}
}
refreshDash(); setInterval(refreshDash,8000);

// KEYWORDS
async function loadKW(){try{const r=await fetch('/api/keywords');const d=await r.json();KW=d.keywords||{};renderKW();}catch(e){toast('Failed to load','err');}}
function renderKW(){
  const keys=Object.keys(KW),div=document.getElementById('kwList');
  if(!keys.length){div.innerHTML='<div class="empty"><div class="icon">⚡</div><p>No keywords. Tap "+ Add Keyword" to start.</p></div>';return;}
  let h='<table><tr><th>Keyword</th><th>DM Response</th><th></th><th></th></tr>';
  for(const k of keys) h+='<tr><td style="width:70px;"><span class="kw">'+k+'</span></td><td style="font-size:11px;max-width:180px;word-break:break-word;line-height:1.4;">'+esc(KW[k])+'</td>'
    +'<td style="width:40px;"><button class="btn btn-s btn-g" onclick="testKW(\''+k+'\')">Test</button></td>'
    +'<td style="width:50px;"><div class="flex" style="justify-content:flex-end;">'
    +'<button class="btn btn-s btn-g" onclick="editKW(\''+k+'\')">Edit</button>'
    +'<button class="btn btn-s btn-d" onclick="delKW(\''+k+'\')">Del</button></div></td></tr>';
  h+='</table>'; div.innerHTML=h;
}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function openModal(k){editKey=k||null;document.getElementById('modalTitle').textContent=k?'Edit':'Add Keyword';document.getElementById('kwKey').value=k||'';document.getElementById('kwKey').disabled=!!k;document.getElementById('kwVal').value=k?KW[k]||'':'';document.getElementById('kwModal').classList.add('open');}
function closeModal(){document.getElementById('kwModal').classList.remove('open');}
function editKW(k){openModal(k);}
async function saveKw(){const key=document.getElementById('kwKey').value.trim().toUpperCase();const val=document.getElementById('kwVal').value.trim();if(!key||!val){toast('Fill both fields','err');return;}
  KW[key]=val;await pushKW();renderKW();closeModal();toast('Saved!');}
async function delKW(k){if(!confirm('Delete "'+k+'"?'))return;delete KW[k];await pushKW();renderKW();toast('Deleted');}
async function pushKW(){await fetch('/api/keywords',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({keywords:KW})});}
async function testKW(k){
  const m=KW[k]; if(!m){toast('No response for '+k,'err');return;}
  const r=await fetch('/api/test-trigger',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({keyword:k,username:'test_user',text:k})});
  const d=await r.json(); if(d.ok){toast('Test triggered! Check Inbox \u2705');loadInbox();}else{toast('Test failed','err');}
}

// INBOX
async function loadInbox(){
  try{
    const r=await fetch('/api/inbox'); const d=await r.json();
    const div=document.getElementById('inboxContent');
    if(!d.items||!d.items.length){div.innerHTML='<div class="empty"><div class="icon">📭</div><p>No activity yet.</p></div>';return;}
    let h='';
    for(const item of d.items.slice().reverse()){
      const t=item.ts?new Date(item.ts).toLocaleString():'--';
      const skipped = item.skipped;
      h+='<div class="inbox-item" style="'+(skipped?'opacity:0.5;':'')+'">'
        +'<div class="head"><span class="user">@'+(item.username||'unknown')+'</span><span class="time">'+t+'</span></div>'
        +'<div class="comment">"'+esc(item.text||'')+'" &rarr; <span class="kw">'+(item.keyword||'?')+'</span></div>'
        +'<div class="status">'
        +(skipped
          ? '<span class="chip chip-warn">⏭ Skipped (old comment)</span>'
          : '<span class="chip '+(item.replyOk?'chip-done':'chip-fail')+'">Reply '+(item.replyOk?'\u2705':'\u274C')+'</span>'
          + '<span class="chip '+(item.dmOk?'chip-done':item.fallback?'chip-warn':'chip-fail')+'">DM '+(item.dmOk?'\u2705':item.fallback?'\u26A0\uFE0F Fallback':'\u274C')+'</span>'
        )+'</div></div>';
    }
    div.innerHTML=h;
  }catch(e){toast('Failed to load inbox','err');}
}

// SETTINGS
async function refreshSet(){try{const r=await fetch('/api/stats');const d=await r.json();document.getElementById('sUptime').textContent=d.uptimeStr||'--';document.getElementById('sStart').textContent=d.startTime?new Date(d.startTime).toLocaleString():'--';}catch(e){}}
setInterval(refreshSet,10000); refreshSet();
</script>
</body>
</html>`;

// ─── HTTP SERVER ───
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (url === '/api/stats' && method === 'GET') {
    stats.uptime = Date.now() - stats.startTime;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...stats, uptimeStr: getDuration(stats.uptime), lastPollStr: stats.lastPollTime ? formatTime(stats.lastPollTime) : null, lastActivityStr: stats.lastActivityTime ? formatTime(stats.lastActivityTime) : null }));
    return;
  }

  if (url === '/api/keywords' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ keywords: KEYWORDS }));
    return;
  }
  if (url === '/api/keywords' && method === 'POST') {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => {
      try {
        const { keywords } = JSON.parse(b);
        if (!keywords) { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing keywords' })); return; }
        KEYWORDS = keywords;
        try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.keywords = keywords; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
        res.writeHead(200); res.end(JSON.stringify({ ok: true, count: Object.keys(KEYWORDS).length }));
      } catch(e) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); }
    });
    return;
  }

  if (url === '/api/inbox' && method === 'GET') {
    const items = loadProcessed();
    // Handle legacy format
    const normalized = items.map(i => ({ id: i.id || '', username: i.username || 'unknown', text: i.text || '', keyword: i.keyword || '?', replyOk: i.replyOk || false, dmOk: i.dmOk || false, fallback: i.fallback || false, skipped: i.skipped || false, ts: i.ts || 0 }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items: normalized }));
    return;
  }

  if (url === '/api/test-trigger' && method === 'POST') {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => {
      try {
        const { keyword, username, text } = JSON.parse(b);
        if (!keyword || !KEYWORDS[keyword]) { res.writeHead(400); res.end(JSON.stringify({ error: 'Keyword not found' })); return; }
        const entry = { id: 'test_' + Date.now(), username: username || 'test_user', text: text || keyword, keyword, replyOk: true, dmOk: false, fallback: true, ts: Date.now() };
        saveProcessed(entry);
        stats.totalCommentsFound++; stats.totalCommentsProcessed++; stats.keywordsTriggered[keyword] = (stats.keywordsTriggered[keyword] || 0) + 1;
        stats.lastActivityTime = Date.now(); saveStats();
        res.writeHead(200); res.end(JSON.stringify({ ok: true }));
      } catch(e) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid' })); }
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(HTML);
}).listen(PORT, () => { console.log(`   Dashboard at http://localhost:${PORT}`); });

loadStats();
console.log('🤖 Instagram Auto-DM Bot Started');
console.log(`   Polling every ${POLL_INTERVAL}s`);
console.log(`   Keywords watched: ${Object.keys(KEYWORDS).join(', ')}`);
console.log('');
run();
setInterval(run, POLL_INTERVAL * 1000);
