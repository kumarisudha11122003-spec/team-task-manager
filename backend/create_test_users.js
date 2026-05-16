const http = require('http');

const signup = (name, email) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({ name, email, password: 'password123' });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => resolve(result));
    });
    req.on('error', (e) => resolve(`Error: ${e.message}`));
    req.write(data);
    req.end();
  });
};

async function main() {
  const r1 = await signup('Admin User', 'admin@example.com');
  console.log('Admin:', r1);
  const r2 = await signup('Member User', 'member@example.com');
  console.log('Member:', r2);
}
main();
