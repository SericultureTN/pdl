export const FINANCIAL_YEARS = ['2024-25', '2025-26'];

/** Indian financial year order: April → March */
export const FY_MONTHS = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];

export const REGIONS = [
  {
    id: 'dharmapuri',
    name: 'Dharmapuri Region',
    adOffices: ['Hosur', 'Denkanikottai', 'Krishnagiri', 'Dharmapuri', 'Pennagaram'],
  },
  {
    id: 'erode',
    name: 'Erode Region',
    adOffices: ['Salem', 'Coimbatore', 'Udumalpettai', 'Erode', 'Talavadi', 'Coonoor'],
  },
  {
    id: 'vellore',
    name: 'Vellore Region',
    adOffices: ['Vaniyambadi', 'Thiruvannamalai', 'Villuppuram'],
  },
  {
    id: 'trichy',
    name: 'Trichy Region',
    adOffices: ['Trichy', 'Namakkal'],
  },
  {
    id: 'madurai',
    name: 'Madurai Region',
    adOffices: ['Dindigul', 'Theni', 'Tenkasi'],
  },
];

export const PLANTATION_CATEGORIES = [
  '2.00 Acre',
  '1.00 Acre',
  'SCSP',
  'TSP',
];

export const SCHEME_TARGETS = {
  '2.00 Acre': { acre: 100, farmer: 50 },
  '1.00 Acre': { acre: 80, farmer: 40 },
  SCSP: { acre: 30, farmer: 15 },
  TSP: { acre: 25, farmer: 12 },
};

export const BV_ROWS = ['Govt', 'NSSO', 'TN Pvt', 'Other State'];
export const CB_ROWS = ['Other State', 'NSSO'];

export const SHEETS = [
  { id: 'plantation-overall', label: 'Plantation Overall', type: 'plantation-overall', unit: 'Acre / Farmer' },
  { id: 'plantation-scheme-2024-25', label: 'Plantation Scheme 2024-25', type: 'plantation-scheme', schemeYear: '2024-25', unit: 'Acre / Farmer' },
  { id: 'plantation-scheme-2025-26', label: 'Plantation Scheme 2025-26', type: 'plantation-scheme', schemeYear: '2025-26', unit: 'Acre / Farmer' },
  { id: 'dfls-distribution', label: 'DFLs Distribution', type: 'dfls', sheetType: 'distribution', unit: 'Nos' },
  { id: 'dfls-consumption', label: 'DFLs Consumption', type: 'dfls', sheetType: 'consumption', unit: 'Nos' },
  { id: 'cocoon-production', label: 'Cocoon Production', type: 'dfls', sheetType: 'cocoon', unit: 'Kgs' },
];

export function getSheetById(sheetId) {
  return SHEETS.find((s) => s.id === sheetId) || SHEETS[0];
}

export function getAllAdOffices() {
  return REGIONS.flatMap((region) =>
    region.adOffices.map((name) => ({ name, region: region.name, regionId: region.id }))
  );
}

export function getAdOfficesForRegion(regionFilter) {
  if (!regionFilter || regionFilter === 'All' || regionFilter === 'All Regions') {
    return getAllAdOffices();
  }
  const region = REGIONS.find((r) => r.name === regionFilter || r.id === regionFilter);
  if (!region) return [];
  return region.adOffices.map((name) => ({ name, region: region.name, regionId: region.id }));
}

export function getNextMonthYear(month, year) {
  const monthIndex = FY_MONTHS.indexOf(month);
  if (monthIndex === -1) return { month: 'April', year };

  if (monthIndex === FY_MONTHS.length - 1) {
    const startYear = parseInt(year.split('-')[0], 10);
    const nextStart = Number.isNaN(startYear) ? 2025 : startYear + 1;
    return { month: 'April', year: `${nextStart}-${String(nextStart + 1).slice(-2)}` };
  }

  return { month: FY_MONTHS[monthIndex + 1], year };
}

export function num(value) {
  return Number(value) || 0;
}

export function sumPair(a, b) {
  return { acre: num(a?.acre) + num(b?.acre), farmer: num(a?.farmer) + num(b?.farmer) };
}

export function computeUmFromUlmDm(ulm, dm) {
  return {
    acre: num(ulm?.acre) + num(dm?.acre),
    farmer: num(ulm?.farmer) + num(dm?.farmer),
  };
}

export function sumPairs(items, key) {
  return items.reduce(
    (acc, item) => sumPair(acc, item[key]),
    { acre: 0, farmer: 0 }
  );
}

export function sumDflsRows(rows, group, field) {
  const total = {};
  if (group === 'bv') {
    BV_ROWS.forEach((row) => {
      total[row] = rows.reduce((t, r) => t + num(r[field]?.bv?.[row]), 0);
    });
    total.Total = Object.values(total).reduce((t, v) => t + v, 0);
  } else if (group === 'cb') {
    CB_ROWS.forEach((row) => {
      total[row] = rows.reduce((t, r) => t + num(r[field]?.cb?.[row]), 0);
    });
    total.Total = Object.values(total).reduce((t, v) => t + v, 0);
  } else if (group === 'p1') {
    total.value = rows.reduce((t, r) => t + num(r[field]?.p1?.value), 0);
  }
  return total;
}

export function computeDflsUm(ulm, dm) {
  const um = { bv: {}, cb: {}, p1: { value: 0 } };
  BV_ROWS.forEach((row) => {
    um.bv[row] = num(ulm?.bv?.[row]) + num(dm?.bv?.[row]);
  });
  um.bv.Total = BV_ROWS.reduce((t, row) => t + um.bv[row], 0);
  CB_ROWS.forEach((row) => {
    um.cb[row] = num(ulm?.cb?.[row]) + num(dm?.cb?.[row]);
  });
  um.cb.Total = CB_ROWS.reduce((t, row) => t + um.cb[row], 0);
  um.p1.value = num(ulm?.p1?.value) + num(dm?.p1?.value);
  um.grandTotal = um.bv.Total + um.cb.Total + um.p1.value;
  return um;
}

export function dflsGrandTotal(block) {
  const bvTotal = BV_ROWS.reduce((t, row) => t + num(block?.bv?.[row]), 0);
  const cbTotal = CB_ROWS.reduce((t, row) => t + num(block?.cb?.[row]), 0);
  return bvTotal + cbTotal + num(block?.p1?.value);
}
