import { MONTHS, UNIT_TABLE_GROUPS, ACHIEVEMENT_REPORT_FIELDS } from './mis34Constants.js';
import { createEmptyUnit, createMis34DefaultValues, mergeMis34StoredReport } from './mis34DefaultValues.js';
import { getFinancialYearKey } from '../set-target/fiscalYear.js';

export const MIS34_REPORTS_KEY = 'pdl-mis34-government-twisting-reports';

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

export function loadMis34Reports() {
  try {
    const raw = localStorage.getItem(MIS34_REPORTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    localStorage.removeItem(MIS34_REPORTS_KEY);
    return {};
  }
}

export function getMis34Report(periodKey) {
  if (!periodKey) return null;
  return loadMis34Reports()[periodKey] || null;
}

export function saveMis34Report(periodKey, report) {
  if (!periodKey) return;
  const store = loadMis34Reports();
  store[periodKey] = report;
  localStorage.setItem(MIS34_REPORTS_KEY, JSON.stringify(store));
}

export function findSubmittedReport(marketOfficeId, period) {
  if (!marketOfficeId || !period?.month || !period?.year) return null;
  const key = `${marketOfficeId}|${period.year}|${period.month}`;
  const report = getMis34Report(key);
  return report?.meta?.status === 'submitted' ? report : null;
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Unit-by-name -> { unitName, unitCode, [group]: { [ulmKey]: thisMonth's U.M } }
 * across every U.L.M/D.M/U.M table group on the unit (Production, Achievement,
 * NSC Expenditure, Cost & Sale Value) — every row in every section rolls over.
 */
function extractCarryForwardFromUnits(units) {
  const carry = {};
  (units || []).forEach((unit) => {
    const key = normalizeName(unit.unitName);
    if (!key) return;
    const entry = { unitName: unit.unitName, unitCode: unit.unitCode || '', groups: {} };
    UNIT_TABLE_GROUPS.forEach(({ path, fields }) => {
      const data = unit[path] || {};
      const groupCarry = {};
      fields.forEach(({ ulmKey, dmKey }) => {
        groupCarry[ulmKey] = round2(num(data[ulmKey]) + num(data[dmKey])); // this month's U.M
      });
      entry.groups[path] = groupCarry;
    });
    carry[key] = entry;
  });
  return carry;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Report-level Achievement to Target carry-forward — this month's U.M for
 * Target and Achieved both become next month's U.L.M. (Target's D.M is
 * re-derived fresh from the Target page's Yearly Target ÷ 12 every time the
 * form loads a period, independent of this carry-forward; only its U.L.M
 * running-cumulative comes from here.)
 */
function extractAchievementCarryForward(achievementToTarget) {
  const carry = {};
  ACHIEVEMENT_REPORT_FIELDS.forEach(({ ulmKey, dmKey }) => {
    carry[ulmKey] = round2(num(achievementToTarget?.[ulmKey]) + num(achievementToTarget?.[dmKey]));
  });
  return carry;
}

function buildNextAchievementToTarget(carry, existing) {
  return { ...(existing || {}), ...carry };
}

/** Builds next month's pre-populated units — same unit names, U.L.M carried, D.M/U.M blank. */
function buildNextUnits(carryMap, existingUnits = []) {
  const existingByName = {};
  (existingUnits || []).forEach((unit) => {
    const key = normalizeName(unit.unitName);
    if (key) existingByName[key] = unit;
  });

  const applyCarry = (unit, carry) => {
    const next = { ...unit };
    UNIT_TABLE_GROUPS.forEach(({ path }) => {
      next[path] = { ...next[path] };
      const groupCarry = carry.groups[path] || {};
      Object.entries(groupCarry).forEach(([ulmKey, value]) => {
        next[path][ulmKey] = value;
      });
    });
    return next;
  };

  const carriedUnits = Object.entries(carryMap).map(([nameKey, carry]) => {
    const existing = existingByName[nameKey];
    if (existing) return applyCarry(existing, carry);
    const unit = createEmptyUnit();
    unit.unitName = carry.unitName || nameKey;
    unit.unitCode = carry.unitCode || '';
    return applyCarry(unit, carry);
  });

  const carriedNames = new Set(Object.keys(carryMap));
  const untouchedExisting = (existingUnits || []).filter((unit) => !carriedNames.has(normalizeName(unit.unitName)));

  return [...carriedUnits, ...untouchedExisting];
}

/** Loads a period's report — U.L.M is pre-populated only when the prior month was submitted. */
export function loadMis34ReportForHeader(header) {
  const periodKey = getPeriodKey(header);
  const defaults = createMis34DefaultValues();
  if (!periodKey) return defaults;

  const stored = getMis34Report(periodKey);
  if (stored) return mergeMis34StoredReport(stored);

  const report = mergeMis34StoredReport({ ...defaults, header: { ...defaults.header, ...header } });

  const priorPeriod = getPreviousPeriod(header.month, header.year);
  const priorSubmitted = priorPeriod ? findSubmittedReport(header.marketOfficeId, priorPeriod) : null;
  if (priorSubmitted) {
    const carryMap = extractCarryForwardFromUnits(priorSubmitted.units);
    report.units = buildNextUnits(carryMap, []);
    report.achievementToTarget = buildNextAchievementToTarget(
      extractAchievementCarryForward(priorSubmitted.achievementToTarget),
      report.achievementToTarget
    );
    report.meta = {
      ...report.meta,
      ulmCarriedFrom: getPeriodKey(priorSubmitted.header),
      ulmCarriedAt: priorSubmitted.meta?.submittedAt || null,
    };
  }

  return report;
}

/** Submit the current report and roll every table row's U.M -> next month's U.L.M, matched by unit name. */
export function submitMis34ReportWithRollover(report, submittedBy = 'unknown') {
  const periodKey = getPeriodKey(report.header);
  if (!periodKey) {
    return { ok: false, error: 'Complete Market Office, month, and year before submitting.' };
  }

  const existing = getMis34Report(periodKey);
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
  saveMis34Report(periodKey, submittedReport);

  const nextPeriod = getNextPeriod(report.header.month, report.header.year);
  if (!nextPeriod) {
    return { ok: true, submittedReport, nextDraft: null };
  }

  const nextHeader = { ...report.header, month: nextPeriod.month, year: nextPeriod.year };
  const nextKey = getPeriodKey(nextHeader);

  let nextDraft = getMis34Report(nextKey);
  if (nextDraft?.meta?.status === 'submitted') {
    return {
      ok: true,
      submittedReport,
      nextDraft: null,
      warning: `${nextPeriod.month} ${nextPeriod.year} is already submitted; rollover skipped.`,
    };
  }

  nextDraft = mergeMis34StoredReport({
    ...(nextDraft || createMis34DefaultValues()),
    header: { ...(nextDraft?.header || createMis34DefaultValues().header), ...nextHeader },
  });

  const carryMap = extractCarryForwardFromUnits(submittedReport.units);
  nextDraft.units = buildNextUnits(carryMap, nextDraft.units || []);
  nextDraft.achievementToTarget = buildNextAchievementToTarget(
    extractAchievementCarryForward(submittedReport.achievementToTarget),
    nextDraft.achievementToTarget
  );

  nextDraft.meta = {
    ...nextDraft.meta,
    status: 'draft',
    locked: false,
    submittedAt: null,
    submittedBy: null,
    ulmCarriedFrom: periodKey,
    ulmCarriedAt: submittedAt,
  };

  saveMis34Report(nextKey, nextDraft);

  return { ok: true, submittedReport, nextDraft, nextPeriodKey: nextKey, nextHeader };
}
