import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sports_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sports_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const userData = await authApi.me();
          setUser(userData);
          localStorage.setItem('sports_user', JSON.stringify(userData));
        } catch (err) {
          console.error("Session expired or invalid token:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    setToken(data.access);
    setUser(data.user);
    localStorage.setItem('sports_token', data.access);
    localStorage.setItem('sports_refresh', data.refresh);
    localStorage.setItem('sports_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sports_token');
    localStorage.removeItem('sports_refresh');
    localStorage.removeItem('sports_user');
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAdmin: user?.role === 'ADMIN',
    isSportsCoordinator: user?.role === 'SPORTS_COORDINATOR',
    isBranchCoordinator: user?.role === 'BRANCH_COORDINATOR',
    isStudentCoordinator: user?.role === 'STUDENT_COORDINATOR',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
