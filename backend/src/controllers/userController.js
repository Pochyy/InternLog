const { queryOne, execute } = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_REGEX = /^[A-Za-z0-9-]{4,30}$/;
const CONTACT_REGEX = /^[0-9+\-\s()]{7,20}$/;
const URL_REGEX = /^https?:\/\/.+/i;

const PUBLIC_USER_SELECT = `
  SELECT user_id, email, full_name, role, profile_picture_url,
         student_id_number, contact_number, academic_program,
         created_at, updated_at, last_login_at
  FROM users WHERE user_id = ?
`;

/**
 * GET /api/users/profile & GET /api/users/:userId
 * Retrieves the authenticated student's own account profile information.
 * Enforces strict row-level isolation against reading other users' profiles.
 */
function getUserProfile(req, res) {
  try {
    const authUserId = req.user.user_id;
    const requestedUserId = req.params.userId;

    if (requestedUserId && requestedUserId !== authUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to view another user's profile."
      });
    }

    const user = queryOne(PUBLIC_USER_SELECT, [authUserId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const ojtProfile = queryOne('SELECT * FROM ojt_profiles WHERE user_id = ?', [authUserId]);

    return res.status(200).json({
      success: true,
      data: {
        user,
        ojt_profile: ojtProfile || null
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile information.'
    });
  }
}

/**
 * PUT /api/users/profile & PUT /api/users/:userId
 * Updates the authenticated student's own profile details with strict validation
 * and row-level authorization preventing modifications to other users' profiles.
 */
function updateUserProfile(req, res) {
  try {
    const authUserId = req.user.user_id;
    const requestedUserId = req.params.userId;

    // 1. Prevent unauthorized modification of another user's profile (SRS Section 4.2 Data Isolation)
    if (
      (requestedUserId && requestedUserId !== authUserId) ||
      (req.body.user_id && req.body.user_id !== authUserId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to modify another user's profile."
      });
    }

    const {
      full_name,
      email,
      student_id_number,
      contact_number,
      academic_program,
      profile_picture_url
    } = req.body;

    // 2. Validate required core identity fields
    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Full Name and Email Address are required.'
      });
    }

    const trimmedName = String(full_name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Full Name must be between 2 and 100 characters long.'
      });
    }

    if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Check email uniqueness excluding current user
    const duplicateEmail = queryOne(
      'SELECT user_id FROM users WHERE LOWER(email) = ? AND user_id != ?',
      [trimmedEmail, authUserId]
    );
    if (duplicateEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already associated with another account.'
      });
    }

    // 3. Validate optional extended student fields
    let cleanStudentId = null;
    if (student_id_number !== undefined && student_id_number !== null && String(student_id_number).trim() !== '') {
      cleanStudentId = String(student_id_number).trim();
      if (!STUDENT_ID_REGEX.test(cleanStudentId)) {
        return res.status(400).json({
          success: false,
          message: 'Student ID Number must be 4–30 characters using letters, numbers, or hyphens (e.g., 2023-10482).'
        });
      }

      const duplicateStudentId = queryOne(
        'SELECT user_id FROM users WHERE LOWER(student_id_number) = LOWER(?) AND user_id != ?',
        [cleanStudentId, authUserId]
      );
      if (duplicateStudentId) {
        return res.status(409).json({
          success: false,
          message: 'This Student ID Number is already registered to another student.'
        });
      }
    }

    let cleanContact = null;
    if (contact_number !== undefined && contact_number !== null && String(contact_number).trim() !== '') {
      cleanContact = String(contact_number).trim();
      if (!CONTACT_REGEX.test(cleanContact)) {
        return res.status(400).json({
          success: false,
          message: 'Contact Number must be 7–20 digits and may include +, -, spaces, or parentheses.'
        });
      }
    }

    let cleanProgram = null;
    if (academic_program !== undefined && academic_program !== null && String(academic_program).trim() !== '') {
      cleanProgram = String(academic_program).trim();
      if (cleanProgram.length < 2 || cleanProgram.length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Academic Program / Department must be between 2 and 120 characters long.'
        });
      }
    }

    const currentRecord = queryOne('SELECT profile_picture_url FROM users WHERE user_id = ?', [authUserId]);
    let cleanAvatarUrl = currentRecord?.profile_picture_url || null;

    if (profile_picture_url !== undefined) {
      const trimmedAvatar = profile_picture_url ? String(profile_picture_url).trim() : '';
      if (!trimmedAvatar) {
        cleanAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=0D9488&color=fff`;
      } else {
        if (!URL_REGEX.test(trimmedAvatar) || trimmedAvatar.length > 500) {
          return res.status(400).json({
            success: false,
            message: 'Profile Picture URL must be a valid http:// or https:// web address.'
          });
        }
        cleanAvatarUrl = trimmedAvatar;
      }
    } else if (!cleanAvatarUrl || cleanAvatarUrl.includes('ui-avatars.com/api/')) {
      cleanAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=0D9488&color=fff`;
    }

    const now = new Date().toISOString();

    execute(
      `UPDATE users
       SET full_name = ?,
           email = ?,
           student_id_number = ?,
           contact_number = ?,
           academic_program = ?,
           profile_picture_url = ?,
           updated_at = ?
       WHERE user_id = ?`,
      [
        trimmedName,
        trimmedEmail,
        cleanStudentId,
        cleanContact,
        cleanProgram,
        cleanAvatarUrl,
        now,
        authUserId
      ]
    );

    const updatedUser = queryOne(PUBLIC_USER_SELECT, [authUserId]);

    return res.status(200).json({
      success: true,
      message: 'Your student profile has been updated successfully.',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating your profile.'
    });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile
};
