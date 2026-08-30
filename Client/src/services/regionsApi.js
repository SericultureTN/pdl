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

/** All 5 regions. */
export async function listRegions() {
  const response = await fetch(`${API_BASE}/regions`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch regions');
  const data = await safeJsonParse(response, 'list regions');
  return data?.regions ?? [];
}

/** Market offices belonging to one region. */
export async function listMarketOffices(regionId) {
  if (!regionId) return [];
  const params = new URLSearchParams({ region_id: String(regionId) });
  const response = await fetch(`${API_BASE}/market-offices?${params}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) await parseApiError(response, 'Failed to fetch market offices');
  const data = await safeJsonParse(response, 'list market offices');
  return data?.marketOffices ?? [];
}

/** Every market office across every region, flattened — for display/lookup (e.g. status tables). */
export async function listAllMarketOffices() {
  const regions = await listRegions();
  const offices = await Promise.all(regions.map((r) => listMarketOffices(r.id)));
  return offices.flat();
}
