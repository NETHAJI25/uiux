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

// ─── HTML DASHBOARD ─────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IG Auto-DM Manager</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #eee; display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background: #111; border-right: 1px solid #222; padding: 20px 0; flex-shrink: 0; }
  .sidebar .logo { padding: 0 20px 20px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #222; margin-bottom: 12px; }
  .sidebar .logo span { color: #666; font-weight: 400; font-size: 12px; }
  .nav-item { padding: 10px 20px; cursor: pointer; font-size: 14px; color: #888; display: flex; align-items: center; gap: 10px; transition: .15s; }
  .nav-item:hover { color: #eee; background: #1a1a1a; }
  .nav-item.active { color: #fff; background: #1a2a1a; border-right: 3px solid #22c55e; }
  .main { flex: 1; padding: 24px; overflow-y: auto; max-height: 100vh; }
  .page { display: none; }
  .page.active { display: block; }
  h1 { font-size: 22px; margin-bottom: 20px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .card { background: #151515; border-radius: 10px; padding: 16px; border: 1px solid #222; }
  .card .label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: .5px; }
  .card .value { font-size: 26px; font-weight: 700; margin-top: 4px; }
  .card .value.green { color: #22c55e; } .card .value.blue { color: #3b82f6; } .card .value.yellow { color: #eab308; } .card .value.red { color: #ef4444; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; }
  .badge.online { background: #166534; color: #86efac; } .badge.offline { background: #7f1d1d; color: #fca5a5; }
  table { width: 100%; border-collapse: collapse; background: #151515; border-radius: 10px; overflow: hidden; border: 1px solid #222; }
  th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: .5px; border-bottom: 1px solid #222; }
  td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #1a1a1a; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .bar { height: 6px; border-radius: 3px; background: #3b82f6; max-width: 100%; } .bar-bg { background: #222; border-radius: 3px; width: 100%; }
  button, .btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: .15s; }
  .btn-primary { background: #2563eb; color: #fff; } .btn-primary:hover { background: #1d4ed8; }
  .btn-danger { background: #dc2626; color: #fff; } .btn-danger:hover { background: #b91c1c; }
  .btn-sm { padding: 5px 10px; font-size: 11px; }
  .btn-ghost { background: transparent; color: #888; border: 1px solid #333; } .btn-ghost:hover { color: #eee; border-color: #555; }
  input, textarea, select { background: #1a1a1a; border: 1px solid #333; color: #eee; padding: 8px 12px; border-radius: 8px; font-size: 13px; width: 100%; font-family: inherit; }
  textarea { resize: vertical; min-height: 60px; }
  input:focus, textarea:focus { outline: none; border-color: #2563eb; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); display: none; align-items: center; justify-content: center; z-index: 100; }
  .modal-overlay.open { display: flex; }
  .modal { background: #151515; border-radius: 12px; padding: 24px; width: 500px; max-width: 90vw; border: 1px solid #333; }
  .modal h2 { margin-bottom: 16px; font-size: 18px; }
  .modal .field { margin-bottom: 12px; }
  .modal .field label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
  .modal .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  .toast { position: fixed; bottom: 20px; right: 20px; background: #166534; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 13px; display: none; z-index: 200; }
  .toast.error { background: #7f1d1d; }
  .toast.show { display: block; }
  .meta-box { background: #151515; border-radius: 10px; padding: 16px; border: 1px solid #222; font-size: 13px; line-height: 2; }
  .meta-box span { color: #888; }
  .keyword-row { display: flex; align-items: center; gap: 8px; }
  .keyword-row .kw-badge { background: #1e3a5f; color: #93c5fd; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; white-space: nowrap; }
  .empty { color: #555; font-size: 14px; padding: 20px; text-align: center; }
  .flex { display: flex; align-items: center; gap: 8px; }
  .flex-wrap { flex-wrap: wrap; }
  .gap-4 { gap: 16px; }
  .mb-4 { margin-bottom: 16px; }
  .mt-4 { margin-top: 16px; }
  .w-full { width: 100%; }
  .inline-code { font-family: monospace; font-size: 12px; background: #222; padding: 2px 6px; border-radius: 4px; }
  .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 200; display: flex; flex-direction: column; gap: 8px; }
  .toast-msg { padding: 12px 20px; border-radius: 8px; font-size: 13px; color: #fff; animation: slideIn .2s ease; max-width: 400px; }
  .toast-msg.success { background: #166534; }
  .toast-msg.error { background: #7f1d1d; }
  .toast-msg.info { background: #1e3a5f; }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; background: #111; border-radius: 8px; padding: 3px; width: fit-content; }
  .tab { padding: 6px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #888; border: none; background: transparent; }
  .tab.active { background: #222; color: #fff; }
</style>
</head>
<body>
<div class="sidebar">
  <div class="logo">IG Auto-DM <span>v2</span></div>
  <div class="nav-item active" data-page="dashboard">📊 Dashboard</div>
  <div class="nav-item" data-page="keywords">⚡ Keywords</div>
  <div class="nav-item" data-page="inbox">📨 Inbox</div>
  <div class="nav-item" data-page="settings">⚙️ Settings</div>
</div>
<div class="main">

<!-- DASHBOARD PAGE -->
<div class="page active" id="page-dashboard">
  <div class="flex flex-wrap gap-4 mb-4">
    <h1>Dashboard</h1>
    <div id="liveBadge" class="badge online">● Live</div>
    <div class="badge" id="uptimeBadge">⏱ --</div>
  </div>
  <div class="cards">
    <div class="card"><div class="label">Polls Run</div><div class="value blue" id="totalPolls">0</div></div>
    <div class="card"><div class="label">Comments Found</div><div class="value" id="totalCommentsFound">0</div></div>
    <div class="card"><div class="label">Processed</div><div class="value green" id="totalCommentsProcessed">0</div></div>
    <div class="card"><div class="label">Replies Sent</div><div class="value blue" id="totalRepliesSent">0</div></div>
    <div class="card"><div class="label">DMs Sent</div><div class="value green" id="totalDMsent">0</div></div>
    <div class="card"><div class="label">Fallbacks</div><div class="value yellow" id="totalFallbackReplies">0</div></div>
    <div class="card"><div class="label">Errors</div><div class="value red" id="totalErrors">0</div></div>
  </div>
  <h2 style="font-size:15px;margin-bottom:8px;">⚡ Keyword Performance</h2>
  <div id="keywordTable"></div>
  <h2 style="font-size:15px;margin:16px 0 8px;">📋 Activity</h2>
  <div class="meta-box">
    <div><span>Last Poll:</span> <span id="lastPoll">--</span></div>
    <div><span>Last Activity:</span> <span id="lastActivity">--</span></div>
    <div id="lastErrorRow" style="display:none;"><span>Last Error:</span> <span style="color:#ef4444;" id="lastError"></span></div>
  </div>
</div>

<!-- KEYWORDS PAGE -->
<div class="page" id="page-keywords">
  <div class="flex flex-wrap gap-4 mb-4">
    <h1>Keywords</h1>
    <button class="btn btn-primary" onclick="openKeywordModal()">+ Add Keyword</button>
    <button class="btn btn-ghost" onclick="saveAllKeywords()">💾 Save All to Bot</button>
  </div>
  <p style="font-size:13px;color:#666;margin-bottom:16px;">Edit DM response templates. Changes save to the bot instantly.</p>
  <div id="keywordsList"></div>
</div>

<!-- INBOX PAGE -->
<div class="page" id="page-inbox">
  <h1>Inbox</h1>
  <p style="font-size:13px;color:#666;margin-bottom:16px;">Recent comments that triggered keyword responses.</p>
  <div id="inboxList"><div class="empty">No activity yet.</div></div>
</div>

<!-- SETTINGS PAGE -->
<div class="page" id="page-settings">
  <h1>Settings</h1>
  <div class="meta-box" style="margin-bottom:16px;">
    <div><span>Poll Interval:</span> ${POLL_INTERVAL}s</div>
    <div><span>Keywords Count:</span> <span id="kwCount">${Object.keys(KEYWORDS).length}</span></div>
    <div><span>IG User ID:</span> ${IG_ID}</div>
    <div><span>Token Prefix:</span> ${TOKEN ? TOKEN.substring(0, 15) + '...' : 'Not set'}</div>
  </div>
  <div class="meta-box">
    <div><span>Uptime:</span> <span id="settingsUptime">--</span></div>
    <div><span>Start Time:</span> <span id="startTime">--</span></div>
  </div>
</div>
</div>

<!-- KEYWORD MODAL -->
<div class="modal-overlay" id="keywordModal">
  <div class="modal">
    <h2 id="modalTitle">Add Keyword</h2>
    <div class="field"><label>Keyword (e.g. DARK)</label><input id="kwKey" placeholder="KEYWORD" maxlength="30" style="text-transform:uppercase;"></div>
    <div class="field"><label>DM Response</label><textarea id="kwValue" rows="3" placeholder="Hey! Thanks for engaging! Here's the link: ..."></textarea></div>
    <div class="actions">
      <button class="btn btn-ghost" onclick="closeKeywordModal()">Cancel</button>
      <button class="btn btn-primary" id="kwSaveBtn" onclick="saveKeyword()">Save</button>
    </div>
  </div>
</div>

<!-- TOAST CONTAINER -->
<div class="toast-container" id="toastContainer"></div>

<script>
let localKeywords = {};
let editingKey = null;

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast-msg ' + type;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── NAVIGATION ───
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('page-' + el.dataset.page).classList.add('active');
    if (el.dataset.page === 'keywords') loadKeywordsPage();
    if (el.dataset.page === 'inbox') loadInbox();
    if (el.dataset.page === 'settings') loadSettings();
  });
});

// ─── DASHBOARD ───
async function refreshDashboard() {
  try {
    const r = await fetch('/api/stats'); const d = await r.json();
    ['totalPolls','totalCommentsFound','totalCommentsProcessed','totalRepliesSent','totalDMsent','totalFallbackReplies','totalErrors'].forEach(k => {
      document.getElementById(k).textContent = d[k] || 0;
    });
    document.getElementById('uptimeBadge').textContent = '⏱ ' + d.uptimeStr;
    document.getElementById('lastPoll').textContent = d.lastPollStr || '--';
    document.getElementById('lastActivity').textContent = d.lastActivityStr || '--';
    document.getElementById('liveBadge').className = 'badge online';
    if (d.lastError) { document.getElementById('lastErrorRow').style.display = ''; document.getElementById('lastError').textContent = d.lastError; }
    else { document.getElementById('lastErrorRow').style.display = 'none'; }
    const kwDiv = document.getElementById('keywordTable');
    const keys = Object.keys(d.keywordsTriggered);
    if (!keys.length) { kwDiv.innerHTML = '<div class="empty">No keywords triggered yet.</div>'; }
    else {
      const maxVal = Math.max(...keys.map(k => d.keywordsTriggered[k]), 1);
      let html = '<table><tr><th>Keyword</th><th>Triggered</th><th></th></tr>';
      for (const k of keys.sort((a,b) => d.keywordsTriggered[b] - d.keywordsTriggered[a])) {
        html += '<tr><td style="font-weight:600;">' + k + '</td><td>' + d.keywordsTriggered[k] + '</td><td><div class="bar-bg"><div class="bar" style="width:' + (d.keywordsTriggered[k]/maxVal*100).toFixed(0) + '%"></div></div></td></tr>';
      }
      html += '</table>'; kwDiv.innerHTML = html;
    }
  } catch(e) { document.getElementById('liveBadge').className = 'badge offline'; }
}
refreshDashboard(); setInterval(refreshDashboard, 10000);

// ─── KEYWORDS ───
async function loadKeywordsPage() {
  try {
    const r = await fetch('/api/keywords'); const d = await r.json();
    localKeywords = d.keywords || {};
    renderKeywords();
  } catch(e) { toast('Failed to load keywords', 'error'); }
}

function renderKeywords() {
  const keys = Object.keys(localKeywords);
  const div = document.getElementById('keywordsList');
  if (!keys.length) { div.innerHTML = '<div class="empty">No keywords added yet. Click "+ Add Keyword" to start.</div>'; return; }
  let html = '<table><tr><th>Keyword</th><th>DM Response</th><th style="width:100px;">Actions</th></tr>';
  for (const k of keys) {
    html += '<tr><td style="font-weight:700;color:#93c5fd;">' + k + '</td>'
      + '<td style="font-size:12px;max-width:400px;word-break:break-word;">' + escapeHtml(localKeywords[k]) + '</td>'
      + '<td><div class="flex">'
      + '<button class="btn btn-sm btn-ghost" onclick="editKeyword(\'' + k + '\')">Edit</button>'
      + '<button class="btn btn-sm btn-danger" onclick="deleteKeyword(\'' + k + '\')">Del</button>'
      + '</div></td></tr>';
  }
  html += '</table>'; div.innerHTML = html;
}

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function openKeywordModal(key) {
  editingKey = key || null;
  document.getElementById('modalTitle').textContent = key ? 'Edit Keyword' : 'Add Keyword';
  document.getElementById('kwKey').value = key || '';
  document.getElementById('kwKey').disabled = !!key;
  document.getElementById('kwValue').value = key ? (localKeywords[key] || '') : '';
  document.getElementById('keywordModal').classList.add('open');
}

function closeKeywordModal() { document.getElementById('keywordModal').classList.remove('open'); }

async function saveKeyword() {
  const key = document.getElementById('kwKey').value.trim().toUpperCase();
  const val = document.getElementById('kwValue').value.trim();
  if (!key || !val) { toast('Keyword and response are required', 'error'); return; }
  localKeywords[key] = val;
  await pushKeywords(); renderKeywords(); closeKeywordModal(); toast('Keyword saved!');
}

async function deleteKeyword(key) {
  if (!confirm('Delete "' + key + '" keyword?')) return;
  delete localKeywords[key];
  await pushKeywords(); renderKeywords(); toast('Keyword deleted');
}

async function pushKeywords() {
  await fetch('/api/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: localKeywords }) });
}

async function saveAllKeywords() {
  await pushKeywords(); toast('All keywords saved to bot!', 'info');
}

function editKeyword(k) { openKeywordModal(k); }

// ─── INBOX ───
async function loadInbox() {
  try {
    const r = await fetch('/api/inbox'); const d = await r.json();
    const div = document.getElementById('inboxList');
    if (!d.items || !d.items.length) { div.innerHTML = '<div class="empty">No activity yet. Comments that trigger keywords will appear here.</div>'; return; }
    let html = '<table><tr><th>Time</th><th>Comment ID</th></tr>';
    for (const item of d.items.slice().reverse()) {
      html += '<tr><td class="time">' + (item.ts ? new Date(item.ts).toLocaleString() : '--') + '</td><td style="font-family:monospace;font-size:12px;">' + item.id + '</td></tr>';
    }
    html += '</table>'; div.innerHTML = html;
  } catch(e) { toast('Failed to load inbox', 'error'); }
}

// ─── SETTINGS ───
async function loadSettings() {
  try {
    const r = await fetch('/api/stats'); const d = await r.json();
    document.getElementById('settingsUptime').textContent = d.uptimeStr || '--';
    document.getElementById('startTime').textContent = d.startTime ? new Date(d.startTime).toLocaleString() : '--';
  } catch(e) {}
}
</script>
</body>
</html>`;

// ─── HTTP SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  // CORS
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
          // Try saving to config.json
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config.keywords = keywords;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          } catch(e) { /* config.json might not be writable in cloud */ }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, count: Object.keys(KEYWORDS).length }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing keywords' }));
        }
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (url === '/api/inbox' && method === 'GET') {
    const items = loadProcessed();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items }));
    return;
  }

  // Serve dashboard HTML for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(HTML);

}).listen(PORT, () => {
  console.log(`   Dashboard & API at http://localhost:${PORT}`);
});

loadStats();

console.log('🤖 Instagram Auto-DM Bot Started');
console.log(`   Polling every ${POLL_INTERVAL}s`);
console.log(`   Keywords watched: ${Object.keys(KEYWORDS).join(', ')}`);
console.log('');

run();
setInterval(run, POLL_INTERVAL * 1000);
