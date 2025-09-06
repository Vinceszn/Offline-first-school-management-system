// routes/settings.js — School settings and customization API routes
// Author: Vincent Onwuli
// Purpose: Handle school settings, logo upload, and customization endpoints
// Version: 1.0.0

const express = require('express');
const router = express.Router();
const multer = require('multer');
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * GET /api/settings/public/branding
 * Purpose: Get public branding information (no auth required)
 * Response: School name, logo, and theme settings
 */
router.get('/public/branding', async (req, res) => {
  try {
    const { selectQuery } = require('../db/database');

    const brandingSettings = await selectQuery(
      'SELECT setting_key, setting_value FROM school_settings WHERE setting_key IN (?, ?, ?, ?)',
      ['school_name', 'school_logo', 'theme_color', 'school_address']
    );

    const branding = {};
    brandingSettings.forEach(setting => {
      branding[setting.setting_key] = setting.setting_value;
    });

    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve branding settings',
      message: error.message
    });
  }
});

// Apply authentication middleware to all other settings routes
router.use(authenticateToken);

/**
 * GET /api/settings
 * Purpose: Retrieve all school settings
 * Response: Object with all settings as key-value pairs
 */
router.get('/', settingsController.getAllSettings);

/**
 * GET /api/settings/:key
 * Purpose: Retrieve a specific setting by key
 * Params: key - Setting key name
 * Response: Single setting object
 */
router.get('/:key', settingsController.getSetting);

/**
 * PUT /api/settings/:key
 * Purpose: Update a specific setting value
 * Params: key - Setting key name
 * Body: { value: "new_value" }
 * Response: Updated setting object
 */
router.put('/:key', settingsController.updateSetting);

/**
 * POST /api/settings/logo/upload
 * Purpose: Upload school logo image
 * Body: Multipart form data with logo file
 * Response: Success message with logo path
 */
router.post('/logo/upload', upload.single('logo'), settingsController.uploadLogo);

/**
 * DELETE /api/settings/logo
 * Purpose: Remove current school logo
 * Response: Success message
 */
router.delete('/logo', settingsController.removeLogo);

/**
 * POST /api/settings/bulk
 * Purpose: Update multiple settings at once
 * Body: Object with setting keys and values
 * Response: Bulk update results
 */
router.post('/bulk', settingsController.bulkUpdateSettings);



// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

module.exports = router;
