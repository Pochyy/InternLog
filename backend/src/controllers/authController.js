const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { queryOne, execute } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Registers a new OJT Student account with input validation, duplicate check, and bcrypt password hashing.
 */
async function register(req, res) {
  try {
    const { full_name, email, password, confirm_password } = req.body;

    // 1. Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All required fields (Full Name, Email, and Password) must be provided.'
      });
    }

    const trimmedName = String(full_name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full Name must be at least 2 characters long.'
      });
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirm_password !== undefined && password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.'
      });
    }

    // 2. Prevent duplicate user accounts
    const existingUser = queryOne('SELECT user_id FROM users WHERE LOWER(email) = ?', [trimmedEmail]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // 3. Securely hash user password before storage (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Assign role ('student' - Registered OJT Student per SRS Section 1.5 & 2.2)
    const userId = crypto.randomUUID();
    const role = 'student';
    const now = new Date().toISOString();
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=1B365D&color=fff`;

    // 5. Store user information in database
    execute(
      `INSERT INTO users (user_id, email, full_name, password_hash, role, profile_picture_url, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, trimmedEmail, trimmedName, passwordHash, role, avatarUrl, now, now]
    );

    // 6. Generate JWT session token
    const token = jwt.sign(
      { user_id: userId, email: trimmedEmail, role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          user_id: userId,
          full_name: trimmedName,
          email: trimmedEmail,
          role,
          profile_picture_url: avatarUrl,
          created_at: now,
          last_login_at: now
        },
        ojt_profile: null
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during account registration.'
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user with registered credentials and returns a JWT session token.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const user = queryOne(
      'SELECT user_id, email, full_name, password_hash, role, profile_picture_url, created_at FROM users WHERE LOWER(email) = ?',
      [trimmedEmail]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials and try again.'
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials and try again.'
      });
    }

    const now = new Date().toISOString();
    execute('UPDATE users SET last_login_at = ? WHERE user_id = ?', [now, user.user_id]);

    const ojtProfile = queryOne('SELECT * FROM ojt_profiles WHERE user_id = ?', [user.user_id]);

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          profile_picture_url: user.profile_picture_url,
          created_at: user.created_at,
          last_login_at: now
        },
        ojt_profile: ojtProfile || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during login.'
    });
  }
}

/**
 * POST /api/auth/logout
 * Terminates the authenticated session by revoking the active JWT token.
 */
function logout(req, res) {
  try {
    const token = req.token;
    if (token) {
      const existing = queryOne('SELECT token FROM revoked_tokens WHERE token = ?', [token]);
      if (!existing) {
        execute('INSERT INTO revoked_tokens (token, revoked_at) VALUES (?, ?)', [
          token,
          new Date().toISOString()
        ]);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session terminated.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while logging out.'
    });
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user details and OJT profile configuration.
 */
function getMe(req, res) {
  try {
    const ojtProfile = queryOne('SELECT * FROM ojt_profiles WHERE user_id = ?', [req.user.user_id]);
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
        ojt_profile: ojtProfile || null
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve current session user.'
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
