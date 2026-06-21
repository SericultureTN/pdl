const STORAGE_PREFIX = 'pdl-plantation';

function storageKey(schemeId) {
  return `${STORAGE_PREFIX}-${schemeId}`;
}

export function loadPlantationDraft(schemeId) {
  try {
    const raw = localStorage.getItem(storageKey(schemeId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function savePlantationDraft(schemeId, data) {
  try {
    localStorage.setItem(storageKey(schemeId), JSON.stringify(data));
  } catch {
    // Ignore quota / private mode errors
  }
}

export function clearPlantationDraft(schemeId) {
  try {
    localStorage.removeItem(storageKey(schemeId));
  } catch {
    // Ignore
  }
}

export function createDefaultDraft(scheme) {
  return {
    subordinateOffice: 'Extension',
    region: 'Erode Region',
    adOffice: 'AD Salem',
    financialYear: scheme.defaultFinancialYear,
    month: 'May',
    dmData: null,
    submitted: false,
  };
}
