const crypto = require('crypto');
const { queryOne, execute } = require('../config/db');

const DAY_NAME_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

/**
 * Helper to compute Estimated Completion Date based on remaining hours and scheduled working days
 * (SRS FR-2.5: dynamically calculate Estimated Completion Date)
 */
function computeEstimatedCompletionDate(startDateStr, requiredHours, renderedHours, workingDaysStr) {
  const remainingHours = Math.max(0, Number(requiredHours) - Number(renderedHours));
  if (remainingHours <= 0) {
    return new Date().toISOString().split('T')[0];
  }

  const dailyHours = 8; // Standard 8-hour OJT workday assumption for baseline forecast
  let daysNeeded = Math.ceil(remainingHours / dailyHours);

  const activeDayIndices = workingDaysStr
    .split(',')
    .map((d) => d.trim())
    .filter((d) => DAY_NAME_TO_INDEX[d] !== undefined)
    .map((d) => DAY_NAME_TO_INDEX[d]);

  if (activeDayIndices.length === 0) {
    return null;
  }

  const start = startDateStr ? new Date(startDateStr) : new Date();
  const today = new Date();
  const cursor = start > today ? new Date(start) : new Date(today);

  let safetyCounter = 0;
  while (daysNeeded > 0 && safetyCounter < 1500) {
    const dayOfWeek = cursor.getDay();
    if (activeDayIndices.includes(dayOfWeek)) {
      daysNeeded--;
    }
    if (daysNeeded > 0) {
      cursor.setDate(cursor.getDate() + 1);
    }
    safetyCounter++;
  }

  return cursor.toISOString().split('T')[0];
}

/**
 * GET /api/profile
 * Retrieves the student's OJT profile and computed dashboard metrics (SRS FR-1.4, FR-1.5, FR-2.4, FR-2.5)
 */
function getProfile(req, res) {
  try {
    const userId = req.user.user_id;
    const profile = queryOne('SELECT * FROM ojt_profiles WHERE user_id = ?', [userId]);

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          ojt_profile: null,
          metrics: {
            required_hours: 0,
            rendered_hours: 0,
            remaining_hours: 0,
            completion_percentage: 0,
            estimated_completion_date: null
          }
        }
      });
    }

    const requiredHours = Number(profile.required_hours) || 0;
    const renderedHours = Number(profile.rendered_hours) || 0;
    const remainingHours = Math.max(0, Number((requiredHours - renderedHours).toFixed(2)));
    const completionPercentage =
      requiredHours > 0
        ? Math.min(100, Number(((renderedHours / requiredHours) * 100).toFixed(1)))
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        ojt_profile: profile,
        metrics: {
          required_hours: requiredHours,
          rendered_hours: renderedHours,
          remaining_hours: remainingHours,
          completion_percentage: completionPercentage,
          estimated_completion_date: profile.estimated_completion_date
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve OJT profile.'
    });
  }
}

/**
 * PUT /api/profile
 * Configures or updates the student's OJT parameters (Host Company Name, Total Required Hours, Official Start Date, Working Days)
 * Aligned with SRS FR-1.4 & FR-1.5
 */
function upsertProfile(req, res) {
  try {
    const userId = req.user.user_id;
    const { company_name, required_hours, start_date, working_days } = req.body;

    if (!company_name || !required_hours || !start_date || !working_days) {
      return res.status(400).json({
        success: false,
        message: 'Company Name, Total Required Hours, Official Start Date, and Working Days are all required.'
      });
    }

    const trimmedCompany = String(company_name).trim();
    if (trimmedCompany.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Host Company Name must be at least 2 characters long.'
      });
    }

    const parsedHours = Number(required_hours);
    if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Total Required Hours must be a positive number between 1 and 2000.'
      });
    }

    const workingDaysStr = Array.isArray(working_days)
      ? working_days.join(',')
      : String(working_days).trim();

    if (!workingDaysStr) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one working day.'
      });
    }

    const existing = queryOne('SELECT * FROM ojt_profiles WHERE user_id = ?', [userId]);
    const renderedHours = existing ? Number(existing.rendered_hours) : 0;
    const estimatedCompletion = computeEstimatedCompletionDate(
      start_date,
      parsedHours,
      renderedHours,
      workingDaysStr
    );
    const now = new Date().toISOString();

    if (existing) {
      execute(
        `UPDATE ojt_profiles
         SET company_name = ?, required_hours = ?, start_date = ?, working_days = ?, estimated_completion_date = ?, updated_at = ?
         WHERE user_id = ?`,
        [trimmedCompany, parsedHours, start_date, workingDaysStr, estimatedCompletion, now, userId]
      );
    } else {
      const profileId = crypto.randomUUID();
      execute(
        `INSERT INTO ojt_profiles (profile_id, user_id, company_name, required_hours, rendered_hours, start_date, working_days, estimated_completion_date, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [profileId, userId, trimmedCompany, parsedHours, 0, start_date, workingDaysStr, estimatedCompletion, now]
      );
    }

    const updatedProfile = queryOne('SELECT * FROM ojt_profiles WHERE user_id = ?', [userId]);
    const remainingHours = Math.max(0, Number((parsedHours - renderedHours).toFixed(2)));
    const completionPercentage =
      parsedHours > 0 ? Math.min(100, Number(((renderedHours / parsedHours) * 100).toFixed(1))) : 0;

    return res.status(200).json({
      success: true,
      message: 'OJT Profile configuration saved successfully.',
      data: {
        ojt_profile: updatedProfile,
        metrics: {
          required_hours: parsedHours,
          rendered_hours: renderedHours,
          remaining_hours: remainingHours,
          completion_percentage: completionPercentage,
          estimated_completion_date: estimatedCompletion
        }
      }
    });
  } catch (error) {
    console.error('Upsert profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save OJT profile configuration.'
    });
  }
}

module.exports = {
  getProfile,
  upsertProfile
};
