// middleware/auth.js — Authentication middleware for protecting routes
// Author: Vincent Onwuli
// Purpose: Verify user authentication and authorization for protected endpoints
// Version: 1.0.0

const jwt = require('jsonwebtoken');
const { selectOneQuery } = require('../db/database');

// JWT secret - should be in environment variables for production
const JWT_SECRET = process.env.JWT_SECRET || 'school-os-jwt-secret-change-in-production';

/**
 * Middleware to authenticate JWT tokens
 * Purpose: Verify user authentication for protected routes
 * Input: req.headers.authorization or req.session
 * Output: Sets req.user with authenticated user data or returns 401
 */
async function authenticateToken(req, res, next) {
  try {
    let token = null;
    
    // Check for token in Authorization header (Bearer token)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    // Fallback to session-based authentication
    if (!token && req.session && req.session.userId) {
      // For session-based auth, create a temporary token
      token = jwt.sign(
        { userId: req.session.userId, username: req.session.username },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.' 
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch current user data from database
    const user = await selectOneQuery(
      'SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token. User not found.' 
      });
    }
    
    // Attach user data to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired. Please login again.' 
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed.',
      message: error.message 
    });
  }
}

/**
 * Middleware to check if user has admin role
 * Purpose: Restrict access to admin-only endpoints
 * Input: req.user (set by authenticateToken middleware)
 * Output: Continues if admin, returns 403 if not
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required.' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required.' 
    });
  }
  
  next();
}

/**
 * Middleware to check if user has teacher or admin role
 * Purpose: Allow access to teacher-level endpoints
 * Input: req.user (set by authenticateToken middleware)
 * Output: Continues if teacher/admin, returns 403 if not
 */
function requireTeacher(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required.' 
    });
  }
  
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Teacher access required.' 
    });
  }
  
  next();
}

/**
 * Generate JWT token for user
 * Purpose: Create authentication token after successful login
 * Input: User object with id, username, role
 * Output: Signed JWT token string
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h' // Token expires in 24 hours
  });
}

/**
 * Verify JWT token without middleware wrapper
 * Purpose: Standalone token verification for utility functions
 * Input: JWT token string
 * Output: Decoded token payload or throws error
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Optional authentication middleware
 * Purpose: Set user data if token exists, but don't require it
 * Input: req.headers.authorization (optional)
 * Output: Sets req.user if valid token, continues regardless
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await selectOneQuery(
        'SELECT id, username, email, role, full_name FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacher,
  generateToken,
  verifyToken,
  optionalAuth
};
