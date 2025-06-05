const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const logger = require('./utils/logger');
const { authenticate } = require('./middleware/authMiddleware');
const path = require('path'); // ✅ Fix for ReferenceError

require('dotenv').config();
const cleanup = require('./utils/cleanupJob');

const app = express();                                                                                                          
const appNameMapRoute = require('./routes/appNameMap');

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limit only on login
app.use('/api/auth/login', limiter);

// Routes
app.use('/api/auth', authRoutes);
const  isAdmin  = require('./middleware/isAdmin');
app.use('/api/admin', authenticate, isAdmin, adminRoutes);
app.use('/screenshots', express.static(path.join(__dirname, 'uploads', 'screenshots')));
app.use('/api/app-name-map', appNameMapRoute);

//Frontend static files
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, 'frontend', 'build')));

//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
//   });
// }
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../'))); // serve the main frontend folder

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'index.html')); // serve the root index.html
  });
}

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});