import { MONTHS, EDITABLE_CATEGORY_IDS, KG_FIELD_GROUPS } from './mis40Constants.js';
import { computeRowsWithCalculations, createEmptyRow } from './mis40Calculations.js';
import { createMis40DefaultValues, mergeMis40StoredReport } from './mis40DefaultValues.js';
import { getFinancialYearKey } from '../set-target/fiscalYear.js';

export const MIS40_REPORTS_KEY = 'pdl-mis40-private-reeling-reports';

export { getFinancialYearKey };

export function getPeriodKey(header) {
  if (!header?.marketOfficeId || !header?.month || !header?.year) return '';
  return `${header.marketOfficeId}|${header.year}|${header.month}`;
}

export function getPreviousPeriod(month, year) {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex === -1) return null;
  if (monthIndex === 0) return { month: MONTHS[11], year: String(Number(year) - 1) };
  return { month: MONTHS[monthIndex - 1], year: String(year) };
}

export function getNextPeriod(month, year) {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex === -1) return null;
  if (monthIndex === 11) return { month: MONTHS[0], year: String(Number(year) + 1) };
  return { month: MONTHS[monthIndex + 1], year: String(year) };
}

export function isReportLocked(meta) {
  return meta?.status === 'submitted' || meta?.locked === true;
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

export function loadMis40Reports() {
  try {
    const raw = localStorage.getItem(MIS40_REPORTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    localStorage.removeItem(MIS40_REPORTS_KEY);
    return {};
  }
}

export function getMis40Report(periodKey) {
  if (!periodKey) return null;
  return loadMis40Reports()[periodKey] || null;
}

export function saveMis40Report(periodKey, report) {
  if (!periodKey) return;
  const store = loadMis40Reports();
  store[periodKey] = report;
  localStorage.setItem(MIS40_REPORTS_KEY, JSON.stringify(store));
}

export function findSubmittedReport(marketOfficeId, period) {
  if (!marketOfficeId || !period?.month || !period?.year) return null;
  const key = `${marketOfficeId}|${period.year}|${period.month}`;
  const report = getMis40Report(key);
  return report?.meta?.status === 'submitted' ? report : null;
}

/** Beneficiary-by-name -> { place, yearlySilkProductionCapacity, [ulmKey]: thisMonth's U.M } for one category's rows. */
function extractCarryForwardFromCategoryRows(rows, month) {
  const computed = computeRowsWithCalculations(rows, month);
  const carry = {};
  computed.forEach((row) => {
    const key = normalizeName(row.beneficiaryName);
    if (!key) return;
    const entry = {
      beneficiaryName: row.beneficiaryName,
      place: row.place || '',
      // Carried forward unchanged, same as name/place — it's an annual
      // figure, not something re-entered every month.
      yearlySilkProductionCapacity: row.yearlySilkProductionCapacity ?? '',
    };
    KG_FIELD_GROUPS.forEach(({ ulmKey, umKey }) => {
      entry[ulmKey] = row[umKey] === '' || row[umKey] == null ? 0 : row[umKey];
    });
    carry[key] = entry;
  });
  return carry;
}

/** Builds next month's pre-populated rows for one category — same beneficiaries, U.L.M carried, D.M/U.M blank. */
function buildNextCategoryRows(carryMap, existingRows = []) {
  const existingByName = {};
  existingRows.forEach((row) => {
    const key = normalizeName(row.beneficiaryName);
    if (key) existingByName[key] = row;
  });

  const carriedRows = Object.entries(carryMap).map(([nameKey, carry]) => {
    const existing = existingByName[nameKey];
    if (existing) {
      const next = { ...existing };
      KG_FIELD_GROUPS.forEach(({ ulmKey }) => {
        next[ulmKey] = carry[ulmKey];
      });
      return next;
    }
    const row = createEmptyRow();
    row.beneficiaryName = carry.beneficiaryName || nameKey;
    row.place = carry.place || '';
    row.yearlySilkProductionCapacity = carry.yearlySilkProductionCapacity ?? '';
    KG_FIELD_GROUPS.forEach(({ ulmKey }) => {
      row[ulmKey] = carry[ulmKey];
    });
    return row;
  });

  // Preserve any manually-added rows for beneficiaries who don't have a
  // carry-forward entry (e.g. new next-month additions not present last month).
  const carriedNames = new Set(Object.keys(carryMap));
  const untouchedExisting = existingRows.filter((row) => !carriedNames.has(normalizeName(row.beneficiaryName)));

  return [...carriedRows, ...untouchedExisting];
}

/** Loads a period's report — U.L.M is pre-populated only when the prior month was submitted. */
export function loadMis40ReportForHeader(header) {
  const periodKey = getPeriodKey(header);
  const defaults = createMis40DefaultValues();
  if (!periodKey) return defaults;

  const stored = getMis40Report(periodKey);
  if (stored) return mergeMis40StoredReport(stored);

  const report = mergeMis40StoredReport({ ...defaults, header: { ...defaults.header, ...header } });

  const priorPeriod = getPreviousPeriod(header.month, header.year);
  const priorSubmitted = priorPeriod ? findSubmittedReport(header.marketOfficeId, priorPeriod) : null;
  if (priorSubmitted) {
    EDITABLE_CATEGORY_IDS.forEach((categoryId) => {
      const priorRows = priorSubmitted.categories?.[categoryId]?.rows || [];
      const carryMap = extractCarryForwardFromCategoryRows(priorRows, priorSubmitted.header?.month);
      report.categories[categoryId].rows = buildNextCategoryRows(carryMap, []);
    });
    report.meta = {
      ...report.meta,
      ulmCarriedFrom: getPeriodKey(priorSubmitted.header),
      ulmCarriedAt: priorSubmitted.meta?.submittedAt || null,
    };
  }

  return report;
}

/** Submit the current report and roll each category's U.M -> next month's U.L.M, matched by beneficiary name. */
export function submitMis40ReportWithRollover(report, submittedBy = 'unknown') {
  const periodKey = getPeriodKey(report.header);
  if (!periodKey) {
    return { ok: false, error: 'Complete Market Office, month, and year before submitting.' };
  }

  const existing = getMis40Report(periodKey);
  if (existing?.meta?.status === 'submitted') {
    return { ok: false, error: 'This report has already been submitted.' };
  }

  const submittedAt = new Date().toISOString();
  const submittedReport = {
    ...report,
    meta: {
      ...report.meta,
      status: 'submitted',
      locked: true,
      submittedAt,
      submittedBy,
    },
  };
  saveMis40Report(periodKey, submittedReport);

  const nextPeriod = getNextPeriod(report.header.month, report.header.year);
  if (!nextPeriod) {
    return { ok: true, submittedReport, nextDraft: null };
  }

  const nextHeader = { ...report.header, month: nextPeriod.month, year: nextPeriod.year };
  const nextKey = getPeriodKey(nextHeader);

  let nextDraft = getMis40Report(nextKey);
  if (nextDraft?.meta?.status === 'submitted') {
    return {
      ok: true,
      submittedReport,
      nextDraft: null,
      warning: `${nextPeriod.month} ${nextPeriod.year} is already submitted; rollover skipped.`,
    };
  }

  nextDraft = mergeMis40StoredReport({
    ...(nextDraft || createMis40DefaultValues()),
    header: { ...(nextDraft?.header || createMis40DefaultValues().header), ...nextHeader },
  });

  EDITABLE_CATEGORY_IDS.forEach((categoryId) => {
    const thisMonthRows = submittedReport.categories?.[categoryId]?.rows || [];
    const carryMap = extractCarryForwardFromCategoryRows(thisMonthRows, report.header?.month);
    const existingNextRows = nextDraft.categories?.[categoryId]?.rows || [];
    nextDraft.categories[categoryId].rows = buildNextCategoryRows(carryMap, existingNextRows);
  });

  nextDraft.meta = {
    ...nextDraft.meta,
    status: 'draft',
    locked: false,
    submittedAt: null,
    submittedBy: null,
    ulmCarriedFrom: periodKey,
    ulmCarriedAt: submittedAt,
  };

  saveMis40Report(nextKey, nextDraft);

  return { ok: true, submittedReport, nextDraft, nextPeriodKey: nextKey, nextHeader };
}
