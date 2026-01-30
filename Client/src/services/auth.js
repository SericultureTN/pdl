import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

export const authService = {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
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
      const response = await axios.post(`${API_BASE_URL}/admin/logout`, {}, {
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
      const response = await axios.get(`${API_BASE_URL}/me`, {
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
