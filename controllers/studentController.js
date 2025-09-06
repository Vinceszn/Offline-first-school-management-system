// controllers/studentController.js — Student business logic and database operations
// Author: Vincent Onwuli
// Purpose: Handle student-related business logic and database interactions
// Version: 1.0.0

const { selectQuery, selectOneQuery, executeQuery } = require('../db/database');
const { validationResult } = require('express-validator');

/**
 * GET all students with optional filtering
 * Purpose: Retrieve students based on query parameters
 * Input: req.query (class_id, status, search, limit, offset)
 * Output: JSON array of student objects
 */
exports.getAllStudents = async (req, res) => {
  try {
    const { class_id, status = 'active', search, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT s.*, c.name as class_name, c.grade_level 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE s.status = ?
    `;
    let params = [status];

    // Add class filter if specified
    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(class_id);
    }

    // Add search functionality
    if (search) {
      query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add ordering and pagination
    query += ' ORDER BY s.last_name, s.first_name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const students = await selectQuery(query, params);
    
    res.json({
      success: true,
      data: students,
      total: students.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve students',
      message: error.message 
    });
  }
};

/**
 * GET student by ID
 * Purpose: Retrieve a single student with full details
 * Input: req.params.id
 * Output: JSON student object or 404 error
 */
exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const query = `
      SELECT s.*, c.name as class_name, c.grade_level 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE s.id = ?
    `;
    
    const student = await selectOneQuery(query, [studentId]);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve student',
      message: error.message 
    });
  }
};

/**
 * GET students by class ID
 * Purpose: Retrieve all students in a specific class
 * Input: req.params.classId
 * Output: JSON array of students in the class
 */
exports.getStudentsByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    
    const query = `
      SELECT s.*, c.name as class_name, c.grade_level 
      FROM students s 
      JOIN classes c ON s.class_id = c.id 
      WHERE s.class_id = ? AND s.status = 'active'
      ORDER BY s.last_name, s.first_name
    `;
    
    const students = await selectQuery(query, [classId]);
    
    res.json({
      success: true,
      data: students,
      total: students.length
    });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve students for class',
      message: error.message 
    });
  }
};

/**
 * POST create new student
 * Purpose: Add a new student to the database
 * Input: req.body (student data)
 * Output: JSON created student object
 */
exports.createStudent = async (req, res) => {
  try {
    const {
      student_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      class_id,
      parent_name,
      parent_phone,
      parent_email,
      address
    } = req.body;

    // Validate required fields
    if (!student_id || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: student_id, first_name, last_name'
      });
    }

    // Check if student ID already exists
    const existingStudent = await selectOneQuery(
      'SELECT id FROM students WHERE student_id = ?',
      [student_id]
    );

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        error: 'Student ID already exists'
      });
    }

    // Insert new student
    const query = `
      INSERT INTO students (
        student_id, first_name, last_name, date_of_birth, gender,
        class_id, parent_name, parent_phone, parent_email, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      student_id, first_name, last_name, date_of_birth, gender,
      class_id, parent_name, parent_phone, parent_email, address
    ]);

    // Fetch the created student with class info
    const newStudent = await selectOneQuery(`
      SELECT s.*, c.name as class_name, c.grade_level 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE s.id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      data: newStudent,
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create student',
      message: error.message 
    });
  }
};

/**
 * PUT update student
 * Purpose: Update existing student information
 * Input: req.params.id, req.body (updated student data)
 * Output: JSON updated student object
 */
exports.updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;

    // Build dynamic update query
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE students SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    values.push(studentId);
    
    const result = await executeQuery(query, values);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Fetch updated student
    const updatedStudent = await selectOneQuery(`
      SELECT s.*, c.name as class_name, c.grade_level 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE s.id = ?
    `, [studentId]);

    res.json({
      success: true,
      data: updatedStudent,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update student',
      message: error.message 
    });
  }
};

/**
 * DELETE student (soft delete)
 * Purpose: Mark student as inactive instead of permanent deletion
 * Input: req.params.id
 * Output: JSON success message
 */
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const result = await executeQuery(
      'UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['inactive', studentId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete student',
      message: error.message 
    });
  }
};

/**
 * POST bulk create students
 * Purpose: Create multiple students from array (for imports)
 * Input: req.body (array of student objects)
 * Output: JSON array with success/error status for each student
 */
exports.bulkCreateStudents = async (req, res) => {
  try {
    const students = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body must be a non-empty array of students'
      });
    }

    const results = [];
    
    for (const studentData of students) {
      try {
        // Validate required fields for each student
        if (!studentData.student_id || !studentData.first_name || !studentData.last_name) {
          results.push({
            student_id: studentData.student_id || 'unknown',
            success: false,
            error: 'Missing required fields'
          });
          continue;
        }

        // Check for duplicate student ID
        const existing = await selectOneQuery(
          'SELECT id FROM students WHERE student_id = ?',
          [studentData.student_id]
        );

        if (existing) {
          results.push({
            student_id: studentData.student_id,
            success: false,
            error: 'Student ID already exists'
          });
          continue;
        }

        // Insert student
        const query = `
          INSERT INTO students (
            student_id, first_name, last_name, date_of_birth, gender,
            class_id, parent_name, parent_phone, parent_email, address
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(query, [
          studentData.student_id,
          studentData.first_name,
          studentData.last_name,
          studentData.date_of_birth || null,
          studentData.gender || null,
          studentData.class_id || null,
          studentData.parent_name || null,
          studentData.parent_phone || null,
          studentData.parent_email || null,
          studentData.address || null
        ]);

        results.push({
          student_id: studentData.student_id,
          success: true,
          id: result.id
        });
      } catch (error) {
        results.push({
          student_id: studentData.student_id || 'unknown',
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Bulk import completed: ${successCount} successful, ${errorCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      }
    });
  } catch (error) {
    console.error('Error in bulk create:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process bulk student creation',
      message: error.message 
    });
  }
};

/**
 * GET student attendance history
 * Purpose: Retrieve attendance records for a specific student
 * Input: req.params.id, req.query (start_date, end_date, limit)
 * Output: JSON array of attendance records
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { start_date, end_date, limit = 50 } = req.query;

    let query = `
      SELECT a.*, s.first_name, s.last_name
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

    const attendance = await selectQuery(query, params);

    res.json({
      success: true,
      data: attendance,
      total: attendance.length
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendance',
      message: error.message
    });
  }
};

/**
 * GET student grades
 * Purpose: Retrieve grade records for a specific student
 * Input: req.params.id, req.query (subject_id, term, academic_year)
 * Output: JSON array of grade records
 */
exports.getStudentGrades = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { subject_id, term, academic_year } = req.query;

    let query = `
      SELECT g.*, s.name as subject_name, st.first_name, st.last_name
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      JOIN students st ON g.student_id = st.id
      WHERE g.student_id = ?
    `;
    let params = [studentId];

    if (subject_id) {
      query += ' AND g.subject_id = ?';
      params.push(subject_id);
    }

    if (term) {
      query += ' AND g.term = ?';
      params.push(term);
    }

    if (academic_year) {
      query += ' AND g.academic_year = ?';
      params.push(academic_year);
    }

    query += ' ORDER BY g.created_at DESC';

    const grades = await selectQuery(query, params);

    res.json({
      success: true,
      data: grades,
      total: grades.length
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve grades',
      message: error.message
    });
  }
};

