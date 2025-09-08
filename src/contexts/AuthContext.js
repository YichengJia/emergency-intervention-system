import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Create context
const AuthContext = createContext();

/**
 * AuthProvider wraps children and provides authentication context including
 * the logged in user and functions for logging in, registering and logging out.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      api.setToken(token);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { user: u, token } = res.data;
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
    api.setToken(token);
    setUser(u);
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { user: u, token } = res.data;
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
    api.setToken(token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);