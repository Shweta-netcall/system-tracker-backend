const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const screenshotController = require('../controllers/screenshotController');
const { authenticate } = require('../middleware/authMiddleware');
const isAdmin  = require('../middleware/isAdmin');
const userController = require('../controllers/userController');

//route definitions:
router.get('/sessions', authenticate, isAdmin, sessionController.getAllSessions);
router.get('/screenshots', authenticate, isAdmin, screenshotController.getAllScreenshots);
router.post('/capture-screenshot', authenticate, isAdmin, screenshotController.captureScreenshot);


// User management routes (Admin only)
router.get('/users', authenticate, isAdmin, userController.getAllUsers);
router.post('/create-user', authenticate, isAdmin, userController.createUser);
router.put('/update-user/:id', authenticate, isAdmin, userController.updateUser);
router.delete('/delete-user/:id', authenticate, isAdmin, userController.deleteUser);

module.exports = router;