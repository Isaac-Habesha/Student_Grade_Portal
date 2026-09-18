/**
 * Axios API client configured for the Django backend.
 * Handles token auth headers, multipart uploads, and base URL.
 */

import axios from 'axios';

// Support production backend domain or local proxy
const apiBase = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/') ? `${import.meta.env.VITE_API_URL}api` : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
