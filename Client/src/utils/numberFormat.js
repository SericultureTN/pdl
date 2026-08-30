// Display-layer number formatting — Indian numbering system (lakh/crore
// grouping via Intl's 'en-IN' locale). Never used on editable inputs (raw
// numeric entry stays plain for easier typing) — only on read-only/computed
// displays and exports. Raw stored values are always plain numbers; these
// only affect what's rendered.

export function formatKg(value) {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value)) + ' Kg';
}

export function formatRupees(value) {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(num));
  return (num < 0 ? '-' : '') + '₹' + formatted;
}

/** `value` is a plain fraction (0.754), not already ×100. */
export function formatPercent(value) {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return (Number(value) * 100).toFixed(1) + '%';
}

export function formatRatio(value) {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(3);
}

/** Plain count (Devices Installed, Days Worked, etc.) — Indian grouping, no unit suffix. */
export function formatCount(value) {
  if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN').format(Number(value));
}

const FORMATTERS = {
  kg: formatKg,
  rs: formatRupees,
  percent: formatPercent,
  ratio: formatRatio,
  count: formatCount,
};

/** `unit` is one of 'kg' | 'rs' | 'percent' | 'ratio' | 'count' | falsy (no formatting). */
export function formatByUnit(unit, value) {
  const formatter = FORMATTERS[unit];
  return formatter ? formatter(value) : value;
}
