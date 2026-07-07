export const SUBORDINATE_OFFICES = [
  'Extension',
  'Grainage',
  'Govt. Anna Silk Exchange, Kancheepuram',
  'TNSTI, Hosur',
  'Seed Coordination, Hosur',
];

/** AD offices for non-Extension subordinate offices */
export const AD_OFFICES_BY_SUBORDINATE = {
  'Seed Coordination, Hosur': [
    'AD Avalapalli',
    'AD Kalkondapalli',
    'AD Kollatti',
  ],
  'Govt. Anna Silk Exchange, Kancheepuram': [
    'AD Kancheepuram',
  ],
  'TNSTI, Hosur': [
    'AD TNSTI, Hosur',
  ],
};

export const REGIONS = [
  'Dharmapuri Region',
  'Erode Region',
  'Vellore Region',
  'Trichy Region',
  'Madurai Region',
];

export const AD_OFFICES_BY_REGION = {
  'Dharmapuri Region': [
    'AD Dharmapuri',
    'AD Pennagaram',
    'AD Krishnagiri',
    'AD Denkanikottai',
    'AD Hosur',
  ],
  'Erode Region': [
    'AD Salem',
    'AD Erode',
    'AD Talavady',
    'AD Coimbatore',
    'AD Udumalaipettai',
    'AD Coonoor',
  ],
  'Vellore Region': [
    'AD Vaniyambadi',
    'AD Villupuram',
    'AD Tiruvannamalai',
  ],
  'Trichy Region': [
    'AD Trichy',
    'AD Namakkal',
  ],
  'Madurai Region': [
    'AD Dindigul',
    'AD Theni',
    'AD Tenkasi',
  ],
};

export const FINANCIAL_YEARS = ['2025–26', '2024–25', '2023–24', '2022–23'];

export const PLANTATION_SCHEMES = {
  '2024-25': {
    id: '2024-25',
    label: '2024–25',
    defaultFinancialYear: '2024–25',
    reportTitle: 'Plantation Scheme 2024-25',
  },
  '2025-26': {
    id: '2025-26',
    label: '2025–26',
    defaultFinancialYear: '2025–26',
    reportTitle: 'Plantation Scheme 2025-26',
  },
};

export function getPlantationSchemeFromPath(pathname) {
  if (pathname.includes('plantation-scheme-2025-26')) {
    return PLANTATION_SCHEMES['2025-26'];
  }
  if (pathname.includes('plantation-scheme-2024-25')) {
    return PLANTATION_SCHEMES['2024-25'];
  }
  return PLANTATION_SCHEMES['2024-25'];
}

export function getFinancialYearsForScheme(schemeId) {
  if (schemeId === '2025-26') {
    return ['2025–26', '2024–25', '2023–24', '2022–23'];
  }
  return ['2024–25', '2023–24', '2022–23'];
}

export function getAdOfficesForRegion(region) {
  return AD_OFFICES_BY_REGION[region] || [];
}

export function usesRegionFilter(subordinateOffice) {
  return subordinateOffice === 'Extension';
}

export function showsAdOfficeFilter(subordinateOffice) {
  return usesRegionFilter(subordinateOffice) || Boolean(AD_OFFICES_BY_SUBORDINATE[subordinateOffice]);
}

export function getAdOfficesForFilter(subordinateOffice, region) {
  if (usesRegionFilter(subordinateOffice)) {
    return getAdOfficesForRegion(region);
  }
  return AD_OFFICES_BY_SUBORDINATE[subordinateOffice] || [];
}

export function resolveAdOffice(region, adOffice) {
  const offices = getAdOfficesForRegion(region);
  if (offices.includes(adOffice)) return adOffice;
  return offices[0] || '';
}

export function resolveAdOfficeForFilter(subordinateOffice, region, adOffice) {
  const offices = getAdOfficesForFilter(subordinateOffice, region);
  if (offices.includes(adOffice)) return adOffice;
  return offices[0] || '';
}

export function getDefaultAdOffice(subordinateOffice, region) {
  return resolveAdOfficeForFilter(subordinateOffice, region, '');
}

export function normalizeFilterDraft(draft, scheme) {
  const defaults = {
    subordinateOffice: 'Extension',
    region: 'Erode Region',
    adOffice: 'AD Salem',
    financialYear: scheme.defaultFinancialYear,
    month: 'May',
  };
  const data = { ...defaults, ...draft };
  const years = getFinancialYearsForScheme(scheme.id);

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
  if (!years.includes(data.financialYear)) {
    data.financialYear = scheme.defaultFinancialYear;
  }
  if (!MONTHS.includes(data.month)) {
    data.month = defaults.month;
  }

  return data;
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PLANTATION_CATEGORIES = [
  '2.00 Acre Category',
  '1.00 Acre Category',
  'SCSP',
  'TSP',
];

export const PLANTATION_CATEGORY_META = {
  '2.00 Acre Category': {
    shortLabel: '2.00 Acre',
    description: 'Farmers under 2.00 acre plantation scheme',
    accent: 'green',
  },
  '1.00 Acre Category': {
    shortLabel: '1.00 Acre',
    description: 'Farmers under 1.00 acre plantation scheme',
    accent: 'blue',
  },
  SCSP: {
    shortLabel: 'SCSP',
    description: 'Scheduled Caste Sub Plan beneficiaries',
    accent: 'purple',
  },
  TSP: {
    shortLabel: 'TSP',
    description: 'Tribal Sub Plan beneficiaries',
    accent: 'amber',
  },
};

export function createEmptyAcreFarmer() {
  return { acre: '', farmer: '' };
}

export function createInitialTargetData() {
  return {
    '2.00 Acre Category': { acre: 100, farmer: 50 },
    '1.00 Acre Category': { acre: 80, farmer: 40 },
    SCSP: { acre: 30, farmer: 15 },
    TSP: { acre: 25, farmer: 12 },
  };
}

export function createEmptyTargetData() {
  return Object.fromEntries(
    PLANTATION_CATEGORIES.map((category) => [category, { acre: 0, farmer: 0 }])
  );
}

export function createInitialUlmData() {
  return {
    '2.00 Acre Category': { acre: 20, farmer: 10 },
    '1.00 Acre Category': { acre: 15, farmer: 8 },
    SCSP: { acre: 5, farmer: 3 },
    TSP: { acre: 4, farmer: 2 },
  };
}

export function createEmptyUlmData() {
  return Object.fromEntries(
    PLANTATION_CATEGORIES.map((category) => [category, { acre: 0, farmer: 0 }])
  );
}

export function createInitialDmData() {
  return Object.fromEntries(
    PLANTATION_CATEGORIES.map((category) => [category, createEmptyAcreFarmer()])
  );
}

export function hasDmValues(dmData) {
  return Object.values(dmData).some(
    (item) => (item.acre !== '' && item.acre != null) || (item.farmer !== '' && item.farmer != null)
  );
}

export function sumAcreFarmer(data) {
  return Object.values(data).reduce(
    (acc, item) => ({
      acre: acc.acre + (Number(item.acre) || 0),
      farmer: acc.farmer + (Number(item.farmer) || 0),
    }),
    { acre: 0, farmer: 0 }
  );
}

export function computeUmValue(ulm, dm) {
  return {
    acre: (Number(ulm.acre) || 0) + (Number(dm.acre) || 0),
    farmer: (Number(ulm.farmer) || 0) + (Number(dm.farmer) || 0),
  };
}
