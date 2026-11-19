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

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="brand">
          <span>InternLog</span>
          <span className="brand-badge">OJT Tracker</span>
        </Link>

        {isAuthenticated && user ? (
          <div className="nav-user">
            <div className="user-meta">
              <span className="user-name">{user.full_name}</span>
              <span className="role-pill">
                Role: {user.role === 'student' ? 'Registered OJT Student' : user.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline" type="button">
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-user">
            <Link to="/login" className="btn btn-outline" style={{ textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn btn-secondary"
              style={{ textDecoration: 'none', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
