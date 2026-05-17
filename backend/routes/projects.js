const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/projects - Get all projects for current user
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query(`
        SELECT p.*, 'admin' as role, u.name as creator_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
        FROM projects p
        JOIN users u ON u.id = p.created_by
        ORDER BY p.created_at DESC
      `);
      return res.json(result.rows);
    } else {
      const result = await pool.query(`
        SELECT p.*, pm.role, u.name as creator_name,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
          (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id
        JOIN users u ON u.id = p.created_by
        WHERE pm.user_id = $1
        ORDER BY p.created_at DESC
      `, [req.user.id]);
      return res.json(result.rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects - Create project
router.post('/', protect, adminOnly, [
  body('name').trim().notEmpty().withMessage('Project name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const proj = await client.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, req.user.id]
    );
    const project = proj.rows[0];
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'admin']
    );
    await client.query('COMMIT');
    res.status(201).json({ ...project, role: 'admin' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/projects/:id - Get single project with members
router.get('/:id', protect, async (req, res) => {
  try {
    let proj;
    if (req.user.role === 'admin') {
      proj = await pool.query(`
        SELECT p.*, 'admin' as role, u.name as creator_name
        FROM projects p
        JOIN users u ON u.id = p.created_by
        WHERE p.id = $1
      `, [req.params.id]);
    } else {
      proj = await pool.query(`
        SELECT p.*, pm.role, u.name as creator_name
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id
        JOIN users u ON u.id = p.created_by
        WHERE p.id = $1 AND pm.user_id = $2
      `, [req.params.id, req.user.id]);
    }

    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found or access denied' });

    const members = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role, pm.joined_at
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
      ORDER BY pm.role DESC, u.name
    `, [req.params.id]);

    res.json({ ...proj.rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/members - Add member (admin only)
router.post('/:id/members', protect, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // Check if requester is admin
    // Check if requester is admin
    // Removed role check to grant full access to all users

    const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found with that email' });

    const newUser = user.rows[0];

    const existing = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, newUser.id]
    );
    if (existing.rows.length) return res.status(409).json({ error: 'User is already a member' });

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [req.params.id, newUser.id, 'member']
    );

    res.status(201).json({ message: 'Member added successfully', user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member (admin only)
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    // Removed role check to grant full access to all users

    if (parseInt(req.params.userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself from project' });
    }

    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Removed role check to grant full access to all users

    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
