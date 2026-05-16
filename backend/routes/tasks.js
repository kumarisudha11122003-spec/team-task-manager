const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: check project membership
async function getMembership(projectId, userId) {
  const result = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows[0] || null;
}

// GET /api/tasks - Get tasks (all projects if project_id omitted)
router.get('/', protect, async (req, res) => {
  const { project_id } = req.query;

  try {
    if (!project_id) {
      if (req.user.role === 'admin') {
        const result = await pool.query(`
          SELECT t.*,
            u.name as assigned_to_name, u.email as assigned_to_email,
            c.name as created_by_name,
            p.name as project_name
          FROM tasks t
          LEFT JOIN users u ON u.id = t.assigned_to
          LEFT JOIN users c ON c.id = t.created_by
          LEFT JOIN projects p ON p.id = t.project_id
          ORDER BY t.created_at DESC
        `);
        return res.json(result.rows);
      } else {
        const result = await pool.query(`
          SELECT t.*,
            u.name as assigned_to_name, u.email as assigned_to_email,
            c.name as created_by_name,
            p.name as project_name
          FROM tasks t
          JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
          LEFT JOIN users u ON u.id = t.assigned_to
          LEFT JOIN users c ON c.id = t.created_by
          LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.assigned_to = $1
          ORDER BY t.created_at DESC
        `, [req.user.id]);
        return res.json(result.rows);
      }
    }

    const membership = await getMembership(project_id, req.user.id);
    if (!membership && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

    const result = await pool.query(`
      SELECT t.*,
        u.name as assigned_to_name, u.email as assigned_to_email,
        c.name as created_by_name,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.project_id = $1
      ORDER BY
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `, [project_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks - Create task (admin only)
router.post('/', protect, adminOnly, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('project_id').isInt().withMessage('project_id is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in_progress', 'done'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, due_date, priority, status, assigned_to, project_id } = req.body;

  const membership = await getMembership(project_id, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });
  if (membership.role !== 'admin') return res.status(403).json({ error: 'Only admins can create tasks' });

  try {
    if (assigned_to) {
      const assigneeCheck = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [project_id, assigned_to]
      );
      if (!assigneeCheck.rows.length) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const result = await pool.query(`
      INSERT INTO tasks (project_id, title, description, due_date, priority, status, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [project_id, title, description || null, due_date || null, priority || 'medium', status || 'todo', assigned_to || null, req.user.id]);

    const task = result.rows[0];

    // Fetch with names
    const full = await pool.query(`
      SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1
    `, [task.id]);

    res.status(201).json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id - Update task
router.patch('/:id', protect, async (req, res) => {
  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found' });
    const task = taskResult.rows[0];

    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assigned_to === req.user.id;

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you' });
    }

    const allowedFields = isAdmin
      ? ['title', 'description', 'due_date', 'priority', 'status', 'assigned_to']
      : ['status'];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates['updated_at'] = new Date();

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const updated = await pool.query(
      `UPDATE tasks SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, req.params.id]
    );

    const full = await pool.query(`
      SELECT t.*, u.name as assigned_to_name, c.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1
    `, [req.params.id]);

    res.json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!taskResult.rows.length) return res.status(404).json({ error: 'Task not found' });
    const task = taskResult.rows[0];

    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
