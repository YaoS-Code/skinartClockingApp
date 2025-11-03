const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth'); // Add this import

// Public routes
router.post('/login', login);
router.post('/register', register); // Public registration route

// Protected routes
router.get('/profile', auth, getProfile);

module.exports = router;