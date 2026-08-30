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

/**
 * Current target for one unit, or null if none has been set yet.
 * government_reeling (office-keyed): pass officeId + fiscalYear.
 * government_twisting / private_reeling (unit-code-keyed): pass unitCode + fiscalYear.
 */
export async function getCurrentTarget({ unitType, unitCode, fiscalYear, officeId }) {
  const params = new URLSearchParams({ unitType, fiscalYear });
  if (unitCode) params.set('unitCode', unitCode);
  if (officeId) params.set('officeId', String(officeId));
  const response = await fetch(`${API_BASE}/targets?${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch target');
  const data = await safeJsonParse(response, 'get current target');
  return data?.target ?? null;
}

/** All current targets for a report type + fiscal year (Set Target status table). */
export async function listTargets({ unitType, fiscalYear }) {
  const params = new URLSearchParams({ unitType, fiscalYear });
  const response = await fetch(`${API_BASE}/targets?${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch targets');
  const data = await safeJsonParse(response, 'list targets');
  return data?.targets ?? [];
}

/** Creates a target. Fails with a 409-derived error if one already exists — use reviseTarget instead. */
export async function saveTarget({ unitType, unitCode, fiscalYear, officeId, physicalTarget, budgetOutlay }) {
  const response = await fetch(`${API_BASE}/targets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ unitType, unitCode, fiscalYear, officeId, physicalTarget, budgetOutlay }),
  });
  if (!response.ok) await parseApiError(response, 'Failed to save target');
  const data = await safeJsonParse(response, 'save target');
  return data?.target;
}

export async function reviseTarget(id, { physicalTarget, budgetOutlay, reason }) {
  const response = await fetch(`${API_BASE}/targets/${id}/revise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ physicalTarget, budgetOutlay, reason }),
  });
  if (!response.ok) await parseApiError(response, 'Failed to revise target');
  const data = await safeJsonParse(response, 'revise target');
  return data?.target;
}
