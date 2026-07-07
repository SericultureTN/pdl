import { fetchReport, saveDmData } from './misReports';

/** UI filter labels → database AD office names */
const AD_OFFICE_TO_DB: Record<string, string> = {
  'AD Hosur': 'Hosur',
  'AD Denkanikottai': 'Denkanikottai',
  'AD Krishnagiri': 'Krishnagiri',
  'AD Dharmapuri': 'Dharmapuri',
  'AD Pennagaram': 'Pennagaram',
  'AD Salem': 'Salem',
  'AD Coimbatore': 'Coimbatore',
  'AD Udumalaipettai': 'Udumalpettai',
  'AD Erode': 'Erode',
  'AD Talavady': 'Talavadi',
  'AD Coonoor': 'Coonoor',
  'AD Vaniyambadi': 'Vaniyambadi',
  'AD Tiruvannamalai': 'Thiruvannamalai',
  'AD Villupuram': 'Villuppuram',
  'AD Trichy': 'Trichy',
  'AD Namakkal': 'Namakkal',
  'AD Dindigul': 'Dindigul',
  'AD Theni': 'Theni',
  'AD Tenkasi': 'Tenkasi',
};

const UI_CATEGORY_TO_DB: Record<string, string> = {
  '2.00 Acre Category': '2.00 Acre',
  '1.00 Acre Category': '1.00 Acre',
  SCSP: 'SCSP',
  TSP: 'TSP',
};

const DB_CATEGORY_TO_UI: Record<string, string> = {
  '2.00 Acre': '2.00 Acre Category',
  '1.00 Acre': '1.00 Acre Category',
  SCSP: 'SCSP',
  TSP: 'TSP',
};

export function normalizeFinancialYear(value: string) {
  return String(value || '').replace(/\u2013/g, '-').replace(/–/g, '-').trim();
}

export function uiAdOfficeToDb(uiLabel: string) {
  if (AD_OFFICE_TO_DB[uiLabel]) return AD_OFFICE_TO_DB[uiLabel];
  return uiLabel.replace(/^AD\s+/i, '').trim();
}

export function uiCategoryToDb(uiCategory: string) {
  return UI_CATEGORY_TO_DB[uiCategory] || uiCategory;
}

export function dbCategoryToUi(dbCategory: string) {
  return DB_CATEGORY_TO_UI[dbCategory] || dbCategory;
}

export function schemeIdToSheetId(schemeId: string) {
  return `plantation-scheme-${schemeId}`;
}

export function dflsPageKeyToSheetId(pageKey: string) {
  if (pageKey === 'distribution') return 'dfls-distribution';
  if (pageKey === 'consumption') return 'dfls-consumption';
  if (pageKey === 'cocoon' || pageKey === 'cocoon-production') return 'cocoon-production';
  return `dfls-${pageKey}`;
}

function findEntryRow(report) {
  for (const region of report?.regions || []) {
    for (const row of region.rows || []) {
      return row;
    }
  }
  return null;
}

function emptyPlantationDm(categories) {
  return Object.fromEntries(
    categories.map((cat) => [cat, { acre: '', farmer: '' }])
  );
}

export async function loadPlantationSchemeEntry({ schemeId, region, adOffice, month, financialYear, uiCategories }) {
  const sheet = schemeIdToSheetId(schemeId);
  const report = await fetchReport({
    sheet,
    month,
    year: normalizeFinancialYear(financialYear),
    region,
    ad: uiAdOfficeToDb(adOffice),
  });

  const row = findEntryRow(report);
  if (!row) {
    return {
      adOfficeId: null,
      targetData: null,
      ulmData: emptyPlantationDm(uiCategories),
      dmData: emptyPlantationDm(uiCategories),
    };
  }

  const targetData = {};
  const ulmData = {};
  const dmData = emptyPlantationDm(uiCategories);

  for (const uiCat of uiCategories) {
    const dbCat = uiCategoryToDb(uiCat);
    const cat = row.categories?.[dbCat];
    if (!cat) continue;
    targetData[uiCat] = {
      acre: cat.target?.acre ?? 0,
      farmer: cat.target?.farmer ?? 0,
    };
    ulmData[uiCat] = {
      acre: cat.ulm?.acre ?? 0,
      farmer: cat.ulm?.farmer ?? 0,
    };
    dmData[uiCat] = {
      acre: cat.dm?.acre ?? '',
      farmer: cat.dm?.farmer ?? '',
    };
  }

  return {
    adOfficeId: row.adOfficeId,
    targetData,
    ulmData,
    dmData,
  };
}

export async function savePlantationSchemeEntry({ schemeId, adOfficeId, month, financialYear, dmData, uiCategories }) {
  const sheet = schemeIdToSheetId(schemeId);
  const year = normalizeFinancialYear(financialYear);

  for (const uiCat of uiCategories) {
    const dm = dmData[uiCat];
    const acre = Number(dm?.acre);
    const farmer = Number(dm?.farmer);
    if (!acre && !farmer) continue;

    await saveDmData({
      sheet,
      month,
      year,
      adOfficeId,
      category: uiCategoryToDb(uiCat),
      dm: { acre: acre || 0, farmer: farmer || 0 },
    });
  }
}

function normalizeDflsBlock(block, asForm = false) {
  const empty = (v) => (asForm ? (v ?? '') : Number(v) || 0);
  return {
    bv: {
      Govt: empty(block?.bv?.Govt),
      NSSO: empty(block?.bv?.NSSO),
      'TN Pvt': empty(block?.bv?.['TN Pvt']),
      'Other State': empty(block?.bv?.['Other State']),
    },
    cb: {
      'Other State': empty(block?.cb?.['Other State']),
      NSSO: empty(block?.cb?.NSSO),
    },
    p1: { value: empty(block?.p1?.value) },
  };
}

export async function loadDflsEntry({ pageKey, region, adOffice, month, financialYear }) {
  const sheet = dflsPageKeyToSheetId(pageKey);
  const report = await fetchReport({
    sheet,
    month,
    year: normalizeFinancialYear(financialYear),
    region,
    ad: uiAdOfficeToDb(adOffice),
  });

  const row = findEntryRow(report);
  if (!row) {
    return {
      adOfficeId: null,
      ulmData: normalizeDflsBlock({}, true),
      dmData: normalizeDflsBlock({}, true),
    };
  }

  return {
    adOfficeId: row.adOfficeId,
    ulmData: normalizeDflsBlock(row.ulm, false),
    dmData: normalizeDflsBlock(row.dm, true),
  };
}

export async function saveDflsEntry({ pageKey, adOfficeId, month, financialYear, dmData }) {
  const sheet = dflsPageKeyToSheetId(pageKey);
  const dm = normalizeDflsBlock(dmData, false);
  await saveDmData({
    sheet,
    month,
    year: normalizeFinancialYear(financialYear),
    adOfficeId,
    dm,
  });
}

export function getApiErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    'Unable to connect to the database. Please log in and ensure the API server is running.'
  );
}
