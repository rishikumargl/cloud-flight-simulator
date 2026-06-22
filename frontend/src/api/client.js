import axios from 'axios';
import keycloak from '../config/keycloak';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  withCredentials: true
});

// Request interceptor: add Authorization header with Keycloak token
api.interceptors.request.use((config) => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

// Response interceptor: handle 401 errors (optional for Phase 1)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid or expired
      // In Phase 1, just reject; Phase 2 will add auto-refresh
      keycloak.logout();
    }
    return Promise.reject(error);
  }
);

export default api;
