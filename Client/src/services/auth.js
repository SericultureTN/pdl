import axios from 'axios';

// Dynamic API URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pdltn.vercel.app/api';

// Fallback for Vercel deployment
const FALLBACK_API_URL = 'https://your-backend-url.com/api';
const FINAL_API_URL = API_BASE_URL || FALLBACK_API_URL;

export const authService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${FINAL_API_URL}/login`, {
        email,
        password
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  async logout() {
    try {
      const response = await axios.post(`${FINAL_API_URL}/admin/logout`, {}, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Logout failed' };
    }
  },

  async getCurrentUser() {
    try {
      console.log('Making request to getCurrentUser...');
      const response = await axios.get(`${FINAL_API_URL}/me`, {
        withCredentials: true,
        timeout: 5000 // 5 second timeout
      });
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
