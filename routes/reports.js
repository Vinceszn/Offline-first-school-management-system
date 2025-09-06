// routes/reports.js — Report generation and export API routes
// Author: Vincent Onwuli
// Purpose: Handle report generation, PDF creation, and data export
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all report routes
router.use(authenticateToken);

/**
 * GET /api/reports/student/:id/report-card
 * Purpose: Generate comprehensive report card for a student
 * Params: id - Student ID
 * Query params: term, academic_year, format (pdf|json)
 * Response: Report card data or PDF file
 */
router.get('/student/:id/report-card', reportController.generateStudentReportCard);

/**
 * GET /api/reports/class/:id/attendance-summary
 * Purpose: Generate attendance summary report for a class
 * Params: id - Class ID
 * Query params: start_date, end_date, format (pdf|json|csv)
 * Response: Attendance summary data or file
 */
router.get('/class/:id/attendance-summary', reportController.generateClassAttendanceSummary);

/**
 * GET /api/reports/class/:id/grade-summary
 * Purpose: Generate grade summary report for a class
 * Params: id - Class ID
 * Query params: subject_id, term, academic_year, format
 * Response: Grade summary data or file
 */
router.get('/class/:id/grade-summary', reportController.generateClassGradeSummary);

/**
 * GET /api/reports/export/students
 * Purpose: Export student data in various formats
 * Query params: class_id, status, format (csv|json|xlsx)
 * Response: Student data file
 */
router.get('/export/students', reportController.exportStudents);

/**
 * GET /api/reports/export/attendance
 * Purpose: Export attendance data in various formats
 * Query params: class_id, start_date, end_date, format
 * Response: Attendance data file
 */
router.get('/export/attendance', reportController.exportAttendance);

/**
 * GET /api/reports/export/grades
 * Purpose: Export grade data in various formats
 * Query params: class_id, subject_id, term, academic_year, format
 * Response: Grade data file
 */
router.get('/export/grades', reportController.exportGrades);

/**
 * POST /api/reports/custom
 * Purpose: Generate custom report based on provided criteria
 * Body: Report configuration and filters
 * Response: Custom report data or file
 */
router.post('/custom', reportController.generateCustomReport);

/**
 * GET /api/reports/dashboard-stats
 * Purpose: Get statistics for dashboard display
 * Query params: date_range
 * Response: Dashboard statistics object
 */
router.get('/dashboard-stats', reportController.getDashboardStats);

/**
 * GET /api/reports/attendance/daily/:date
 * Purpose: Generate daily attendance report
 * Params: date - Date in YYYY-MM-DD format
 * Query params: class_id, format
 * Response: Daily attendance report
 */
router.get('/attendance/daily/:date', reportController.generateDailyAttendanceReport);

/**
 * GET /api/reports/grades/transcript/:studentId
 * Purpose: Generate academic transcript for a student
 * Params: studentId - Student ID
 * Query params: academic_year, format
 * Response: Academic transcript
 */
router.get('/grades/transcript/:studentId', reportController.generateStudentTranscript);

/**
 * GET /api/reports/analytics/attendance-trends
 * Purpose: Generate attendance trend analysis
 * Query params: class_id, start_date, end_date
 * Response: Attendance trend data
 */
router.get('/analytics/attendance-trends', reportController.getAttendanceTrends);

/**
 * GET /api/reports/analytics/grade-distribution
 * Purpose: Generate grade distribution analysis
 * Query params: class_id, subject_id, term, academic_year
 * Response: Grade distribution data
 */
router.get('/analytics/grade-distribution', reportController.getGradeDistribution);

module.exports = router;
