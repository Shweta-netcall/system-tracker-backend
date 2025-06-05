const fs = require('fs').promises; // Using promises version for async operations
const path = require('path');
const { captureAndSendScreenshot } = require('../services/screenshotService');
const Screenshot = require('../models/Screenshot'); // Adjust the path if needed

exports.getAllScreenshots = async (req, res) => {
  try {
    // console.log('--- /api/admin/screenshots hit ---');

    const screenshots = await Screenshot.find()
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Screenshots found:', screenshots.length);

    res.json(screenshots.map(s => ({
      path: s.fileUrl,
      timestamp: s.createdAt,
      username: s.userId?.username || 'Unknown'
    })));
  } catch (error) {
    console.error('Error getting screenshots:', error.message, error.stack);

    res.status(500).json({
      error: 'Failed to retrieve screenshots',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

exports.captureScreenshot = async (req, res) => {
  try {
    // 1. Validate userId
    if (!req.user?.userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 2. Capture screenshot
    const result = await captureAndSendScreenshot(req.user.userId);
    
    // 3. Validate result
    if (!result?.filename) {
      throw new Error('Screenshot capture returned invalid result');
    }

    res.json({
      success: true,
      filename: result.filename,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    res.status(500).json({
      error: 'Failed to capture screenshot',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};