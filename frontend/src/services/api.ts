import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cybercare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto redirect on login page errors
      if (!window.location.pathname.includes('/signin') && !window.location.pathname.includes('/verify-otp')) {
        localStorage.removeItem('cybercare_token');
        localStorage.removeItem('cybercare_user');
      }
    }
    return Promise.reject(error);
  }
);
