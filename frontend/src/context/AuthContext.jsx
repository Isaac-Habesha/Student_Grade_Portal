/**
 * AuthContext — manages login state, user info, and role across the app.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const saveAuthSession = (data) => {
    const { token, user: userData } = data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const loginStudent = async (studentId, firstName) => {
    const response = await api.post('/auth/student/login/', {
      student_id: studentId,
      first_name: firstName,
    });
    return saveAuthSession(response.data);
  };

  const loginInstructor = async (username, password) => {
    const response = await api.post('/auth/instructor/login/', {
      username,
      password,
    });
    return saveAuthSession(response.data);
  };

  // Backwards-compatible general login
  const login = async (payload, maybePassword) => {
    if (typeof payload === 'object') {
      if (payload.student_id) {
        return loginStudent(payload.student_id, payload.first_name);
      }
      return loginInstructor(payload.username, payload.password);
    }
    return loginInstructor(payload, maybePassword);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    loginStudent,
    loginInstructor,
    logout,
    isAuthenticated: !!user,
    isInstructor: user?.role === 'instructor',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
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
