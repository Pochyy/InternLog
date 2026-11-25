import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';

export default function ResetPassword() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token') || '';

  const [token, setToken] = useState(queryToken);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifying, setVerifying] = useState(!!queryToken);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    if (!queryToken) {
      setVerifying(false);
      return;
    }

    setToken(queryToken);
    async function checkToken() {
      setVerifying(true);
      setError('');
      try {
        const res = await apiRequest(
          `/auth/verify-reset-token?token=${encodeURIComponent(queryToken)}`,
          { method: 'GET' }
        );
        if (res.success && res.data?.email) {
          setVerifiedEmail(res.data.email);
        }
      } catch (err) {
        setError(err.message || 'Invalid or expired password recovery link.');
      } finally {
        setVerifying(false);
      }
    }

    checkToken();
  }, [queryToken]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Please provide your password recovery token.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: trimmedToken,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      if (res.success) {
        setResetComplete(true);
      }
    } catch (err) {
      setError(err.message || 'Password reset failed. Please request a new recovery link.');
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Password Reset Verification</span>
            </div>

            <h2 className="showcase-title">Create a Strong New Password.</h2>
            <p className="showcase-subtitle">
              Your new password is encrypted using 10-round bcrypt hashing before storage, and your
              single-use recovery token is invalidated immediately upon completion.
            </p>
          </div>

          <ul className="showcase-feature-list">
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Minimum 6 characters required for account credentials</span>
            </li>
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Previous forgotten password immediately deactivated</span>
            </li>
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Recovery token permanently consumed after reset</span>
            </li>
          </ul>
        </aside>

        {/* Right Form Panel */}
        <section className="auth-form-panel">
          <div className="auth-header">
            <h1>Reset Your Password</h1>
            <p>
              {verifiedEmail
                ? `Setting a new password for ${verifiedEmail}`
                : 'Verify your single-use recovery token and enter your new password below.'}
            </p>
          </div>

          {verifying && (
            <div className="alert alert-info" role="status">
              <span>Verifying recovery token...</span>
            </div>
          )}

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

          {resetComplete ? (
            <div>
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
                <span>
                  Your password has been reset! Your recovery token has been consumed and you can
                  now sign in with your new password.
                </span>
              </div>

              <Link to="/login" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                <span>Continue to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {!queryToken && (
                <div className="form-group">
                  <label className="form-label" htmlFor="reset_token">
                    Recovery Token *
                  </label>
                  <input
                    id="reset_token"
                    type="text"
                    className="form-input"
                    placeholder="Paste your 64-character recovery token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="reset_new_password">
                  New Password *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="reset_new_password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-left-icon has-right-icon"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-action-right"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset_confirm_password">
                  Confirm New Password *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <input
                    id="reset_confirm_password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-left-icon"
                    placeholder="Re-enter your new password"
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
                style={{ marginTop: '0.5rem' }}
                disabled={submitting || verifying}
              >
                <span>{submitting ? 'Resetting Password...' : 'Save New Password'}</span>
              </button>
            </form>
          )}

          <div className="auth-footer">
            Need a new token? <Link to="/forgot-password">Request Recovery Link</Link> •{' '}
            <Link to="/login">Sign In</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
