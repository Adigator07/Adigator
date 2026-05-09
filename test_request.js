const fs = require('fs');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const content = [
  '--' + boundary,
  'Content-Disposition: form-data; name="goal"',
  '',
  'awareness',
  '--' + boundary,
  'Content-Disposition: form-data; name="vertical"',
  '',
  'news_media',
  '--' + boundary,
  'Content-Disposition: form-data; name="image"; filename="test.txt"',
  'Content-Type: text/plain',
  '',
  'dummy image content',
  '--' + boundary + '--',
  ''
].join('\r\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze-v2',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(content)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.write(content);
req.end();
