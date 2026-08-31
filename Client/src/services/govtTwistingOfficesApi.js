import { safeJsonParse } from '../utils/safeJson.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Government Twisting Unit's own flat office list — see Node/src/govtTwistingOffices.js. */
export async function listGovtTwistingOffices() {
  const response = await fetch(`${API_BASE}/govt-twisting-offices`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch Government Twisting Unit offices');
  const data = await safeJsonParse(response, 'list govt twisting offices');
  return data?.offices ?? [];
}
