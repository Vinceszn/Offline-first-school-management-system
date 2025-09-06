// routes/classes.js — Classes management API routes
// Author: Vincent Onwuli
// Purpose: Handle class-related API endpoints
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const { selectQuery } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware
router.use(authenticateToken);

/**
 * GET /api/classes
 * Purpose: Retrieve all classes
 * Response: Array of class objects
 */
router.get('/', async (req, res) => {
  try {
    const classes = await selectQuery(`
      SELECT 
        c.*,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.grade_level, c.name
    `);
    
    res.json({
      success: true,
      data: classes,
      total: classes.length
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve classes',
      message: error.message 
    });
  }
});

/**
 * GET /api/classes/:id
 * Purpose: Retrieve a specific class by ID
 * Params: id - Class ID
 * Response: Single class object with students
 */
router.get('/:id', async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Get class details
    const classData = await selectQuery(`
      SELECT 
        c.*,
        COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
      WHERE c.id = ?
      GROUP BY c.id
    `, [classId]);
    
    if (classData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }
    
    // Get students in this class
    const students = await selectQuery(`
      SELECT id, student_id, first_name, last_name, status
      FROM students 
      WHERE class_id = ? AND status = 'active'
      ORDER BY last_name, first_name
    `, [classId]);
    
    const result = {
      ...classData[0],
      students: students
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve class',
      message: error.message 
    });
  }
});

module.exports = router;
