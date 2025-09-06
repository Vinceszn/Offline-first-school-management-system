// routes/student.js — Student management API routes
// Author: Vincent Onwuli
// Purpose: Handle all student-related HTTP requests and responses
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all student routes
router.use(authenticateToken);

/**
 * GET /api/students
 * Purpose: Retrieve all students with optional filtering
 * Query params: class_id, status, search
 * Response: Array of student objects
 */
router.get('/', studentController.getAllStudents);

/**
 * GET /api/students/:id
 * Purpose: Retrieve a specific student by ID
 * Params: id - Student ID
 * Response: Single student object or 404 error
 */
router.get('/:id', studentController.getStudentById);

/**
 * GET /api/students/class/:classId
 * Purpose: Get all students in a specific class
 * Params: classId - Class ID
 * Response: Array of students in the specified class
 */
router.get('/class/:classId', studentController.getStudentsByClass);

/**
 * POST /api/students
 * Purpose: Create a new student record
 * Body: Student data (first_name, last_name, etc.)
 * Response: Created student object with generated ID
 */
router.post('/', studentController.createStudent);

/**
 * PUT /api/students/:id
 * Purpose: Update an existing student record
 * Params: id - Student ID
 * Body: Updated student data
 * Response: Updated student object
 */
router.put('/:id', studentController.updateStudent);

/**
 * DELETE /api/students/:id
 * Purpose: Soft delete a student (set status to 'inactive')
 * Params: id - Student ID
 * Response: Success message
 */
router.delete('/:id', studentController.deleteStudent);

/**
 * POST /api/students/bulk
 * Purpose: Create multiple students at once (bulk import)
 * Body: Array of student objects
 * Response: Array of created students with success/error status
 */
router.post('/bulk', studentController.bulkCreateStudents);

/**
 * GET /api/students/:id/attendance
 * Purpose: Get attendance history for a specific student
 * Params: id - Student ID
 * Query params: start_date, end_date, limit
 * Response: Array of attendance records
 */
router.get('/:id/attendance', studentController.getStudentAttendance);

/**
 * GET /api/students/:id/grades
 * Purpose: Get grade history for a specific student
 * Params: id - Student ID
 * Query params: subject_id, term, academic_year
 * Response: Array of grade records
 */
router.get('/:id/grades', studentController.getStudentGrades);

/**
 * POST /api/students/:id/photo
 * Purpose: Upload student photo
 * Params: id - Student ID
 * Body: Multipart form data with photo file
 * Response: Updated student object with photo URL
 */
router.post('/:id/photo', studentController.uploadStudentPhoto);

/**
 * GET /api/students/search/:query
 * Purpose: Search students by name, student ID, or parent info
 * Params: query - Search term
 * Response: Array of matching students
 */
router.get('/search/:query', studentController.searchStudents);

/**
 * PATCH /api/students/:id/status
 * Purpose: Update student status (active/inactive/graduated/transferred)
 * Params: id - Student ID
 * Body: { status: 'new_status', notes: 'optional notes' }
 * Response: Updated student object
 */
router.patch('/:id/status', studentController.updateStudentStatus);

module.exports = router;
