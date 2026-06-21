const STORAGE_PREFIX = 'pdl-dfls';

function storageKey(pageKey) {
  return `${STORAGE_PREFIX}-${pageKey}`;
}

export function loadDflsDraft(pageKey) {
  try {
    const raw = localStorage.getItem(storageKey(pageKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDflsDraft(pageKey, data) {
  try {
    localStorage.setItem(storageKey(pageKey), JSON.stringify(data));
  } catch {
    // Ignore quota / private mode errors
  }
}

export function clearDflsDraft(pageKey) {
  try {
    localStorage.removeItem(storageKey(pageKey));
  } catch {
    // Ignore
  }
}

/** @deprecated Use loadDflsDraft('distribution') */
export function loadDflsDistributionDraft() {
  return loadDflsDraft('distribution');
}

/** @deprecated Use saveDflsDraft('distribution', data) */
export function saveDflsDistributionDraft(data) {
  return saveDflsDraft('distribution', data);
}