/**
 * POST upload student photo
 * Purpose: Handle student photo upload
 * Input: req.params.id, req.file (photo file)
 * Output: JSON updated student object
 */
exports.uploadStudentPhoto = async (req, res) => {
  try {
    const studentId = req.params.id;

    // For now, return a placeholder response since multer setup would be needed
    res.json({
      success: true,
      message: 'Photo upload functionality not yet implemented',
      data: { id: studentId }
    });
  } catch (error) {
    console.error('Error uploading student photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photo',
      message: error.message
    });
  }
};

/**
 * GET search students
 * Purpose: Search students by various criteria
 * Input: req.params.query (search term)
 * Output: JSON array of matching students
 */
exports.searchStudents = async (req, res) => {
  try {
    const searchQuery = req.params.query;

    const query = `
      SELECT s.*, c.name as class_name, c.grade_level
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.status = 'active' AND (
        s.first_name LIKE ? OR
        s.last_name LIKE ? OR
        s.student_id LIKE ? OR
        s.parent_name LIKE ?
      )
      ORDER BY s.last_name, s.first_name
      LIMIT 20
    `;

    const searchTerm = `%${searchQuery}%`;
    const students = await selectQuery(query, [searchTerm, searchTerm, searchTerm, searchTerm]);

    res.json({
      success: true,
      data: students,
      total: students.length,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search students',
      message: error.message
    });
  }
};

/**
 * PATCH update student status
 * Purpose: Update student status (active/inactive/graduated/transferred)
 * Input: req.params.id, req.body (status, notes)
 * Output: JSON updated student object
 */
exports.updateStudentStatus = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['active', 'inactive', 'graduated', 'transferred'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const result = await executeQuery(
      'UPDATE students SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notes || null, studentId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Fetch updated student
    const updatedStudent = await selectOneQuery(`
      SELECT s.*, c.name as class_name, c.grade_level
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `, [studentId]);

    res.json({
      success: true,
      data: updatedStudent,
      message: `Student status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update student status',
      message: error.message
    });
  }
};

module.exports = exports;
