const Screenshot = require('../models/Screenshot'); // Add at the top
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User'); // Add this at the top


const captureAndSendScreenshot = async (userId) => {
  try {
    // First check if user is admin
    const user = await User.findById(userId);
    if (user?.role === 'admin') {
      console.log('Admin user detected - skipping screenshot capture');
      return null;
    }

    // Capture screenshot
    const imgBuffer = await screenshot({ format: 'png' });

    // Process image
    const processedImg = await sharp(imgBuffer)
      .png({ quality: 80 })
      .toBuffer();

    // Generate filename and path
    const filename = `screenshot_${userId}_${uuidv4()}_${Date.now()}.png`;
    const savePath = path.join(__dirname, '..', 'uploads', 'screenshots', filename);
    const relativePath = `/screenshots/${filename}`;

    // Ensure directory exists
    fs.mkdirSync(path.dirname(savePath), { recursive: true });

    // Save to disk
    fs.writeFileSync(savePath, processedImg);

    // Save metadata to DB
    const screenshotRecord = new Screenshot({
      userId,
      filename,
      contentType: 'image/png', // explicitly setting the MIME type
      fileUrl: relativePath, // This will be used for serving static files
    });

    await screenshotRecord.save();

    // Log URL for dev view
    console.log(`Screenshot captured for user ${userId}: ${relativePath}`);

    return screenshotRecord;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  }
};

// const startScreenshotMonitoring = async (userId) => {
//   // First check if user is admin
//   const user = await User.findById(userId);
//   if (user?.role === 'admin') {
//     console.log('Admin user detected - skipping screenshot monitoring');
//     return;
//   }
//   const scheduleNextCapture = () => {
//     // Choose a random delay within the next 5 minutes (0 to 299999 ms)
//     const randomDelay = Math.floor(Math.random() * 5 * 60 * 1000);

//     setTimeout(() => {
//       captureAndSendScreenshot(userId); // Take screenshot
//       scheduleNextCapture();            // Schedule next one
//     }, randomDelay);
//   };

//   // Start the loop
//   scheduleNextCapture();
// };
const startScreenshotMonitoring = async (userId) => {
  // First check if user is admin
  const user = await User.findById(userId);
  if (user?.role === 'admin') {
    console.log('Admin user detected - skipping screenshot monitoring');
    return;
  }

  // Take a screenshot immediately, then every 5 minutes
  await captureAndSendScreenshot(userId);

  setInterval(() => {
    captureAndSendScreenshot(userId);
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
};

module.exports = {
  captureAndSendScreenshot,
  startScreenshotMonitoring
};