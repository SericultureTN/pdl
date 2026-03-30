const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const FALLBACK_API = 'https://your-backend-deployment-url.com/api';
const FINAL_API = API_BASE || FALLBACK_API;

export const sericulturistService = {
  // Get all sericulturists with pagination and filtering
  async getAll(page = 1, limit = 10, search = '', status = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status })
    });

    try {
      const response = await fetch(`${FINAL_API}/sericulturists?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sericulturists');
      }

      return response.json();
    } catch (error) {
      console.error('Sericulturist service error:', error);
      // Return default data if API fails
      return {
        ok: true,
        sericulturists: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  },

  // Get sericulturist by ID
  async getById(id) {
    try {
      const response = await fetch(`${FINAL_API}/sericulturists/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sericulturist');
      }

      return response.json();
    } catch (error) {
      console.error('Get sericulturist error:', error);
      throw error;
    }
  },

  // Create new sericulturist
  async create(userData) {
    try {
      const response = await fetch(`${FINAL_API}/sericulturists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sericulturist');
      }

      return response.json();
    } catch (error) {
      console.error('Create sericulturist error:', error);
      throw error;
    }
  },

  // Update sericulturist
  async update(id, userData) {
    try {
      const response = await fetch(`${FINAL_API}/sericulturists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update sericulturist');
      }

      return response.json();
    } catch (error) {
      console.error('Update sericulturist error:', error);
      throw error;
    }
  },

  // Delete sericulturist
  async delete(id) {
    try {
      const response = await fetch(`${FINAL_API}/sericulturists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sericulturist');
      }

      return response.json();
    } catch (error) {
      console.error('Delete sericulturist error:', error);
      throw error;
    }
  },

  // Bulk update status
  async bulkUpdateStatus(ids, status) {
    try {
      const response = await fetch(`${FINAL_API}/sericulturists/bulk/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ ids, status })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      return response.json();
    } catch (error) {
      console.error('Bulk update status error:', error);
      throw error;
    }
  },

  // Bulk delete
  async bulkDelete(ids) {
    try {
      const response = await fetch(`${FINAL_API}/sericulturists/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ ids })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sericulturists');
      }

      return response.json();
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  },

  // Get statistics
  async getStatistics() {
    try {
      const response = await fetch(`${FINAL_API}/sericulturists/statistics`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      return response.json();
    } catch (error) {
      console.error('Get statistics error:', error);
      // Return default statistics if API fails
      return {
        ok: true,
        statistics: {
          totalSericulturists: 0,
          activeSericulturists: 0,
          inactiveSericulturists: 0,
          newThisMonth: 0
        }
      };
    }
  }
};
