import axios from 'axios';

// Dynamic API URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Fallback for Vercel deployment
const FALLBACK_API_URL = 'https://pdltn.vercel.app/api';
const FINAL_API_URL = API_BASE_URL || FALLBACK_API_URL;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: FINAL_API_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post('/login', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  async logout() {
    try {
      const response = await apiClient.post('/admin/logout');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error.response?.data || { error: 'Logout failed' };
    }
  },

  async getCurrentUser() {
    try {
      console.log('Making request to getCurrentUser...');
      const response = await apiClient.get('/me');
      console.log('getCurrentUser response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      if (error.code === 'ECONNABORTED') {
        throw { error: 'Request timeout' };
      }
      throw error.response?.data || { error: 'Failed to get user info' };
    }
  }
};
