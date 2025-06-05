const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  contentType: {
  type: String,
  default: 'image/png'
},

  fileUrl: {
    type: String,
    required: true, // this is the relative path like "/screenshots/xyz.png"
  },
}, { timestamps: true });

module.exports = mongoose.model('Screenshot', screenshotSchema);
