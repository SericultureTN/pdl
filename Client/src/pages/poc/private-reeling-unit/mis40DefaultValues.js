import { MIS40_FORM_CODE } from './mis40Constants.js';
import { createEmptyRow, createRowId } from './mis40Calculations.js';

export const MIS40_STORAGE_KEY = 'pdl-mis40-private-reeling-unit';

function createCategoryState(withRow = false) {
  return { rows: withRow ? [createEmptyRow()] : [] };
}

export function createMis40DefaultValues() {
  return {
    header: {
      assistantDirectorName: '',
      pdlNo: MIS40_FORM_CODE,
      month: '',
      year: '',
    },
    categories: {
      arm: createCategoryState(true),
      charka: createCategoryState(true),
      cottage: createCategoryState(true),
      mrm: createCategoryState(true),
    },
    signOff: {
      extensionOfficer: '',
      signedAt: '',
    },
    meta: {
      status: 'draft',
      savedTabs: [],
    },
  };
}

function normalizeRows(rows, fallbackRows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return fallbackRows;
  }

  return rows.map((row) => ({
    ...createEmptyRow(),
    ...(row && typeof row === 'object' ? row : {}),
    id: row?.id || createRowId(),
  }));
}

export function loadMis40Draft() {
  const defaults = createMis40DefaultValues();

  try {
    const raw = localStorage.getItem(MIS40_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    return {
      ...defaults,
      header: { ...defaults.header, ...(parsed.header && typeof parsed.header === 'object' ? parsed.header : {}) },
      categories: {
        arm: {
          rows: normalizeRows(parsed.categories?.arm?.rows, defaults.categories.arm.rows),
        },
        charka: {
          rows: normalizeRows(parsed.categories?.charka?.rows, defaults.categories.charka.rows),
        },
        cottage: {
          rows: normalizeRows(parsed.categories?.cottage?.rows, defaults.categories.cottage.rows),
        },
        mrm: {
          rows: normalizeRows(parsed.categories?.mrm?.rows, defaults.categories.mrm.rows),
        },
      },
      signOff: { ...defaults.signOff, ...(parsed.signOff && typeof parsed.signOff === 'object' ? parsed.signOff : {}) },
      meta: { ...defaults.meta, ...(parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : {}) },
    };
  } catch {
    localStorage.removeItem(MIS40_STORAGE_KEY);
    return defaults;
  }
}

export function saveMis40Draft(data) {
  localStorage.setItem(MIS40_STORAGE_KEY, JSON.stringify(data));
}
