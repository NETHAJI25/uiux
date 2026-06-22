const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err?.message||err); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err?.message||err); });

let CONFIG = {};
const configPath = path.join(__dirname, 'config.json');
try { if (fs.existsSync(configPath)) CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e) {}

let TOKEN = process.env.ACCESS_TOKEN || CONFIG.access_token || '';
const IG_ID = process.env.IG_USER_ID || CONFIG.ig_user_id || '';
const APP_ID = process.env.APP_ID || CONFIG.app_id || '';
const APP_SECRET = process.env.APP_SECRET || CONFIG.app_secret || '';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || CONFIG.poll_interval_seconds || '30', 10);

let KEYWORDS = {};
try { KEYWORDS = JSON.parse(process.env.KEYWORDS_JSON || 'null') || CONFIG.keywords || {}; } catch(e) {}
let REPLY_TEMPLATE = process.env.REPLY_TEMPLATE || CONFIG.reply_template || 'Check your DM \u2705 Thanks for commenting!';
let POST_KEYWORDS = {};
try { POST_KEYWORDS = JSON.parse(process.env.POST_KEYWORDS_JSON || 'null') || CONFIG.post_keywords || {}; } catch(e) {}

const PROCESSED_FILE = path.join(__dirname, 'processed.json');
const STATS_FILE = path.join(__dirname, 'stats.json');
const USERS_FILE = path.join(__dirname, 'users.json');

let stats = { startTime: Date.now(), totalPolls:0, totalCommentsFound:0, totalCommentsProcessed:0, totalRepliesSent:0, totalDMsent:0, totalErrors:0, totalFallbackReplies:0, keywordsTriggered:{}, lastPollTime:null, lastActivityTime:null, lastError:null, uptime:0 };
function loadStats() { try { const s = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); stats = { ...stats, ...s, startTime: s.startTime || Date.now() }; } catch(e) {} }
function saveStats() { stats.uptime = Date.now() - stats.startTime; try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch(e) {} }

function getDuration(ms) { const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return `${d}d ${h}h ${m}m ${s%60}s`; }
function formatTime(ts) { try { return new Date(ts).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'}); } catch(e) { return ''; } }

function apiRequest(endpoint, method='GET', body=null) {
  return new Promise((resolve,reject)=>{
    try {
      const url = new URL(`https://graph.facebook.com${endpoint.startsWith('/')?'':'/'}${endpoint}`);
      if (method==='GET') url.searchParams.append('access_token', TOKEN);
      const opts = { hostname: 'graph.facebook.com', path: url.pathname+url.search+(method==='GET'?'':`&access_token=${TOKEN}`), method, headers: body?{'Content-Type':'application/json'}:{} };
      const req = https.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){resolve(d)}}); });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('API timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    } catch(e) { reject(e); }
  });
}

