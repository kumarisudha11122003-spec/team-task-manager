const http = require('http');

const data = JSON.stringify({ email: 'admin@example.com', password: 'password123' });
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let result = '';
  res.on('data', chunk => result += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', result);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
