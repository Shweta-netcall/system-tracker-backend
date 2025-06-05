const mongoose = require('mongoose');

const sessionLogSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('SessionLog', sessionLogSchema);