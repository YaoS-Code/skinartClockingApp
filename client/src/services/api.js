import axios from 'axios';
import store from '../store/store';
import { logout } from '../store/authSlice';

// 动态获取API URL：根据当前访问的地址自动构建
// 在 Docker 容器中，使用相对路径 /api（通过 nginx 反向代理到后端）
// 在本地开发时，使用 localhost:13000
const getApiBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // 本地开发环境：直接访问后端端口
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${window.location.protocol}//${hostname}:13000`;
  }
  
  // 生产环境（Docker 或通过域名访问）：使用相对路径，通过 nginx 反向代理
  // 例如：clock.skinartmd.ca/api -> nginx 代理到 server:13000/api
  return '';  // 空字符串表示使用相对路径
};

const baseURL = getApiBaseURL();
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
