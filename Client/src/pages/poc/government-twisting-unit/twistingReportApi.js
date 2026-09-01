import { safeJsonParse } from '../../../utils/safeJson.js';

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

/** report + achievement + units + abstract, all server-computed — see /api/twisting-reports/:id/full in Node/src/index.js. */
export async function getFullTwistingReport(reportId) {
  const response = await fetch(`${API_BASE}/twisting-reports/${reportId}/full`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch twisting report');
  return safeJsonParse(response, 'get full twisting report');
}

/** Achieved D.M is the only writable field — Target row is always server-derived from the Target page. */
export async function saveTwistingAchievement(reportId, achievedDm) {
  const response = await fetch(`${API_BASE}/twisting-reports/${reportId}/achievement`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ achievedDm }),
  });
  if (!response.ok) await parseApiError(response, 'Failed to save achievement');
  return safeJsonParse(response, 'save twisting achievement');
}

export async function createTwistingUnit(reportId, fields) {
  const response = await fetch(`${API_BASE}/twisting-reports/${reportId}/units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(fields),
  });
  if (!response.ok) await parseApiError(response, 'Failed to add twisting unit');
  const data = await safeJsonParse(response, 'create twisting unit');
  return data?.unit;
}

export async function updateTwistingUnit(reportId, unitId, fields) {
  const response = await fetch(`${API_BASE}/twisting-reports/${reportId}/units/${unitId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(fields),
  });
  if (!response.ok) await parseApiError(response, 'Failed to update twisting unit');
  const data = await safeJsonParse(response, 'update twisting unit');
  return data?.unit;
}

export async function deleteTwistingUnit(reportId, unitId) {
  const response = await fetch(`${API_BASE}/twisting-reports/${reportId}/units/${unitId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok && response.status !== 204) await parseApiError(response, 'Failed to delete twisting unit');
}

/** Locks the report and rolls Achievement to Target + every unit's U.M into next month's U.L.M, in one DB transaction. */
export async function submitTwistingReport(reportId) {
  const response = await fetch(`${API_BASE}/twisting-reports/${reportId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) await parseApiError(response, 'Failed to submit twisting report');
  return safeJsonParse(response, 'submit twisting report');
}
