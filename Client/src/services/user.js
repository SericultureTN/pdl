import { safeJsonParse } from '../utils/safeJson.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
    const data = await safeJsonParse(response, fallbackMessage);
    throw new Error(data?.error || fallbackMessage);
  } catch (error) {
    if (error instanceof Error && error.message !== fallbackMessage) {
      throw error;
    }
    throw new Error(fallbackMessage);
  }
}

export const userService = {
  async getAll(page = 1, limit = 10, search = '', status = '', role = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(role && { role }),
    });

    const response = await fetch(`${API_BASE}/users?${params}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      await parseApiError(response, 'Failed to fetch users');
    }

    const data = await safeJsonParse(response, 'list users');
    return { ...data, pagination: normalizePagination(data?.pagination, page, limit) };
  },

  async getById(id) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      await parseApiError(response, 'Failed to fetch user');
    }
    return safeJsonParse(response, 'get user');
  },

  async create(userData) {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      await parseApiError(response, 'Failed to create user');
    }
    return safeJsonParse(response, 'create user');
  },

  async update(id, userData) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      await parseApiError(response, 'Failed to update user');
    }
    return safeJsonParse(response, 'update user');
  },

  async delete(id) {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      await parseApiError(response, 'Failed to delete user');
    }
    return safeJsonParse(response, 'delete user');
  },

  async bulkUpdateStatus(ids, status) {
    const response = await fetch(`${API_BASE}/users/bulk/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids, status }),
    });
    if (!response.ok) {
      await parseApiError(response, 'Failed to update status');
    }
    return safeJsonParse(response, 'bulk update status');
  },

  async bulkDelete(ids) {
    const response = await fetch(`${API_BASE}/users/bulk`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      await parseApiError(response, 'Failed to delete users');
    }
    return safeJsonParse(response, 'bulk delete users');
  },

  async getStatistics() {
    const response = await fetch(`${API_BASE}/users/statistics`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      await parseApiError(response, 'Failed to fetch statistics');
    }
    return safeJsonParse(response, 'get user statistics');
  },
};
