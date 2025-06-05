require('dotenv').config();
const { exec } = require('child_process');
const logger = require('../utils/logger');
const SessionLog = require('../models/SessionLog');
const axios = require('axios');
const psList = require('ps-list');
console.log('psList loaded:', typeof psList);
const { captureAndSendScreenshot } = require('../services/screenshotService');
const User = require('../models/User');


class SessionTracker {
  constructor(userId) {
    this.userId = userId;
    this.activeApps = new Map();
    this.sessionLogs = [];
    this.trackInterval = null;
    this.screenshotInterval = null;
    this.isTrackingScreenshots = false; //  flag
    this.nameMap = {};
    this.systemProcesses = [
      'system', 'idle', 'svchost', 'runtime', 'node', 'powershell', 'cmd',
      'dllhost', 'conhost', 'wininit', 'registry', 'smss', 'csrss', 'winlogon',
      'services', 'lsass', 'fontdrvhost', 'dwm', 'spoolsv', 'explorer','memory compression', 'apphelpercap', 'diagscap', 'networkcap', 
      'sysinfocap', 'sihost', 'taskhostw', 'servicehost', 'wmiprvse',
      'unsecapp', 'uihost', 'shellhost', 'aggregatorhost', 'ctfmon',
      'searchhost', 'runtimebroker', 'widgets', 'widgetservice',
      'searchindexer', 'backgroundtaskhost', 'textinputhost',
      'securityhealthsystray', 'securityhealthservice', 'desktopextension',
      'applicationframehost', 'shellexperiencehost', 'systemsettings',
      'useroobebroker', 'searchprotocolhost', 'mousocoreworker',
      'trustedinstaller', 'tiworker'
    ];
  }
 async initialize() {
    // Check if user is admin before starting tracking
    const user = await User
    .findById(this.userId);
    this.isAdmin = user?.role === 'admin';
    if (this.isAdmin) {
      logger.info(`Admin user detected (${this.userId}), skipping tracking initialization`);
      return false;
    }
    await this.fetchNameMap();
    return true;
  }
  async fetchNameMap() {
  try {
    const response = await axios.get(`${process.env.BASE_URL}/api/app-name-map`);
    this.nameMap = response.data || {};
    logger.info('Fetched app name map from API');
  } catch (err) {
    logger.error('Failed to fetch app name map:', err);
    this.nameMap = {};
  }
}


  async trackApplications() {
  try {
    const processes = await psList.default();
    const currentApps = new Map(); // Changed to Map for better performance

    processes.forEach(proc => {
      let appName = this.normalizeProcessName(proc.name);
      if (this.shouldSkipProcess(appName)) return;
      
      const friendlyName = this.findFriendlyName(appName);
      appName = friendlyName || appName;

      if (appName && !this.isSystemProcess(appName)) {
        // Store with original name for reference
        currentApps.set(appName, proc.name); 
      }
    });

    // Start new sessions
    currentApps.forEach((originalName, friendlyName) => {
      if (!this.activeApps.has(friendlyName)) {
        const session = {
          appName: friendlyName,
          originalName, // Store original for debugging
          startTime: new Date(),
          endTime: null,
          duration: null,
          userId: this.userId
        };
        this.activeApps.set(friendlyName, session);
        logger.info(`App started: ${friendlyName} (Original: ${originalName})`);
      }
    });

    // End completed sessions
    this.activeApps.forEach((session, appName) => {
      if (!currentApps.has(appName)) {
        session.endTime = new Date();
        session.duration = (session.endTime - session.startTime) / 1000;
        this.sessionLogs.push(session);
        this.activeApps.delete(appName);
        logger.info(`App closed: ${appName} (Duration: ${session.duration}s)`);
        this.sendSessionData(session);
      }
    });
  } catch (error) {
    logger.error('Error tracking applications:', error);
  }
}

  isSystemProcess(name) {
    return this.systemProcesses.includes(name.toLowerCase());
  }

  sendSessionData(session) {
    const log = new SessionLog(session);
    log.save()
      .then(() => logger.info(`Session saved: ${session.appName}`))
      .catch(err => logger.error('Failed to save session:', err));
  }

