const fetch = require('node-fetch');

async function scrapeInstagram(profile_id, first = 10) {
  try {
    const response = await fetch('http://localhost:3000/api/instagram/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id, first })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error('Scrape failed:', e.message);
  }
}

const profileId = process.argv[2] || 'your-instagram-profile-id';
const count = parseInt(process.argv[3], 10) || 10;
scrapeInstagram(profileId, count);
