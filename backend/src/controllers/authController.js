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
      `INSERT INTO users (user_id, email, full_name, password_hash, role, profile_picture_url, created_at, updated_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, trimmedEmail, trimmedName, passwordHash, role, avatarUrl, now, now, now]
    );

    // 6. Generate JWT session token with unique jti
    const token = jwt.sign(
      { user_id: userId, email: trimmedEmail, role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h', jwtid: crypto.randomUUID() }
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
          student_id_number: null,
          contact_number: null,
          academic_program: null,
          created_at: now,
          updated_at: now,
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
      `SELECT user_id, email, full_name, password_hash, role, profile_picture_url,
              student_id_number, contact_number, academic_program, created_at, updated_at
       FROM users WHERE LOWER(email) = ?`,
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h', jwtid: crypto.randomUUID() }
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
          student_id_number: user.student_id_number || null,
          contact_number: user.contact_number || null,
          academic_program: user.academic_program || null,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
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

/**
 * PUT / POST /api/auth/change-password
 * Allows an authenticated user to change their password after verifying their current password.
 * Overwrites password_hash with a fresh 10-round bcrypt hash and rotates the active JWT token.
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.user_id;
    const { current_password, new_password, confirm_password, confirm_new_password } = req.body;
    const confirmation =
      confirm_password !== undefined ? confirm_password : confirm_new_password;

    if (!current_password || !new_password || confirmation === undefined || confirmation === '') {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and password confirmation are all required.'
      });
    }

    const userRecord = queryOne(
      'SELECT user_id, email, role, password_hash FROM users WHERE user_id = ?',
      [userId]
    );

    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // 1. Verify current password against stored bcrypt hash
    const isCurrentValid = await bcrypt.compare(
      String(current_password),
      userRecord.password_hash
    );
    if (!isCurrentValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect. Please verify and try again.'
      });
    }

    // 2. Validate new password strength & confirmation match
    if (String(new_password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (String(new_password) !== String(confirmation)) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match.'
      });
    }

    // 3. Prevent reusing the exact same password
    const isSameAsOld = await bcrypt.compare(String(new_password), userRecord.password_hash);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password.'
      });
    }

    // 4. Hash new password and overwrite old hash so previous password can never authenticate again
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(String(new_password), salt);
    const now = new Date().toISOString();

    execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE user_id = ?', [
      newPasswordHash,
      now,
      userId
    ]);

    // 5. Revoke previous JWT token and issue rotated session token
    if (req.token) {
      const existingRevoked = queryOne('SELECT token FROM revoked_tokens WHERE token = ?', [
        req.token
      ]);
      if (!existingRevoked) {
        execute('INSERT INTO revoked_tokens (token, revoked_at) VALUES (?, ?)', [req.token, now]);
      }
    }

    const rotatedToken = jwt.sign(
      { user_id: userRecord.user_id, email: userRecord.email, role: userRecord.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h', jwtid: crypto.randomUUID() }
    );

    return res.status(200).json({
      success: true,
      message: 'Your password has been changed successfully.',
      data: {
        token: rotatedToken
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating your password.'
    });
  }
}

const RESET_TOKEN_TTL_MINUTES = 15;

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

/**
 * POST /api/auth/forgot-password
 * Verifies student account identity by registered email and issues a cryptographically
 * secure, single-use, 15-minute expiring recovery token (stored hashed with SHA-256).
 */
function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your registered email address.'
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    const user = queryOne(
      'SELECT user_id, email, full_name FROM users WHERE LOWER(email) = ?',
      [trimmedEmail]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered student account was found with that email address.'
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Invalidate any prior unused reset tokens for this user
    execute(
      'UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL',
      [nowIso, user.user_id]
    );

    // Generate cryptographically random 32-byte single-use recovery token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const resetId = crypto.randomUUID();
    const expiresAt = new Date(
      now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
    ).toISOString();

    execute(
      `INSERT INTO password_reset_tokens (reset_id, user_id, token_hash, expires_at, used_at, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [resetId, user.user_id, tokenHash, expiresAt, nowIso]
    );

    const resetPath = `/reset-password?token=${rawToken}`;
    console.log(`[InternLog Password Recovery] Student: ${user.email} | Reset Path: ${resetPath} | Expires: ${expiresAt}`);

    return res.status(200).json({
      success: true,
      message: 'Password recovery token generated. Use the recovery link below within 15 minutes.',
      data: {
        email: user.email,
        dev_reset: {
          reset_token: rawToken,
          reset_path: resetPath,
          expires_in_minutes: RESET_TOKEN_TTL_MINUTES,
          expires_at: expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while initiating password recovery.'
    });
  }
}

/**
 * GET /api/auth/verify-reset-token?token=...
 * Validates whether a recovery token exists, is unused, and has not expired.
 */
function verifyResetToken(req, res) {
  try {
    const rawToken = req.query.token ? String(req.query.token).trim() : '';
    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Recovery token is required.'
      });
    }

    const tokenHash = hashResetToken(rawToken);
    const record = queryOne(
      `SELECT prt.reset_id, prt.user_id, prt.expires_at, prt.used_at, u.email, u.full_name
       FROM password_reset_tokens prt
       JOIN users u ON u.user_id = prt.user_id
       WHERE prt.token_hash = ?`,
      [tokenHash]
    );

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unrecognized password recovery token.'
      });
    }

    if (record.used_at) {
      return res.status(400).json({
        success: false,
        message: 'This password recovery link has already been used. Please request a new one.'
      });
    }

    if (new Date(record.expires_at) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This password recovery token has expired. Please request a new one.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        email: record.email,
        full_name: record.full_name,
        expires_at: record.expires_at
      }
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to verify recovery token.'
    });
  }
}

/**
 * POST /api/auth/reset-password
 * Resets a student's password using a valid, unexpired, single-use recovery token.
 * Hashes the new password with bcrypt (10 salt rounds) and consumes the token.
 */
async function resetPassword(req, res) {
  try {
    const { token, new_password, confirm_password } = req.body;

    if (!token || !new_password || confirm_password === undefined || confirm_password === '') {
      return res.status(400).json({
        success: false,
        message: 'Recovery token, new password, and password confirmation are all required.'
      });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (String(new_password) !== String(confirm_password)) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation password do not match.'
      });
    }

    const tokenHash = hashResetToken(String(token).trim());
    const record = queryOne(
      'SELECT reset_id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?',
      [tokenHash]
    );

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unrecognized password recovery token.'
      });
    }

    if (record.used_at) {
      return res.status(400).json({
        success: false,
        message: 'This password recovery token has already been used. Please request a new recovery link.'
      });
    }

    if (new Date(record.expires_at) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This password recovery token has expired. Please request a new recovery link.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(String(new_password), salt);
    const nowIso = new Date().toISOString();

    execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE user_id = ?', [
      newPasswordHash,
      nowIso,
      record.user_id
    ]);

    // Mark token consumed (single-use enforcement)
    execute('UPDATE password_reset_tokens SET used_at = ? WHERE reset_id = ?', [
      nowIso,
      record.reset_id
    ]);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password.'
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword
};
