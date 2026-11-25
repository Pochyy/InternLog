import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ojtProfile, setOjtProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('internlog_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiRequest('/auth/me', { method: 'GET' });
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          setOjtProfile(res.data.ojt_profile || null);
        } else {
          localStorage.removeItem('internlog_token');
          setUser(null);
        }
      } catch (err) {
        localStorage.removeItem('internlog_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const register = async (fullName, email, password, confirmPassword) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword
      })
    });

    if (res.success && res.data?.token) {
      localStorage.setItem('internlog_token', res.data.token);
      setUser(res.data.user);
      setOjtProfile(res.data.ojt_profile || null);
    }

    return res;
  };

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success && res.data?.token) {
      localStorage.setItem('internlog_token', res.data.token);
      setUser(res.data.user);
      setOjtProfile(res.data.ojt_profile || null);
    }

    return res;
  };

  const updateUserProfile = async (profilePayload) => {
    const res = await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profilePayload)
    });

    if (res.success && res.data?.user) {
      setUser(res.data.user);
    }

    return res;
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    const res = await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });

    if (res.success && res.data?.token) {
      localStorage.setItem('internlog_token', res.data.token);
    }

    return res;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Proceed with client-side session cleanup even if network call fails
    } finally {
      localStorage.removeItem('internlog_token');
      setUser(null);
      setOjtProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        ojtProfile,
        setOjtProfile,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        updateUserProfile,
        changePassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
