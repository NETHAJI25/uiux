const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err?.message||err); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err?.message||err); });

// ─── Config ───
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
let DM_KEYWORD_ENABLED = CONFIG.dm_keyword_enabled === true;

let KEYWORDS = {};
try { KEYWORDS = JSON.parse(process.env.KEYWORDS_JSON || 'null') || CONFIG.keywords || {}; } catch(e) {}
let REPLY_TEMPLATE = process.env.REPLY_TEMPLATE || CONFIG.reply_template || 'Check your DM \u2705 Thanks for commenting!';
let POST_KEYWORDS = {};
try { POST_KEYWORDS = JSON.parse(process.env.POST_KEYWORDS_JSON || 'null') || CONFIG.post_keywords || {}; } catch(e) {}

let FOLLOW_GATE_ENABLED = CONFIG.follow_gate_enabled === true;
let FOLLOW_PROMPT = CONFIG.follow_prompt || 'Follow @{ig_username} and comment {keyword} again to get the link!';
let RATE_LIMIT_PER_HOUR = parseInt(CONFIG.rate_limit_per_hour || '150', 10);
let IG_USERNAME = CONFIG.ig_username || '';

const PROCESSED_FILE = path.join(__dirname, 'processed.json');
const STATS_FILE = path.join(__dirname, 'stats.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const FOLLOWERS_CACHE_FILE = path.join(__dirname, 'followers_cache.json');
const INTERACTIONS_FILE = path.join(__dirname, 'interactions.json');
const CLICKS_FILE = path.join(__dirname, 'clicks.json');

// ─── Stats ───
let stats = { startTime: Date.now(), totalPolls:0, totalCommentsFound:0, totalCommentsProcessed:0, totalRepliesSent:0, totalDMsent:0, totalErrors:0, totalFallbackReplies:0, totalFollowGateBlocked:0, totalInboundDMs:0, totalInboundReplied:0, totalClicks:0, keywordsTriggered:{}, lastPollTime:null, lastActivityTime:null, lastError:null, uptime:0 };
function loadStats() { try { const s = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); stats = { ...stats, ...s, startTime: s.startTime || Date.now() }; } catch(e) {} }
function saveStats() { stats.uptime = Date.now() - stats.startTime; try { fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2)); } catch(e) {} }

