const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err?.message||err); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err?.message||err); });

// ─── Config Loading ───
let CONFIG = {};
const configPath = path.join(__dirname, 'config.json');
try { if (fs.existsSync(configPath)) CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e) {}

let TOKEN = CONFIG.access_token || process.env.ACCESS_TOKEN || '';
const IG_ID = process.env.IG_USER_ID || CONFIG.ig_user_id || '';
const APP_ID = process.env.APP_ID || CONFIG.app_id || '';
const APP_SECRET = process.env.APP_SECRET || CONFIG.app_secret || '';
let POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || CONFIG.poll_interval_seconds || '30', 10);

let KEYWORDS = {};
try { KEYWORDS = JSON.parse(process.env.KEYWORDS_JSON || 'null') || CONFIG.keywords || {}; } catch(e) {}
let REPLY_TEMPLATE = process.env.REPLY_TEMPLATE || CONFIG.reply_template || 'Check your DM \u2705 Thanks for commenting!';
let POST_KEYWORDS = {};
try { POST_KEYWORDS = JSON.parse(process.env.POST_KEYWORDS_JSON || 'null') || CONFIG.post_keywords || {}; } catch(e) {}

// Follow gate settings
let FOLLOW_GATE_ENABLED = CONFIG.follow_gate_enabled === true;
let FOLLOW_PROMPT = CONFIG.follow_prompt || 'Follow @{ig_username} and comment {keyword} again to get the link!';

// Rate limiter settings
let RATE_LIMIT_PER_HOUR = parseInt(CONFIG.rate_limit_per_hour || '150', 10);
let IG_USERNAME = CONFIG.ig_username || '';

const PROCESSED_FILE = path.join(__dirname, 'processed.json');
const STATS_FILE = path.join(__dirname, 'stats.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const FOLLOWERS_CACHE_FILE = path.join(__dirname, 'followers_cache.json');

// ─── Stats ───
let stats = { startTime: Date.now(), totalPolls:0, totalCommentsFound:0, totalCommentsProcessed:0, totalRepliesSent:0, totalDMsent:0, totalErrors:0, totalFallbackReplies:0, totalFollowGateBlocked:0, keywordsTriggered:{}, lastPollTime:null, lastActivityTime:null, lastError:null, uptime:0 };
function loadStats() { try { const s = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); stats = { ...stats, ...s, startTime: s.startTime || Date.now() }; } catch(e) {} }
function saveStats() { stats.uptime = Date.now() - stats.startTime; try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch(e) {} }

