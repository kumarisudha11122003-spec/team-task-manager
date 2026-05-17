require('dotenv').config();
const { pool } = require('./models/db');

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, email, role, password FROM users');
    console.log('--- USERS IN DATABASE ---');
    console.log(res.rows);
    console.log('-------------------------');
  } catch (err) {
    console.error('Error querying users:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}
check();
