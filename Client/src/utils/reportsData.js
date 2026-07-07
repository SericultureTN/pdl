import { loadPlantationDraft } from '../pages/mis/plantationStorage.js';
import { loadDflsDraft } from '../pages/mis/dflsStorage.js';
import {
  PLANTATION_SCHEMES,
  MONTHS,
  normalizeFilterDraft,
} from '../pages/mis/plantationConstants.js';
import { normalizeDflsFilterDraft } from '../pages/mis/dflsConstants.js';
import {
  getPlantationEntryReport,
  getDflsEntryReport,
  DFLS_BV_ROWS,
  DFLS_CB_ROWS,
} from '../pages/mis/reports/entryReportData.js';

export const REPORT_MODULES = [
  {
    id: 'plantation-2024-25',
    label: 'Plantation Scheme 2024-25',
    type: 'plantation',
    schemeId: '2024-25',
  },
  {
    id: 'plantation-2025-26',
    label: 'Plantation Scheme 2025-26',
    type: 'plantation',
    schemeId: '2025-26',
  },
  {
    id: 'dfls-distribution',
    label: 'DFLs Distribution',
    type: 'dfls',
    pageKey: 'distribution',
    unit: 'Nos',
  },
  {
    id: 'dfls-consumption',
    label: 'DFLs Consumption',
    type: 'dfls',
    pageKey: 'consumption',
    unit: 'Nos',
  },
  {
    id: 'cocoon-production',
    label: 'Cocoon Production',
    type: 'dfls',
    pageKey: 'cocoon-production',
    unit: 'Kgs',
  },
];

const SHORT_MONTHS = {
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};

function normalizeMonthName(month) {
  if (!month) return '';
  if (MONTHS.includes(month)) return month;
  return SHORT_MONTHS[month] || month;
}

