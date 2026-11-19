import React, { useState } from 'react';
import { apiRequest } from '../api';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OjtSetupModal({ existingProfile, onClose, onSaved }) {
  const [companyName, setCompanyName] = useState(existingProfile?.company_name || '');
  const [requiredHours, setRequiredHours] = useState(existingProfile?.required_hours || 486);
  const [startDate, setStartDate] = useState(
    existingProfile?.start_date || new Date().toISOString().split('T')[0]
  );
  const [selectedDays, setSelectedDays] = useState(
    existingProfile?.working_days
      ? existingProfile.working_days.split(',').map((d) => d.trim())
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  );

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('Please enter your Host Company Name.');
      return;
    }

    if (!requiredHours || Number(requiredHours) <= 0) {
      setError('Total Required Hours must be greater than 0.');
      return;
    }

    if (!startDate) {
      setError('Please select your Official Start Date.');
      return;
    }

    if (selectedDays.length === 0) {
      setError('Please select at least one Working Day.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          company_name: companyName.trim(),
          required_hours: Number(requiredHours),
          start_date: startDate,
          working_days: selectedDays.join(',')
        })
      });

      if (res.success) {
        onSaved(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to save OJT profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ojt-modal-title">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 id="ojt-modal-title" style={{ color: '#134E4A', fontWeight: 800, marginBottom: '0.3rem' }}>
              {existingProfile ? 'Update OJT Placement Setup' : 'Configure Your OJT Placement'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.25rem' }}>
              Define your host company and required training parameters (SRS FR-1.4 & FR-1.5).
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="company_name">
              Host Company / Organization Name *
            </label>
            <input
              id="company_name"
              type="text"
              className="form-input"
              placeholder="e.g., Accenture Philippines / Tech Solutions Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="required_hours">
              Total Required OJT Hours *
            </label>
            <input
              id="required_hours"
              type="number"
              min="1"
              max="2000"
              step="0.5"
              className="form-input"
              placeholder="e.g., 486"
              value={requiredHours}
              onChange={(e) => setRequiredHours(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="start_date">
              Official OJT Start Date *
            </label>
            <input
              id="start_date"
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Designated Weekly Working Days *</label>
            <div className="days-selector">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`day-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleDay(day)}
                    aria-pressed={isSelected}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-actions">
            {onClose && (
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-secondary" disabled={saving}>
              {saving ? 'Saving Configuration...' : 'Save OJT Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