function getDuration(ms) { const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return `${d}d ${h}h ${m}m ${s%60}s`; }
function formatTime(ts) { try { return new Date(ts).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'}); } catch(e) { return ''; } }

// ─── Facebook API Helper ───
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

// ─── Followers Cache ───
let followersCache = { ids: new Set(), usernames: new Set(), lastRefreshed: 0, isRefreshing: false };
function loadFollowersCache() {
  try {
    const d = JSON.parse(fs.readFileSync(FOLLOWERS_CACHE_FILE, 'utf8'));
    followersCache.ids = new Set(d.ids || []);
    followersCache.usernames = new Set(d.usernames || []);
    followersCache.lastRefreshed = d.lastRefreshed || 0;
  } catch(e) {}
}
function saveFollowersCache() {
  try { fs.writeFileSync(FOLLOWERS_CACHE_FILE, JSON.stringify({ ids: [...followersCache.ids], usernames: [...followersCache.usernames], lastRefreshed: followersCache.lastRefreshed })); } catch(e) {}
}
async function refreshFollowers() {
  if (!IG_ID || !TOKEN) return;
  if (followersCache.isRefreshing) return;
  followersCache.isRefreshing = true;
  try {
    console.log('Refreshing followers cache...');
    const newIds = new Set();
    const newUsernames = new Set();
    let after = null;
    let pages = 0;
    do {
      const url = `/${IG_ID}/followers?fields=id,username&limit=200${after ? '&after='+encodeURIComponent(after) : ''}`;
      const data = await apiRequest(url);
      if (!data || data.error) { console.error('Followers fetch error:', data?.error?.message || 'No data'); break; }
      if (data.data) {
        for (const f of data.data) { newIds.add(f.id); newUsernames.add((f.username||'').toLowerCase()); }
      }
      after = data.paging?.cursors?.after || data.paging?.next || null;
      pages++;
      if (pages > 50) break; // safety cap (~10k followers)
    } while (after);
    followersCache.ids = newIds;
    followersCache.usernames = newUsernames;
    followersCache.lastRefreshed = Date.now();
    saveFollowersCache();
    console.log(`Followers cache refreshed: ${newIds.size} followers (${pages} pages)`);
  } catch(e) {
    console.error('Followers refresh failed:', e.message);
  } finally {
    followersCache.isRefreshing = false;
  }
}
function isFollowing(igUserId, username) {
  if (followersCache.ids.has(igUserId)) return true;
  if (followersCache.usernames.has((username||'').toLowerCase())) return true;
  return false;
}

// ─── Rate Limiter ───
let dmQueue = [];
let dmSentTimestamps = [];
function canSendDM() {
  const now = Date.now();
  dmSentTimestamps = dmSentTimestamps.filter(t => now - t < 3600000); // remove timestamps older than 1h
  return dmSentTimestamps.length < RATE_LIMIT_PER_HOUR;
}
function trackDMsent() { dmSentTimestamps.push(Date.now()); }

// ─── Processed Comments ───
function loadProcessed() { try { return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')); } catch { return []; } }
function saveProcessed(entry) { const list = loadProcessed(); list.push(entry); try { fs.writeFileSync(PROCESSED_FILE, JSON.stringify(list.slice(-500))); } catch(e) {} }

function extractKeyword(text) { const u=text.toUpperCase(); for (const k of Object.keys(KEYWORDS)) { if (u.includes(k)) return k; } return null; }
async function replyToComment(cId, msg) { return await apiRequest(`/${cId}/replies?message=${encodeURIComponent(msg)}&access_token=${TOKEN}`, 'POST'); }
async function sendDM(recipientId, msg) { try { return await apiRequest(`/${IG_ID}/messages?access_token=${TOKEN}`, 'POST', { recipient: { id: recipientId }, message: { text: msg } }); } catch(e) { return { error: e.message }; } }

const BOT_START_TIME = Date.now();

// ─── Token Auto-Refresh ───
async function refreshToken() {
  if (!APP_ID || !APP_SECRET || !TOKEN) { console.log('Token refresh: missing credentials'); return; }
  try {
    console.log('Refreshing Facebook token...');
    const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${TOKEN}`;
    const data = await new Promise((resolve,reject) => {
      https.get(url, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){reject(e)} }); }).on('error', reject);
    });
    if (data.access_token && data.access_token !== TOKEN) {
      CONFIG.access_token = data.access_token;
      TOKEN = data.access_token;
      try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.access_token = data.access_token; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
      console.log('Token refreshed successfully! New expiry: '+(data.expires_in ? Math.floor(data.expires_in/86400)+' days' : 'unknown'));
    } else if (data.error) {
      console.error('Token refresh error:', data.error.message);
    }
  } catch(e) {
    console.error('Token refresh failed:', e.message);
  }
}
setInterval(refreshToken, 25 * 24 * 60 * 60 * 1000);

// ─── Process Comments ───
async function processComments(mediaId) {
  try {
    const comments = await apiRequest(`/${mediaId}/comments?fields=id,text,username,timestamp,from{id,username}&limit=50`);
    if (!comments || !comments.data) return;
    const processed = loadProcessed();
    // Refresh followers cache if stale (older than 15 min) when follow gate is on
    if (FOLLOW_GATE_ENABLED && (Date.now() - followersCache.lastRefreshed > 15 * 60 * 1000)) {
      refreshFollowers().catch(() => {});
    }
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

      // Follow gate check
      if (FOLLOW_GATE_ENABLED && !isFollowing(c.from.id, c.from?.username)) {
        stats.totalFollowGateBlocked++;
        const followPrompt = FOLLOW_PROMPT
          .replace(/{ig_username}/g, IG_USERNAME)
          .replace(/{keyword}/g, keyword)
          .replace(/{username}/g, c.from?.username || 'there');
        await replyToComment(c.id, followPrompt);
        saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, replyOk:true, dmOk:false, fallback:false, followGate:true, skipped:false, ts:Date.now() });
        saveStats(); continue;
      }

      // Send public reply
      const replyResult = await replyToComment(c.id, replyTxt);
      let replyOk=false, dmOk=false, fb=false;
      if (replyResult && replyResult.error) { stats.totalErrors++; stats.lastError=`Reply: ${JSON.stringify(replyResult.error)}`; }
      else { stats.totalRepliesSent++; replyOk=true; }

      // Rate-limited DM
      if (canSendDM()) {
        const dmResult = await sendDM(c.from.id, dmMsg);
        if (dmResult && dmResult.error) {
          stats.totalErrors++; stats.lastError=`DM: ${JSON.stringify(dmResult.error)}`;
          await replyToComment(c.id, dmMsg); fb=true;
          stats.totalFallbackReplies++;
        } else { stats.totalDMsent++; dmOk=true; trackDMsent(); }
      } else {
        // Queue DM for later
        dmQueue.push({ recipientId: c.from.id, msg: dmMsg, commentId: c.id, keyword, mediaId, username: c.from?.username||'?', text: c.text });
      }

      saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, replyOk, dmOk, fallback:fb, followGate:false, skipped:false, ts:Date.now() });
      saveStats();
    }
  } catch(e) {
    stats.totalErrors++; stats.lastError=`processComments: ${e.message||e}`; saveStats();
  }
}

// Process queued DMs (called from run loop)
async function processDMQueue() {
  if (!dmQueue.length || !canSendDM()) return;
  const item = dmQueue.shift();
  try {
    const result = await sendDM(item.recipientId, item.msg);
    if (result && result.error) {
      stats.totalErrors++; stats.lastError=`Queue DM: ${JSON.stringify(result.error)}`;
      await replyToComment(item.commentId, item.msg);
      stats.totalFallbackReplies++;
    } else { stats.totalDMsent++; trackDMsent(); }
  } catch(e) {
    stats.totalErrors++;
  }
  saveStats();
}

async function run() {
  try {
    stats.totalPolls++; stats.lastPollTime = Date.now();
    if (!TOKEN || !IG_ID) { stats.lastError='Missing TOKEN or IG_ID'; saveStats(); return; }
    const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
    if (!media || media.error) { stats.totalErrors++; stats.lastError=`API: ${media?.error?.message||JSON.stringify(media?.error||'No response')}`; saveStats(); return; }
    if (!media.data||!media.data.length) { saveStats(); return; }
    for (const p of media.data) { if ((p.comments_count||0)>0) await processComments(p.id); }
    // Process queued DMs (up to 3 per poll cycle)
    for (let i=0; i<3 && dmQueue.length; i++) await processDMQueue();
    saveStats();
  } catch(e) {
    stats.totalErrors++; stats.lastError=`run: ${e.message||e}`; saveStats();
  }
}

// ─── HTTP Server ───
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
      json({ ...stats, uptimeStr: getDuration(stats.uptime), lastPollStr: stats.lastPollTime ? formatTime(stats.lastPollTime) : null, lastActivityStr: stats.lastActivityTime ? formatTime(stats.lastActivityTime) : null, dmQueueLength: dmQueue.length });
      return;
    }

    if (url === '/api/config' && method === 'GET') {
      json({
        poll_interval_seconds: POLL_INTERVAL,
        reply_template: REPLY_TEMPLATE,
        keywords: KEYWORDS,
        post_keywords: POST_KEYWORDS,
        follow_gate_enabled: FOLLOW_GATE_ENABLED,
        follow_prompt: FOLLOW_PROMPT,
        rate_limit_per_hour: RATE_LIMIT_PER_HOUR,
        ig_username: IG_USERNAME,
        ig_user_id: IG_ID,
        followers_count: followersCache.ids.size,
        followers_last_refreshed: followersCache.lastRefreshed ? formatTime(followersCache.lastRefreshed) : null,
        dm_queue_length: dmQueue.length
      });
      return;
    }

    if (url === '/api/config' && method === 'POST') {
      let b = '';
      req.on('data', c => b += c);
      req.on('end', () => {
        try {
          const data = JSON.parse(b);
          if (data.poll_interval_seconds) { POLL_INTERVAL = parseInt(data.poll_interval_seconds, 10); }
          if (data.reply_template) { REPLY_TEMPLATE = data.reply_template; }
          if (data.follow_gate_enabled !== undefined) { FOLLOW_GATE_ENABLED = data.follow_gate_enabled === true; }
          if (data.follow_prompt) { FOLLOW_PROMPT = data.follow_prompt; }
          if (data.rate_limit_per_hour) { RATE_LIMIT_PER_HOUR = parseInt(data.rate_limit_per_hour, 10); }
          if (data.ig_username) { IG_USERNAME = data.ig_username; }
          if (data.keywords) { KEYWORDS = data.keywords; }
          if (data.post_keywords) { POST_KEYWORDS = data.post_keywords; }
          // Persist
          try {
            const c = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            for (const key of Object.keys(data)) { c[key] = data[key]; }
            fs.writeFileSync(configPath, JSON.stringify(c, null, 2));
          } catch(e) {}
          json({ ok: true });
        } catch(e) { json({ error: 'Invalid JSON' }, 400); }
      });
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
      const normalized = items.map(i => ({ id:i.id||'', username:i.username||'unknown', text:i.text||'', keyword:i.keyword||'?', mediaId:i.mediaId||'', replyOk:!!i.replyOk, dmOk:!!i.dmOk, fallback:!!i.fallback, followGate:!!i.followGate, skipped:!!i.skipped, ts:i.ts||0 }));
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
        const isFollower = IG_USERNAME ? isFollowing('', name) : null;
        users.push({ username: name, tag, count, lastSeen: last?.ts||0, lastKeyword: last?.keyword||'', isFollower });
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

    // Followers cache endpoint
    if (url === '/api/refresh-followers' && method === 'POST') {
      refreshFollowers().then(() => json({ ok: true, count: followersCache.ids.size })).catch(e => json({ error: e.message }, 500));
      return;
    }
    if (url === '/api/followers' && method === 'GET') {
      json({ count: followersCache.ids.size, lastRefreshed: followersCache.lastRefreshed, isRefreshing: followersCache.isRefreshing });
      return;
    }

    // Health check
    if (url === '/api/health' || url === '/health') { json({ ok: true, uptime: getDuration(Date.now()-stats.startTime) }); return; }

    if (url === '/') { json({ ok: true, name: 'IG Auto-DM API', docs: 'https://dashboard-two-rho-nl38203o2y.vercel.app' }); return; }

    json({ error: 'Not found' }, 404);
  } catch(e) {
    try { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); } catch(e2) {}
  }
});

server.on('error', (err) => { console.error('Server error:', err.message); });
server.listen(PORT, () => { console.log(`API server on port ${PORT}`); });

loadStats();
loadFollowersCache();
(async () => {
  await refreshToken();
  console.log('Bot started, polling every '+POLL_INTERVAL+'s'+(FOLLOW_GATE_ENABLED?' (follow gate ON)':''));
  await run();
  setInterval(() => run().catch(e => {}), POLL_INTERVAL * 1000);
})();
