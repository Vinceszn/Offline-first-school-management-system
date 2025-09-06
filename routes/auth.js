// routes/auth.js — Authentication and user management routes
// Author: Vincent Onwuli
// Purpose: Handle user authentication, login, logout, and profile management
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Purpose: Authenticate user and create session
 * Body: { username, password }
 * Response: User profile and session token
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 * Purpose: Destroy user session and logout
 * Response: Success message
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/profile
 * Purpose: Get current authenticated user's profile
 * Headers: Authorization token required
 * Response: User profile data
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * PUT /api/auth/profile
 * Purpose: Update current user's profile information
 * Headers: Authorization token required
 * Body: Updated profile data
 * Response: Updated user profile
 */
router.put('/profile', authenticateToken, authController.updateProfile);

/**
 * POST /api/auth/change-password
 * Purpose: Change user's password
 * Headers: Authorization token required
 * Body: { currentPassword, newPassword }
 * Response: Success message
 */
router.post('/change-password', authenticateToken, authController.changePassword);

/**
 * POST /api/auth/register
 * Purpose: Create new user account (admin only)
 * Headers: Authorization token required (admin role)
 * Body: New user data
 * Response: Created user profile
 */
router.post('/register', authenticateToken, authController.register);

/**
 * GET /api/auth/verify
 * Purpose: Verify if current session/token is valid
 * Headers: Authorization token required
 * Response: Token validity status
 */
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;