function getDuration(ms) { const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return `${d}d ${h}h ${m}m ${s%60}s`; }
function formatTime(ts) { try { return new Date(ts).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'}); } catch(e) { return ''; } }

// ─── API Request ───
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

// ─── Instagram API Request (for DM sending) ───
function igApiRequest(endpoint, method='POST', body=null) {
  return new Promise((resolve,reject)=>{
    try {
      const opts = {
        hostname: 'graph.instagram.com',
        path: endpoint,
        method,
        headers: { 'Authorization': `Bearer ${IG_TOKEN}`, 'Content-Type': 'application/json' }
      };
      const req = https.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch(e){resolve(d)}}); });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Instagram API timeout')); });
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

// ─── Rate Limiter ───
let dmQueue = [];
let dmSentTimestamps = [];
function canSendDM() {
  const now = Date.now();
  dmSentTimestamps = dmSentTimestamps.filter(t => now - t < 3600000);
  return dmSentTimestamps.length < RATE_LIMIT_PER_HOUR;
}
function trackDMsent() { dmSentTimestamps.push(Date.now()); }

// ─── 24h Window ───
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

// ─── Click Tracking ───
function loadClicks() { try { return JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf8')); } catch { return []; } }
function saveClicks(data) { try { fs.writeFileSync(CLICKS_FILE, JSON.stringify(data.slice(-5000), null, 2)); } catch(e) {} }
function trackClick(clickId, url, username, keyword) {
  const clicks = loadClicks();
  clicks.push({ clickId, url, username, keyword, ts: Date.now() });
  saveClicks(clicks);
  stats.totalClicks++;
}
function replaceLinksWithTracked(text, username, keyword) {
  const urlRegex = /https?:\/\/[^\s,]+/g;
  let idx = 0;
  return text.replace(urlRegex, (match) => {
    const clickId = `clk_${Date.now()}_${idx++}`;
    trackClick(clickId, match, username, keyword);
    return `${match} [click:${clickId}]`;
  });
}

// ─── Data ───
function loadProcessed() { try { return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8')); } catch { return []; } }
function saveProcessed(entry) { const list = loadProcessed(); list.push(entry); try { fs.writeFileSync(PROCESSED_FILE, JSON.stringify(list.slice(-1000))); } catch(e) {} }
function extractKeyword(text) { const u=text.toUpperCase(); for (const k of Object.keys(KEYWORDS)) { if (u.includes(k)) return k; } return null; }

// ─── DM Sending (Instagram API first, fallback to Facebook) ───
async function sendDM(recipientId, msg, mediaUrl) {
  if (IG_TOKEN) {
    try {
      const body = { recipient: { id: recipientId }, message: { text: msg } };
      const result = await igApiRequest('/v25.0/me/messages', 'POST', body);
      if (result && !result.error) return result;
      console.error('Instagram DM failed:', result?.error);
    } catch(e) { console.error('Instagram API error:', e.message); }
  }
  try {
    const body = { recipient: { id: recipientId } };
    if (mediaUrl) {
      body.message = { attachment: { type: 'image', payload: { url: mediaUrl } } };
    } else {
      body.message = { text: msg };
    }
    return await apiRequest(`/${IG_ID}/messages?access_token=${TOKEN}`, 'POST', body);
  } catch(e) { return { error: e.message }; }
}
async function sendPostShare(recipientId, postMediaId) {
  try {
    return await apiRequest(`/${IG_ID}/messages?access_token=${TOKEN}`, 'POST', {
      recipient: { id: recipientId },
      message: { attachment: { type: 'MEDIA_SHARE', payload: { id: postMediaId } } }
    });
  } catch(e) { return { error: e.message }; }
}

async function replyToComment(cId, msg) { return await apiRequest(`/${cId}/replies?message=${encodeURIComponent(msg)}&access_token=${TOKEN}`, 'POST'); }

const BOT_START_TIME = Date.now();

// ─── Token Refresh ───
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
// ─── Process Comment Triggers ───
async function processComments(mediaId) {
  try {
    const comments = await apiRequest(`/${mediaId}/comments?fields=id,text,username,timestamp,from{id,username}&limit=50`);
    if (!comments || !comments.data) return;
    const processed = loadProcessed();
    if (FOLLOW_GATE_ENABLED && (Date.now() - followersCache.lastRefreshed > 15 * 60 * 1000)) refreshFollowers().catch(()=>{});
    for (const c of comments.data) {
      if (processed.some(p => p.id === c.id)) continue;
      stats.totalCommentsFound++;
      const postKwList = POST_KEYWORDS[mediaId];
      if (!postKwList || !postKwList.length) continue;
      const uText = c.text.toUpperCase();
      const keyword = postKwList.find(k => uText.includes(k));
      if (!keyword) continue;
      stats.totalCommentsProcessed++;
      stats.keywordsTriggered[keyword] = (stats.keywordsTriggered[keyword]||0)+1;
      const commentTime = c.timestamp ? new Date(c.timestamp).getTime() : 0;
      if (commentTime < BOT_START_TIME) {
        saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, type:'comment', replyOk:false, dmOk:false, fallback:false, skipped:true, ts:Date.now() });
        saveStats(); continue;
      }
      stats.lastActivityTime = Date.now();
      const dmMsg = KEYWORDS[keyword];
      const replyTxt = REPLY_TEMPLATE.replace(/{keyword}/g, keyword);

      // 24h window check
      if (!isWithinWindow(c.from.id)) {
        const windowMsg = CONFIG.window_expired_msg || 'Thanks for your interest! Reply to this or send me a DM to continue.';
        await replyToComment(c.id, windowMsg);
        saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, type:'comment', replyOk:true, dmOk:false, fallback:false, windowBlocked:true, skipped:false, ts:Date.now() });
        saveStats(); continue;
      }

      // Follow gate
      if (FOLLOW_GATE_ENABLED && !isFollowing(c.from.id, c.from?.username)) {
        stats.totalFollowGateBlocked++;
        const fp = FOLLOW_PROMPT.replace(/{ig_username}/g, IG_USERNAME).replace(/{keyword}/g, keyword).replace(/{username}/g, c.from?.username || 'there');
        await replyToComment(c.id, fp);
        saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, type:'comment', replyOk:true, dmOk:false, fallback:false, followGate:true, skipped:false, ts:Date.now() });
        saveStats(); continue;
      }

      // Reply
      const replyResult = await replyToComment(c.id, replyTxt);
      let replyOk=false, dmOk=false, fb=false;
      if (replyResult && replyResult.error) { stats.totalErrors++; stats.lastError=`Reply: ${JSON.stringify(replyResult.error)}`; }
      else { stats.totalRepliesSent++; replyOk=true; }

      // DM with link tracking
      if (canSendDM()) {
        const trackedMsg = replaceLinksWithTracked(dmMsg, c.from?.username||'?', keyword);
        const kwCfg = CONFIG.keyword_configs?.[keyword] || {};
        const dmResult = await sendDM(c.from.id, trackedMsg, kwCfg.media_url || null);
        if (dmResult && dmResult.error) {
          stats.totalErrors++; stats.lastError=`DM: ${JSON.stringify(dmResult.error)}`;
          await replyToComment(c.id, dmMsg); fb=true;
          stats.totalFallbackReplies++;
        } else { stats.totalDMsent++; dmOk=true; trackDMsent(); touchInteraction(c.from.id); }
      } else { dmQueue.push({ recipientId: c.from.id, msg: dmMsg, commentId: c.id, keyword, mediaId, username: c.from?.username||'?', text: c.text }); }

      saveProcessed({ id:c.id, username:c.from?.username||'?', text:c.text, keyword, mediaId, type:'comment', replyOk, dmOk, fallback:fb, skipped:false, ts:Date.now() });
      saveStats();
    }
  } catch(e) { stats.totalErrors++; stats.lastError=`processComments: ${e.message||e}`; saveStats(); }
}

