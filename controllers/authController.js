const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const User = require('../models/User');
const SessionTracker = require('../services/sessionTracker');
const { captureAndSendScreenshot } = require('../services/screenshotService');

const activeTrackers = new Map();

exports.login = async (req, res) => {
  try {
    // console.log('Login attempt:', req.body);

    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    // 1. Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 2. Verify password (fixed duplicate check)
    console.log('Stored user password hash:', user.password);

    console.log('Raw input password:', password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch');
     
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('Password match (manual):', await bcrypt.compare('admin123', user.password));

    // 3. Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 4. Update user session
    user.activeSessions.push(token);
    user.lastLogin = new Date();
    await user.save();

    // 5. Initialize monitoring (only if not already tracking)
    // if (!activeTrackers.has(user._id.toString())) {
    //   const tracker = new SessionTracker(user._id);
    //   tracker.startTracking();
    //   activeTrackers.set(user._id.toString(), tracker);
    // }

     if (user.role !== 'admin' && !activeTrackers.has(user._id.toString())) {
      const tracker = new SessionTracker(user._id);
      tracker.startTracking();
      activeTrackers.set(user._id.toString(), tracker);
      console.log(`Started tracking for user ${user._id}`);
    } else if (user.role === 'admin') {
      console.log('Admin login detected - skipping tracking initialization');
    }

    // 6. Return response
    res.json({ 
      token, 
      userId: user._id, // Added userId to response
      username: user.username,
      role: user.role 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.logout = async (req, res) => {
  try {
    console.log('-----logout called------');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove session
    user.activeSessions = user.activeSessions.filter(s => s !== token);
    await user.save();

    // Cleanup tracking
    const userIdStr = user._id.toString();
    if (user.activeSessions.length === 0 && activeTrackers.has(userIdStr)) {
      const tracker = activeTrackers.get(user._id.toString());
      if (tracker) {
        tracker.stopTracking();
        activeTrackers.delete(user._id.toString());
        console.log(`Stopped tracking and screenshots for user ${userIdStr}`);

      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


//SYSTEM SHOUTDOWN CASE
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function cleanup() {
  console.log('Cleaning up before shutdown...');
  // End all tracking sessions
  for (const [userId, tracker] of activeTrackers.entries()) {
    tracker.stopTracking();
  }
  process.exit(0);
}
