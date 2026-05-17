import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import API from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(res => {
          const userData = res.data;
          setUser(userData);
          // Ensure role is always up-to-date in localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('role', userData.role || 'member');
          localStorage.setItem('userId', userData.id);
          localStorage.setItem('userName', userData.name);
          localStorage.setItem('userEmail', userData.email);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Heartbeat: update last_seen every 60 seconds while logged in
  useEffect(() => {
    if (!user) return;
    const sendHeartbeat = () => {
      API.patch('/users/heartbeat').catch(() => {});
    };
    sendHeartbeat(); // fire immediately on login
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('role', res.data.user.role);
    localStorage.setItem('userId', res.data.user.id);
    localStorage.setItem('userName', res.data.user.name);
    localStorage.setItem('userEmail', res.data.user.email);
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await authAPI.signup({ name, email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('role', res.data.user.role);
    localStorage.setItem('userId', res.data.user.id);
    localStorage.setItem('userName', res.data.user.name);
    localStorage.setItem('userEmail', res.data.user.email);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
