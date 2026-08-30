import { safeJsonParse } from '../../../utils/safeJson.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const UNIT_TYPE = 'private_reeling';

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

/** Current report for one office + month, or null if none has been created yet. */
export async function getCurrentReport({ officeId, fiscalYear, month }) {
  const params = new URLSearchParams({ unitType: UNIT_TYPE, fiscalYear });
  if (officeId) params.set('officeId', String(officeId));
  if (month) params.set('month', month);
  const response = await fetch(`${API_BASE}/reports/current?${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch report');
  const data = await safeJsonParse(response, 'get current report');
  return data?.report ?? null;
}

/**
 * List reports for a fiscal year. officeId is forced server-side to the
 * caller's own office for role 'user'; admin/secondary_admin may omit it
 * (all offices) or pass sectionId/groupId to scope the list.
 */
export async function listReports({ officeId, fiscalYear, sectionId, groupId } = {}) {
  const params = new URLSearchParams({ unitType: UNIT_TYPE, fiscalYear });
  if (officeId) params.set('officeId', String(officeId));
  if (sectionId) params.set('sectionId', String(sectionId));
  if (groupId) params.set('groupId', String(groupId));
  const response = await fetch(`${API_BASE}/reports?${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch reports');
  const data = await safeJsonParse(response, 'list reports');
  return data?.reports ?? [];
}

/** Upsert (create-or-update) a draft report by its natural key (office/month/year). */
export async function saveReportDraft({ officeId, fiscalYear, month, data }) {
  const response = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ unitType: UNIT_TYPE, officeId, fiscalYear, month, data }),
  });
  if (!response.ok) await parseApiError(response, 'Failed to save report');
  const result = await safeJsonParse(response, 'save report draft');
  return result?.report;
}

/** Locks the report server-side. Call after saveReportDraft has persisted the final data. */
export async function submitReport(id) {
  const response = await fetch(`${API_BASE}/reports/${id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) await parseApiError(response, 'Failed to submit report');
  const result = await safeJsonParse(response, 'submit report');
  return result?.report;
}
