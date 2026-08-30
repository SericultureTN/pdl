import { NUMERIC_ROW_FIELDS, KG_FIELD_GROUPS } from './mis40Constants.js';

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/** U.M is never entered directly — always U.L.M + D.M for each Kg field group. */
export function computeRowUm(row) {
  const next = { ...row };
  KG_FIELD_GROUPS.forEach(({ ulmKey, dmKey, umKey }) => {
    next[umKey] = round2(num(row[ulmKey]) + num(row[dmKey]));
  });
  return next;
}

export function computeRowRenditta(row) {
  const consumedDm = num(row.cocoonConsumedDm);
  const consumedUm = num(row.cocoonConsumedUm);
  const silkDm = num(row.silkProductionDm);
  const silkUm = num(row.silkProductionUm);

  return {
    ...row,
    rendittaDm: consumedDm > 0 ? round2((silkDm / consumedDm) * 100) : '',
    rendittaUm: consumedUm > 0 ? round2((silkUm / consumedUm) * 100) : '',
  };
}

export function computeRowsWithCalculations(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({
    ...computeRowRenditta(computeRowUm(row)),
    sNo: index + 1,
  }));
}

export function computeTotalRow(rows) {
  const computedRows = computeRowsWithCalculations(rows);
  const totals = { label: 'TOTAL', isTotal: true };

  NUMERIC_ROW_FIELDS.forEach((field) => {
    totals[field] = round2(computedRows.reduce((acc, row) => acc + num(row[field]), 0));
  });

  const consumedDm = num(totals.cocoonConsumedDm);
  const consumedUm = num(totals.cocoonConsumedUm);
  totals.rendittaDm = consumedDm > 0
    ? round2((num(totals.silkProductionDm) / consumedDm) * 100)
    : '';
  totals.rendittaUm = consumedUm > 0
    ? round2((num(totals.silkProductionUm) / consumedUm) * 100)
    : '';

  return totals;
}

export function createRowId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyRow() {
  const row = {
    id: createRowId(),
    beneficiaryName: '',
    place: '',
    installedUnit: '',
    installedDevice: '',
    functionalUnit: '',
    functionalDevice: '',
    rendittaDm: '',
    rendittaUm: '',
  };
  KG_FIELD_GROUPS.forEach(({ ulmKey, dmKey, umKey }) => {
    row[ulmKey] = 0;
    row[dmKey] = '';
    row[umKey] = '';
  });
  return row;
}
