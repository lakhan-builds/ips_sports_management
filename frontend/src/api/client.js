import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sports_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on login attempt failure
      if (!error.config.url.includes('/auth/login/')) {
        localStorage.removeItem('sports_token');
        localStorage.removeItem('sports_refresh');
        localStorage.removeItem('sports_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
