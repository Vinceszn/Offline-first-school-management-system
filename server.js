// server.js — Entry point of the Offline School OS backend
// Author: Vincent Onwuli
// Purpose: Launch Express server, apply middleware, and route logic
// Version: 1.0.0
// Last Modified: 2025-06-14

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Core middleware imports
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Database initialization
const { initializeDatabase } = require('./db/database');

// Route handler imports
const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

// Security middleware - Helmet for basic security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configuration for offline-first approach
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' })); // Parse incoming JSON requests
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data
app.use(cookieParser()); // Parse cookies for session use

// Session setup for tracking logged-in users
app.use(session({
  secret: process.env.SESSION_SECRET || 'school-os-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Only true when using HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - All endpoints prefixed with /api
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve the main application for any non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize SQLite database
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Start the Express server
    app.listen(port, () => {
      console.log(`✅ School OS Server running at http://localhost:${port}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕒 Started at: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app; // Export for testing purposes
