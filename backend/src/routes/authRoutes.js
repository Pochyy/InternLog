const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  changePassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public authentication endpoints
router.post('/register', register);
router.post('/login', login);

// Protected session & credential management endpoints
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.put('/change-password', authenticateToken, changePassword);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
