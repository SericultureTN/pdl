import { AD_OFFICES_BY_REGION, REGIONS } from '../plantationConstants.js';

export const REPORT_DEFAULTS = {
  financialYear: '2024-25',
  month: 'May 2024',
  date: '31-05-2024',
  region: 'Erode Region',
  adOffice: 'All AD Offices',
  status: 'All Status',
};

function scale(base, factor) {
  return {
    acre: Math.round(base.acre * factor),
    farmer: Math.round(base.farmer * factor),
  };
}

function officeRecord(name, region, factor, status = 'Submitted') {
  const target = scale({ acre: 235, farmer: 117 }, factor);
  const ulm = scale({ acre: 44, farmer: 23 }, factor);
  const dm = scale({ acre: 12, farmer: 7 }, factor);
  const um = {
    acre: ulm.acre + dm.acre,
    farmer: ulm.farmer + dm.farmer,
  };
  const achievement = target.acre
    ? Number(((um.acre / target.acre) * 100).toFixed(2))
    : 0;

  return {
    adOffice: name,
    region,
    target,
    ulm,
    dm,
    um,
    achievement,
    status,
  };
}

/** AD Office wise summary for each region */
export const AD_OFFICE_WISE_BY_REGION = {
  'Erode Region': [
    officeRecord('AD Salem', 'Erode Region', 1.0, 'Submitted'),
    officeRecord('AD Erode', 'Erode Region', 0.82, 'Approved'),
    officeRecord('AD Talavady', 'Erode Region', 0.65, 'Approved'),
    officeRecord('AD Coimbatore', 'Erode Region', 0.91, 'Submitted'),
    officeRecord('AD Udumalaipettai', 'Erode Region', 0.58, 'Draft'),
    officeRecord('AD Coonoor', 'Erode Region', 0.47, 'Approved'),
  ],
  'Dharmapuri Region': [
    officeRecord('AD Dharmapuri', 'Dharmapuri Region', 0.88, 'Approved'),
    officeRecord('AD Pennagaram', 'Dharmapuri Region', 0.62, 'Submitted'),
    officeRecord('AD Krishnagiri', 'Dharmapuri Region', 0.75, 'Approved'),
    officeRecord('AD Denkanikottai', 'Dharmapuri Region', 0.54, 'Draft'),
    officeRecord('AD Hosur', 'Dharmapuri Region', 0.79, 'Approved'),
  ],
  'Vellore Region': [
    officeRecord('AD Vaniyambadi', 'Vellore Region', 0.7, 'Approved'),
    officeRecord('AD Villupuram', 'Vellore Region', 0.85, 'Submitted'),
    officeRecord('AD Tiruvannamalai', 'Vellore Region', 0.68, 'Approved'),
  ],
  'Trichy Region': [
    officeRecord('AD Trichy', 'Trichy Region', 0.92, 'Approved'),
    officeRecord('AD Namakkal', 'Trichy Region', 0.73, 'Submitted'),
  ],
  'Madurai Region': [
    officeRecord('AD Dindigul', 'Madurai Region', 0.86, 'Approved'),
    officeRecord('AD Theni', 'Madurai Region', 0.61, 'Submitted'),
    officeRecord('AD Tenkasi', 'Madurai Region', 0.55, 'Draft'),
  ],
};

export function getAdOfficesForRegion(region) {
  return AD_OFFICES_BY_REGION[region] || [];
}

export function getAdOfficeWiseList(region, adOfficeFilter = 'All AD Offices', statusFilter = 'All Status') {
  const offices = AD_OFFICE_WISE_BY_REGION[region] || [];
  return offices.filter((row) => {
    const officeMatch = adOfficeFilter === 'All AD Offices' || row.adOffice === adOfficeFilter;
    const statusMatch = statusFilter === 'All Status' || row.status === statusFilter;
    return officeMatch && statusMatch;
  });
}

export function getRegionTotals(officeList) {
  return officeList.reduce(
    (acc, row) => ({
      target: {
        acre: acc.target.acre + row.target.acre,
        farmer: acc.target.farmer + row.target.farmer,
      },
      ulm: {
        acre: acc.ulm.acre + row.ulm.acre,
        farmer: acc.ulm.farmer + row.ulm.farmer,
      },
      dm: {
        acre: acc.dm.acre + row.dm.acre,
        farmer: acc.dm.farmer + row.dm.farmer,
      },
      um: {
        acre: acc.um.acre + row.um.acre,
        farmer: acc.um.farmer + row.um.farmer,
      },
    }),
    {
      target: { acre: 0, farmer: 0 },
      ulm: { acre: 0, farmer: 0 },
      dm: { acre: 0, farmer: 0 },
      um: { acre: 0, farmer: 0 },
    }
  );
}

export function getAchievementPercent(um, target) {
  if (!target.acre) return 0;
  return Number(((um.acre / target.acre) * 100).toFixed(2));
}

export const REPORT_KPIS = {
  target: { acre: 235, farmer: 117 },
  ulm: { acre: 44, farmer: 23 },
  dm: { acre: 12, farmer: 7 },
  um: { acre: 56, farmer: 30 },
  achievement: 75.42,
};

