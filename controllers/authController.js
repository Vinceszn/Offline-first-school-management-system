// controllers/authController.js — Authentication business logic
// Author: Vincent Onwuli
// Purpose: Handle user authentication, registration, and profile management
// Version: 1.0.0

const bcrypt = require('bcrypt');
const { selectOneQuery, executeQuery } = require('../db/database');
const { generateToken } = require('../middleware/auth');

// Salt rounds for password hashing
const SALT_ROUNDS = 12;

/**
 * POST login user
 * Purpose: Authenticate user credentials and create session/token
 * Input: req.body { username, password }
 * Output: JSON with user profile and authentication token
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Find user by username or email
    const user = await selectOneQuery(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set session data
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    // Remove password hash from response
    const { password_hash, ...userProfile } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userProfile,
        token: token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
};

/**
 * POST logout user
 * Purpose: Destroy user session and invalidate authentication
 * Input: req.session
 * Output: JSON success message
 */
exports.logout = async (req, res) => {
  try {
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({
          success: false,
          error: 'Logout failed'
        });
      }
      
      // Clear session cookie
      res.clearCookie('connect.sid');
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
};

/**
 * GET user profile
 * Purpose: Retrieve current authenticated user's profile
 * Input: req.user (set by auth middleware)
 * Output: JSON user profile data
 */
exports.getProfile = async (req, res) => {
  try {
    // User data is already available from auth middleware
    const { password_hash, ...userProfile } = req.user;
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
};

/**
 * PUT update user profile
 * Purpose: Update current user's profile information
 * Input: req.user.id, req.body (updated profile data)
 * Output: JSON updated user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, email } = req.body;
    
    // Validate input
    if (!full_name && !email) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (full_name or email) is required'
      });
    }
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await selectOneQuery(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email address is already in use'
        });
      }
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await executeQuery(query, values);
    
    // Fetch updated user profile
    const updatedUser = await selectOneQuery(
      'SELECT id, username, email, role, full_name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
};

/**
 * POST change password
 * Purpose: Change user's password with current password verification
 * Input: req.user.id, req.body { currentPassword, newPassword }
 * Output: JSON success message
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }
    
    // Get current user with password hash
    const user = await selectOneQuery(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update password in database
    await executeQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    });
  }
};

/**
 * POST register new user (admin only)
 * Purpose: Create new user account
 * Input: req.body { username, email, password, full_name, role }
 * Output: JSON created user profile
 */
exports.register = async (req, res) => {
  try {
    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required to create new users'
      });
    }
    
    const { username, email, password, full_name, role = 'teacher' } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, password, and full name are required'
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }
    
    // Validate role
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "admin" or "teacher"'
      });
    }
    
    // Check if username or email already exists
    const existingUser = await selectOneQuery(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create new user
    const result = await executeQuery(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, role]
    );
    
    // Fetch created user (without password hash)
    const newUser = await selectOneQuery(
      'SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?',
      [result.id]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
};

/**
 * GET verify token
 * Purpose: Verify if current authentication token is valid
 * Input: req.user (set by auth middleware)
 * Output: JSON token validity status
 */
exports.verifyToken = async (req, res) => {
  try {
    // If we reach here, the token is valid (auth middleware passed)
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      message: error.message
    });
  }
};

module.exports = exports;
