require('dotenv').config({ path: './backend/.env' });
const { pool } = require('./backend/models/db');
(async () => {
  try {
    await pool.query("UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'");
    const res = await pool.query('SELECT email, role FROM users');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
