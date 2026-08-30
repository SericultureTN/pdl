import { safeJsonParse } from '../utils/safeJson.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Government Reeling Unit's own flat 8-office list — see Node/src/govtReelingOffices.js. */
export async function listGovtReelingOffices() {
  const response = await fetch(`${API_BASE}/govt-reeling-offices`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch Government Reeling Unit offices');
  const data = await safeJsonParse(response, 'list govt reeling offices');
  return data?.offices ?? [];
}
