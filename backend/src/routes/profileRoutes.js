const express = require('express');
const router = express.Router();
const { getProfile, upsertProfile } = require('../controllers/profileController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All OJT profile routes require authentication and the 'student' role (Registered OJT Student per SRS)
router.use(authenticateToken);
router.use(requireRole('student'));

router.get('/', getProfile);
router.put('/', upsertProfile);

module.exports = router;
