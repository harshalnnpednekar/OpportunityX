import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('opportunityx_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Initialize and check authenticated user from backend
  const checkAuth = useCallback(async () => {
    try {
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        setSessionExpired(false);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 Unauthorized: token expired or missing
      if (localStorage.getItem('opportunityx_token')) {
        setSessionExpired(true);
      }
      localStorage.removeItem('opportunityx_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    setSessionExpired(false);
    const data = await api.login({ email, password });
    if (data.token) {
      localStorage.setItem('opportunityx_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    setSessionExpired(false);
    const data = await api.register(payload);
    if (data.token) {
      localStorage.setItem('opportunityx_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout notification error:', err.message);
    } finally {
      localStorage.removeItem('opportunityx_token');
      setToken(null);
      setUser(null);
      setSessionExpired(false);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isLoading,
      sessionExpired,
      login,
      register,
      logout,
      refreshUser,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
