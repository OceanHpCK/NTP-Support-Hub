// Quick script: trigger request then tail logs
const https = require('https');

const url = 'https://hotrokythuat.doandacduong.workers.dev/api/admin/documents/public-list';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(data.substring(0, 500));
    }
  });
}).on('error', (e) => console.error('Request error:', e.message));
