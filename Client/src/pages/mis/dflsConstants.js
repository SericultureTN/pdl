import {
  SUBORDINATE_OFFICES,
  REGIONS,
  MONTHS,
  FINANCIAL_YEARS,
  resolveAdOfficeForFilter,
} from './plantationConstants.js';

export const DFLS_DEFAULT_FINANCIAL_YEAR = '2024–25';

export const INITIAL_ULM = {
  bv: { Govt: 120, NSSO: 85, 'TN Pvt': 45, 'Other State': 30 },
  cb: { 'Other State': 22, NSSO: 18 },
  p1: { value: 50 },
};

export const INITIAL_DM = {
  bv: { Govt: '', NSSO: '', 'TN Pvt': '', 'Other State': '' },
  cb: { 'Other State': '', NSSO: '' },
  p1: { value: '' },
};

export function createInitialDmData() {
  return JSON.parse(JSON.stringify(INITIAL_DM));
}

export function normalizeDflsFilterDraft(draft) {
  const defaults = {
    subordinateOffice: 'Extension',
    region: 'Erode Region',
    adOffice: 'AD Salem',
    financialYear: DFLS_DEFAULT_FINANCIAL_YEAR,
    month: 'May',
  };
  const data = { ...defaults, ...draft };

  const legacySubordinateNames = {
    'Anna Silk Exchange': 'Govt. Anna Silk Exchange, Kancheepuram',
    'Seed Farm': 'Seed Coordination, Hosur',
  };
  if (legacySubordinateNames[data.subordinateOffice]) {
    data.subordinateOffice = legacySubordinateNames[data.subordinateOffice];
  }
  if (!SUBORDINATE_OFFICES.includes(data.subordinateOffice)) {
    data.subordinateOffice = defaults.subordinateOffice;
  }
  if (!REGIONS.includes(data.region)) {
    data.region = defaults.region;
  }
  data.adOffice = resolveAdOfficeForFilter(
    data.subordinateOffice,
    data.region,
    data.adOffice
  );
  if (!FINANCIAL_YEARS.includes(data.financialYear)) {
    data.financialYear = defaults.financialYear;
  }
  if (!MONTHS.includes(data.month)) {
    data.month = defaults.month;
  }

  return data;
}
