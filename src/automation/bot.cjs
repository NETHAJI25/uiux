const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err?.message||err); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err?.message||err); });

let CONFIG = {};
const configPath = path.join(__dirname, 'config.json');
try { if (fs.existsSync(configPath)) CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e) {}

let TOKEN = CONFIG.access_token || process.env.ACCESS_TOKEN || '';
let IG_TOKEN = CONFIG.ig_token || process.env.IG_TOKEN || '';
const IG_ID = process.env.IG_USER_ID || CONFIG.ig_user_id || '';
const APP_ID = process.env.APP_ID || CONFIG.app_id || '';
const APP_SECRET = process.env.APP_SECRET || CONFIG.app_secret || '';
let POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || CONFIG.poll_interval_seconds || '15', 10);
let ENFORCE_24H_WINDOW = CONFIG.enforce_24h_window === true;
let REPLY_TEMPLATE = process.env.REPLY_TEMPLATE || CONFIG.reply_template || 'Check your DM \u2705 Thanks for commenting!';
let DM_MESSAGE = CONFIG.dm_message || 'Here is the link you requested! Let me know if you have any questions.';
let RATE_LIMIT_PER_HOUR = parseInt(CONFIG.rate_limit_per_hour || '150', 10);
let IG_USERNAME = CONFIG.ig_username || '';

const PROCESSED_FILE = path.join(__dirname, 'processed.json');
const STATS_FILE = path.join(__dirname, 'stats.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const FOLLOWERS_CACHE_FILE = path.join(__dirname, 'followers_cache.json');
const INTERACTIONS_FILE = path.join(__dirname, 'interactions.json');
const CLICKS_FILE = path.join(__dirname, 'clicks.json');

let stats = { startTime: Date.now(), totalPolls:0, totalCommentsFound:0, totalCommentsProcessed:0, totalRepliesSent:0, totalDMsent:0, totalErrors:0, totalFollowGateBlocked:0, totalClicks:0, lastPollTime:null, lastActivityTime:null, lastError:null, uptime:0 };
function loadStats() { try { const s = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); stats = { ...stats, ...s, startTime: s.startTime || Date.now() }; } catch(e) {} }
function saveStats() { stats.uptime = Date.now() - stats.startTime; try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch(e) {} }

function getDuration(ms) { const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return `${d}d ${h}h ${m}m ${s%60}s`; }
function formatTime(ts) { try { return new Date(ts).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'}); } catch(e) { return ''; } }

function apiRequest(endpoint, method='GET', body=null) {
  return new Promise((resolve,reject)=>{
    try {
      const url = new URL(`https://graph.facebook.com${endpoint.startsWith('/')?'':'/'}${endpoint}`);
      if (method==='GET') url.searchParams.append('access_token', TOKEN);
      const qs = method==='GET' ? '' : (url.search ? '&' : '?') + `access_token=${TOKEN}`;
      const opts = { hostname: 'graph.facebook.com', path: url.pathname+url.search+qs, method, headers: body?{'Content-Type':'application/json'}:{} };
      const req = https.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){resolve(d)}}); });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('API timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    } catch(e) { reject(e); }
  });
}

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
  if (!IG_ID || !TOKEN || followersCache.isRefreshing) return;
  followersCache.isRefreshing = true;
  try {
    console.log('Refreshing followers cache...');
    const newIds = new Set(); const newUsernames = new Set();
    let after = null; let pages = 0;
    do {
      const url = `/${IG_ID}/followers?fields=id,username&limit=200${after ? '&after='+encodeURIComponent(after) : ''}`;
      const data = await apiRequest(url);
      if (!data || data.error) break;
      if (data.data) { for (const f of data.data) { newIds.add(f.id); newUsernames.add((f.username||'').toLowerCase()); } }
      after = data.paging?.cursors?.after || null;
      pages++;
      if (pages > 50) break;
    } while (after);
    followersCache.ids = newIds; followersCache.usernames = newUsernames;
    followersCache.lastRefreshed = Date.now();
    saveFollowersCache();
    console.log(`Followers cache: ${newIds.size} (${pages} pages)`);
  } catch(e) { console.error('Followers refresh failed:', e.message); }
  finally { followersCache.isRefreshing = false; }
}
function isFollowing(igUserId, username) {
  if (followersCache.ids.has(igUserId)) return true;
  if (followersCache.usernames.has((username||'').toLowerCase())) return true;
  return false;
}

