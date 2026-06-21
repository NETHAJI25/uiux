const https = require('https');
const fs = require('fs');
const path = require('path');

// Load config - support env vars for cloud deployment with JSON fallback
let CONFIG = {};
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

const TOKEN = process.env.ACCESS_TOKEN || CONFIG.access_token;
const IG_ID = process.env.IG_USER_ID || CONFIG.ig_user_id;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || CONFIG.poll_interval_seconds || '30', 10);

// Load keywords from env (JSON string) or config.json
let KEYWORDS = {};
try { KEYWORDS = JSON.parse(process.env.KEYWORDS_JSON || 'null') || CONFIG.keywords || {}; } catch(e) {}

const PROCESSED_FILE = path.join(__dirname, 'processed.json');

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

    const keyword = extractKeyword(comment.text);
    if (!keyword) continue;

    const dmMessage = KEYWORDS[keyword];

    // Reply to comment with a teaser
    const replyText = `✅ "${keyword}" received! Check your DMs 📩`;
    const replyResult = await replyToComment(comment.id, replyText);
    if (replyResult.error) {
      console.log(`  Reply error: ${JSON.stringify(replyResult.error)}`);
    } else {
      console.log(`  ✅ Replied to comment ${comment.id}`);
    }

    // Send DM with the actual link
    const dmResult = await sendDM(comment.from.id, dmMessage);
    if (dmResult.error) {
      console.log(`  DM error for user ${comment.from.id}: ${JSON.stringify(dmResult.error)}`);
      // Fallback: put the link in a second comment reply
      await replyToComment(comment.id, dmMessage);
      console.log(`  ⚠️ Sent link as comment reply instead`);
    } else {
      console.log(`  ✅ DM sent to ${comment.from.username} (${comment.from.id})`);
    }

    saveProcessed(comment.id);
  }
}

async function run() {
  console.log(`\n[${new Date().toLocaleTimeString()}] Polling Instagram...`);

  // Get latest media
  const media = await apiRequest(`/${IG_ID}/media?fields=id,caption,media_type,comments_count&limit=5`);
  if (!media.data || media.data.length === 0) {
    console.log('  No media found');
    return;
  }

  for (const post of media.data) {
    console.log(`  Checking post ${post.id} (${post.comments_count || 0} comments)...`);
    if ((post.comments_count || 0) > 0) {
      await processComments(post.id);
    }
  }
  console.log('  Done');
}

// Main loop
console.log('🤖 Instagram Auto-DM Bot Started');
console.log(`   Polling every ${POLL_INTERVAL}s`);
console.log(`   Keywords watched: ${Object.keys(KEYWORDS).join(', ')}`);
console.log('');

run();
setInterval(run, POLL_INTERVAL * 1000);
