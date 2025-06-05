const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
// router.post('/logout', authController.logout);
router.post('/logout', verifyToken, authController.logout);

module.exports = router;