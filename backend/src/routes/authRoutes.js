const express = require('express');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public authentication endpoints
router.post('/register', register);
router.post('/login', login);

// Protected session endpoints
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);

module.exports = router;
