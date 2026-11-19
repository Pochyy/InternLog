import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="brand">
          <div className="brand-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span>InternLog</span>
          <span className="brand-badge">OJT Portal</span>
        </Link>

        {isAuthenticated && user ? (
          <div className="nav-user">
            <div className="user-profile-pill">
              <div className="user-avatar" aria-hidden="true">
                {getInitials(user.full_name)}
              </div>
              <div className="user-meta">
                <span className="user-name">{user.full_name}</span>
                <span className="role-pill">
                  {user.role === 'student' ? 'OJT Student' : user.role}
                </span>
              </div>
            </div>

            <button onClick={handleLogout} className="btn btn-outline-nav" type="button">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="nav-user">
            <Link to="/login" className="btn btn-ghost" style={{ minHeight: '40px', padding: '0.45rem 1rem' }}>
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn btn-secondary"
              style={{ minHeight: '40px', padding: '0.45rem 1rem', fontSize: '0.86rem' }}
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
