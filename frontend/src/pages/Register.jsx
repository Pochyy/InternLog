import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('All fields are required. Please complete the registration form.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Full Name must be at least 2 characters long.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await register(trimmedName, trimmedEmail, password, confirmPassword);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '0 1rem' }}>
      <div className="auth-split-layout">
        {/* Left Showcase Panel */}
        <aside className="auth-showcase-panel">
          <div>
            <div className="showcase-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>Student Onboarding</span>
            </div>

            <h2 className="showcase-title">
              Start Your OJT Journey with Confidence.
            </h2>
            <p className="showcase-subtitle">
              Create your InternLog account in seconds, then configure your host company and
              required training hours directly from your dashboard.
            </p>

            <div className="showcase-bento-preview" aria-hidden="true">
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#CCFBF1',
                  marginBottom: '0.5rem'
                }}
              >
                ACCOUNT WORKSPACE
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(19, 78, 74, 0.5)',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.16)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                    OJT Student Workspace
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#99F6E4' }}>
                    Full access to Hours Tracker, Placement Setup & Journals
                  </div>
                </div>
                <span
                  style={{
                    background: '#EA580C',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px'
                  }}
                >
                  Student
                </span>
              </div>
            </div>
          </div>

          <ul className="showcase-feature-list">
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Personalized internship hours & completion date forecasting</span>
            </li>
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>End-to-end encrypted account security</span>
            </li>
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Instant access to your personal OJT dashboard</span>
            </li>
          </ul>
        </aside>

        {/* Right Registration Form Panel */}
        <section className="auth-form-panel">
          <div className="auth-header">
            <h1>Create Your Account</h1>
            <p>Fill in your details below to get started with InternLog</p>
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
                strokeLinecap="round"
                strokeLinejoin="round"
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

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
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
                  id="fullName"
                  type="text"
                  className="form-input has-left-icon"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
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
                  id="email"
                  type="email"
                  className="form-input has-left-icon"
                  placeholder="student@university.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password * (minimum 6 characters)
              </label>
              <div className="input-with-icon">
                <span className="input-icon-left" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input has-left-icon has-right-icon"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="input-action-right"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <div className="input-with-icon">
                <span className="input-icon-left" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input has-left-icon"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '0.4rem' }}
              disabled={submitting}
            >
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
