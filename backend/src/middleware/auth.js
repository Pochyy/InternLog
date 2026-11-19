const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'internlog_super_secret_jwt_key_2026_it342_sia';

/**
 * Middleware to verify JWT authentication token and check against revoked sessions
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to access this resource.'
    });
  }

  try {
    // Check if token has been revoked via logout
    const revoked = queryOne('SELECT token FROM revoked_tokens WHERE token = ?', [token]);
    if (revoked) {
      return res.status(401).json({
        success: false,
        message: 'Session has been terminated. Please log in again.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure user still exists in database
    const user = queryOne(
      'SELECT user_id, email, full_name, role, profile_picture_url, created_at, last_login_at FROM users WHERE user_id = ?',
      [decoded.user_id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session. Please log in again.'
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware aligned with SRS role definition ('student')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
