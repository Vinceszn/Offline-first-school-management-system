// controllers/settingsController.js — School settings and customization business logic
// Author: Vincent Onwuli
// Purpose: Handle school settings, logo upload, and customization features
// Version: 1.0.0

const { selectQuery, selectOneQuery, executeQuery } = require('../db/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * GET all school settings
 * Purpose: Retrieve all school configuration settings
 * Input: req.query (optional filters)
 * Output: JSON array of settings
 */
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await selectQuery(
      'SELECT setting_key, setting_value, setting_type, description, updated_at FROM school_settings ORDER BY setting_key'
    );
    
    // Convert to key-value object for easier frontend consumption
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.setting_key] = {
        value: setting.setting_value,
        type: setting.setting_type,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });
    
    res.json({
      success: true,
      data: settingsObject,
      total: settings.length
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve settings',
      message: error.message 
    });
  }
};

/**
 * GET specific setting by key
 * Purpose: Retrieve a single setting value
 * Input: req.params.key
 * Output: JSON setting object
 */
exports.getSetting = async (req, res) => {
  try {
    const settingKey = req.params.key;
    
    const setting = await selectOneQuery(
      'SELECT setting_key, setting_value, setting_type, description, updated_at FROM school_settings WHERE setting_key = ?',
      [settingKey]
    );
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve setting',
      message: error.message 
    });
  }
};

/**
 * PUT update setting
 * Purpose: Update a school setting value
 * Input: req.params.key, req.body.value
 * Output: JSON updated setting
 */
exports.updateSetting = async (req, res) => {
  try {
    const settingKey = req.params.key;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Setting value is required'
      });
    }
    
    // Check if setting exists
    const existingSetting = await selectOneQuery(
      'SELECT id FROM school_settings WHERE setting_key = ?',
      [settingKey]
    );
    
    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }
    
    // Update the setting
    await executeQuery(
      'UPDATE school_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
      [value, settingKey]
    );
    
    // Fetch updated setting
    const updatedSetting = await selectOneQuery(
      'SELECT setting_key, setting_value, setting_type, description, updated_at FROM school_settings WHERE setting_key = ?',
      [settingKey]
    );
    
    res.json({
      success: true,
      data: updatedSetting,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update setting',
      message: error.message 
    });
  }
};

/**
 * POST upload school logo
 * Purpose: Handle school logo file upload and update setting
 * Input: req.file (uploaded logo file)
 * Output: JSON success message with logo path
 */
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No logo file provided'
      });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and SVG files are allowed'
      });
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(req.file.originalname);
    const filename = `school-logo-${timestamp}${extension}`;
    const filepath = path.join(uploadsDir, filename);
    
    // Save file
    await fs.writeFile(filepath, req.file.buffer);
    
    // Update school_logo setting
    const logoPath = `/uploads/${filename}`;
    await executeQuery(
      'UPDATE school_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
      [logoPath, 'school_logo']
    );
    
    res.json({
      success: true,
      message: 'School logo uploaded successfully',
      data: {
        logo_path: logoPath,
        filename: filename,
        original_name: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload logo',
      message: error.message 
    });
  }
};

/**
 * DELETE remove school logo
 * Purpose: Remove current school logo and reset setting
 * Input: None
 * Output: JSON success message
 */
exports.removeLogo = async (req, res) => {
  try {
    // Get current logo path
    const currentLogo = await selectOneQuery(
      'SELECT setting_value FROM school_settings WHERE setting_key = ?',
      ['school_logo']
    );
    
    if (currentLogo && currentLogo.setting_value) {
      // Try to delete the file
      const logoPath = path.join(__dirname, '..', 'public', currentLogo.setting_value);
      try {
        await fs.unlink(logoPath);
      } catch (fileError) {
        console.warn('Could not delete logo file:', fileError.message);
      }
    }
    
    // Clear the logo setting
    await executeQuery(
      'UPDATE school_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
      ['', 'school_logo']
    );
    
    res.json({
      success: true,
      message: 'School logo removed successfully'
    });
  } catch (error) {
    console.error('Error removing logo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove logo',
      message: error.message 
    });
  }
};

/**
 * POST bulk update settings
 * Purpose: Update multiple settings at once
 * Input: req.body (object with setting keys and values)
 * Output: JSON success message with updated settings
 */
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Settings object is required'
      });
    }
    
    const results = [];
    
    for (const [key, value] of Object.entries(settings)) {
      try {
        // Check if setting exists
        const existingSetting = await selectOneQuery(
          'SELECT id FROM school_settings WHERE setting_key = ?',
          [key]
        );
        
        if (existingSetting) {
          await executeQuery(
            'UPDATE school_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
            [value, key]
          );
          
          results.push({
            key,
            success: true,
            action: 'updated'
          });
        } else {
          results.push({
            key,
            success: false,
            error: 'Setting not found'
          });
        }
      } catch (settingError) {
        results.push({
          key,
          success: false,
          error: settingError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Bulk update completed: ${successCount} successful, ${errorCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      }
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to bulk update settings',
      message: error.message 
    });
  }
};

module.exports = exports;