function loadProcessed() { try { return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')); } catch { return []; } }
function saveProcessed(entry) { const list = loadProcessed(); list.push(entry); try { fs.writeFileSync(PROCESSED_FILE, JSON.stringify(list.slice(-500))); } catch(e) {} }

function extractKeyword(text) { const u=text.toUpperCase(); for (const k of Object.keys(KEYWORDS)) { if (u.includes(k)) return k; } return null; }
async function replyToComment(cId, msg) { return await apiRequest(`/${cId}/replies?message=${encodeURIComponent(msg)}&access_token=${TOKEN}`, 'POST'); }
async function sendDM(recipientId, msg) { try { return await apiRequest(`/${IG_ID}/messages?access_token=${TOKEN}`, 'POST', { recipient: { id: recipientId }, message: { text: msg } }); } catch(e) { return { error: e.message }; } }

const BOT_START_TIME = Date.now();

// Token auto-refresh every 25 days (long-lived tokens last 60 days)
async function refreshToken() {
  if (!APP_ID || !APP_SECRET || !TOKEN) { console.log('Token refresh: missing credentials'); return; }
  try {
    console.log('Refreshing Facebook token...');
    const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${TOKEN}`;
    const data = await new Promise((resolve,reject) => {
      https.get(url, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){reject(e)} }); }).on('error', reject);
    });
    if (data.access_token && data.access_token !== TOKEN) {
      // Update in-memory
      CONFIG.access_token = data.access_token;
      TOKEN = data.access_token;
      // Persist to config file
      try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.access_token = data.access_token; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
      console.log('Token refreshed successfully! New expiry: '+(data.expires_in ? Math.floor(data.expires_in/86400)+' days' : 'unknown'));
    } else if (data.error) {
      console.error('Token refresh error:', data.error.message);
    }
  } catch(e) {
    console.error('Token refresh failed:', e.message);
  }
}
// Refresh token immediately on start, then every 25 days
refreshToken();
setInterval(refreshToken, 25 * 24 * 60 * 60 * 1000);

async function processComments(mediaId) {
  try {
    const comments = await apiRequest(`/${mediaId}/comments?fields=id,text,username,timestamp,from{id,username}&limit=50`);
    if (!comments || !comments.data) return;
    const processed = loadProcessed();
    for (const c of comments.data) {
      if (processed.some(p => p.id === c.id)) continue;
      stats.totalCommentsFound++;
      const keyword = extractKeyword(c.text);
      if (!keyword) continue;
      const allowed = POST_KEYWORDS[mediaId];
      if (allowed && !allowed.includes(keyword)) continue;
      stats.totalCommentsProcessed++;
      stats.keywordsTriggered[keyword] = (stats.keywordsTriggered[keyword]||0)+1;
      const commentTime = c.timestamp ? new Date(c.timestamp).getTime() : 0;
      if (commentTime < BOT_START_TIME) {
        saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, replyOk:false, dmOk:false, fallback:false, skipped:true, ts:Date.now() });
        saveStats(); continue;
      }
      stats.lastActivityTime = Date.now();
      const dmMsg = KEYWORDS[keyword];
      const replyTxt = REPLY_TEMPLATE.replace(/{keyword}/g, keyword);
      const replyResult = await replyToComment(c.id, replyTxt);
      let replyOk=false, dmOk=false, fb=false;
      if (replyResult && replyResult.error) { stats.totalErrors++; stats.lastError=`Reply: ${JSON.stringify(replyResult.error)}`; }
      else { stats.totalRepliesSent++; replyOk=true; }
      const dmResult = await sendDM(c.from.id, dmMsg);
      if (dmResult && dmResult.error) {
        stats.totalErrors++; stats.lastError=`DM: ${JSON.stringify(dmResult.error)}`;
        await replyToComment(c.id, dmMsg); fb=true;
        stats.totalFallbackReplies++;
      } else { stats.totalDMsent++; dmOk=true; }
      saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, replyOk, dmOk, fallback:fb, skipped:false, ts:Date.now() });
      saveStats();
    }
  } catch(e) {
    stats.totalErrors++; stats.lastError=`processComments: ${e.message||e}`; saveStats();
  }
}

async function run() {
  try {
    stats.totalPolls++; stats.lastPollTime = Date.now();
    if (!TOKEN || !IG_ID) { stats.lastError='Missing TOKEN or IG_ID'; saveStats(); return; }
    const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
    if (!media || media.error) { stats.totalErrors++; stats.lastError=`API: ${media?.error?.message||JSON.stringify(media?.error||'No response')}`; saveStats(); return; }
    if (!media.data||!media.data.length) { saveStats(); return; }
    for (const p of media.data) { if ((p.comments_count||0)>0) await processComments(p.id); }
    saveStats();
  } catch(e) {
    stats.totalErrors++; stats.lastError=`run: ${e.message||e}`; saveStats();
  }
}

// HTTP Server - JSON API only, no HTML
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  try {
    const url = req.url.split('?')[0];
    const method = req.method;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const json = (data, code=200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };

    if (url === '/api/stats' && method === 'GET') {
      stats.uptime = Date.now() - stats.startTime;
      json({ ...stats, uptimeStr: getDuration(stats.uptime), lastPollStr: stats.lastPollTime ? formatTime(stats.lastPollTime) : null, lastActivityStr: stats.lastActivityTime ? formatTime(stats.lastActivityTime) : null });
      return;
    }

    if (url === '/api/keywords' && method === 'GET') { json({ keywords: KEYWORDS }); return; }

    if (url === '/api/keywords' && method === 'POST') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => { try { const { keywords } = JSON.parse(b); if (!keywords) { json({ error: 'Missing keywords' }, 400); return; } KEYWORDS = keywords; try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.keywords = keywords; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {} json({ ok: true, count: Object.keys(KEYWORDS).length }); } catch(e) { json({ error: 'Invalid JSON' }, 400); } });
      return;
    }

    if (url === '/api/posts' && method === 'GET') {
      apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,timestamp&limit=25`).then(posts => { json({ posts: posts.data || [], assignments: POST_KEYWORDS }); }).catch(e => { json({ error: e.message }, 500); });
      return;
    }

    if (url === '/api/post-keywords' && method === 'POST') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => { try { const { assignments } = JSON.parse(b); if (!assignments) { json({ error: 'Missing assignments' }, 400); return; } POST_KEYWORDS = assignments; try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.post_keywords = assignments; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {} json({ ok: true }); } catch(e) { json({ error: 'Invalid JSON' }, 400); } });
      return;
    }

    if (url === '/api/reply-template' && method === 'POST') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => { try { const { template } = JSON.parse(b); if (!template) { json({ error: 'Missing template' }, 400); return; } REPLY_TEMPLATE = template; try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.reply_template = template; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {} json({ ok: true }); } catch(e) { json({ error: 'Invalid JSON' }, 400); } });
      return;
    }

    if (url === '/api/inbox' && method === 'GET') {
      const items = loadProcessed();
      const normalized = items.map(i => ({ id:i.id||'', username:i.username||'unknown', text:i.text||'', keyword:i.keyword||'?', mediaId:i.mediaId||'', replyOk:!!i.replyOk, dmOk:!!i.dmOk, fallback:!!i.fallback, skipped:!!i.skipped, ts:i.ts||0 }));
      json({ items: normalized });
      return;
    }

    if (url === '/api/test-trigger' && method === 'POST') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => { try { const { keyword, username, text } = JSON.parse(b); if (!keyword || !KEYWORDS[keyword]) { json({ error: 'Keyword not found' }, 400); return; } saveProcessed({ id:'test_'+Date.now(), username:username||'test_user', text:text||keyword, keyword, replyOk:true, dmOk:false, fallback:true, ts:Date.now() }); stats.totalCommentsFound++; stats.totalCommentsProcessed++; stats.keywordsTriggered[keyword] = (stats.keywordsTriggered[keyword]||0)+1; stats.lastActivityTime=Date.now(); saveStats(); json({ ok:true }); } catch(e) { json({ error: 'Invalid' }, 400); } });
      return;
    }

    // Users
    if (url === '/api/users' && method === 'GET') {
      const items = loadProcessed();
      let userTags = {};
      try { userTags = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch(e) {}
      const seen = {};
      const users = [];
      for (const item of items) {
        const name = item.username || 'unknown';
        if (seen[name]) continue;
        seen[name] = true;
        const tag = userTags[name] || '';
        const count = items.filter(i => (i.username||'unknown') === name).length;
        const last = items.filter(i => (i.username||'unknown') === name).sort((a,b) => (b.ts||0) - (a.ts||0))[0];
        users.push({ username: name, tag, count, lastSeen: last?.ts||0, lastKeyword: last?.keyword||'' });
      }
      json({ users });
      return;
    }
    if (url === '/api/users' && method === 'POST') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => {
        try {
          const { tags } = JSON.parse(b);
          if (!tags) { json({ error: 'Missing tags' }, 400); return; }
          try { fs.writeFileSync(USERS_FILE, JSON.stringify(tags, null, 2)); } catch(e) { json({ error: 'Write failed' }, 500); return; }
          json({ ok: true });
        } catch(e) { json({ error: 'Invalid JSON' }, 400); }
      });
      return;
    }

    // Health check
    if (url === '/api/health' || url === '/health') { json({ ok: true, uptime: getDuration(Date.now()-stats.startTime) }); return; }

    // Serve CORS preflight & health for root
    if (url === '/') { json({ ok: true, name: 'IG Auto-DM API', docs: 'https://dashboard-two-rho-nl38203o2y.vercel.app' }); return; }

    json({ error: 'Not found' }, 404);
  } catch(e) {
    try { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); } catch(e2) {}
  }
});

server.on('error', (err) => { console.error('Server error:', err.message); });
server.listen(PORT, () => { console.log(`API server on port ${PORT}`); });

loadStats();
console.log('Bot started, polling every '+POLL_INTERVAL+'s');
run().catch(e => {});
setInterval(() => run().catch(e => {}), POLL_INTERVAL * 1000);
