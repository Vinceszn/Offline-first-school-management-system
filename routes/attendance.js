// routes/attendance.js — Attendance tracking API routes
// Author: Vincent Onwuli
// Purpose: Handle attendance recording, retrieval, and management
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all attendance routes
router.use(authenticateToken);

/**
 * GET /api/attendance
 * Purpose: Retrieve attendance records with filtering options
 * Query params: date, class_id, student_id, status, limit, offset
 * Response: Array of attendance records
 */
router.get('/', attendanceController.getAttendanceRecords);

/**
 * GET /api/attendance/class/:classId/date/:date
 * Purpose: Get attendance for a specific class on a specific date
 * Params: classId - Class ID, date - Date in YYYY-MM-DD format
 * Response: Array of attendance records for the class and date
 */
router.get('/class/:classId/date/:date', attendanceController.getClassAttendanceByDate);

/**
 * GET /api/attendance/student/:studentId
 * Purpose: Get attendance history for a specific student
 * Params: studentId - Student ID
 * Query params: start_date, end_date, limit
 * Response: Array of attendance records for the student
 */
router.get('/student/:studentId', attendanceController.getStudentAttendance);

/**
 * POST /api/attendance
 * Purpose: Record attendance for students
 * Body: Single attendance record or array of records
 * Response: Created attendance record(s)
 */
router.post('/', attendanceController.recordAttendance);

/**
 * POST /api/attendance/bulk
 * Purpose: Record attendance for multiple students at once
 * Body: Array of attendance records
 * Response: Array of created records with success/error status
 */
router.post('/bulk', attendanceController.bulkRecordAttendance);

/**
 * PUT /api/attendance/:id
 * Purpose: Update an existing attendance record
 * Params: id - Attendance record ID
 * Body: Updated attendance data
 * Response: Updated attendance record
 */
router.put('/:id', attendanceController.updateAttendance);

/**
 * DELETE /api/attendance/:id
 * Purpose: Delete an attendance record
 * Params: id - Attendance record ID
 * Response: Success message
 */
router.delete('/:id', attendanceController.deleteAttendance);

/**
 * GET /api/attendance/summary/class/:classId
 * Purpose: Get attendance summary for a class over a date range
 * Params: classId - Class ID
 * Query params: start_date, end_date
 * Response: Attendance statistics and summary
 */
router.get('/summary/class/:classId', attendanceController.getClassAttendanceSummary);

/**
 * GET /api/attendance/summary/student/:studentId
 * Purpose: Get attendance summary for a student over a date range
 * Params: studentId - Student ID
 * Query params: start_date, end_date
 * Response: Student attendance statistics
 */
router.get('/summary/student/:studentId', attendanceController.getStudentAttendanceSummary);

/**
 * GET /api/attendance/today
 * Purpose: Get today's attendance across all classes
 * Query params: class_id (optional)
 * Response: Today's attendance records
 */
router.get('/today', attendanceController.getTodayAttendance);

/**
 * POST /api/attendance/mark-all-present
 * Purpose: Mark all students in a class as present for a specific date
 * Body: { class_id, date, notes }
 * Response: Array of created attendance records
 */
router.post('/mark-all-present', attendanceController.markAllPresent);

module.exports = router;
