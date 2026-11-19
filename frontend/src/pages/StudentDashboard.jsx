import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import OjtSetupModal from '../components/OjtSetupModal';

export default function StudentDashboard() {
  const { user, ojtProfile, setOjtProfile } = useAuth();
  const [metrics, setMetrics] = useState({
    required_hours: 0,
    rendered_hours: 0,
    remaining_hours: 0,
    completion_percentage: 0,
    estimated_completion_date: null
  });
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiRequest('/profile', { method: 'GET' });
        if (res.success && res.data) {
          setOjtProfile(res.data.ojt_profile);
          setMetrics(res.data.metrics);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [setOjtProfile]);

  const handleProfileSaved = (data) => {
    setOjtProfile(data.ojt_profile);
    setMetrics(data.metrics);
    setShowSetupModal(false);
  };

  return (
    <main className="dashboard-container">
      {/* Onboarding Action Alert if OJT Profile is not yet configured (Option B) */}
      {!loadingProfile && !ojtProfile && (
        <div
          className="alert alert-warning"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Complete Your OJT Onboarding (SRS FR-1.4):</strong> Configure your Host
              Company Name, Total Required Hours, Start Date, and Working Days to activate progress
              forecasting.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-accent"
            style={{ minHeight: '40px', padding: '0.5rem 1.1rem', fontSize: '0.86rem' }}
            onClick={() => setShowSetupModal(true)}
          >
            Configure OJT Profile Now
          </button>
        </div>
      )}

      {/* Bento Grid Layout */}
      <section className="bento-grid">
        {/* Bento Tile 1 (Span 8): Hero Welcome & Progress Bar */}
        <div className="bento-card bento-hero bento-span-8">
          <div className="bento-hero-top">
            <div>
              <div className="hero-tag">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Role: Registered OJT Student</span>
              </div>
              <h1>Welcome back, {user?.full_name}!</h1>
              <p>
                {ojtProfile
                  ? `Currently placed at ${ojtProfile.company_name}. Keep logging your daily attendance and activities to stay on track.`
                  : 'Your OJT Student account is active. Set up your host company placement parameters to start tracking your hours.'}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-accent"
              onClick={() => setShowSetupModal(true)}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{ojtProfile ? 'Edit OJT Setup' : 'Configure OJT Details'}</span>
            </button>
          </div>

          <div className="hero-progress-box">
            <div className="hero-progress-header">
              <span>Cumulative OJT Hours Completion (SRS FR-2.4)</span>
              <span style={{ color: '#FDBA74', fontSize: '0.95rem' }}>
                {metrics.completion_percentage}% Completed
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, metrics.completion_percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bento Tile 2 (Span 4): Estimated Completion Spotlight */}
        <div className="bento-card bento-spotlight bento-span-4">
          <div>
            <div className="kpi-header">
              <span className="stat-label">Completion Forecast (FR-2.5)</span>
              <div className="kpi-icon-box kpi-icon-amber" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
            <div className="stat-value" style={{ fontSize: '1.65rem', marginTop: '0.35rem' }}>
              {metrics.estimated_completion_date || 'Pending Setup'}
            </div>
            <div className="stat-subtext">
              Projected end date based on 8 hrs/day across your active working days.
            </div>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.84rem'
            }}
          >
            <span style={{ color: '#475569', fontWeight: 600 }}>Host Company</span>
            <span style={{ color: '#134E4A', fontWeight: 800 }}>
              {ojtProfile?.company_name || 'Unconfigured'}
            </span>
          </div>
        </div>

        {/* Bento Tile 3 (Span 3): Total Required Hours */}
        <div className="bento-card bento-span-3">
          <div className="kpi-header">
            <span className="stat-label">Required Hours</span>
            <div className="kpi-icon-box kpi-icon-teal" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-value">
            {ojtProfile ? `${metrics.required_hours}h` : 'Not Set'}
          </div>
          <div className="stat-subtext">Mandated OJT target duration</div>
        </div>

        {/* Bento Tile 4 (Span 3): Hours Rendered */}
        <div className="bento-card bento-span-3">
          <div className="kpi-header">
            <span className="stat-label">Hours Rendered</span>
            <div className="kpi-icon-box kpi-icon-emerald" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{metrics.rendered_hours}h</div>
          <div className="stat-subtext">Validated cumulative hours</div>
        </div>

        {/* Bento Tile 5 (Span 3): Hours Remaining */}
        <div className="bento-card bento-span-3">
          <div className="kpi-header">
            <span className="stat-label">Hours Remaining</span>
            <div className="kpi-icon-box kpi-icon-amber" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 22h14" />
                <path d="M5 2h14" />
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
              </svg>
            </div>
          </div>
          <div className="stat-value">
            {ojtProfile ? `${metrics.remaining_hours}h` : '—'}
          </div>
          <div className="stat-subtext">Remaining balance to finish</div>
        </div>

        {/* Bento Tile 6 (Span 3): Weekly Schedule */}
        <div className="bento-card bento-span-3">
          <div className="kpi-header">
            <span className="stat-label">Active Days / Wk</span>
            <div className="kpi-icon-box kpi-icon-slate" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
          </div>
          <div className="stat-value">
            {ojtProfile?.working_days
              ? `${ojtProfile.working_days.split(',').length} Days`
              : '—'}
          </div>
          <div className="stat-subtext">
            {ojtProfile?.working_days
              ? ojtProfile.working_days
                  .split(',')
                  .map((d) => d.trim().slice(0, 3))
                  .join(', ')
              : 'Configure working days'}
          </div>
        </div>

        {/* Bento Tile 7 (Span 6): OJT Placement & Student Profile Card */}
        <div className="bento-card bento-span-6">
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h2>OJT Placement & Student Account</h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ minHeight: '36px', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setShowSetupModal(true)}
            >
              {ojtProfile ? 'Update Parameters' : 'Configure'}
            </button>
          </div>

          <div className="info-list">
            <div className="info-item">
              <span className="info-key">Student Full Name</span>
              <span className="info-val">{user?.full_name}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Registered Email</span>
              <span className="info-val">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Assigned System Role</span>
              <span className="info-val" style={{ color: '#0F766E' }}>
                Registered OJT Student ({user?.role})
              </span>
            </div>
            <div className="info-item">
              <span className="info-key">Host Company Name</span>
              <span className="info-val">
                {ojtProfile?.company_name || 'Not configured yet'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-key">Official Start Date</span>
              <span className="info-val">{ojtProfile?.start_date || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Designated Working Days</span>
              <span className="info-val">
                {ojtProfile?.working_days
                  ? ojtProfile.working_days
                      .split(',')
                      .map((d) => d.trim().slice(0, 3))
                      .join(', ')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Bento Tile 8 (Span 6): Role-Permitted System Modules Card */}
        <div className="bento-card bento-span-6">
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
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <h2>Student Role Modules & Architecture</h2>
            </div>
          </div>

          <div className="module-item">
            <div>
              <div className="module-title">1. User Account & OJT Profile Configuration</div>
              <div className="module-desc">
                Bcrypt credential security, JWT session revocation, RBAC guard, and OJT placement
                onboarding (SRS FR-1.1 to FR-1.5).
              </div>
            </div>
            <span className="badge-active">Active • Inc 1</span>
          </div>

          <div className="module-item">
            <div>
              <div className="module-title">2. Daily Time In / Time Out Logging</div>
              <div className="module-desc">
                Record daily attendance timestamps with automatic net rendered hours computation
                (SRS FR-2.1 to FR-2.5).
              </div>
            </div>
            <span className="badge-upcoming">Increment 2</span>
          </div>

          <div className="module-item">
            <div>
              <div className="module-title">3. Smart Daily Journal with Gemini AI</div>
              <div className="module-desc">
                Transform informal daily notes into polished journal reflections via Google Gemini
                API (SRS FR-3.1 to FR-3.5).
              </div>
            </div>
            <span className="badge-upcoming">Increment 2</span>
          </div>

          <div className="module-item" style={{ marginBottom: 0 }}>
            <div>
              <div className="module-title">4. Weekly Report Compilation & PDF Export</div>
              <div className="module-desc">
                Compile weekly logs into printable PDF reports with automated Brevo email reminders
                (SRS FR-4.1 to FR-5.5).
              </div>
            </div>
            <span className="badge-upcoming">Increment 3</span>
          </div>
        </div>
      </section>

      {showSetupModal && (
        <OjtSetupModal
          existingProfile={ojtProfile}
          onClose={() => setShowSetupModal(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </main>
  );
}
