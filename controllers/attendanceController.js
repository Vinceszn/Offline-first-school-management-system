// controllers/attendanceController.js — Attendance business logic and database operations
// Author: Vincent Onwuli
// Purpose: Handle attendance-related business logic and database interactions
// Version: 1.0.0

const { selectQuery, selectOneQuery, executeQuery } = require('../db/database');

/**
 * GET all attendance records with filtering
 * Purpose: Retrieve attendance records based on query parameters
 * Input: req.query (date, class_id, student_id, status, limit, offset)
 * Output: JSON array of attendance records
 */
exports.getAttendanceRecords = async (req, res) => {
  try {
    const { date, class_id, student_id, status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT a.*, s.first_name, s.last_name, s.student_id, c.name as class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    let params = [];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.date DESC, s.last_name, s.first_name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const records = await selectQuery(query, params);
    
    res.json({
      success: true,
      data: records,
      total: records.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve attendance records',
      message: error.message 
    });
  }
};

/**
 * GET class attendance by date
 * Purpose: Retrieve attendance for a specific class on a specific date
 * Input: req.params.classId, req.params.date
 * Output: JSON array of attendance records
 */
exports.getClassAttendanceByDate = async (req, res) => {
  try {
    const { classId, date } = req.params;
    
    const query = `
      SELECT a.*, s.first_name, s.last_name, s.student_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE s.class_id = ? AND a.date = ?
      ORDER BY s.last_name, s.first_name
    `;
    
    const records = await selectQuery(query, [classId, date]);
    
    res.json({
      success: true,
      data: records,
      total: records.length,
      class_id: classId,
      date: date
    });
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve class attendance',
      message: error.message 
    });
  }
};

/**
 * GET student attendance history
 * Purpose: Retrieve attendance records for a specific student
 * Input: req.params.studentId, req.query (start_date, end_date, limit)
 * Output: JSON array of attendance records
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { start_date, end_date, limit = 50 } = req.query;
    
    let query = `
      SELECT a.*, s.first_name, s.last_name, s.student_id 
      FROM attendance a 
      JOIN students s ON a.student_id = s.id 
      WHERE a.student_id = ?
    `;
    let params = [studentId];

    if (start_date) {
      query += ' AND a.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY a.date DESC LIMIT ?';
    params.push(parseInt(limit));

    const records = await selectQuery(query, params);
    
    res.json({
      success: true,
      data: records,
      total: records.length,
      student_id: studentId
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve student attendance',
      message: error.message 
    });
  }
};

/**
 * POST record attendance
 * Purpose: Record attendance for one or more students
 * Input: req.body (attendance data)
 * Output: JSON created attendance record(s)
 */
exports.recordAttendance = async (req, res) => {
  try {
    const attendanceData = req.body;
    
    // Handle single record or array
    const records = Array.isArray(attendanceData) ? attendanceData : [attendanceData];
    const results = [];
    
    for (const record of records) {
      const { student_id, date, status, notes } = record;
      
      if (!student_id || !date || !status) {
        results.push({
          success: false,
          error: 'Missing required fields: student_id, date, status',
          data: record
        });
        continue;
      }

      try {
        // Check if attendance already exists for this student and date
        const existing = await selectOneQuery(
          'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
          [student_id, date]
        );

        if (existing) {
          // Update existing record
          const updateResult = await executeQuery(
            'UPDATE attendance SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND date = ?',
            [status, notes || null, student_id, date]
          );
          
          results.push({
            success: true,
            action: 'updated',
            id: existing.id,
            data: { student_id, date, status, notes }
          });
        } else {
          // Create new record
          const insertResult = await executeQuery(
            'INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, ?, ?)',
            [student_id, date, status, notes || null]
          );
          
          results.push({
            success: true,
            action: 'created',
            id: insertResult.id,
            data: { student_id, date, status, notes }
          });
        }
      } catch (recordError) {
        results.push({
          success: false,
          error: recordError.message,
          data: record
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Attendance recorded: ${successCount} successful, ${errorCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      }
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record attendance',
      message: error.message 
    });
  }
};

/**
 * POST bulk record attendance
 * Purpose: Record attendance for multiple students at once
 * Input: req.body (array of attendance records)
 * Output: JSON array with success/error status for each record
 */
exports.bulkRecordAttendance = async (req, res) => {
  // This method can reuse the recordAttendance logic
  return exports.recordAttendance(req, res);
};

/**
 * PUT update attendance record
 * Purpose: Update an existing attendance record
 * Input: req.params.id, req.body (updated attendance data)
 * Output: JSON updated attendance record
 */
exports.updateAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const result = await executeQuery(
      'UPDATE attendance SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notes || null, attendanceId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    // Fetch updated record
    const updatedRecord = await selectOneQuery(`
      SELECT a.*, s.first_name, s.last_name, s.student_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.id = ?
    `, [attendanceId]);

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Attendance record updated successfully'
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update attendance record',
      message: error.message
    });
  }
};