// ─── Process Inbound DM Triggers ───
let processedDMs = new Set();
function loadProcessedDMs() { try { const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'processed_dms.json'), 'utf8')); processedDMs = new Set(d); } catch {} }
function saveProcessedDMs() { try { fs.writeFileSync(path.join(__dirname, 'processed_dms.json'), JSON.stringify([...processedDMs].slice(-2000))); } catch {} }

async function processInboundDMs() {
  if (!DM_KEYWORD_ENABLED || !IG_ID || !TOKEN) return;
  try {
    const convs = await apiRequest(`/${IG_ID}/conversations?fields=id,messages{id,from,to,message,created_time}&limit=20`);
    if (!convs || !convs.data) return;
    for (const conv of convs.data) {
      const msgs = conv.messages?.data || [];
      if (!msgs.length) continue;
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg || processedDMs.has(lastMsg.id)) continue;
      // Only process messages FROM users (not from our account)
      const senderId = lastMsg.from?.id || '';
      if (senderId === IG_ID) { processedDMs.add(lastMsg.id); continue; }
      processedDMs.add(lastMsg.id);
      stats.totalInboundDMs++;
      const text = lastMsg.message || '';
      const keyword = extractKeyword(text);
      if (!keyword) continue;
      stats.totalInboundReplied++;
      const dmMsg = KEYWORDS[keyword];
      if (!dmMsg) continue;
      const kwCfg = CONFIG.keyword_configs?.[keyword] || {};
      const trackedMsg = replaceLinksWithTracked(dmMsg, lastMsg.from?.username || 'unknown', keyword);
      const dmResult = await sendDM(senderId, trackedMsg, kwCfg.media_url || null);
      let replyOk = false;
      if (dmResult && !dmResult.error) { replyOk = true; stats.totalDMsent++; trackDMsent(); touchInteraction(senderId); }
      else { stats.totalErrors++; stats.lastError=`Inbound DM: ${JSON.stringify(dmResult?.error)}`; }
      saveProcessed({ id:`dm_${lastMsg.id}`, username:lastMsg.from?.username||'?', text, keyword, mediaId:'DM', type:'inbound_dm', replyOk, dmOk:replyOk, fallback:false, skipped:false, ts:Date.now() });
      saveStats();
    }
    saveProcessedDMs();
  } catch(e) { /* silent - conversations API may fail if not available */ }
}

