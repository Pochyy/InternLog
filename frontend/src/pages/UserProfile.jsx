import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import ChangePasswordCard from '../components/ChangePasswordCard';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_REGEX = /^[A-Za-z0-9-]{4,30}$/;
const CONTACT_REGEX = /^[0-9+\-\s()]{7,20}$/;

export default function UserProfile() {
  const { user, setUser, ojtProfile, setOjtProfile, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [academicProgram, setAcademicProgram] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  const syncFormWithUser = (userData) => {
    if (!userData) return;
    setFullName(userData.full_name || '');
    setEmail(userData.email || '');
    setStudentIdNumber(userData.student_id_number || '');
    setContactNumber(userData.contact_number || '');
    setAcademicProgram(userData.academic_program || '');
    const customAvatar =
      userData.profile_picture_url && !userData.profile_picture_url.includes('ui-avatars.com/api/')
        ? userData.profile_picture_url
        : '';
    setProfilePictureUrl(customAvatar);
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiRequest('/users/profile', { method: 'GET' });
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          syncFormWithUser(res.data.user);
          if (res.data.ojt_profile !== undefined) {
            setOjtProfile(res.data.ojt_profile);
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load profile details.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [setUser, setOjtProfile]);

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStartEdit = () => {
    setError('');
    setSuccessMsg('');
    syncFormWithUser(user);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setError('');
    syncFormWithUser(user);
    setIsEditing(false);
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedStudentId = studentIdNumber.trim();
    const trimmedContact = contactNumber.trim();
    const trimmedProgram = academicProgram.trim();
    const trimmedAvatar = profilePictureUrl.trim();

    if (!trimmedName || !trimmedEmail) {
      setError('Full Name and Email Address are required fields.');
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError('Full Name must be between 2 and 100 characters long.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (trimmedStudentId && !STUDENT_ID_REGEX.test(trimmedStudentId)) {
      setError(
        'Student ID Number must be 4–30 characters using letters, numbers, or hyphens (e.g., 2023-10482).'
      );
      return;
    }

    if (trimmedContact && !CONTACT_REGEX.test(trimmedContact)) {
      setError(
        'Contact Number must be 7–20 digits and may include +, -, spaces, or parentheses.'
      );
      return;
    }

    if (trimmedProgram && (trimmedProgram.length < 2 || trimmedProgram.length > 120)) {
      setError('Academic Program / Department must be between 2 and 120 characters long.');
      return;
    }

    if (trimmedAvatar && !/^https?:\/\/.+/i.test(trimmedAvatar)) {
      setError('Custom Avatar URL must start with http:// or https://.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfile({
        full_name: trimmedName,
        email: trimmedEmail,
        student_id_number: trimmedStudentId || null,
        contact_number: trimmedContact || null,
        academic_program: trimmedProgram || null,
        profile_picture_url: trimmedAvatar || ''
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Profile updated successfully.');
        syncFormWithUser(res.data.user);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile updates.');
    } finally {
      setSaving(false);
    }
  };

  const hasCustomAvatar =
    user?.profile_picture_url && !user.profile_picture_url.includes('ui-avatars.com/api/');

  return (
    <main className="dashboard-container">
      <section className="bento-grid">
        {/* Hero Banner (Span 12): Identity & Actions */}
        <div className="bento-card bento-hero bento-span-12">
          <div className="bento-hero-top" style={{ alignItems: 'center' }}>
            <div className="profile-hero-identity">
              <div className="profile-avatar-lg" aria-hidden="true">
                {hasCustomAvatar ? (
                  <img src={user.profile_picture_url} alt="" />
                ) : (
                  getInitials(user?.full_name)
                )}
              </div>
              <div>
                <div className="hero-tag" style={{ marginBottom: '0.5rem' }}>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Registered OJT Student Profile</span>
                </div>
                <h1 style={{ marginBottom: '0.25rem' }}>{user?.full_name || 'Student Account'}</h1>
                <p style={{ fontSize: '0.9rem' }}>
                  {user?.email}
                  {user?.student_id_number ? ` • ID: ${user.student_id_number}` : ''}
                  {user?.academic_program ? ` • ${user.academic_program}` : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                to="/dashboard"
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.16)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  minHeight: '42px',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.86rem'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>

              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-accent"
                  style={{ minHeight: '42px', padding: '0.55rem 1.15rem', fontSize: '0.86rem' }}
                  onClick={handleStartEdit}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit Profile Info</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Left Column (Span 7): Personal & Academic Profile Information */}
        <div className="bento-card bento-span-7">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0D9488"
                strokeWidth="2.2"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h2>{isEditing ? 'Edit Personal & Academic Details' : 'Student Profile Information'}</h2>
            </div>

            {!isEditing ? (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: '36px', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={handleStartEdit}
              >
                Edit Profile
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: '36px', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                style={{ flexShrink: 0, marginTop: '1px' }}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success" role="status">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                style={{ flexShrink: 0, marginTop: '1px' }}
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <p style={{ color: 'var(--color-muted-foreground)', padding: '1rem 0' }}>
              Loading profile details...
            </p>
          ) : !isEditing ? (
            <div className="info-list">
              <div className="info-item">
                <span className="info-key">Full Name</span>
                <span className="info-val">{user?.full_name || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Email Address</span>
                <span className="info-val">{user?.email || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Student ID Number</span>
                <span className="info-val">
                  {user?.student_id_number || (
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>Not set</span>
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="info-key">Contact / Phone Number</span>
                <span className="info-val">
                  {user?.contact_number || (
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>Not set</span>
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="info-key">Academic Program / Department</span>
                <span className="info-val">
                  {user?.academic_program || (
                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>Not set</span>
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="info-key">Account Role</span>
                <span className="info-val" style={{ color: '#0F766E' }}>
                  Registered OJT Student ({user?.role})
                </span>
              </div>
              <div className="info-item">
                <span className="info-key">Member Since</span>
                <span className="info-val">{formatDate(user?.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Last Profile Update</span>
                <span className="info-val">
                  {formatDate(user?.updated_at || user?.created_at)}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitProfile} noValidate>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile_full_name">
                    Full Name *
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="profile_full_name"
                      type="text"
                      className="form-input has-left-icon"
                      placeholder="Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile_email">
                    Email Address *
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      id="profile_email"
                      type="email"
                      className="form-input has-left-icon"
                      placeholder="student@university.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile_student_id">
                    Student ID Number
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="7" y1="8" x2="17" y2="8" />
                        <line x1="7" y1="12" x2="13" y2="12" />
                      </svg>
                    </span>
                    <input
                      id="profile_student_id"
                      type="text"
                      className="form-input has-left-icon"
                      placeholder="e.g., 2023-10482"
                      value={studentIdNumber}
                      onChange={(e) => setStudentIdNumber(e.target.value)}
                    />
                  </div>
                  <span className="field-hint">4–30 letters, numbers, or hyphens</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profile_contact">
                    Contact / Phone Number
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      id="profile_contact"
                      type="tel"
                      className="form-input has-left-icon"
                      placeholder="+63 917 123 4567"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                    />
                  </div>
                  <span className="field-hint">7–20 digits (+, -, spaces allowed)</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile_program">
                  Academic Program / Department
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </span>
                  <input
                    id="profile_program"
                    type="text"
                    className="form-input has-left-icon"
                    placeholder="e.g., BS in Information Technology — College of Computer Studies"
                    value={academicProgram}
                    onChange={(e) => setAcademicProgram(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile_avatar_url">
                  Custom Avatar Image URL (Optional)
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </span>
                  <input
                    id="profile_avatar_url"
                    type="url"
                    className="form-input has-left-icon"
                    placeholder="https://example.com/my-photo.jpg (leave blank for initials avatar)"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-secondary" disabled={saving}>
                  {saving ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column (Span 5): Change Password & Linked OJT Placement */}
        <div
          className="bento-span-5"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <ChangePasswordCard />

          <div
            className="bento-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div>
              <div className="panel-header">
                <div className="panel-title-wrap">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0D9488"
                    strokeWidth="2.2"
                    aria-hidden="true"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <h2>Linked OJT Placement</h2>
                </div>
                <Link
                  to="/dashboard"
                  className="btn btn-ghost"
                  style={{ minHeight: '34px', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                >
                  Manage on Dashboard
                </Link>
              </div>

              <div className="info-list">
                <div className="info-item">
                  <span className="info-key">Host Company</span>
                  <span className="info-val">
                    {ojtProfile?.company_name || 'Not configured yet'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Required Hours</span>
                  <span className="info-val">
                    {ojtProfile ? `${ojtProfile.required_hours} hrs` : '—'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Official Start Date</span>
                  <span className="info-val">{ojtProfile?.start_date || '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Estimated Completion</span>
                  <span className="info-val" style={{ color: '#EA580C' }}>
                    {ojtProfile?.estimated_completion_date || 'Pending Setup'}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: '14px',
                background: '#F0FDFA',
                border: '1px solid var(--color-border)',
                fontSize: '0.84rem',
                color: 'var(--color-foreground)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 800,
                  marginBottom: '0.3rem'
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="2.3"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Profile Ownership & Security</span>
              </div>
              <p style={{ color: '#475569', lineHeight: 1.55 }}>
                Your profile is protected by strict row-level authorization. Only your authenticated
                student session can view or modify your personal information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
