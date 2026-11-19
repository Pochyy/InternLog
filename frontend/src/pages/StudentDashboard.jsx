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
      {/* Top Welcome Banner */}
      <section className="welcome-banner">
        <div>
          <h1>Welcome, {user?.full_name}!</h1>
          <p>
            InternLog Registered OJT Student Dashboard — Track your internship progress, daily time
            records, and smart journals.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn"
            style={{ backgroundColor: '#ffffff', color: '#1B365D' }}
            onClick={() => setShowSetupModal(true)}
          >
            {ojtProfile ? 'Edit OJT Setup' : 'Configure OJT Details'}
          </button>
        </div>
      </section>

      {/* Onboarding Prompt Banner if OJT Profile is not yet configured (Option B) */}
      {!loadingProfile && !ojtProfile && (
        <div
          className="alert alert-warning"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}
        >
          <div>
            <strong>Action Required (SRS FR-1.4):</strong> You have not configured your OJT host
            company and required hours yet. Complete your onboarding setup to activate hours
            forecasting.
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setShowSetupModal(true)}
          >
            Set Up OJT Profile Now
          </button>
        </div>
      )}

      {/* Key OJT Progress Metrics (SRS Section 3.2 FR-2.4 & FR-2.5) */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Required Hours</div>
          <div className="stat-value">
            {ojtProfile ? `${metrics.required_hours} hrs` : 'Not Set'}
          </div>
          <div className="stat-subtext">Target internship duration</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Hours Rendered</div>
          <div className="stat-value">{metrics.rendered_hours} hrs</div>
          <div className="stat-subtext">Cumulative validated hours</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Hours Remaining</div>
          <div className="stat-value">
            {ojtProfile ? `${metrics.remaining_hours} hrs` : '—'}
          </div>
          <div className="stat-subtext">Remaining balance to complete</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Estimated Completion</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>
            {metrics.estimated_completion_date || 'Pending Setup'}
          </div>
          <div className="stat-subtext">Forecasted based on schedule</div>
        </div>
      </section>

      {/* Completion Progress Bar */}
      <section className="progress-section">
        <div className="progress-header">
          <span style={{ color: '#1B365D' }}>Overall OJT Completion Progress</span>
          <span style={{ color: '#2E5B88' }}>{metrics.completion_percentage}% Completed</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, metrics.completion_percentage)}%` }}
          />
        </div>
      </section>

      {/* Main Two-Column Content */}
      <section className="content-grid">
        {/* OJT Placement & Account Profile Card */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>OJT Placement & Student Profile</h2>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setShowSetupModal(true)}
            >
              {ojtProfile ? 'Update' : 'Configure'}
            </button>
          </div>

          <div className="info-list">
            <div className="info-item">
              <span className="info-key">Student Name</span>
              <span className="info-val">{user?.full_name}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Registered Email</span>
              <span className="info-val">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-key">Assigned System Role</span>
              <span className="info-val" style={{ color: '#1B365D' }}>
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
              <span className="info-key">Working Days Schedule</span>
              <span className="info-val">
                {ojtProfile?.working_days
                  ? ojtProfile.working_days
                      .split(',')
                      .map((d) => d.slice(0, 3))
                      .join(', ')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Role-Permitted System Modules Card */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>Student Role Modules & Capabilities</h2>
          </div>

          <div className="module-item">
            <div>
              <div className="module-title">1. User Account & OJT Profile Configuration</div>
              <div className="module-desc">
                Authenticated session management, role verification, and OJT parameter setup (FR-1.1
                to FR-1.5).
              </div>
            </div>
            <span className="badge-active">Active</span>
          </div>

          <div className="module-item">
            <div>
              <div className="module-title">2. Daily Time In / Time Out Logging</div>
              <div className="module-desc">
                Record daily attendance timestamps and compute net rendered hours (FR-2.1 to FR-2.5).
              </div>
            </div>
            <span className="badge-upcoming">Increment 2</span>
          </div>

          <div className="module-item">
            <div>
              <div className="module-title">3. Smart Daily Journal with Gemini AI</div>
              <div className="module-desc">
                Write rough daily notes and transform them into formal entries via Google Gemini AI
                (FR-3.1 to FR-3.5).
              </div>
            </div>
            <span className="badge-upcoming">Increment 2</span>
          </div>

          <div className="module-item" style={{ marginBottom: 0 }}>
            <div>
              <div className="module-title">4. Weekly Report Compilation & PDF Export</div>
              <div className="module-desc">
                Compile weekly logs into printable PDF reports with Brevo email reminders (FR-4.1 to
                FR-5.5).
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
