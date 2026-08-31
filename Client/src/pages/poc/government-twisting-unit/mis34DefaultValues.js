import { createUnitId } from './mis34Calculations.js';
import { PRODUCTION_FIELDS, UNIT_TABLE_GROUPS } from './mis34Constants.js';

function buildSimpleFields(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

/** U.L.M starts at 0 (carried forward later), D.M/U.M start blank until entered/computed. */
function buildTableFields(fields) {
  const data = {};
  fields.forEach(({ ulmKey, dmKey, umKey }) => {
    data[ulmKey] = 0;
    data[dmKey] = '';
    data[umKey] = '';
  });
  return data;
}

function buildProductionDetails() {
  const groupFields = UNIT_TABLE_GROUPS.find((g) => g.path === 'productionDetails').fields;
  return { ...buildSimpleFields(PRODUCTION_FIELDS), ...buildTableFields(groupFields) };
}

export function createEmptyUnit() {
  const unit = {
    id: createUnitId(),
    unitName: '',
    unitCode: '',
    productionDetails: buildProductionDetails(),
  };
  UNIT_TABLE_GROUPS.forEach(({ path, fields }) => {
    if (path === 'productionDetails') return; // already built above (has extra plain fields)
    unit[path] = buildTableFields(fields);
  });
  return unit;
}

export function createMis34DefaultValues() {
  return {
    header: {
      region: '',
      marketOfficeId: '',
      adCode: '',
      disCode: '',
      regCode: '',
      month: '',
      year: '',
    },
    units: [],
    meta: {
      status: 'draft',
      locked: false,
      submittedAt: null,
      submittedBy: null,
    },
  };
}

export const MIS34_STORAGE_KEY = 'pdl-mis34-government-twisting-unit';

function mergeUnit(unit) {
  const empty = createEmptyUnit();
  const merged = {
    ...empty,
    ...unit,
    id: unit?.id || empty.id,
  };
  UNIT_TABLE_GROUPS.forEach(({ path }) => {
    merged[path] = { ...empty[path], ...(unit?.[path] || {}) };
  });
  return merged;
}

export function mergeMis34StoredReport(parsed) {
  const defaults = createMis34DefaultValues();
  return {
    ...defaults,
    ...parsed,
    header: { ...defaults.header, ...(parsed?.header || {}) },
    units: Array.isArray(parsed?.units) ? parsed.units.map(mergeUnit) : [],
    meta: { ...defaults.meta, ...(parsed?.meta || {}) },
  };
}

export function loadMis34Draft() {
  const defaults = createMis34DefaultValues();
  try {
    const raw = localStorage.getItem(MIS34_STORAGE_KEY);
    if (!raw) return defaults;
    return mergeMis34StoredReport(JSON.parse(raw));
  } catch {
    localStorage.removeItem(MIS34_STORAGE_KEY);
    return defaults;
  }
}

export function saveMis34Draft(report) {
  try {
    localStorage.setItem(MIS34_STORAGE_KEY, JSON.stringify(report));
  } catch {
    /* localStorage unavailable — draft simply won't persist across reloads */
  }
}
