const API_BASE = 'http://localhost:4000/api';

export const sericulturistService = {
  // Get all sericulturists with pagination and filtering
  async getAll(page = 1, limit = 10, search = '', status = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status })
    });

    const response = await fetch(`${API_BASE}/sericulturists?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sericulturists');
    }

    return response.json();
  },

  // Get sericulturist by ID
  async getById(id) {
    const response = await fetch(`${API_BASE}/sericulturists/${id}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sericulturist');
    }

    return response.json();
  },

  // Create new sericulturist
  async create(userData) {
    const response = await fetch(`${API_BASE}/sericulturists`, {
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
  },

  // Update sericulturist
  async update(id, userData) {
    const response = await fetch(`${API_BASE}/sericulturists/${id}`, {
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
  },

  // Delete sericulturist
  async delete(id) {
    const response = await fetch(`${API_BASE}/sericulturists/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete sericulturist');
    }

    return response.json();
  },

  // Bulk update status
  async bulkUpdateStatus(ids, status) {
    const response = await fetch(`${API_BASE}/sericulturists/bulk/status`, {
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
  },

  // Bulk delete
  async bulkDelete(ids) {
    const response = await fetch(`${API_BASE}/sericulturists/bulk`, {
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
  },

  // Get statistics
  async getStatistics() {
    const response = await fetch(`${API_BASE}/sericulturists/statistics`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  }
};
