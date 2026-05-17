require('dotenv').config();
const { pool } = require('./models/db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    const hashed = await bcrypt.hash('password123', 12);
    
    // Check if admin user exists
    const adminRes = await client.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    if (adminRes.rows.length > 0) {
      console.log('Updating admin@example.com role and password...');
      await client.query(
        "UPDATE users SET name = $1, password = $2, role = 'admin' WHERE email = $3",
        ['Admin User', hashed, 'admin@example.com']
      );
    } else {
      console.log('Creating admin@example.com with role admin...');
      await client.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')",
        ['Admin User', 'admin@example.com', hashed]
      );
    }

    // Check if member user exists
    const memberRes = await client.query('SELECT id FROM users WHERE email = $1', ['member@example.com']);
    if (memberRes.rows.length > 0) {
      console.log('Updating member@example.com role and password...');
      await client.query(
        "UPDATE users SET name = $1, password = $2, role = 'member' WHERE email = $3",
        ['Member User', hashed, 'member@example.com']
      );
    } else {
      console.log('Creating member@example.com with role member...');
      await client.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'member')",
        ['Member User', 'member@example.com', hashed]
      );
    }

    // Check if jatin@gmail.com user exists
    const jatinRes = await client.query('SELECT id FROM users WHERE email = $1', ['jatin@gmail.com']);
    if (jatinRes.rows.length > 0) {
      console.log('Updating jatin@gmail.com to role admin...');
      await client.query(
        "UPDATE users SET role = 'admin' WHERE email = $1",
        ['jatin@gmail.com']
      );
    } else {
      console.log('Creating jatin@gmail.com with role admin...');
      await client.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')",
        ['Jatin Admin', 'jatin@gmail.com', hashed]
      );
    }

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