  async startTracking() {
    const shouldStart = await this.initialize();
    if (!shouldStart) return;

    if (!this.trackInterval) {
        this.trackInterval = setInterval(() => this.trackApplications(), 2000);
        this.trackApplications(); // Run once immediately
        logger.info(`Started app tracking for user ${this.userId}`);
    }

    if (!this.screenshotInterval) {
        this.isTrackingScreenshots = true; // Set flag when starting
         // Take a screenshot immediately
        captureAndSendScreenshot(this.userId).catch(err =>
            logger.error('Screenshot error (immediate):', err)
        );
        this.screenshotInterval = setInterval(() => {
            // Only capture if tracking is still active
            if (this.isTrackingScreenshots) {
                captureAndSendScreenshot(this.userId).catch(err =>
                    logger.error('Screenshot error:', err)
                );
            } else {
                // This else block helps debug if interval fires after flag is false
                logger.warn(`Screenshot interval fired but tracking is off for user ${this.userId}`);
            }
        },5 * 60 * 1000);
        logger.info(`Started screenshot capture for user ${this.userId}`);
    }
}

  stopTracking() {
    if (this.trackInterval) {
      clearInterval(this.trackInterval);
      this.trackInterval = null;
    }

    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval);
      this.screenshotInterval = null;
      this.isTrackingScreenshots = false; // Clear flag immediately

    }

    logger.info(`Stopped tracking for user ${this.userId}`);

    this.activeApps.forEach((session, appName) => {
      session.endTime = new Date();
      session.duration = (session.endTime - session.startTime) / 1000;
      this.sendSessionData(session);
    });

    this.activeApps.clear();
  }
  findFriendlyName(rawName) {
  // Check exact matches first
  if (this.nameMap[rawName]) {
    return this.nameMap[rawName];
  }
  
  // Check for partial matches (e.g., "msedgewebview2" contains "msedge")
  for (const key in this.nameMap) {
    if (rawName.includes(key)) {
      return this.nameMap[key];
    }
  }
  
  return null;
}
normalizeProcessName(name) {
  // Convert to lowercase and remove common suffixes
  let normalized = name.toLowerCase()
    .replace('.exe', '')
    .replace('.dll', '')
    .replace('.js', '')
    .replace('.bin', '')
    .replace(/\d+\.\d+\.\d+/, '') // Remove version numbers
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .trim();
    
  // Handle specific cases
  if (normalized.includes('msedge')) return 'msedge';
  if (normalized.includes('chrome')) return 'chrome';
  if (normalized.includes('firefox')) return 'firefox';
  
  return normalized;
}
shouldSkipProcess(name) {
  const skipPatterns = [
    /service$/i,
    /host$/i,
    /^dllhost/i,
    /^conhost/i,
    /^svchost/i,
    /^runtime/i,
    /^background/i,
    /^systemsettings/i,
    /^taskhost/i,
    /^aggregator/i,
    /^widget/i,
    /^securityhealth/i,
    /^textinput/i,
    /^search/i,
    /^sppsvc/i,
    /^tiworker/i,
    /^ipf/i,          // IP Filtering services
    /^rtk/i,          // Realtek services
    /^etd/i,          // Elan touchpad
    /^seco/i,         // Security components
    /^ngc/i,          // Windows NGC
    /^oobe/i,         // Out of box experience
    /^mouso/i         // Mouse services
  ];
  
  const processesToSkip = [
    'comppkgsrv',
    'windowspackagemanagerserver',
    'filecoauth',
    'apphostregistrationverifier',
    'lsaiso',
    'ipfsvc',
    'ipfuf',
    'secocl64',
    'ipfhelper',
    'ngciso',
    'rtkauduservice64',
    'rtkbtmanserv',
    'secomn64',
    'etdctrl',
    'overlayhelper',
    'omeninstallmonitor',
    'lockapp',
    'memorycompression',
    'intelcphdcpsvc',
    'fastlistx64',
    'officeclicktorun',
    'onedrive',
    'windowscopilotruntimeactions',
    'systemprocess',
    'securesystem',
    
  ];
  
  return skipPatterns.some(pattern => pattern.test(name)) || 
         processesToSkip.includes(name.toLowerCase());
}
}

module.exports = SessionTracker;