/**
 * DELETE attendance record
 * Purpose: Delete an attendance record
 * Input: req.params.id
 * Output: JSON success message
 */
exports.deleteAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;

    const result = await executeQuery(
      'DELETE FROM attendance WHERE id = ?',
      [attendanceId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete attendance record',
      message: error.message
    });
  }
};

/**
 * GET class attendance summary
 * Purpose: Get attendance summary for a class over a date range
 * Input: req.params.classId, req.query (start_date, end_date)
 * Output: JSON attendance statistics and summary
 */
exports.getClassAttendanceSummary = async (req, res) => {
  try {
    const classId = req.params.classId;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT
        a.status,
        COUNT(*) as count,
        COUNT(DISTINCT a.student_id) as unique_students,
        COUNT(DISTINCT a.date) as unique_dates
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE s.class_id = ?
    `;
    let params = [classId];

    if (start_date) {
      query += ' AND a.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.date <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY a.status';

    const summary = await selectQuery(query, params);

    res.json({
      success: true,
      data: summary,
      class_id: classId,
      date_range: { start_date, end_date }
    });
  } catch (error) {
    console.error('Error fetching class attendance summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendance summary',
      message: error.message
    });
  }
};

/**
 * GET student attendance summary
 * Purpose: Get attendance summary for a student over a date range
 * Input: req.params.studentId, req.query (start_date, end_date)
 * Output: JSON student attendance statistics
 */
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT
        a.status,
        COUNT(*) as count
      FROM attendance a
      WHERE a.student_id = ?
    `;
    let params = [studentId];

    if (start_date) {
      query += ' AND a.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.date <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY a.status';

    const summary = await selectQuery(query, params);

    res.json({
      success: true,
      data: summary,
      student_id: studentId,
      date_range: { start_date, end_date }
    });
  } catch (error) {
    console.error('Error fetching student attendance summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve student attendance summary',
      message: error.message
    });
  }
};

/**
 * GET today's attendance
 * Purpose: Get today's attendance across all classes
 * Input: req.query (class_id optional)
 * Output: JSON today's attendance records
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const { class_id } = req.query;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    let query = `
      SELECT a.*, s.first_name, s.last_name, s.student_id, c.name as class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE a.date = ?
    `;
    let params = [today];

    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    query += ' ORDER BY c.name, s.last_name, s.first_name';

    const records = await selectQuery(query, params);

    res.json({
      success: true,
      data: records,
      total: records.length,
      date: today
    });
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve today\'s attendance',
      message: error.message
    });
  }
};

/**
 * POST mark all present
 * Purpose: Mark all students in a class as present for a specific date
 * Input: req.body (class_id, date, notes)
 * Output: JSON array of created attendance records
 */
exports.markAllPresent = async (req, res) => {
  try {
    const { class_id, date, notes } = req.body;

    if (!class_id || !date) {
      return res.status(400).json({
        success: false,
        error: 'class_id and date are required'
      });
    }

    // Get all active students in the class
    const students = await selectQuery(
      'SELECT id FROM students WHERE class_id = ? AND status = "active"',
      [class_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active students found in this class'
      });
    }

    const results = [];

    for (const student of students) {
      try {
        // Check if attendance already exists
        const existing = await selectOneQuery(
          'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
          [student.id, date]
        );

        if (existing) {
          // Update to present
          await executeQuery(
            'UPDATE attendance SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND date = ?',
            ['present', notes || null, student.id, date]
          );

          results.push({
            success: true,
            action: 'updated',
            student_id: student.id
          });
        } else {
          // Create new present record
          const insertResult = await executeQuery(
            'INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, ?, ?)',
            [student.id, date, 'present', notes || null]
          );

          results.push({
            success: true,
            action: 'created',
            student_id: student.id,
            id: insertResult.id
          });
        }
      } catch (recordError) {
        results.push({
          success: false,
          error: recordError.message,
          student_id: student.id
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Marked all present: ${successCount} successful, ${errorCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      }
    });
  } catch (error) {
    console.error('Error marking all present:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all students present',
      message: error.message
    });
  }
};

module.exports = exports;
