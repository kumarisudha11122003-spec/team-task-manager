const express = require('express');
const { pool } = require('../models/db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/dashboard/stats - Get role-filtered dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let taskQuery = '';
    let queryParams = [];

    if (!isAdmin) {
      taskQuery = 'WHERE assigned_to = $1';
      queryParams.push(req.user.id);
    }

    const tasksRes = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('in_progress', 'in-progress')) as in_progress,
        COUNT(*) FILTER (WHERE status = 'done') as completed,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') as overdue
      FROM tasks
      ${taskQuery}
    `, queryParams);

    const stats = {
      total: parseInt(tasksRes.rows[0].total) || 0,
      inProgress: parseInt(tasksRes.rows[0].in_progress) || 0,
      completed: parseInt(tasksRes.rows[0].completed) || 0,
      overdue: parseInt(tasksRes.rows[0].overdue) || 0
    };

    let teamWorkload = [];
    if (isAdmin) {
      const usersRes = await pool.query('SELECT id as _id, name, email, role FROM users');
      const tasksAll = await pool.query('SELECT assigned_to, status FROM tasks');
      
      teamWorkload = usersRes.rows.map(u => {
        const userTasks = tasksAll.rows.filter(t => t.assigned_to === u._id);
        return {
          user: u,
          total: userTasks.length,
          completed: userTasks.filter(t => t.status === 'done').length,
          inProgress: userTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length
        };
      });
    }

    const myTasksRes = await pool.query(`
      SELECT t.*, p.name as project_name, u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.assigned_to = $1 AND t.status != 'done'
      ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
      LIMIT 5
    `, [req.user.id]);

    let activityQuery = '';
    let activityParams = [];
    if (isAdmin) {
      activityQuery = `
        SELECT t.id, t.title as task, t.status, t.updated_at as time, u.name as "user", t.created_at
        FROM tasks t
        LEFT JOIN users u ON u.id = COALESCE(t.assigned_to, t.created_by)
        ORDER BY t.updated_at DESC
        LIMIT 10
      `;
    } else {
      activityQuery = `
        SELECT t.id, t.title as task, t.status, t.updated_at as time, u.name as "user", t.created_at
        FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
        LEFT JOIN users u ON u.id = COALESCE(t.assigned_to, t.created_by)
        ORDER BY t.updated_at DESC
        LIMIT 10
      `;
      activityParams.push(req.user.id);
    }
    const activityRes = await pool.query(activityQuery, activityParams);

    const recentActivity = activityRes.rows.map(row => {
      let action = 'updated';
      let type = 'inProgress';
      if (row.status === 'done') { action = 'completed'; type = 'completed'; }
      else if (row.time.getTime() === row.created_at.getTime()) { action = 'created'; type = 'created'; }
      
      return {
        id: row.id,
        user: row.user || 'Someone',
        action,
        task: row.task,
        time: row.time,
        type
      };
    });

    res.json({
      success: true,
      stats,
      teamWorkload,
      myTasks: myTasksRes.rows,
      recentActivity,
      role: req.user.role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