export const CATEGORY_DETAILS = [
  {
    category: '2.00 Acre Category',
    ulm: { acre: 20, farmer: 10 },
    dm: { acre: 5, farmer: 3 },
    um: { acre: 25, farmer: 13 },
  },
  {
    category: '1.00 Acre Category',
    ulm: { acre: 15, farmer: 8 },
    dm: { acre: 4, farmer: 2 },
    um: { acre: 19, farmer: 10 },
  },
  {
    category: 'SCSP Category',
    ulm: { acre: 5, farmer: 3 },
    dm: { acre: 2, farmer: 1 },
    um: { acre: 7, farmer: 4 },
  },
  {
    category: 'TSP Category',
    ulm: { acre: 4, farmer: 2 },
    dm: { acre: 1, farmer: 1 },
    um: { acre: 5, farmer: 3 },
  },
];

export const OVERALL_TOTALS = {
  ulm: { acre: 44, farmer: 23 },
  dm: { acre: 12, farmer: 7 },
  um: { acre: 56, farmer: 30 },
  total: { acre: 56, farmer: 30 },
};

function historyRow(id, adOffice, region, month, date, umBase, status, submittedOn) {
  const ulm = scale({ acre: umBase - 12, farmer: Math.round((umBase - 12) * 0.52) }, 1);
  const dm = { acre: 12, farmer: 7 };
  const um = { acre: ulm.acre + dm.acre, farmer: ulm.farmer + dm.farmer };
  return {
    id,
    adOffice,
    region,
    month,
    date,
    ulm,
    dm,
    um,
    total: { ...um },
    status,
    submittedOn,
  };
}

/** Monthly history records per AD Office */
export const MONTHLY_HISTORY_BY_OFFICE = [
  historyRow(1, 'AD Salem', 'Erode Region', 'May 2024', '31-05-2024', 56, 'Submitted', '01-06-2024 10:32 AM'),
  historyRow(2, 'AD Erode', 'Erode Region', 'May 2024', '31-05-2024', 46, 'Approved', '01-06-2024 11:05 AM'),
  historyRow(3, 'AD Coimbatore', 'Erode Region', 'May 2024', '31-05-2024', 51, 'Submitted', '01-06-2024 09:48 AM'),
  historyRow(4, 'AD Talavady', 'Erode Region', 'May 2024', '31-05-2024', 36, 'Approved', '02-06-2024 10:15 AM'),
  historyRow(5, 'AD Udumalaipettai', 'Erode Region', 'May 2024', '31-05-2024', 32, 'Draft', '—'),
  historyRow(6, 'AD Coonoor', 'Erode Region', 'May 2024', '31-05-2024', 26, 'Approved', '01-06-2024 03:22 PM'),
  historyRow(7, 'AD Salem', 'Erode Region', 'April 2024', '30-04-2024', 44, 'Approved', '02-05-2024 09:15 AM'),
  historyRow(8, 'AD Erode', 'Erode Region', 'April 2024', '30-04-2024', 38, 'Approved', '02-05-2024 10:40 AM'),
  historyRow(9, 'AD Coimbatore', 'Erode Region', 'April 2024', '30-04-2024', 41, 'Submitted', '02-05-2024 11:20 AM'),
  historyRow(10, 'AD Dharmapuri', 'Dharmapuri Region', 'May 2024', '31-05-2024', 48, 'Approved', '01-06-2024 12:00 PM'),
  historyRow(11, 'AD Krishnagiri', 'Dharmapuri Region', 'May 2024', '31-05-2024', 42, 'Submitted', '01-06-2024 01:15 PM'),
  historyRow(12, 'AD Trichy', 'Trichy Region', 'May 2024', '31-05-2024', 52, 'Approved', '01-06-2024 02:30 PM'),
];

export function getMonthlyHistory(region, adOfficeFilter = 'All AD Offices', statusFilter = 'All Status') {
  return MONTHLY_HISTORY_BY_OFFICE.filter((row) => {
    const regionMatch = row.region === region;
    const officeMatch = adOfficeFilter === 'All AD Offices' || row.adOffice === adOfficeFilter;
    const statusMatch = statusFilter === 'All Status' || row.status === statusFilter;
    return regionMatch && officeMatch && statusMatch;
  });
}

export const FILTER_OPTIONS = {
  financialYears: ['2025-26', '2024-25', '2023-24', '2022-23'],
  months: ['May 2024', 'April 2024', 'March 2024', 'February 2024'],
  dates: ['31-05-2024', '30-04-2024', '31-03-2024'],
  regions: REGIONS,
  statuses: ['All Status', 'Submitted', 'Approved', 'Draft'],
};

export function getKpisFromOfficeList(officeList) {
  const totals = getRegionTotals(officeList);
  return {
    target: totals.target,
    ulm: totals.ulm,
    dm: totals.dm,
    um: totals.um,
    achievement: getAchievementPercent(totals.um, totals.target),
  };
}