function parseFinancialYearStart(financialYear) {
  const match = String(financialYear).match(/(\d{4})/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

export function monthToEntryDate(month, financialYear) {
  const monthName = normalizeMonthName(month);
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex === -1) return null;

  let year = parseFinancialYearStart(financialYear);
  if (monthIndex < 3) {
    year += 1;
  }

  return new Date(year, monthIndex, 1);
}

function formatEntryDate(month, financialYear) {
  const date = monthToEntryDate(month, financialYear);
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatPlantationPair(values) {
  return `${values.acre} Acre / ${values.farmer} Farmer`;
}

function buildPlantationDetails(report) {
  if (!report.hasEntry) return [];

  return report.categories
    .filter((row) => row.dm.acre || row.dm.farmer)
    .map(
      (row) =>
        `${row.category}: ULM ${row.ulm.acre}/${row.ulm.farmer}, DM ${row.dm.acre}/${row.dm.farmer}, UM ${row.um.acre}/${row.um.farmer}`
    );
}

function buildDflsDetails(report) {
  if (!report.hasEntry) return [];

  const lines = [];
  DFLS_BV_ROWS.forEach((row) => {
    const dm = report.dmData.bv[row];
    if (dm !== '' && dm != null) {
      lines.push(`BV ${row}: DM ${dm}, UM ${report.umData.bv[row]}`);
    }
  });
  DFLS_CB_ROWS.forEach((row) => {
    const dm = report.dmData.cb[row];
    if (dm !== '' && dm != null) {
      lines.push(`CB ${row}: DM ${dm}, UM ${report.umData.cb[row]}`);
    }
  });
  const p1 = report.dmData.p1?.value;
  if (p1 !== '' && p1 != null) {
    lines.push(`P1: DM ${p1}, UM ${report.umData.p1.value}`);
  }
  return lines;
}

function buildPlantationRow(module) {
  const scheme = PLANTATION_SCHEMES[module.schemeId];
  if (!scheme) return null;

  const draft = loadPlantationDraft(module.schemeId);
  const filters = normalizeFilterDraft(draft, scheme);
  const report = getPlantationEntryReport(scheme);
  const details = buildPlantationDetails(report);

  return {
    id: module.id,
    module: module.label,
    subordinateOffice: filters.subordinateOffice,
    region: filters.region,
    adOffice: filters.adOffice,
    financialYear: filters.financialYear,
    month: filters.month,
    periodLabel: `${filters.financialYear} · ${filters.month}`,
    entryDate: formatEntryDate(filters.month, filters.financialYear),
    entryDateValue: monthToEntryDate(filters.month, filters.financialYear),
    unit: 'Acre / Farmer',
    ulm: report.hasEntry ? formatPlantationPair(report.ulm) : '—',
    dm: report.hasEntry ? formatPlantationPair(report.dm) : '—',
    um: report.hasEntry ? formatPlantationPair(report.um) : '—',
    details,
    detailsText: details.join(' | '),
    status: report.submitted ? 'Submitted' : report.hasEntry ? 'Draft' : 'Empty',
    hasEntry: report.hasEntry,
  };
}

function buildDflsRow(module) {
  const draft = loadDflsDraft(module.pageKey);
  const filters = normalizeDflsFilterDraft(draft);
  const report = getDflsEntryReport(module.pageKey);
  const details = buildDflsDetails(report);

  return {
    id: module.id,
    module: module.label,
    subordinateOffice: filters.subordinateOffice,
    region: filters.region,
    adOffice: filters.adOffice,
    financialYear: filters.financialYear,
    month: filters.month,
    periodLabel: `${filters.financialYear} · ${filters.month}`,
    entryDate: formatEntryDate(filters.month, filters.financialYear),
    entryDateValue: monthToEntryDate(filters.month, filters.financialYear),
    unit: module.unit,
    ulm: report.hasEntry ? `${report.ulmTotal} ${module.unit}` : '—',
    dm: report.hasEntry ? `${report.dmTotal} ${module.unit}` : '—',
    um: report.hasEntry ? `${report.umTotal} ${module.unit}` : '—',
    details,
    detailsText: details.join(' | '),
    status: report.hasEntry ? 'Draft' : 'Empty',
    hasEntry: report.hasEntry,
  };
}

export function collectAllReportRows() {
  return REPORT_MODULES.map((module) => {
    if (module.type === 'plantation') {
      return buildPlantationRow(module);
    }
    return buildDflsRow(module);
  }).filter(Boolean);
}

function parseInputDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeFilterMonth(month) {
  if (month === 'all') return 'all';
  return normalizeMonthName(month);
}

export function filterReportRows(rows, filters) {
  const fromDate = parseInputDate(filters.fromDate);
  const toDate = parseInputDate(filters.toDate);
  const filterMonth = normalizeFilterMonth(filters.month);

  return rows.filter((row) => {
    if (filters.reportType !== 'all' && row.id !== filters.reportType) {
      return false;
    }
    if (filters.subordinateOffice !== 'all' && row.subordinateOffice !== filters.subordinateOffice) {
      return false;
    }
    if (filters.region !== 'all' && row.region !== filters.region) {
      return false;
    }
    if (filters.adOffice !== 'all' && row.adOffice !== filters.adOffice) {
      return false;
    }
    if (filters.financialYear !== 'all' && row.financialYear !== filters.financialYear) {
      return false;
    }
    if (filterMonth !== 'all' && normalizeMonthName(row.month) !== filterMonth) {
      return false;
    }

    if (fromDate || toDate) {
      const entryDate = row.entryDateValue;
      if (!entryDate) return false;
      if (fromDate && entryDate < fromDate) return false;
      if (toDate && entryDate > toDate) return false;
    }

    return true;
  });
}

export const DEFAULT_REPORT_FILTERS = {
  reportType: 'all',
  subordinateOffice: 'all',
  region: 'all',
  adOffice: 'all',
  financialYear: 'all',
  month: 'all',
  fromDate: '',
  toDate: '',
};

export { MONTHS as REPORT_MONTHS };
