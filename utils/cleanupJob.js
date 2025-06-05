const cron = require('node-cron');
const path = require('path');
const fs = require('fs-extra');
const mongoose = require('mongoose');
const Screenshot = require('../models/Screenshot');
const SessionLog = require('../models/SessionLog');

// Initialize cleanup job
function initializeCleanupJob() {
  // TESTING: Runs every 2 minutes
  // cron.schedule('*/2 * * * *', () => {
  //   console.log('⏰ TEST MODE: Running cleanup every 2 minutes');
  //   runCleanup();
  // }, {
  //   scheduled: true,
  //   timezone: "Asia/Kolkata" // Set your actual timezone
  // });
  
  //   PRODUCTION: Run every day at midnight only
    cron.schedule('0 0 * * *', runCleanup, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

  
  console.log('---Cleanup job scheduled in TEST mode (runs every midnight)');
}

const runCleanup = async () => {
  try {
    console.log('🧹 Starting cleanup job at', new Date().toISOString());
    //last 2 days screenshot and session  deletion
    const cutoffDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // For testing - delete everything older than 1 hour
    // const cutoffDate = new Date(Date.now() - 60 * 60 * 1000);

    // === Screenshots ===
    const oldScreenshots = await Screenshot.find({ createdAt: { $lt: cutoffDate } });
    console.log(`🔍 Found ${oldScreenshots.length} screenshots to delete`);
    console.log('Sample record date:', oldScreenshots[0]?.createdAt);
    // Delete files first
    let filesDeleted = 0;
    for (const shot of oldScreenshots) {
      // Change this line in cleanup.js
      console.log('🕰️ Cutoff date:', cutoffDate);
      const fullPath = path.join(__dirname, '..', 'uploads', 'screenshots', path.basename(shot.fileUrl));
      try {
        await fs.remove(fullPath);
        filesDeleted++;
        console.log(`🗑️ Deleted file: ${fullPath}`);
      } catch (err) {
        console.warn(`⚠️ Error deleting file: ${fullPath}`, err.message);
      }
    }

    // Then delete DB records
    const screenshotResult = await Screenshot.deleteMany({ createdAt: { $lt: cutoffDate } });
    console.log(`🧼 Deleted ${screenshotResult.deletedCount} old screenshots from DB`);

    // === Session Logs ===
    const sessionResult = await SessionLog.deleteMany({ startTime: { $lt: cutoffDate } });
    console.log(`🧼 Deleted ${sessionResult.deletedCount} old session logs`);

    return {
      filesDeleted,
      screenshotsDeleted: screenshotResult.deletedCount,
      sessionsDeleted: sessionResult.deletedCount
    };
  } catch (err) {
    console.error('❌ Cleanup job failed:', err);
    throw err;
  }
};

// Export for manual triggering if needed
module.exports = {
  runCleanup,
  initializeCleanupJob
};

// Initialize when this module is loaded
initializeCleanupJob();