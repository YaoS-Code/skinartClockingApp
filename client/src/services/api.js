import axios from 'axios';
import store from '../store/store';
import { logout } from '../store/authSlice';

// 确保baseURL包含/api前缀
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:13000';
const api = axios.create({
  baseURL: baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dispatch logout action to clear Redux state
      store.dispatch(logout());

      // Only redirect to login if we're not already there
      if (!window.location.pathname.includes('/login')) {
        // Use replace instead of href to avoid adding to browser history
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
