import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const EMAIL_KEY = 'auth_email';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY));
  const [loading, setLoading] = useState(true);

  const setToken = (newToken, newEmail) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      axios.defaults.headers.common['Authorization'] = `Token ${newToken}`;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      delete axios.defaults.headers.common['Authorization'];
    }
    setTokenState(newToken);
    if (newEmail !== undefined) {
      if (newEmail) localStorage.setItem(EMAIL_KEY, newEmail);
      else localStorage.removeItem(EMAIL_KEY);
      setEmail(newEmail);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      axios.defaults.headers.common['Authorization'] = `Token ${stored}`;
    }
    setLoading(false);
  }, []);

  const login = async (emailValue, password) => {
    const { data } = await axios.post('/api/auth/login/', { email: emailValue, password });
    if (data.requires_mfa) {
      return data;
    }
    setToken(data.token, data.email);
    return data;
  };

  const verifyMfa = async (tempToken, code) => {
    const { data } = await axios.post('/api/auth/verify-mfa/', { temp_token: tempToken, code });
    setToken(data.token, data.email);
    return data;
  };

  const register = async (emailValue, password, passwordConfirm, options = {}) => {
    const { data } = await axios.post('/api/auth/register/', {
      email: emailValue,
      password,
      password_confirm: passwordConfirm,
    });
    if (!options.skipLogin) {
      setToken(data.token, data.email);
    }
    return data;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout/');
    } catch (e) {
      // ignore
    }
    setToken(null, null);
  };

  const deleteAccount = async () => {
    await axios.post('/api/auth/delete-account/');
    setToken(null, null);
  };

  const value = {
    token,
    email,
    isAuthenticated: !!token,
    loading,
    login,
    verifyMfa,
    register,
    logout,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
