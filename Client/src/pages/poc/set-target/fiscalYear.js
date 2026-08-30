export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Indian financial year (April–March), e.g. April 2026 -> '2026-2027', March 2026 -> '2025-2026'. */
export function getFinancialYearKey(month, year) {
  const monthIndex = MONTHS.indexOf(month);
  const y = Number(year);
  if (monthIndex === -1 || !Number.isFinite(y)) return '';
  if (monthIndex >= 3) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}
