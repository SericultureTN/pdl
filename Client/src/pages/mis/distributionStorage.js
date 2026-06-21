const STORAGE_KEY = 'pdl-distribution';

export function loadDistributionDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDistributionDraft(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }
}

export function clearDistributionDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function createDefaultDraft() {
  return {
    subordinateOffice: 'Extension',
    region: 'Erode Region',
    adOffice: 'AD Salem',
    financialYear: '2024–25',
    month: 'May',
    dmData: null,
    submitted: false,
  };
}