// ─── Process DM Queue ───
async function processDMQueue() {
  if (!dmQueue.length || !canSendDM()) return;
  const item = dmQueue.shift();
  try {
    const result = await sendDM(item.recipientId, item.msg);
    if (result && result.error) { stats.totalErrors++; await replyToComment(item.commentId, item.msg); stats.totalFallbackReplies++; }
    else { stats.totalDMsent++; trackDMsent(); touchInteraction(item.recipientId); }
  } catch(e) { stats.totalErrors++; }
  saveStats();
}

// ─── Main Run Loop ───
async function run() {
  try {
    stats.totalPolls++; stats.lastPollTime = Date.now();
    if (!TOKEN || !IG_ID) { stats.lastError='Missing TOKEN or IG_ID'; saveStats(); return; }
    const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
    if (!media || media.error) { stats.totalErrors++; stats.lastError=`API: ${media?.error?.message||JSON.stringify(media?.error||'No response')}`; saveStats(); return; }
    if (media.data) { for (const p of media.data) { if ((p.comments_count||0)>0) await processComments(p.id); } }
    if (DM_KEYWORD_ENABLED) await processInboundDMs();
    for (let i=0; i<3 && dmQueue.length; i++) await processDMQueue();
    saveStats();
  } catch(e) { stats.totalErrors++; stats.lastError=`run: ${e.message||e}`; saveStats(); }
}

