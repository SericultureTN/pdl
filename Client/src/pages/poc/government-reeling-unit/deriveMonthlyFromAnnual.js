import { MONTHS } from './mis37Constants.js';

// April is fiscal-month 0, March is fiscal-month 11.
const FISCAL_MONTH_ORDER = [...MONTHS.slice(3), ...MONTHS.slice(0, 3)];

export function fiscalMonthIndex(month) {
  return FISCAL_MONTH_ORDER.indexOf(month);
}

export function isFiscalYearStart(month) {
  return month === 'April';
}

/**
 * Splits an annual figure into this fiscal month's D.M value. Whole-unit
 * rounding: April–February each get floor(annual / 12); March (the last
 * fiscal month) takes whatever remains, so the 12 months always sum to
 * exactly the annual figure regardless of remainder.
 */
export function deriveMonthlyFromAnnual(annualValue, month) {
  const annual = Number(annualValue);
  if (!Number.isFinite(annual)) return 0;
  const idx = fiscalMonthIndex(month);
  if (idx === -1) return 0;
  const base = Math.floor(annual / 12);
  if (idx === 11) return annual - base * 11;
  return base;
}
