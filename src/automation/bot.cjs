const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load config
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

// Stats
let stats = {
  startTime: Date.now(),
  totalPolls: 0,
  totalCommentsFound: 0,
  totalCommentsProcessed: 0,
  totalRepliesSent: 0,
  totalDMsent: 0,
  totalErrors: 0,
  totalFallbackReplies: 0,
  keywordsTriggered: {},
  lastPollTime: null,
  lastActivityTime: null,
  lastError: null,
  uptime: 0
};

function loadStats() {
  try {
    const saved = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    stats = { ...stats, ...saved, startTime: saved.startTime || Date.now() };
  } catch(e) {}
}
function saveStats() {
  stats.uptime = Date.now() - stats.startTime;
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch(e) {}
}

function getDuration(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

function formatTime(ts) {
  return new Date(ts).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const API_BASE = 'graph.facebook.com';
const API_V = 'v25.0';

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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function loadProcessed() {
  try { return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')); }
  catch { return []; }
}

function saveProcessed(id) {
  const list = loadProcessed();
  list.push({ id, ts: Date.now() });
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(list.slice(-500)));
}

function extractKeyword(text) {
  const upper = text.toUpperCase();
  for (const kw of Object.keys(KEYWORDS)) {
    if (upper.includes(kw)) return kw;
  }
  return null;
}

async function replyToComment(commentId, message) {
  const result = await apiRequest(`/${commentId}/replies?message=${encodeURIComponent(message)}&access_token=${TOKEN}`, 'POST');
  return result;
}

async function sendDM(recipientIgId, message) {
  try {
    const result = await apiRequest(`/${IG_ID}/messages?access_token=${TOKEN}`, 'POST', {
      recipient: { id: recipientIgId },
      message: { text: message }
    });
    return result;
  } catch (e) {
    return { error: e.message };
  }
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
    if (replyResult.error) {
      stats.totalErrors++;
      stats.lastError = `Reply error: ${JSON.stringify(replyResult.error)}`;
      console.log(`  Reply error: ${JSON.stringify(replyResult.error)}`);
    } else {
      stats.totalRepliesSent++;
      console.log(`  ✅ Replied to comment ${comment.id}`);
    }

    const dmResult = await sendDM(comment.from.id, dmMessage);
    if (dmResult.error) {
      stats.totalErrors++;
      stats.lastError = `DM error: ${JSON.stringify(dmResult.error)}`;
      console.log(`  DM error for user ${comment.from.id}: ${JSON.stringify(dmResult.error)}`);
      await replyToComment(comment.id, dmMessage);
      stats.totalFallbackReplies++;
      console.log(`  ⚠️ Sent link as comment reply instead`);
    } else {
      stats.totalDMsent++;
      console.log(`  ✅ DM sent to ${comment.from.username} (${comment.from.id})`);
    }

    saveProcessed(comment.id);
    saveStats();
  }
}

async function run() {
  stats.totalPolls++;
  stats.lastPollTime = Date.now();
  console.log(`\n[${new Date().toLocaleTimeString()}] Polling Instagram...`);

  const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
  if (!media.data || media.data.length === 0) {
    console.log('  No media found');
    saveStats();
    return;
  }

  for (const post of media.data) {
    console.log(`  Checking post ${post.id} (${post.comments_count || 0} comments)...`);
    if ((post.comments_count || 0) > 0) {
      await processComments(post.id);
    }
  }
  console.log('  Done');
  saveStats();
}

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IG Auto-DM Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #eee; padding: 20px; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  h1 span { color: #888; font-weight: 400; font-size: 14px; }
  .status-bar { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
  .badge { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .badge.online { background: #16a34a; color: #fff; }
  .badge.offline { background: #dc2626; color: #fff; }
  .badge.warn { background: #ea580c; color: #fff; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .card { background: #1a1a1a; border-radius: 12px; padding: 16px; border: 1px solid #2a2a2a; }
  .card .label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
  .card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
  .card .value.green { color: #22c55e; }
  .card .value.blue { color: #3b82f6; }
  .card .value.yellow { color: #eab308; }
  .card .value.red { color: #ef4444; }
  .card .sub { font-size: 12px; color: #666; margin-top: 2px; }
  h2 { font-size: 16px; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a; }
  th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; border-bottom: 1px solid #2a2a2a; }
  td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #222; }
  tr:last-child td { border-bottom: none; }
  .bar { height: 6px; border-radius: 3px; background: #2563eb; max-width: 100%; }
  .bar-bg { background: #2a2a2a; border-radius: 3px; width: 100%; }
  .time { font-size: 12px; color: #666; }
  .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #555; }
  .meta { background: #1a1a1a; border-radius: 12px; padding: 16px; border: 1px solid #2a2a2a; margin-bottom: 24px; font-size: 13px; line-height: 1.8; }
  .meta span { color: #888; }
  .error-msg { color: #ef4444; font-size: 13px; margin-top: 8px; }
</style>
</head>
<body>
<div class="container">
  <h1>🤖 IG Auto-DM Bot <span id="statusTag"></span></h1>
  <div class="status-bar">
    <div id="liveBadge" class="badge online">● Live</div>
    <div class="badge" id="uptimeBadge">⏱ --</div>
  </div>
  <div class="cards">
    <div class="card"><div class="label">Polls Run</div><div class="value blue" id="totalPolls">0</div></div>
    <div class="card"><div class="label">Comments Found</div><div class="value" id="totalCommentsFound">0</div></div>
    <div class="card"><div class="label">Comments Processed</div><div class="value green" id="totalCommentsProcessed">0</div></div>
    <div class="card"><div class="label">Replies Sent</div><div class="value blue" id="totalRepliesSent">0</div></div>
    <div class="card"><div class="label">DMs Sent</div><div class="value green" id="totalDMsent">0</div></div>
    <div class="card"><div class="label">Fallback Replies</div><div class="value yellow" id="totalFallbackReplies">0</div></div>
    <div class="card"><div class="label">Errors</div><div class="value red" id="totalErrors">0</div></div>
  </div>

  <h2>⚡ Keywords Triggered</h2>
  <div id="keywordTable"><p style="color:#666;font-size:13px;">No keywords triggered yet.</p></div>

  <h2>📋 Activity Log</h2>
  <div class="meta" id="activityLog">
    <div><span>Last Poll:</span> <span id="lastPoll">--</span></div>
    <div><span>Last Activity:</span> <span id="lastActivity">--</span></div>
    <div id="lastErrorRow" style="display:none;"><span>Last Error:</span> <span class="error-msg" id="lastError"></span></div>
  </div>

  <h2>⏱ Timing</h2>
  <div class="meta">
    <div><span>Poll Interval:</span> ${POLL_INTERVAL}s</div>
    <div><span>Keywords Watched:</span> ${Object.keys(KEYWORDS).length}</div>
    <div><span>IG User ID:</span> ${IG_ID}</div>
  </div>

  <div class="footer">Auto-refreshes every 10s &middot; Instagram Auto-DM Bot</div>
</div>
<script>
async function refresh() {
  try {
    const r = await fetch('/api/stats');
    const d = await r.json();
    document.getElementById('totalPolls').textContent = d.totalPolls;
    document.getElementById('totalCommentsFound').textContent = d.totalCommentsFound;
    document.getElementById('totalCommentsProcessed').textContent = d.totalCommentsProcessed;
    document.getElementById('totalRepliesSent').textContent = d.totalRepliesSent;
    document.getElementById('totalDMsent').textContent = d.totalDMsent;
    document.getElementById('totalFallbackReplies').textContent = d.totalFallbackReplies;
    document.getElementById('totalErrors').textContent = d.totalErrors;
    document.getElementById('uptimeBadge').textContent = '⏱ ' + d.uptimeStr;
    document.getElementById('lastPoll').textContent = d.lastPollStr || '--';
    document.getElementById('lastActivity').textContent = d.lastActivityStr || '--';
    if (d.lastError) {
      document.getElementById('lastErrorRow').style.display = '';
      document.getElementById('lastError').textContent = d.lastError;
    }
    document.getElementById('liveBadge').className = 'badge online';
    document.getElementById('statusTag').textContent = '\\u25cf Live';

    const kwDiv = document.getElementById('keywordTable');
    const keys = Object.keys(d.keywordsTriggered);
    if (keys.length === 0) {
      kwDiv.innerHTML = '<p style="color:#666;font-size:13px;">No keywords triggered yet.</p>';
    } else {
      const maxVal = Math.max(...keys.map(k => d.keywordsTriggered[k]), 1);
      let html = '<table><tr><th>Keyword</th><th>Triggered</th><th></th></tr>';
      for (const k of keys.sort((a,b) => d.keywordsTriggered[b] - d.keywordsTriggered[a])) {
        const pct = (d.keywordsTriggered[k] / maxVal * 100).toFixed(0);
        html += '<tr><td style="font-weight:600;">' + k + '</td><td>' + d.keywordsTriggered[k] + '</td><td><div class="bar-bg"><div class="bar" style="width:' + pct + '%"></div></div></td></tr>';
      }
      html += '</table>';
      kwDiv.innerHTML = html;
    }
  } catch(e) {
    document.getElementById('liveBadge').className = 'badge offline';
    document.getElementById('statusTag').textContent = '\\u2716 Offline';
  }
}
refresh();
setInterval(refresh, 10000);
</script>
</body>
</html>`;

// HTTP server
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/stats') {
    stats.uptime = Date.now() - stats.startTime;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    const payload = {
      ...stats,
      uptimeStr: getDuration(stats.uptime),
      lastPollStr: stats.lastPollTime ? formatTime(stats.lastPollTime) : null,
      lastActivityStr: stats.lastActivityTime ? formatTime(stats.lastActivityTime) : null,
    };
    res.end(JSON.stringify(payload));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(DASHBOARD_HTML);
  }
}).listen(PORT, () => {
  console.log(`   Dashboard at http://localhost:${PORT}`);
  console.log(`   Health check server on port ${PORT}`);
});

loadStats();

console.log('🤖 Instagram Auto-DM Bot Started');
console.log(`   Polling every ${POLL_INTERVAL}s`);
console.log(`   Keywords watched: ${Object.keys(KEYWORDS).join(', ')}`);
console.log('');

run();
setInterval(run, POLL_INTERVAL * 1000);
