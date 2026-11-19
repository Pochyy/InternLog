import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Enforces Role-Based Access Control (RBAC) and authentication protection on frontend routes.
 */
export default function ProtectedRoute({ children, allowedRoles = ['student'] }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#DC2626', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p>Your account role ({user.role}) is not authorized to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
