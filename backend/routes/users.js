const express = require('express');
const { pool } = require('../models/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// PATCH /api/users/heartbeat - Update last_seen for current user
router.patch('/heartbeat', protect, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET last_seen = NOW() WHERE id = $1',
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    // last_seen column may not exist yet — ignore silently
    res.json({ ok: true });
  }
});

// Temporary helper route — sets admin@example.com to admin role
router.get('/fix-admin', async (req, res) => {
  try {
    await pool.query("UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'");
    const rows = await pool.query('SELECT email, role FROM users');
    res.json({ success: true, users: rows.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users - Get all users (all authenticated users can call this for Team Workspace)
router.get('/', protect, async (req, res) => {
  try {
    let result;
    try {
      // Try with last_seen column first
      result = await pool.query(
        'SELECT id as "_id", id, name, email, created_at as "createdAt", role, last_seen as "lastSeen" FROM users ORDER BY name ASC'
      );
    } catch (colErr) {
      // Fallback if last_seen column doesn't exist
      result = await pool.query(
        'SELECT id as "_id", id, name, email, created_at as "createdAt", role FROM users ORDER BY name ASC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id as "_id", id, name, email, created_at as "createdAt", role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/invite - Admin only
router.post('/invite', protect, adminOnly, async (req, res) => {
  const { email, role } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'User already exists' });
    res.json({ message: 'Invitation sent to ' + email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/role - Admin only
router.patch('/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin or member.' });
    }

    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const updated = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id as "_id", name, email, role, created_at as "createdAt"',
      [role, req.params.id]
    );

    if (updated.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const userName = updated.rows[0].name;
    res.json({ success: true, message: userName + ' is now ' + role, user: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id - Admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot remove yourself' });
    }

    await pool.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [req.params.id]);
    await pool.query('DELETE FROM project_members WHERE user_id = $1', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    res.json({ success: true, message: 'User has been removed from the team' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
