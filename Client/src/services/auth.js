import axios from 'axios';

// In dev, use Vite proxy (/api → localhost:4000). In production, set VITE_API_URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post('/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  async logout() {
    try {
      const response = await apiClient.post('/admin/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Logout failed' };
    }
  },

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/me');
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw { error: 'Request timeout' };
      }
      throw error.response?.data || { error: 'Failed to get user info' };
    }
  },
};
