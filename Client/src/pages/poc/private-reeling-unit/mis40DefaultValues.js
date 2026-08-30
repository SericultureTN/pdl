import { createEmptyRow } from './mis40Calculations.js';
import { EDITABLE_CATEGORY_IDS, MIS40_FORM_CODE } from './mis40Constants.js';

export function createMis40DefaultValues() {
  return {
    header: {
      regionId: '',
      marketOfficeId: '',
      pdlNo: MIS40_FORM_CODE,
      month: '',
      year: '',
    },
    categories: Object.fromEntries(EDITABLE_CATEGORY_IDS.map((id) => [id, { rows: [] }])),
    signOff: { extensionOfficer: '', signedAt: null },
    meta: {
      status: 'draft',
      locked: false,
      submittedAt: null,
      submittedBy: null,
      savedTabs: [],
      ulmCarriedFrom: null,
      ulmCarriedAt: null,
    },
  };
}

export const MIS40_STORAGE_KEY = 'pdl-mis40-private-reeling-unit';

function mergeRow(row) {
  const empty = createEmptyRow();
  return { ...empty, ...row, id: row?.id || empty.id };
}

export function mergeMis40StoredReport(parsed) {
  const defaults = createMis40DefaultValues();
  return {
    ...defaults,
    ...parsed,
    header: { ...defaults.header, ...(parsed?.header || {}) },
    categories: Object.fromEntries(
      EDITABLE_CATEGORY_IDS.map((id) => [
        id,
        { rows: Array.isArray(parsed?.categories?.[id]?.rows) ? parsed.categories[id].rows.map(mergeRow) : [] },
      ])
    ),
    signOff: { ...defaults.signOff, ...(parsed?.signOff || {}) },
    meta: { ...defaults.meta, ...(parsed?.meta || {}) },
  };
}

export function loadMis40Draft() {
  const defaults = createMis40DefaultValues();
  try {
    const raw = localStorage.getItem(MIS40_STORAGE_KEY);
    if (!raw) return defaults;
    return mergeMis40StoredReport(JSON.parse(raw));
  } catch {
    localStorage.removeItem(MIS40_STORAGE_KEY);
    return defaults;
  }
}

export function saveMis40Draft(report) {
  try {
    localStorage.setItem(MIS40_STORAGE_KEY, JSON.stringify(report));
  } catch {
    /* localStorage unavailable — draft simply won't persist across reloads */
  }
}
