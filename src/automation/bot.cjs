const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

let CONFIG = {};
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const TOKEN = process.env.ACCESS_TOKEN || CONFIG.access_token;
const IG_ID = process.env.IG_USER_ID || CONFIG.ig_user_id;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || CONFIG.poll_interval_seconds || '30', 10);

let KEYWORDS = {};
try { KEYWORDS = JSON.parse(process.env.KEYWORDS_JSON || 'null') || CONFIG.keywords || {}; } catch(e) {}

const PROCESSED_FILE = path.join(__dirname, 'processed.json');
const STATS_FILE = path.join(__dirname, 'stats.json');

let stats = {
  startTime: Date.now(), totalPolls: 0, totalCommentsFound: 0, totalCommentsProcessed: 0,
  totalRepliesSent: 0, totalDMsent: 0, totalErrors: 0, totalFallbackReplies: 0,
  keywordsTriggered: {}, lastPollTime: null, lastActivityTime: null, lastError: null, uptime: 0
};

function loadStats() {
  try { const s = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); stats = { ...stats, ...s, startTime: s.startTime || Date.now() }; } catch(e) {}
}
function saveStats() {
  stats.uptime = Date.now() - stats.startTime;
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch(e) {}
}
function getDuration(ms) {
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m ${s % 60}s`;
}
function formatTime(ts) { return new Date(ts).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }); }

const API_BASE = 'graph.facebook.com';

function apiRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);
    if (method === 'GET') url.searchParams.append('access_token', TOKEN);
    const opts = {
      hostname: API_BASE,
      path: url.pathname + url.search + (method === 'GET' ? '' : `&access_token=${TOKEN}`),
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function loadProcessed() {
  try { return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')); } catch { return []; }
}
function saveProcessed(id) {
  const list = loadProcessed();
  list.push({ id, ts: Date.now() });
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(list.slice(-500)));
}

function extractKeyword(text) {
  const upper = text.toUpperCase();
  for (const kw of Object.keys(KEYWORDS)) { if (upper.includes(kw)) return kw; }
  return null;
}

async function replyToComment(commentId, message) {
  return await apiRequest(`/${commentId}/replies?message=${encodeURIComponent(message)}&access_token=${TOKEN}`, 'POST');
}

async function sendDM(recipientIgId, message) {
  try {
    return await apiRequest(`/${IG_ID}/messages?access_token=${TOKEN}`, 'POST', { recipient: { id: recipientIgId }, message: { text: message } });
  } catch (e) { return { error: e.message }; }
}

async function processComments(mediaId) {
  const comments = await apiRequest(`/${mediaId}/comments?fields=id,text,username,from{id,username}&limit=50`);
  if (!comments.data) return;
  const processed = loadProcessed();
  for (const comment of comments.data) {
    if (processed.some(p => p.id === comment.id)) continue;
    stats.totalCommentsFound++;
    const keyword = extractKeyword(comment.text);
    if (!keyword) continue;
    stats.totalCommentsProcessed++;
    stats.keywordsTriggered[keyword] = (stats.keywordsTriggered[keyword] || 0) + 1;
    stats.lastActivityTime = Date.now();
    const dmMessage = KEYWORDS[keyword];
    const replyText = `✅ "${keyword}" received! Check your DMs 📩`;
    const replyResult = await replyToComment(comment.id, replyText);
    if (replyResult.error) { stats.totalErrors++; stats.lastError = `Reply error: ${JSON.stringify(replyResult.error)}`; console.log(`  Reply error: ${JSON.stringify(replyResult.error)}`); }
    else { stats.totalRepliesSent++; console.log(`  ✅ Replied to comment ${comment.id}`); }
    const dmResult = await sendDM(comment.from.id, dmMessage);
    if (dmResult.error) {
      stats.totalErrors++; stats.lastError = `DM error: ${JSON.stringify(dmResult.error)}`;
      console.log(`  DM error for user ${comment.from.id}: ${JSON.stringify(dmResult.error)}`);
      await replyToComment(comment.id, dmMessage);
      stats.totalFallbackReplies++; console.log(`  ⚠️ Sent link as comment reply instead`);
    } else { stats.totalDMsent++; console.log(`  ✅ DM sent to ${comment.from.username} (${comment.from.id})`); }
    saveProcessed(comment.id); saveStats();
  }
}

async function run() {
  stats.totalPolls++; stats.lastPollTime = Date.now();
  console.log(`\n[${new Date().toLocaleTimeString()}] Polling Instagram...`);
  const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
  if (!media.data || media.data.length === 0) { console.log('  No media found'); saveStats(); return; }
  for (const post of media.data) {
    console.log(`  Checking post ${post.id} (${post.comments_count || 0} comments)...`);
    if ((post.comments_count || 0) > 0) await processComments(post.id);
  }
  console.log('  Done'); saveStats();
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>IG Auto-DM</title>
<style>
  :root { --bg: #0d0d0d; --surface: #171717; --border: #262626; --text: #f5f5f5; --muted: #737373; --accent: #2563eb; --green: #22c55e; --red: #ef4444; --yellow: #eab308; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
  .topbar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
  .topbar h1 { font-size: 16px; font-weight: 700; } .topbar h1 span { color: var(--muted); font-weight: 400; font-size: 11px; }
  .topbar-right { display: flex; align-items: center; gap: 8px; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); display: inline-block; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
  .content { flex: 1; overflow-y: auto; padding: 12px 12px 80px; }
  .page { display: none; } .page.active { display: block; }
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--border); display: flex; z-index: 50; padding-bottom: env(safe-area-inset-bottom); }
  .nav-item { flex: 1; padding: 8px 4px; text-align: center; cursor: pointer; font-size: 10px; color: var(--muted); transition: .15s; border: none; background: none; font-family: inherit; }
  .nav-item .icon { font-size: 20px; display: block; margin-bottom: 2px; }
  .nav-item.active { color: var(--accent); } .nav-item.active .icon { color: var(--accent); }
  @media (min-width: 768px) {
    body { flex-direction: row; }
    .topbar { display: none; }
    .sidebar { width: 220px; background: var(--surface); border-right: 1px solid var(--border); padding: 20px 0; flex-shrink: 0; min-height: 100vh; }
    .sidebar .logo { padding: 0 20px 20px; font-size: 16px; font-weight: 700; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
    .sidebar .logo span { color: var(--muted); font-weight: 400; font-size: 12px; }
    .sidebar .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 14px; color: var(--muted); cursor: pointer; transition: .15s; }
    .sidebar .nav-item:hover { color: var(--text); background: #1f1f1f; }
    .sidebar .nav-item.active { color: var(--text); background: #1a2a1a; border-right: 3px solid var(--green); }
    .sidebar .nav-item .icon { font-size: 16px; display: inline; margin: 0; }
    .bottom-nav { display: none; }
    .content { padding: 24px 32px 24px; }
  }
  .section-title { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; margin: 20px 0 10px; }
  .cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; }
  @media (min-width: 768px) { .cards { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; } }
  .card { background: var(--surface); border-radius: 10px; padding: 12px; border: 1px solid var(--border); }
  .card .lbl { font-size: 10px; text-transform: uppercase; color: var(--muted); letter-spacing: .3px; }
  .card .val { font-size: 22px; font-weight: 700; margin-top: 2px; line-height: 1.2; }
  .card .val.green { color: var(--green); } .card .val.blue { color: var(--accent); } .card .val.yellow { color: var(--yellow); } .card .val.red { color: var(--red); }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-green { background: #052e16; color: var(--green); } .badge-red { background: #450a0a; color: var(--red); }
  .box { background: var(--surface); border-radius: 10px; padding: 14px; border: 1px solid var(--border); font-size: 13px; line-height: 1.8; }
  .box .row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
  .box .row .l { color: var(--muted); } .box .row .r { text-align: right; word-break: break-word; }
  table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: 10px; overflow: hidden; border: 1px solid var(--border); font-size: 12px; }
  th { text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; color: var(--muted); letter-spacing: .3px; border-bottom: 1px solid var(--border); }
  td { padding: 8px 10px; border-bottom: 1px solid #1a1a1a; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .keyword-tag { background: #1e3a5f; color: #93c5fd; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; white-space: nowrap; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 14px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: .15s; font-family: inherit; }
  .btn:active { transform: scale(.97); }
  .btn-primary { background: var(--accent); color: #fff; } .btn-primary:hover { background: #1d4ed8; }
  .btn-danger { background: var(--red); color: #fff; }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); } .btn-ghost:hover { color: var(--text); border-color: #444; }
  .btn-sm { padding: 5px 10px; font-size: 11px; }
  .btn-block { width: 100%; }
  input, textarea { background: #1a1a1a; border: 1px solid var(--border); color: var(--text); padding: 10px 12px; border-radius: 8px; font-size: 14px; width: 100%; font-family: inherit; outline: none; transition: .15s; }
  input:focus, textarea:focus { border-color: var(--accent); }
  textarea { resize: vertical; min-height: 70px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.8); display: none; align-items: flex-end; justify-content: center; z-index: 100; }
  @media (min-width: 768px) { .modal-overlay { align-items: center; } }
  .modal-overlay.open { display: flex; }
  .modal { background: var(--surface); border-radius: 16px 16px 0 0; padding: 24px 16px 20px; width: 100%; max-width: 500px; border: 1px solid var(--border); max-height: 85vh; overflow-y: auto; }
  @media (min-width: 768px) { .modal { border-radius: 16px; } }
  .modal h2 { font-size: 17px; margin-bottom: 16px; }
  .modal .field { margin-bottom: 12px; }
  .modal .field label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  .modal .actions { display: flex; gap: 8px; margin-top: 16px; }
  .modal .actions .btn { flex: 1; }
  .empty-state { text-align: center; padding: 30px 20px; color: var(--muted); }
  .empty-state .icon { font-size: 32px; margin-bottom: 8px; }
  .empty-state p { font-size: 13px; line-height: 1.5; }
  .toast-container { position: fixed; top: 12px; right: 12px; z-index: 200; display: flex; flex-direction: column; gap: 6px; }
  .toast { padding: 10px 16px; border-radius: 8px; font-size: 13px; color: #fff; animation: slideIn .2s ease; max-width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,.4); }
  .toast.success { background: #166534; } .toast.error { background: #7f1d1d; } .toast.info { background: #1e3a5f; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .bar-bg { background: #222; border-radius: 3px; width: 100%; height: 6px; }
  .bar-fill { height: 6px; border-radius: 3px; background: var(--accent); }
  .help-banner { background: #1a2a1a; border: 1px solid #22c55e33; border-radius: 10px; padding: 14px; margin-bottom: 16px; font-size: 13px; line-height: 1.6; }
  .help-banner strong { color: var(--green); }
  .inline-code { font-family: monospace; background: #222; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
  .flex { display: flex; align-items: center; gap: 8px; } .flex-wrap { flex-wrap: wrap; } .flex-1 { flex: 1; } .gap-2 { gap: 4px; } .mt-2 { margin-top: 8px; } .mb-2 { margin-bottom: 8px; } .w-full { width: 100%; }
  .stat-time { font-size: 11px; color: var(--muted); margin-top: 8px; text-align: center; }
</style>
</head>
<body>

<!-- TOP BAR (mobile) -->
<div class="topbar">
  <h1>IG Auto-DM <span>v2</span></h1>
  <div class="topbar-right">
    <span class="live-dot" id="mobileLiveDot"></span>
    <span style="font-size:12px;color:var(--muted);" id="mobileUptime">--</span>
  </div>
</div>

<!-- SIDEBAR (desktop) -->
<div class="sidebar">
  <div class="logo">IG Auto-DM <span>v2</span></div>
  <div class="nav-item active" data-page="dashboard"><span class="icon">📊</span> Dashboard</div>
  <div class="nav-item" data-page="keywords"><span class="icon">⚡</span> Keywords</div>
  <div class="nav-item" data-page="inbox"><span class="icon">📨</span> Inbox</div>
  <div class="nav-item" data-page="settings"><span class="icon">⚙️</span> Settings</div>
  <div style="margin-top:20px;padding:0 20px;font-size:11px;color:var(--muted);">
    <div id="sidebarUptime">--</div>
    <div id="sidebarPolls" style="margin-top:2px;">--</div>
  </div>
</div>

<!-- MAIN CONTENT -->
<div class="content">

<!-- DASHBOARD -->
<div class="page active" id="page-dashboard">
  <div class="help-banner">
    <strong>✅ How it works:</strong> When someone comments a keyword (like <span class="inline-code">PORTFOLIO</span>) on your Instagram post, the bot replies automatically and sends them a DM with your design link. Add/edit keywords in the <strong>Keywords</strong> tab.
  </div>
  <div class="cards">
    <div class="card"><div class="lbl">Polls</div><div class="val blue" id="totalPolls">0</div></div>
    <div class="card"><div class="lbl">Comments</div><div class="val" id="totalCommentsFound">0</div></div>
    <div class="card"><div class="lbl">Processed</div><div class="val green" id="totalCommentsProcessed">0</div></div>
    <div class="card"><div class="lbl">Replies</div><div class="val blue" id="totalRepliesSent">0</div></div>
    <div class="card"><div class="lbl">DMs Sent</div><div class="val green" id="totalDMsent">0</div></div>
    <div class="card"><div class="lbl">Fallbacks</div><div class="val yellow" id="totalFallbackReplies">0</div></div>
    <div class="card"><div class="lbl">Errors</div><div class="val red" id="totalErrors">0</div></div>
  </div>

  <div class="section-title">⚡ Keyword Performance</div>
  <div id="keywordTable"><div class="empty-state"><div class="icon">📊</div><p>No keywords triggered yet. When someone comments a keyword on your post, it'll show up here.</p></div></div>

  <div class="section-title">📋 Last Activity</div>
  <div class="box">
    <div class="row"><span class="l">Last Poll:</span><span class="r" id="lastPoll">--</span></div>
    <div class="row"><span class="l">Last Trigger:</span><span class="r" id="lastActivity">--</span></div>
    <div class="row" id="lastErrorRow" style="display:none;"><span class="l" style="color:var(--red);">Last Error:</span><span class="r" style="color:var(--red);font-size:12px;" id="lastError"></span></div>
  </div>
</div>

<!-- KEYWORDS -->
<div class="page" id="page-keywords">
  <div class="help-banner">
    <strong>⚡ How keywords work:</strong> Add a keyword (e.g. <span class="inline-code">PORTFOLIO</span>) and the DM message the bot should send when someone comments it. The bot auto-detects keywords in comments and replies within 30 seconds.
  </div>
  <div class="flex flex-wrap mb-2">
    <button class="btn btn-primary flex-1" onclick="openModal()">+ Add Keyword</button>
  </div>
  <div id="keywordsList"></div>
</div>

<!-- INBOX -->
<div class="page" id="page-inbox">
  <div class="help-banner">
    <strong>📨 Inbox:</strong> Every time someone triggers a keyword, it's logged here. Shows the comment ID and timestamp.
  </div>
  <div id="inboxList"><div class="empty-state"><div class="icon">📭</div><p>No activity yet. When a keyword is triggered, it appears here.</p></div></div>
</div>

<!-- SETTINGS -->
<div class="page" id="page-settings">
  <div class="section-title">Bot Status</div>
  <div class="box">
    <div class="row"><span class="l">Status</span><span class="r"><span class="badge badge-green" id="settingsStatus">● Live</span></span></div>
    <div class="row"><span class="l">Uptime</span><span class="r" id="settingsUptime">--</span></div>
    <div class="row"><span class="l">Started</span><span class="r" id="settingsStart">--</span></div>
  </div>
  <div class="section-title">Configuration</div>
  <div class="box">
    <div class="row"><span class="l">Poll Interval</span><span class="r">${POLL_INTERVAL}s</span></div>
    <div class="row"><span class="l">Keywords Loaded</span><span class="r" id="kwCount">${Object.keys(KEYWORDS).length}</span></div>
    <div class="row"><span class="l">IG Account ID</span><span class="r" style="font-size:11px;font-family:monospace;">${IG_ID}</span></div>
    <div class="row"><span class="l">Token</span><span class="r" style="font-size:11px;">${TOKEN ? TOKEN.substring(0,12) + '...' : 'Not set'}</span></div>
  </div>
</div>
</div>

<!-- BOTTOM NAV (mobile) -->
<div class="bottom-nav">
  <button class="nav-item active" data-page="dashboard"><span class="icon">📊</span>Dashboard</button>
  <button class="nav-item" data-page="keywords"><span class="icon">⚡</span>Keywords</button>
  <button class="nav-item" data-page="inbox"><span class="icon">📨</span>Inbox</button>
  <button class="nav-item" data-page="settings"><span class="icon">⚙️</span>Settings</button>
</div>

<!-- MODAL -->
<div class="modal-overlay" id="keywordModal">
  <div class="modal">
    <h2 id="modalTitle">Add Keyword</h2>
    <div class="field">
      <label>Keyword (what users comment)</label>
      <input id="kwKey" placeholder="e.g. PORTFOLIO" maxlength="30" style="text-transform:uppercase;" autocomplete="off">
      <div style="font-size:11px;color:var(--muted);margin-top:4px;">Users type this word in their comment to trigger the bot</div>
    </div>
    <div class="field">
      <label>DM Response (what the bot sends)</label>
      <textarea id="kwValue" rows="3" placeholder="Hey! Thanks for engaging! Here's the link: https://..."></textarea>
      <div style="font-size:11px;color:var(--muted);margin-top:4px;">This message is sent as a DM when someone comments the keyword</div>
    </div>
    <div class="actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="kwSaveBtn" onclick="saveKeyword()">Save Keyword</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div class="toast-container" id="toastContainer"></div>

<script>
let localKeywords = {};
let editingKey = null;

function toast(msg, type = 'success') {
  const el = document.createElement('div'); el.className = 'toast ' + type; el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// NAVIGATION
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('page-' + el.dataset.page).classList.add('active');
    if (el.dataset.page === 'keywords') loadKeywords();
    if (el.dataset.page === 'inbox') loadInbox();
  });
});

// DASHBOARD
async function refreshDash() {
  try {
    const r = await fetch('/api/stats'); const d = await r.json();
    ['totalPolls','totalCommentsFound','totalCommentsProcessed','totalRepliesSent','totalDMsent','totalFallbackReplies','totalErrors'].forEach(k => {
      const el = document.getElementById(k); if (el) el.textContent = d[k] || 0;
    });
    const u = d.uptimeStr || '--';
    document.getElementById('mobileUptime').textContent = u;
    document.getElementById('sidebarUptime').textContent = 'Uptime: ' + u;
    document.getElementById('sidebarPolls').textContent = 'Polls: ' + (d.totalPolls || 0);
    document.getElementById('lastPoll').textContent = d.lastPollStr || '--';
    document.getElementById('lastActivity').textContent = d.lastActivityStr || '--';
    if (d.lastError) {
      document.getElementById('lastErrorRow').style.display = 'flex';
      document.getElementById('lastError').textContent = d.lastError;
    } else { document.getElementById('lastErrorRow').style.display = 'none'; }
    // Keyword perf table
    const kwDiv = document.getElementById('keywordTable');
    const keys = Object.keys(d.keywordsTriggered);
    if (!keys.length) { kwDiv.innerHTML = '<div class="empty-state"><div class="icon">📊</div><p>No keywords triggered yet. When someone comments a keyword on your post, it\'ll show up here.</p></div>'; }
    else {
      const maxVal = Math.max(...keys.map(k => d.keywordsTriggered[k]), 1);
      let html = '<table><tr><th>Keyword</th><th>Count</th><th></th></tr>';
      for (const k of keys.sort((a,b) => d.keywordsTriggered[b] - d.keywordsTriggered[a])) {
        html += '<tr><td><span class="keyword-tag">' + k + '</span></td><td>' + d.keywordsTriggered[k] + '</td><td><div class="bar-bg"><div class="bar-fill" style="width:' + (d.keywordsTriggered[k]/maxVal*100).toFixed(0) + '%"></div></div></td></tr>';
      }
      html += '</table>'; kwDiv.innerHTML = html;
    }
  } catch(e) { console.log('Dash refresh failed'); }
}
refreshDash(); setInterval(refreshDash, 8000);

// KEYWORDS
async function loadKeywords() {
  try {
    const r = await fetch('/api/keywords'); const d = await r.json();
    localKeywords = d.keywords || {}; renderKeywords();
  } catch(e) { toast('Failed to load keywords', 'error'); }
}
function renderKeywords() {
  const keys = Object.keys(localKeywords);
  const div = document.getElementById('keywordsList');
  if (!keys.length) {
    div.innerHTML = '<div class="empty-state"><div class="icon">⚡</div><p>No keywords added yet. Tap "+ Add Keyword" to create your first trigger.</p></div>';
    return;
  }
  let html = '<table><tr><th>Keyword</th><th>DM Response</th><th></th></tr>';
  for (const k of keys) {
    html += '<tr><td style="width:80px;"><span class="keyword-tag">' + k + '</span></td>'
      + '<td style="font-size:11px;max-width:200px;word-break:break-word;line-height:1.4;">' + esc(localKeywords[k]) + '</td>'
      + '<td style="width:70px;"><div class="flex gap-2" style="justify-content:flex-end;">'
      + '<button class="btn btn-sm btn-ghost" onclick="editKw(\'' + k + '\')">Edit</button>'
      + '<button class="btn btn-sm btn-danger" onclick="deleteKw(\'' + k + '\')">Del</button>'
      + '</div></td></tr>';
  }
  html += '</table>'; div.innerHTML = html;
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function openModal(key) {
  editingKey = key || null;
  document.getElementById('modalTitle').textContent = key ? 'Edit Keyword' : 'Add Keyword';
  document.getElementById('kwKey').value = key || '';
  document.getElementById('kwKey').disabled = !!key;
  document.getElementById('kwValue').value = key ? (localKeywords[key] || '') : '';
  document.getElementById('keywordModal').classList.add('open');
}
function closeModal() { document.getElementById('keywordModal').classList.remove('open'); }
function editKw(k) { openModal(k); }

async function saveKeyword() {
  const key = document.getElementById('kwKey').value.trim().toUpperCase();
  const val = document.getElementById('kwValue').value.trim();
  if (!key || !val) { toast('Fill in both fields', 'error'); return; }
  localKeywords[key] = val;
  await pushKeywords(); renderKeywords(); closeModal(); toast('Keyword saved!');
}
async function deleteKw(key) {
  if (!confirm('Delete "' + key + '"?')) return;
  delete localKeywords[key]; await pushKeywords(); renderKeywords(); toast('Keyword deleted');
}
async function pushKeywords() {
  await fetch('/api/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: localKeywords }) });
}

// INBOX
async function loadInbox() {
  try {
    const r = await fetch('/api/inbox'); const d = await r.json();
    const div = document.getElementById('inboxList');
    if (!d.items || !d.items.length) { div.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No activity yet. When a keyword is triggered, it appears here.</p></div>'; return; }
    let html = '<table><tr><th>Time</th><th>Comment ID</th></tr>';
    for (const item of d.items.slice().reverse()) {
      html += '<tr><td style="font-size:11px;color:var(--muted);">' + (item.ts ? new Date(item.ts).toLocaleString() : '--') + '</td><td style="font-family:monospace;font-size:11px;">' + item.id + '</td></tr>';
    }
    html += '</table>'; div.innerHTML = html;
  } catch(e) { toast('Failed to load inbox', 'error'); }
}

// SETTINGS
async function refreshSettings() {
  try {
    const r = await fetch('/api/stats'); const d = await r.json();
    document.getElementById('settingsUptime').textContent = d.uptimeStr || '--';
    document.getElementById('settingsStart').textContent = d.startTime ? new Date(d.startTime).toLocaleString() : '--';
    document.getElementById('kwCount').textContent = Object.keys(localKeywords).length || '${Object.keys(KEYWORDS).length}';
  } catch(e) {}
}
setInterval(refreshSettings, 10000); refreshSettings();
</script>
</body>
</html>`;

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { keywords } = JSON.parse(body);
        if (keywords) {
          KEYWORDS = keywords;
          try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.keywords = keywords; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, count: Object.keys(KEYWORDS).length }));
        } else { res.writeHead(400); res.end(JSON.stringify({ error: 'Missing keywords' })); }
      } catch(e) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid JSON' })); }
    });
    return;
  }
  if (url === '/api/inbox' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items: loadProcessed() }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(HTML);
}).listen(PORT, () => { console.log(`   Dashboard & API at http://localhost:${PORT}`); });

loadStats();
console.log('🤖 Instagram Auto-DM Bot Started');
console.log(`   Polling every ${POLL_INTERVAL}s`);
console.log(`   Keywords watched: ${Object.keys(KEYWORDS).join(', ')}`);
console.log('');
run();
setInterval(run, POLL_INTERVAL * 1000);