// ─── HTTP Server ───
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

    // Click tracking redirect
    if (urlPath.startsWith('/click/')) {
      const clickId = urlPath.replace('/click/', '');
      const clicks = loadClicks();
      const click = clicks.find(c => c.clickId === clickId);
      if (click) { stats.totalClicks++; saveStats(); res.writeHead(302, { 'Location': click.url }); res.end(); return; }
      res.writeHead(302, { 'Location': '/' }); res.end(); return;
    }

    // Stats
    if (urlPath === '/api/stats' && method === 'GET') {
      stats.uptime = Date.now() - stats.startTime;
      json({ ...stats, uptimeStr: getDuration(stats.uptime), lastPollStr: stats.lastPollTime ? formatTime(stats.lastPollTime) : null, lastActivityStr: stats.lastActivityTime ? formatTime(stats.lastActivityTime) : null, dmQueueLength: dmQueue.length });
      return;
    }

    // Config
    if (urlPath === '/api/config' && method === 'GET') {
      json({
        poll_interval_seconds: POLL_INTERVAL,
        reply_template: REPLY_TEMPLATE,
        keywords: KEYWORDS,
        keyword_configs: CONFIG.keyword_configs || {},
        post_keywords: POST_KEYWORDS,
        follow_gate_enabled: FOLLOW_GATE_ENABLED,
        follow_prompt: FOLLOW_PROMPT,
        rate_limit_per_hour: RATE_LIMIT_PER_HOUR,
        ig_username: IG_USERNAME,
        enforce_24h_window: ENFORCE_24H_WINDOW,
        dm_keyword_enabled: DM_KEYWORD_ENABLED,
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
        if (data.follow_gate_enabled !== undefined) { FOLLOW_GATE_ENABLED = data.follow_gate_enabled === true; persist.follow_gate_enabled = FOLLOW_GATE_ENABLED; }
        if (data.follow_prompt !== undefined) { FOLLOW_PROMPT = data.follow_prompt; persist.follow_prompt = FOLLOW_PROMPT; }
        if (data.rate_limit_per_hour !== undefined) { RATE_LIMIT_PER_HOUR = parseInt(data.rate_limit_per_hour, 10); persist.rate_limit_per_hour = RATE_LIMIT_PER_HOUR; }
        if (data.ig_username !== undefined) { IG_USERNAME = data.ig_username; persist.ig_username = IG_USERNAME; }
        if (data.keywords !== undefined) { KEYWORDS = data.keywords; persist.keywords = KEYWORDS; }
        if (data.keyword_configs !== undefined) { CONFIG.keyword_configs = data.keyword_configs; persist.keyword_configs = data.keyword_configs; }
        if (data.post_keywords !== undefined) { POST_KEYWORDS = data.post_keywords; persist.post_keywords = POST_KEYWORDS; }
        if (data.enforce_24h_window !== undefined) { ENFORCE_24H_WINDOW = data.enforce_24h_window === true; persist.enforce_24h_window = ENFORCE_24H_WINDOW; }
        if (data.dm_keyword_enabled !== undefined) { DM_KEYWORD_ENABLED = data.dm_keyword_enabled === true; persist.dm_keyword_enabled = DM_KEYWORD_ENABLED; }
        if (data.window_expired_msg !== undefined) { persist.window_expired_msg = data.window_expired_msg; }
        if (data.access_token !== undefined) { TOKEN = data.access_token; CONFIG.access_token = data.access_token; persist.access_token = data.access_token; }
        if (data.ig_token !== undefined) { IG_TOKEN = data.ig_token; CONFIG.ig_token = data.ig_token; persist.ig_token = data.ig_token; }
        try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); Object.assign(c, persist); fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
        json({ ok: true });
      });
      return;
    }

    // Keywords
    if (urlPath === '/api/keywords' && method === 'GET') { json({ keywords: KEYWORDS }); return; }
    if (urlPath === '/api/keywords' && method === 'POST') {
      body((data) => {
        if (!data.keywords) { json({ error: 'Missing keywords' }, 400); return; }
        KEYWORDS = data.keywords;
        try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.keywords = KEYWORDS; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
        json({ ok: true, count: Object.keys(KEYWORDS).length });
      });
      return;
    }

    // Posts
    if (urlPath === '/api/posts' && method === 'GET') {
      apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,timestamp&limit=25`)
        .then(p => json({ posts: p.data || [], assignments: POST_KEYWORDS }))
        .catch(e => json({ error: e.message }, 500));
      return;
    }
    if (urlPath === '/api/post-keywords' && method === 'POST') {
      body((data) => {
        if (!data.assignments) { json({ error: 'Missing assignments' }, 400); return; }
        POST_KEYWORDS = data.assignments;
        try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.post_keywords = POST_KEYWORDS; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
        json({ ok: true });
      });
      return;
    }

    // Reply template
    if (urlPath === '/api/reply-template' && method === 'POST') {
      body((data) => {
        if (!data.template) { json({ error: 'Missing template' }, 400); return; }
        REPLY_TEMPLATE = data.template;
        try { const c = JSON.parse(fs.readFileSync(configPath, 'utf8')); c.reply_template = REPLY_TEMPLATE; fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); } catch(e) {}
        json({ ok: true });
      });
      return;
    }

    // Inbox
    if (urlPath === '/api/inbox' && method === 'GET') {
      const items = loadProcessed();
      const normalized = items.map(i => ({ id:i.id||'', username:i.username||'unknown', text:i.text||'', keyword:i.keyword||'?', mediaId:i.mediaId||'', type:i.type||'comment', replyOk:!!i.replyOk, dmOk:!!i.dmOk, fallback:!!i.fallback, followGate:!!i.followGate, windowBlocked:!!i.windowBlocked, skipped:!!i.skipped, ts:i.ts||0 }));
      json({ items: normalized });
      return;
    }

    // Test trigger
    if (urlPath === '/api/test-trigger' && method === 'POST') {
      body((data) => {
        const { keyword, username } = data;
        if (!keyword || !KEYWORDS[keyword]) { json({ error: 'Keyword not found' }, 400); return; }
        saveProcessed({ id:'test_'+Date.now(), username:username||'test_user', text:data.text||keyword, keyword, type:'test', replyOk:true, dmOk:false, fallback:true, ts:Date.now() });
        stats.totalCommentsFound++; stats.totalCommentsProcessed++; stats.keywordsTriggered[keyword] = (stats.keywordsTriggered[keyword]||0)+1; stats.lastActivityTime=Date.now(); saveStats();
        json({ ok: true });
      });
      return;
    }

    // Users
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
        const dmsFail = userItems.filter(i => i.fallback || (i.type === 'comment' && !i.dmOk && !i.skipped)).length;
        users.push({ username: name, tag, count, dmsOk, dmsFail, lastSeen: last?.ts||0, lastKeyword: last?.keyword||'', isFollower, lastType: last?.type||'' });
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

    // Contact profile
    if (urlPath.startsWith('/api/user/') && method === 'GET') {
      const username = decodeURIComponent(urlPath.replace('/api/user/', ''));
      const items = loadProcessed();
      const userItems = items.filter(i => (i.username||'unknown') === username).sort((a,b) => (b.ts||0) - (a.ts||0));
      let userTags = {};
      try { userTags = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch(e) {}
      const interactions = loadInteractions();
      // Find IG user ID from processed items
      const userId = userItems.length > 0 ? (userItems[0].id?.split('_')[0] || '') : '';
      json({
        username,
        tag: userTags[username] || '',
        isFollower: IG_USERNAME ? isFollowing('', username) : null,
        totalTriggers: userItems.length,
        dmsOk: userItems.filter(i => i.dmOk).length,
        dmsFailed: userItems.filter(i => i.fallback || (!i.dmOk && !i.skipped)).length,
        lastInteraction: interactions[userId] || null,
        lastInteractionStr: interactions[userId] ? formatTime(interactions[userId]) : null,
        keywordsUsed: [...new Set(userItems.map(i => i.keyword).filter(Boolean))],
        history: userItems.slice(0, 100).map(i => ({ id:i.id, text:i.text, keyword:i.keyword, type:i.type||'comment', replyOk:!!i.replyOk, dmOk:!!i.dmOk, fallback:!!i.fallback, followGate:!!i.followGate, windowBlocked:!!i.windowBlocked, skipped:!!i.skipped, ts:i.ts, timeStr: formatTime(i.ts) }))
      });
      return;
    }

    // Analytics
    if (urlPath === '/api/analytics' && method === 'GET') {
      const clicks = loadClicks();
      const items = loadProcessed();
      const totalSent = items.filter(i => i.dmOk).length;
      const totalOpens = 0; // would need webhook for this
      const totalClicks = stats.totalClicks || 0;
      const uniqueClickers = new Set(clicks.map(c => c.username)).size;
      const clicksByKeyword = {};
      for (const c of clicks) { clicksByKeyword[c.keyword] = (clicksByKeyword[c.keyword]||0)+1; }
      json({
        totalSent,
        totalOpens,
        totalClicks,
        uniqueClickers,
        clickRate: totalSent ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0',
        clicksByKeyword,
        recentClicks: clicks.slice(-50).reverse().map(c => ({ ...c, timeStr: formatTime(c.ts) }))
      });
      return;
    }

    // Followers
    if (urlPath === '/api/refresh-followers' && method === 'POST') {
      refreshFollowers().then(() => json({ ok: true, count: followersCache.ids.size })).catch(e => json({ error: e.message }, 500));
      return;
    }
    if (urlPath === '/api/followers' && method === 'GET') {
      json({ count: followersCache.ids.size, lastRefreshed: followersCache.lastRefreshed, isRefreshing: followersCache.isRefreshing });
      return;
    }

    // Health
    if (urlPath === '/api/health' || urlPath === '/health') { json({ ok: true, uptime: getDuration(Date.now()-stats.startTime) }); return; }
    if (urlPath === '/') { json({ ok: true, name: 'IG Auto-DM API' }); return; }

    json({ error: 'Not found' }, 404);
  } catch(e) {
    try { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); } catch(e2) {}
  }
});

server.on('error', (err) => { console.error('Server error:', err.message); });
server.listen(PORT, () => { console.log(`API server on port ${PORT}`); });

loadStats();
loadFollowersCache();
loadProcessedDMs();
(async () => {
  if (!TOKEN) await refreshToken();
  setInterval(refreshToken, 25 * 24 * 60 * 60 * 1000);
  setInterval(() => run().catch(e => {}), POLL_INTERVAL * 1000);
  await run();
})();
