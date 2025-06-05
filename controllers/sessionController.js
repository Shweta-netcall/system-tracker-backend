const SessionLog = require('../models/SessionLog');

exports.getAllSessions = async (req, res) => {
  try {
    // const sessions = await SessionLog.find({ userId: req.user.userId });
    const sessions = await SessionLog.find().populate('userId', 'username');
    const validSessions = sessions.filter(s => s.userId !== null);
    res.json(validSessions);
        // res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
