const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All user profile management endpoints require active JWT authentication and 'student' role
router.use(authenticateToken);
router.use(requireRole('student'));

// Self-service profile endpoints
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// ID-parameterized endpoints enforcing strict row-level ownership (403 on cross-user access)
router.get('/:userId', getUserProfile);
router.put('/:userId', updateUserProfile);

module.exports = router;
