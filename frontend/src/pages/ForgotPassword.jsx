import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recoveryData, setRecoveryData] = useState(null);
  const [copied, setCopied] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecoveryData(null);
    setCopied(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail })
      });

      if (res.success && res.data?.dev_reset) {
        setRecoveryData({
          email: res.data.email,
          ...res.data.dev_reset
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to process password recovery request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = async () => {
    if (!recoveryData?.reset_token) return;
    try {
      await navigator.clipboard.writeText(recoveryData.reset_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Secure Account Recovery</span>
            </div>

            <h2 className="showcase-title">Recover Access to Your OJT Workspace.</h2>
            <p className="showcase-subtitle">
              Forgot your password? Verify your registered student email to receive a single-use,
              time-limited recovery token and set a new password securely.
            </p>

            <div className="showcase-bento-preview" aria-hidden="true">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#CCFBF1'
                }}
              >
                <span>SECURITY PROTOCOL</span>
                <span style={{ color: '#FDBA74' }}>SHA-256 + Bcrypt</span>
              </div>
              <div className="preview-metrics-row">
                <div className="preview-metric-box">
                  <div className="preview-metric-val">15m</div>
                  <div className="preview-metric-lbl">Token Expiry</div>
                </div>
                <div className="preview-metric-box">
                  <div className="preview-metric-val">1x</div>
                  <div className="preview-metric-lbl">Single-Use</div>
                </div>
                <div className="preview-metric-box">
                  <div className="preview-metric-val">256b</div>
                  <div className="preview-metric-lbl">Token Entropy</div>
                </div>
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
              <span>Cryptographic 256-bit recovery tokens hashed at rest</span>
            </li>
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Automatic 15-minute expiration & single-use consumption</span>
            </li>
            <li className="showcase-feature-item">
              <span className="feature-check-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>10-round bcrypt hashing before password storage</span>
            </li>
          </ul>
        </aside>

        {/* Right Form Panel */}
        <section className="auth-form-panel">
          <div className="auth-header">
            <h1>Forgot Password?</h1>
            <p>Enter your registered student email to generate a secure password reset link.</p>
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

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="recovery_email">
                Registered Email Address
              </label>
              <div className="input-with-icon">
                <span className="input-icon-left" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="recovery_email"
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

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <span>
                {submitting ? 'Generating Recovery Token...' : 'Send Password Recovery Link'}
              </span>
            </button>
          </form>

          {/* Developer Recovery Notification Banner */}
          {recoveryData && (
            <div
              role="region"
              aria-label="Developer Password Recovery Notification"
              style={{
                marginTop: '1.35rem',
                padding: '1.15rem 1.25rem',
                borderRadius: '16px',
                background: 'linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 100%)',
                border: '1.5px solid #0D9488',
                boxShadow: '0 8px 20px -4px rgba(13, 148, 136, 0.14)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.55rem'
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#0F766E'
                  }}
                >
                  Developer Recovery Notification
                </span>
                <span
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: '#FFEDD5',
                    color: '#9A3412',
                    border: '1px solid #FDBA74'
                  }}
                >
                  Valid {recoveryData.expires_in_minutes} mins • Single-Use
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.75rem' }}>
                Identity verified for <strong>{recoveryData.email}</strong>. Use the direct reset
                link or copy your single-use token below:
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.55rem 0.75rem',
                  marginBottom: '0.9rem'
                }}
              >
                <code
                  style={{
                    fontSize: '0.78rem',
                    color: '#0F172A',
                    wordBreak: 'break-all',
                    flex: 1,
                    fontFamily: 'Consolas, monospace'
                  }}
                >
                  {recoveryData.reset_token}
                </code>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="btn btn-ghost"
                  style={{ minHeight: '32px', padding: '0.25rem 0.65rem', fontSize: '0.76rem' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <Link
                to={recoveryData.reset_path}
                className="btn btn-accent"
                style={{ width: '100%', minHeight: '42px', fontSize: '0.88rem' }}
              >
                <span>Open Reset Password Form</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          )}

          <div className="auth-footer">
            Remembered your password? <Link to="/login">Back to Sign In</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
