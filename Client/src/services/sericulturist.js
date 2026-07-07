// Local API URL only
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FINAL_API = API_BASE;

function normalizePagination(pagination = {}, page = 1, limit = 10) {
  const totalItems = pagination.totalItems ?? pagination.total ?? 0;
  const totalPages =
    pagination.totalPages ??
    (pagination.total && pagination.total !== totalItems ? pagination.total : Math.max(1, Math.ceil(totalItems / limit)));

  return {
    current: pagination.current ?? pagination.page ?? page,
    total: totalPages,
    limit: pagination.limit ?? limit,
    totalItems
  };
}

async function parseApiError(response, fallbackMessage) {
  try {
    const data = await response.json();
    throw new Error(data.error || fallbackMessage);
  } catch (error) {
    if (error instanceof Error && error.message !== fallbackMessage) {
      throw error;
    }
    throw new Error(fallbackMessage);
  }
}

export const sericulturistService = {
  // Get all sericulturists with pagination and filtering
  async getAll(page = 1, limit = 10, search = '', status = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status })
    });

    const response = await fetch(`${FINAL_API}/sericulturists?${params}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      await parseApiError(response, 'Failed to fetch sericulturists');
    }

    const data = await response.json();
    return {
      ...data,
      pagination: normalizePagination(data.pagination, page, limit)
    };
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
    const response = await fetch(`${FINAL_API}/sericulturists/statistics`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      await parseApiError(response, 'Failed to fetch statistics');
    }

    return response.json();
  }
};