let dmQueue = [];
let dmSentTimestamps = [];
function canSendDM() {
  const now = Date.now();
  dmSentTimestamps = dmSentTimestamps.filter(t => now - t < 3600000);
  return dmSentTimestamps.length < RATE_LIMIT_PER_HOUR;
}
function trackDMsent() { dmSentTimestamps.push(Date.now()); }

function loadInteractions() { try { return JSON.parse(fs.readFileSync(INTERACTIONS_FILE, 'utf8')); } catch { return {}; } }
function saveInteractions(data) { try { fs.writeFileSync(INTERACTIONS_FILE, JSON.stringify(data, null, 2)); } catch(e) {} }
function touchInteraction(userId) { const d = loadInteractions(); d[userId] = Date.now(); saveInteractions(d); }
function isWithinWindow(userId) {
  if (!ENFORCE_24H_WINDOW) return true;
  const d = loadInteractions();
  const last = d[userId];
  if (!last) return false;
  return Date.now() - last < 24 * 60 * 60 * 1000;
}

function loadClicks() { try { return JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf8')); } catch { return []; } }
function saveClicks(data) { try { fs.writeFileSync(CLICKS_FILE, JSON.stringify(data.slice(-5000), null, 2)); } catch(e) {} }
function trackClick(clickId, url, username) {
  const clicks = loadClicks();
  clicks.push({ clickId, url, username, ts: Date.now() });
  saveClicks(clicks);
  stats.totalClicks++;
}
function replaceLinksWithTracked(text, username) {
  const urlRegex = /https?:\/\/[^\s,]+/g;
  let idx = 0;
  return text.replace(urlRegex, (match) => {
    const clickId = `clk_${Date.now()}_${idx++}`;
    trackClick(clickId, match, username);
    return `${match} [click:${clickId}]`;
  });
}

function loadProcessed() { try { return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')); } catch { return []; } }
function saveProcessed(entry) { const list = loadProcessed(); list.push(entry); try { fs.writeFileSync(PROCESSED_FILE, JSON.stringify(list.slice(-1000))); } catch(e) {} }

async function sendDM(recipientId, msg, mediaUrl) {
  try {
    const body = { recipient: { id: recipientId } };
    if (mediaUrl) {
      body.message = { attachment: { type: 'image', payload: { url: mediaUrl } } };
    } else {
      body.message = { text: msg };
    }
    return await apiRequest(`/${IG_ID}/messages`, 'POST', body);
  } catch(e) { return { error: e.message }; }
}

async function replyToComment(cId, msg) { return await apiRequest(`/${cId}/replies?message=${encodeURIComponent(msg)}`, 'POST'); }

async function refreshToken() {
  if (!APP_ID || !APP_SECRET || !TOKEN) return;
  try {
    const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${TOKEN}`;
    const data = await new Promise((resolve,reject) => {
      https.get(url, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){reject(e)} }); }).on('error', reject);
    });
    if (data.access_token && data.access_token !== TOKEN) {
      CONFIG.access_token = data.access_token; TOKEN = data.access_token;
      try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.access_token = data.access_token; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
    } else if (data.error) console.error('Token refresh error:', data.error.message);
  } catch(e) { console.error('Token refresh failed:', e.message); }
}

async function processComments(mediaId) {
  try {
    const comments = await apiRequest(`/${mediaId}/comments?fields=id,text,username,timestamp,from{id,username}&limit=50`);
    if (!comments || !comments.data) return;
    const processed = loadProcessed();
    if (Date.now() - followersCache.lastRefreshed > 15 * 60 * 1000) refreshFollowers().catch(()=>{});
    for (const c of comments.data) {
      if (processed.some(p => p.id === c.id)) continue;
      stats.totalCommentsFound++;
      stats.lastActivityTime = Date.now();

      if (!isWithinWindow(c.from.id)) {
        const windowMsg = CONFIG.window_expired_msg || 'Thanks for your interest! Reply to this or send me a DM to continue.';
        await replyToComment(c.id, windowMsg);
        saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, mediaId, type:'comment', replyOk:true, dmOk:false, windowBlocked:true, ts:Date.now() });
        saveStats(); continue;
      }

      if (!isFollowing(c.from.id, c.from?.username)) {
        stats.totalFollowGateBlocked++;
        console.log(`Blocked (not following): @${c.from?.username||'?'}`);
        saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, mediaId, type:'comment', replyOk:false, dmOk:false, followGate:true, ts:Date.now() });
        saveStats(); continue;
      }

      console.log(`Processing: @${c.from?.username||'?'}`);
      stats.totalCommentsProcessed++;

      const replyResult = await replyToComment(c.id, REPLY_TEMPLATE);
      let replyOk=false, dmOk=false;
      if (replyResult && replyResult.error) { stats.totalErrors++; stats.lastError=`Reply: ${JSON.stringify(replyResult.error)}`; }
      else { stats.totalRepliesSent++; replyOk=true; }

      if (canSendDM()) {
        const trackedMsg = replaceLinksWithTracked(DM_MESSAGE, c.from?.username||'?');
        const kwCfg = CONFIG.keyword_configs?.['*'] || {};
        const dmResult = await sendDM(c.from.id, trackedMsg, kwCfg.media_url || null);
        if (dmResult && dmResult.error) {
          console.error(`DM failed for @${c.from?.username||'?'}:`, dmResult.error);
          stats.totalErrors++; stats.lastError=`DM: ${JSON.stringify(dmResult.error)}`;
        } else { stats.totalDMsent++; dmOk=true; trackDMsent(); touchInteraction(c.from.id); console.log(`DM sent to @${c.from?.username||'?'}`); }
      } else { dmQueue.push({ recipientId: c.from.id, msg: DM_MESSAGE, commentId: c.id, mediaId, username: c.from?.username||'?', text: c.text }); }

      saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, mediaId, type:'comment', replyOk, dmOk, ts:Date.now() });
      saveStats();
    }
  } catch(e) { stats.totalErrors++; stats.lastError=`processComments: ${e.message||e}`; saveStats(); }
}

async function processDMQueue() {
  if (!dmQueue.length || !canSendDM()) return;
  const item = dmQueue.shift();
  try {
    const result = await sendDM(item.recipientId, item.msg);
    if (result && result.error) { stats.totalErrors++; }
    else { stats.totalDMsent++; trackDMsent(); touchInteraction(item.recipientId); }
  } catch(e) { stats.totalErrors++; }
  saveStats();
}

async function run() {
  try {
    stats.totalPolls++; stats.lastPollTime = Date.now();
    if (!TOKEN || !IG_ID) { stats.lastError='Missing TOKEN or IG_ID'; console.error('Missing TOKEN or IG_ID'); saveStats(); return; }
    const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
    if (!media || media.error) { stats.totalErrors++; stats.lastError=`API: ${media?.error?.message||JSON.stringify(media?.error||'No response')}`; saveStats(); return; }
    if (media.data) { for (const p of media.data) { if ((p.comments_count||0)>0) await processComments(p.id); } }
    for (let i=0; i<3 && dmQueue.length; i++) await processDMQueue();
    saveStats();
  } catch(e) { stats.totalErrors++; stats.lastError=`run: ${e.message||e}`; saveStats(); }
}

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  try {
    const urlPath = req.url.split('?')[0];
    const method = req.method;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const json = (data, code=200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    let b = '';
    const body = (cb) => { req.on('data', c => b += c); req.on('end', () => { try { cb(JSON.parse(b)); } catch(e) { json({ error: 'Invalid JSON' }, 400); } }); };

    if (urlPath.startsWith('/click/')) {
      const clickId = urlPath.replace('/click/', '');
      const clicks = loadClicks();
      const click = clicks.find(c => c.clickId === clickId);
      if (click) { stats.totalClicks++; saveStats(); res.writeHead(302, { 'Location': click.url }); res.end(); return; }
      res.writeHead(302, { 'Location': '/' }); res.end(); return;
    }

    if (urlPath === '/api/stats' && method === 'GET') {
      stats.uptime = Date.now() - stats.startTime;
      json({ ...stats, uptimeStr: getDuration(stats.uptime), lastPollStr: stats.lastPollTime ? formatTime(stats.lastPollTime) : null, lastActivityStr: stats.lastActivityTime ? formatTime(stats.lastActivityTime) : null, dmQueueLength: dmQueue.length });
      return;
    }

    if (urlPath === '/api/config' && method === 'GET') {
      json({
        poll_interval_seconds: POLL_INTERVAL,
        reply_template: REPLY_TEMPLATE,
        dm_message: DM_MESSAGE,
        rate_limit_per_hour: RATE_LIMIT_PER_HOUR,
        ig_username: IG_USERNAME,
        enforce_24h_window: ENFORCE_24H_WINDOW,
        window_expired_msg: CONFIG.window_expired_msg || '',
        followers_count: followersCache.ids.size,
        followers_last_refreshed: followersCache.lastRefreshed ? formatTime(followersCache.lastRefreshed) : null,
        dm_queue_length: dmQueue.length
      });
      return;
    }
    if (urlPath === '/api/config' && method === 'POST') {
      body((data) => {
        const persist = {};
        if (data.poll_interval_seconds !== undefined) { POLL_INTERVAL = parseInt(data.poll_interval_seconds, 10); persist.poll_interval_seconds = POLL_INTERVAL; }
        if (data.reply_template !== undefined) { REPLY_TEMPLATE = data.reply_template; persist.reply_template = REPLY_TEMPLATE; }
        if (data.dm_message !== undefined) { DM_MESSAGE = data.dm_message; persist.dm_message = DM_MESSAGE; }
        if (data.rate_limit_per_hour !== undefined) { RATE_LIMIT_PER_HOUR = parseInt(data.rate_limit_per_hour, 10); persist.rate_limit_per_hour = RATE_LIMIT_PER_HOUR; }
        if (data.ig_username !== undefined) { IG_USERNAME = data.ig_username; persist.ig_username = IG_USERNAME; }
        if (data.enforce_24h_window !== undefined) { ENFORCE_24H_WINDOW = data.enforce_24h_window === true; persist.enforce_24h_window = ENFORCE_24H_WINDOW; }
        if (data.window_expired_msg !== undefined) { persist.window_expired_msg = data.window_expired_msg; }
        if (data.access_token !== undefined) { TOKEN = data.access_token; CONFIG.access_token = data.access_token; persist.access_token = data.access_token; }
        if (data.ig_token !== undefined) { IG_TOKEN = data.ig_token; CONFIG.ig_token = data.ig_token; persist.ig_token = data.ig_token; }
        if (data.keyword_configs !== undefined) { CONFIG.keyword_configs = data.keyword_configs; persist.keyword_configs = data.keyword_configs; }
        try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); Object.assign(c, persist); fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
        json({ ok: true });
      });
      return;
    }

    if (urlPath === '/api/inbox' && method === 'GET') {
      const items = loadProcessed();
      const normalized = items.map(i => ({ id:i.id||'', username:i.username||'unknown', text:i.text||'', mediaId:i.mediaId||'', type:i.type||'comment', replyOk:!!i.replyOk, dmOk:!!i.dmOk, followGate:!!i.followGate, windowBlocked:!!i.windowBlocked, ts:i.ts||0 }));
      json({ items: normalized });
      return;
    }

    if (urlPath === '/api/test-trigger' && method === 'POST') {
      body((data) => {
        const { username } = data;
        saveProcessed({ id:'test_'+Date.now(), username:username||'test_user', text:data.text||'test', type:'test', replyOk:true, dmOk:false, ts:Date.now() });
        stats.totalCommentsFound++; stats.totalCommentsProcessed++; stats.lastActivityTime=Date.now(); saveStats();
        json({ ok: true });
      });
      return;
    }

    if (urlPath === '/api/users' && method === 'GET') {
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
        const userItems = items.filter(i => (i.username||'unknown') === name);
        const count = userItems.length;
        const last = userItems.sort((a,b) => (b.ts||0) - (a.ts||0))[0];
        const isFollower = IG_USERNAME ? isFollowing('', name) : null;
        const dmsOk = userItems.filter(i => i.dmOk).length;
        const dmsFail = userItems.filter(i => !i.dmOk && !i.followGate && !i.windowBlocked).length;
        users.push({ username: name, tag, count, dmsOk, dmsFail, lastSeen: last?.ts||0, isFollower, lastType: last?.type||'' });
      }
      json({ users });
      return;
    }
    if (urlPath === '/api/users' && method === 'POST') {
      body((data) => {
        if (!data.tags) { json({ error: 'Missing tags' }, 400); return; }
        try { fs.writeFileSync(USERS_FILE, JSON.stringify(data.tags, null, 2)); } catch(e) { json({ error: 'Write failed' }, 500); return; }
        json({ ok: true });
      });
      return;
    }

    if (urlPath.startsWith('/api/user/') && method === 'GET') {
      const username = decodeURIComponent(urlPath.replace('/api/user/', ''));
      const items = loadProcessed();
      const userItems = items.filter(i => (i.username||'unknown') === username).sort((a,b) => (b.ts||0) - (a.ts||0));
      let userTags = {};
      try { userTags = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch(e) {}
      const interactions = loadInteractions();
      const userId = userItems.length > 0 ? (userItems[0].id?.split('_')[0] || '') : '';
      json({
        username,
        tag: userTags[username] || '',
        isFollower: IG_USERNAME ? isFollowing('', username) : null,
        totalTriggers: userItems.length,
        dmsOk: userItems.filter(i => i.dmOk).length,
        dmsFailed: userItems.filter(i => !i.dmOk && !i.followGate && !i.windowBlocked).length,
        lastInteraction: interactions[userId] || null,
        lastInteractionStr: interactions[userId] ? formatTime(interactions[userId]) : null,
        history: userItems.slice(0, 100).map(i => ({ id:i.id, text:i.text, type:i.type||'comment', replyOk:!!i.replyOk, dmOk:!!i.dmOk, followGate:!!i.followGate, windowBlocked:!!i.windowBlocked, ts:i.ts, timeStr: formatTime(i.ts) }))
      });
      return;
    }

    if (urlPath === '/api/analytics' && method === 'GET') {
      const clicks = loadClicks();
      const items = loadProcessed();
      const totalSent = items.filter(i => i.dmOk).length;
      const totalClicks = stats.totalClicks || 0;
      const uniqueClickers = new Set(clicks.map(c => c.username)).size;
      json({
        totalSent,
        totalClicks,
        uniqueClickers,
        clickRate: totalSent ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0',
        recentClicks: clicks.slice(-50).reverse().map(c => ({ ...c, timeStr: formatTime(c.ts) }))
      });
      return;
    }

    if (urlPath === '/api/refresh-followers' && method === 'POST') {
      refreshFollowers().then(() => json({ ok: true, count: followersCache.ids.size })).catch(e => json({ error: e.message }, 500));
      return;
    }
    if (urlPath === '/api/followers' && method === 'GET') {
      json({ count: followersCache.ids.size, lastRefreshed: followersCache.lastRefreshed, isRefreshing: followersCache.isRefreshing });
      return;
    }

    if (urlPath === '/api/health' || urlPath === '/health') { json({ ok: true, uptime: getDuration(Date.now()-stats.startTime) }); return; }
    if (urlPath === '/') { json({ ok: true, name: 'IG Auto-DM' }); return; }

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
  if (!TOKEN) await refreshToken();
  console.log(`Bot ready: reply="${REPLY_TEMPLATE}", DM="${DM_MESSAGE.substring(0,40)}...", IG_ID=${IG_ID ? 'set' : 'MISSING'}, TOKEN=${TOKEN ? 'set' : 'MISSING'}`);
  setInterval(refreshToken, 20 * 24 * 60 * 60 * 1000);
  setInterval(() => run().catch(e => {}), POLL_INTERVAL * 1000);
  await run();
})();
