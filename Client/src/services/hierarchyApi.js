import { safeJsonParse } from '../utils/safeJson.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

/** All sections (MIS, PLS, PRC, POC), each with its group/office labels. */
export async function listSections() {
  const response = await fetch(`${API_BASE}/sections`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch sections');
  const data = await safeJsonParse(response, 'list sections');
  return data?.sections ?? [];
}

/** Groups belonging to one section. */
export async function listGroups(sectionId) {
  if (!sectionId) return [];
  const params = new URLSearchParams({ section_id: String(sectionId) });
  const response = await fetch(`${API_BASE}/groups?${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch groups');
  const data = await safeJsonParse(response, 'list groups');
  return data?.groups ?? [];
}

/** Offices belonging to one group. */
export async function listOffices(groupId) {
  if (!groupId) return [];
  const params = new URLSearchParams({ group_id: String(groupId) });
  const response = await fetch(`${API_BASE}/offices?${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch offices');
  const data = await safeJsonParse(response, 'list offices');
  return data?.offices ?? [];
}
