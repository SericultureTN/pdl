import {
  REGIONS,
  FY_MONTHS,
  FINANCIAL_YEARS,
  PLANTATION_CATEGORIES,
  SCHEME_TARGETS,
  BV_ROWS,
  CB_ROWS,
  SHEETS,
  getSheetById,
  getAdOfficesForRegion,
  getNextMonthYear,
  num,
  computeUmFromUlmDm,
  computeDflsUm,
  dflsGrandTotal,
  sumPair,
} from './constants.js';
import { ensureMisMonthRecords } from './seed.js';

const SHEET_ALIASES = {
  plantation: 'plantation-overall',
  'plantation-overall': 'plantation-overall',
  'plantation-scheme-2024-25': 'plantation-scheme-2024-25',
  'plantation-scheme-2025-26': 'plantation-scheme-2025-26',
  'dfls-distribution': 'dfls-distribution',
  'dfls-consumption': 'dfls-consumption',
  'cocoon-production': 'cocoon-production',
};

function normalizeSheetId(sheet) {
  return SHEET_ALIASES[sheet] || sheet;
}

function normalizeRegion(region) {
  if (!region || region === 'All' || region === 'All Regions') return 'All';
  return region;
}

function normalizeAd(ad) {
  if (!ad || ad === 'All' || ad === 'All ADs') return 'All';
  return ad;
}

function parseDflsJson(raw) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {};
  } catch {
    return { bv: {}, cb: {}, p1: { value: 0 } };
  }
}

function emptyDflsBlock() {
  return {
    bv: Object.fromEntries(BV_ROWS.map((r) => [r, 0])),
    cb: Object.fromEntries(CB_ROWS.map((r) => [r, 0])),
    p1: { value: 0 },
  };
}

async function getOfficeMap(db) {
  const rows = await db.all(`
    SELECT o.id, o.name, r.name as region_name, r.id as region_id
    FROM mis_ad_offices o
    JOIN mis_regions r ON r.id = o.region_id
    ORDER BY r.id, o.id
  `);
  return rows;
}

function filterOffices(offices, region, ad) {
  let filtered = offices;
  if (region !== 'All') {
    filtered = filtered.filter((o) => o.region_name === region);
  }
  if (ad !== 'All') {
    filtered = filtered.filter((o) => o.name === ad);
  }
  return filtered;
}

function groupByRegion(offices) {
  const groups = [];
  const map = new Map();
  for (const office of offices) {
    if (!map.has(office.region_name)) {
      const group = { regionName: office.region_name, offices: [] };
      map.set(office.region_name, group);
      groups.push(group);
    }
    map.get(office.region_name).offices.push(office);
  }
  return groups;
}

function plantationKpis(rows) {
  const ulm = rows.reduce((acc, r) => sumPair(acc, r.ulm), { acre: 0, farmer: 0 });
  const dm = rows.reduce((acc, r) => sumPair(acc, r.dm), { acre: 0, farmer: 0 });
  return { ulm, dm, um: computeUmFromUlmDm(ulm, dm) };
}

function dflsKpis(rows) {
  const ulm = { bv: {}, cb: {}, p1: { value: 0 }, grandTotal: 0 };
  const dm = { bv: {}, cb: {}, p1: { value: 0 }, grandTotal: 0 };
  BV_ROWS.forEach((row) => {
    ulm.bv[row] = rows.reduce((t, r) => t + num(r.ulm?.bv?.[row]), 0);
    dm.bv[row] = rows.reduce((t, r) => t + num(r.dm?.bv?.[row]), 0);
  });
  ulm.bv.Total = BV_ROWS.reduce((t, row) => t + ulm.bv[row], 0);
  dm.bv.Total = BV_ROWS.reduce((t, row) => t + dm.bv[row], 0);
  CB_ROWS.forEach((row) => {
    ulm.cb[row] = rows.reduce((t, r) => t + num(r.ulm?.cb?.[row]), 0);
    dm.cb[row] = rows.reduce((t, r) => t + num(r.dm?.cb?.[row]), 0);
  });
  ulm.cb.Total = CB_ROWS.reduce((t, row) => t + ulm.cb[row], 0);
  dm.cb.Total = CB_ROWS.reduce((t, row) => t + dm.cb[row], 0);
  ulm.p1.value = rows.reduce((t, r) => t + num(r.ulm?.p1?.value), 0);
  dm.p1.value = rows.reduce((t, r) => t + num(r.dm?.p1?.value), 0);
  ulm.grandTotal = dflsGrandTotal(ulm);
  dm.grandTotal = dflsGrandTotal(dm);
  const um = computeDflsUm(ulm, dm);
  return { ulm, dm, um };
}

export async function getReport(db, { sheet, month, year, region, ad }, user = null) {
  const sheetId = normalizeSheetId(sheet);
  const sheetMeta = getSheetById(sheetId);
  const regionFilter = normalizeRegion(region);
  const adFilter = normalizeAd(ad);

  let effectiveRegion = regionFilter;
  if (user?.misRole === 'supervisor' && user.region_id) {
    const supervisorRegion = await db.get('SELECT name FROM mis_regions WHERE id = ?', [user.region_id]);
    if (supervisorRegion) {
      effectiveRegion = supervisorRegion.name;
    }
  }

  if (!FY_MONTHS.includes(month)) {
    throw new Error(`Invalid month: ${month}`);
  }
  if (!FINANCIAL_YEARS.includes(year)) {
    throw new Error(`Invalid financial year: ${year}`);
  }

  const allOffices = await getOfficeMap(db);
  const offices = filterOffices(allOffices, effectiveRegion, adFilter);

  const officeIdsToEnsure =
    adFilter !== 'All' && offices.length > 0
      ? offices.map((o) => o.id)
      : null;
  await ensureMisMonthRecords(db, month, year, officeIdsToEnsure);
  const regionGroups = groupByRegion(offices);

  let flatRows = [];
  let regions = [];
  let grandTotal = null;
  let kpis = null;

  if (sheetMeta.type === 'plantation-overall') {
    const result = await buildPlantationOverallReport(db, regionGroups, month, year);
    regions = result.regions;
    flatRows = result.flatRows;
    grandTotal = result.grandTotal;
    kpis = plantationKpis(flatRows);
  } else if (sheetMeta.type === 'plantation-scheme') {
    const result = await buildPlantationSchemeReport(db, regionGroups, month, year, sheetMeta.schemeYear);
    regions = result.regions;
    flatRows = result.flatRows;
    grandTotal = result.grandTotal;
    kpis = plantationKpis(flatRows.map((r) => ({ ulm: r.totals.ulm, dm: r.totals.dm })));
  } else if (sheetMeta.type === 'dfls' || sheetMeta.type === 'cocoon') {
    const sheetType = sheetMeta.sheetType;
    const result = await buildDflsReport(db, regionGroups, month, year, sheetType);
    regions = result.regions;
    flatRows = result.flatRows;
    grandTotal = result.grandTotal;
    kpis = dflsKpis(flatRows);
  }

  const canEditDm = user?.misRole === 'admin' || user?.misRole === 'ad_user';
  const editableAdIds =
    user?.misRole === 'admin'
      ? offices.map((o) => o.id)
      : user?.misRole === 'ad_user' && user.ad_office_id
        ? [user.ad_office_id]
        : [];

  return {
    ok: true,
    sheet: sheetMeta,
    filters: { month, year, region: effectiveRegion, ad: adFilter },
    kpis,
    regions,
    grandTotal,
    meta: {
      canEditDm,
      editableAdIds,
      regions: REGIONS.map((r) => ({ id: r.id, name: r.name })),
      adOffices: getAdOfficesForRegion(effectiveRegion === 'All' ? 'All Regions' : effectiveRegion),
      financialYears: FINANCIAL_YEARS,
      months: FY_MONTHS,
      sheets: SHEETS,
    },
  };
}

async function buildPlantationOverallReport(db, regionGroups, month, year) {
  let sno = 0;
  const flatRows = [];
  const regions = [];
  const grandAcc = { base: { acre: 0, farmer: 0 }, ulm: { acre: 0, farmer: 0 }, dm: { acre: 0, farmer: 0 }, um: { acre: 0, farmer: 0 } };

  for (const group of regionGroups) {
    const rows = [];
    const subtotal = { base: { acre: 0, farmer: 0 }, ulm: { acre: 0, farmer: 0 }, dm: { acre: 0, farmer: 0 }, um: { acre: 0, farmer: 0 } };

    for (const office of group.offices) {
      sno += 1;
      const record = await db.get(
        'SELECT * FROM mis_plantation_overall WHERE ad_office_id = ? AND month = ? AND financial_year = ?',
        [office.id, month, year]
      );
      const row = {
        sno,
        adOfficeId: office.id,
        adOffice: office.name,
        base: { acre: num(record?.base_acre), farmer: num(record?.base_farmer) },
        ulm: { acre: num(record?.ulm_acre), farmer: num(record?.ulm_farmer) },
        dm: { acre: num(record?.dm_acre), farmer: num(record?.dm_farmer) },
      };
      row.um = computeUmFromUlmDm(row.ulm, row.dm);
      rows.push(row);
      flatRows.push(row);

      subtotal.base = sumPair(subtotal.base, row.base);
      subtotal.ulm = sumPair(subtotal.ulm, row.ulm);
      subtotal.dm = sumPair(subtotal.dm, row.dm);
      subtotal.um = sumPair(subtotal.um, row.um);
    }

    grandAcc.base = sumPair(grandAcc.base, subtotal.base);
    grandAcc.ulm = sumPair(grandAcc.ulm, subtotal.ulm);
    grandAcc.dm = sumPair(grandAcc.dm, subtotal.dm);
    grandAcc.um = sumPair(grandAcc.um, subtotal.um);

    regions.push({ regionName: group.regionName, rows, subtotal });
  }

  return { regions, flatRows, grandTotal: grandAcc };
}

async function buildPlantationSchemeReport(db, regionGroups, month, year, schemeYear) {
  let sno = 0;
  const flatRows = [];
  const regions = [];
  const grandCategories = Object.fromEntries(
    PLANTATION_CATEGORIES.map((cat) => [
      cat,
      { target: SCHEME_TARGETS[cat], ulm: { acre: 0, farmer: 0 }, dm: { acre: 0, farmer: 0 }, um: { acre: 0, farmer: 0 } },
    ])
  );

  for (const group of regionGroups) {
    const rows = [];
    const subtotalCategories = Object.fromEntries(
      PLANTATION_CATEGORIES.map((cat) => [
        cat,
        { target: SCHEME_TARGETS[cat], ulm: { acre: 0, farmer: 0 }, dm: { acre: 0, farmer: 0 }, um: { acre: 0, farmer: 0 } },
      ])
    );

    for (const office of group.offices) {
      sno += 1;
      const categories = {};
      const totals = { ulm: { acre: 0, farmer: 0 }, dm: { acre: 0, farmer: 0 }, um: { acre: 0, farmer: 0 } };

      for (const category of PLANTATION_CATEGORIES) {
        const record = await db.get(
          `SELECT * FROM mis_plantation_scheme
           WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND scheme_year = ? AND category = ?`,
          [office.id, month, year, schemeYear, category]
        );
        const ulm = { acre: num(record?.ulm_acre), farmer: num(record?.ulm_farmer) };
        const dm = { acre: num(record?.dm_acre), farmer: num(record?.dm_farmer) };
        const um = computeUmFromUlmDm(ulm, dm);
        categories[category] = { target: SCHEME_TARGETS[category], ulm, dm, um };
        totals.ulm = sumPair(totals.ulm, ulm);
        totals.dm = sumPair(totals.dm, dm);
        totals.um = sumPair(totals.um, um);
        subtotalCategories[category].ulm = sumPair(subtotalCategories[category].ulm, ulm);
        subtotalCategories[category].dm = sumPair(subtotalCategories[category].dm, dm);
        subtotalCategories[category].um = sumPair(subtotalCategories[category].um, um);
        grandCategories[category].ulm = sumPair(grandCategories[category].ulm, ulm);
        grandCategories[category].dm = sumPair(grandCategories[category].dm, dm);
        grandCategories[category].um = sumPair(grandCategories[category].um, um);
      }

      const row = { sno, adOfficeId: office.id, adOffice: office.name, categories, totals };
      rows.push(row);
      flatRows.push(row);
    }

    regions.push({ regionName: group.regionName, rows, subtotal: { categories: subtotalCategories } });
  }

  return { regions, flatRows, grandTotal: { categories: grandCategories } };
}

async function buildDflsReport(db, regionGroups, month, year, sheetType) {
  let sno = 0;
  const flatRows = [];
  const regions = [];
  const grandAcc = { ulm: emptyDflsBlock(), dm: emptyDflsBlock(), um: emptyDflsBlock() };

  for (const group of regionGroups) {
    const rows = [];
    const subtotal = { ulm: emptyDflsBlock(), dm: emptyDflsBlock(), um: emptyDflsBlock() };

    for (const office of group.offices) {
      sno += 1;
      const record = await db.get(
        'SELECT * FROM mis_dfls_data WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND sheet_type = ?',
        [office.id, month, year, sheetType]
      );
      const ulm = parseDflsJson(record?.ulm_json);
      const dm = parseDflsJson(record?.dm_json);
      const um = computeDflsUm(ulm, dm);
      const row = { sno, adOfficeId: office.id, adOffice: office.name, ulm, dm, um };
      rows.push(row);
      flatRows.push(row);

      ['ulm', 'dm', 'um'].forEach((field) => {
        BV_ROWS.forEach((r) => {
          subtotal[field].bv[r] = num(subtotal[field].bv[r]) + num(row[field]?.bv?.[r]);
        });
        subtotal[field].bv.Total = BV_ROWS.reduce((t, r) => t + num(subtotal[field].bv[r]), 0);
        CB_ROWS.forEach((r) => {
          subtotal[field].cb[r] = num(subtotal[field].cb[r]) + num(row[field]?.cb?.[r]);
        });
        subtotal[field].cb.Total = CB_ROWS.reduce((t, r) => t + num(subtotal[field].cb[r]), 0);
        subtotal[field].p1.value = num(subtotal[field].p1.value) + num(row[field]?.p1?.value);
        subtotal[field].grandTotal = dflsGrandTotal(subtotal[field]);
      });
    }

    ['ulm', 'dm', 'um'].forEach((field) => {
      BV_ROWS.forEach((r) => {
        grandAcc[field].bv[r] = num(grandAcc[field].bv[r]) + num(subtotal[field].bv[r]);
      });
      grandAcc[field].bv.Total = BV_ROWS.reduce((t, r) => t + num(grandAcc[field].bv[r]), 0);
      CB_ROWS.forEach((r) => {
        grandAcc[field].cb[r] = num(grandAcc[field].cb[r]) + num(subtotal[field].cb[r]);
      });
      grandAcc[field].cb.Total = CB_ROWS.reduce((t, r) => t + num(grandAcc[field].cb[r]), 0);
      grandAcc[field].p1.value = num(grandAcc[field].p1.value) + num(subtotal[field].p1.value);
      grandAcc[field].grandTotal = dflsGrandTotal(grandAcc[field]);
    });

    regions.push({ regionName: group.regionName, rows, subtotal });
  }

  return { regions, flatRows, grandTotal: grandAcc };
}

export async function saveDmData(db, payload, user) {
  const { sheet, month, year, adOfficeId, dm, category } = payload;
  const sheetId = normalizeSheetId(sheet);
  const sheetMeta = getSheetById(sheetId);

  if (!user || (user.misRole !== 'admin' && user.misRole !== 'ad_user')) {
    throw new Error('Not authorized to save DM data');
  }
  if (user.misRole === 'ad_user' && user.ad_office_id !== adOfficeId) {
    throw new Error('You can only edit data for your assigned AD office');
  }
  if (!FY_MONTHS.includes(month) || !FINANCIAL_YEARS.includes(year)) {
    throw new Error('Invalid month or financial year');
  }

  await ensureMisMonthRecords(db, month, year);

  if (sheetMeta.type === 'plantation-overall') {
    await db.run(
      `UPDATE mis_plantation_overall SET dm_acre = ?, dm_farmer = ?
       WHERE ad_office_id = ? AND month = ? AND financial_year = ?`,
      [num(dm?.acre), num(dm?.farmer), adOfficeId, month, year]
    );
  } else if (sheetMeta.type === 'plantation-scheme') {
    if (!category || !PLANTATION_CATEGORIES.includes(category)) {
      throw new Error('Invalid scheme category');
    }
    await db.run(
      `UPDATE mis_plantation_scheme SET dm_acre = ?, dm_farmer = ?
       WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND scheme_year = ? AND category = ?`,
      [num(dm?.acre), num(dm?.farmer), adOfficeId, month, year, sheetMeta.schemeYear, category]
    );
  } else if (sheetMeta.type === 'dfls' || sheetMeta.type === 'cocoon') {
    const existing = await db.get(
      'SELECT dm_json FROM mis_dfls_data WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND sheet_type = ?',
      [adOfficeId, month, year, sheetMeta.sheetType]
    );
    const current = parseDflsJson(existing?.dm_json);
    const merged = {
      bv: { ...emptyDflsBlock().bv, ...current.bv, ...(dm?.bv || {}) },
      cb: { ...emptyDflsBlock().cb, ...current.cb, ...(dm?.cb || {}) },
      p1: { value: num(dm?.p1?.value ?? current.p1?.value) },
    };
    await db.run(
      `UPDATE mis_dfls_data SET dm_json = ?
       WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND sheet_type = ?`,
      [JSON.stringify(merged), adOfficeId, month, year, sheetMeta.sheetType]
    );
  } else {
    throw new Error('Unsupported sheet type');
  }

  return getReport(db, { sheet: sheetId, month, year, region: 'All', ad: 'All' }, user);
}

export async function rolloverMonth(db, month, year) {
  if (!FY_MONTHS.includes(month) || !FINANCIAL_YEARS.includes(year)) {
    throw new Error('Invalid month or financial year');
  }

  const next = getNextMonthYear(month, year);
  const offices = await db.all('SELECT id FROM mis_ad_offices');

  for (const office of offices) {
    const overall = await db.get(
      'SELECT * FROM mis_plantation_overall WHERE ad_office_id = ? AND month = ? AND financial_year = ?',
      [office.id, month, year]
    );
    if (!overall) continue;

    const umAcre = num(overall.ulm_acre) + num(overall.dm_acre);
    const umFarmer = num(overall.ulm_farmer) + num(overall.dm_farmer);

    const nextOverall = await db.get(
      'SELECT id FROM mis_plantation_overall WHERE ad_office_id = ? AND month = ? AND financial_year = ?',
      [office.id, next.month, next.year]
    );
    if (nextOverall) {
      await db.run(
        `UPDATE mis_plantation_overall SET ulm_acre = ?, ulm_farmer = ?, dm_acre = 0, dm_farmer = 0
         WHERE ad_office_id = ? AND month = ? AND financial_year = ?`,
        [umAcre, umFarmer, office.id, next.month, next.year]
      );
    } else {
      await db.run(
        `INSERT INTO mis_plantation_overall
         (ad_office_id, month, financial_year, base_acre, base_farmer, ulm_acre, ulm_farmer, dm_acre, dm_farmer)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [office.id, next.month, next.year, overall.base_acre, overall.base_farmer, umAcre, umFarmer]
      );
    }

    for (const schemeYear of FINANCIAL_YEARS) {
      for (const category of PLANTATION_CATEGORIES) {
        const scheme = await db.get(
          `SELECT * FROM mis_plantation_scheme
           WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND scheme_year = ? AND category = ?`,
          [office.id, month, year, schemeYear, category]
        );
        if (!scheme) continue;
        const umA = num(scheme.ulm_acre) + num(scheme.dm_acre);
        const umF = num(scheme.ulm_farmer) + num(scheme.dm_farmer);
        const nextScheme = await db.get(
          `SELECT id FROM mis_plantation_scheme
           WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND scheme_year = ? AND category = ?`,
          [office.id, next.month, next.year, schemeYear, category]
        );
        if (nextScheme) {
          await db.run(
            `UPDATE mis_plantation_scheme SET ulm_acre = ?, ulm_farmer = ?, dm_acre = 0, dm_farmer = 0
             WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND scheme_year = ? AND category = ?`,
            [umA, umF, office.id, next.month, next.year, schemeYear, category]
          );
        } else {
          await db.run(
            `INSERT INTO mis_plantation_scheme
             (ad_office_id, month, financial_year, scheme_year, category, ulm_acre, ulm_farmer, dm_acre, dm_farmer)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
            [office.id, next.month, next.year, schemeYear, category, umA, umF]
          );
        }
      }
    }

    for (const sheetType of ['distribution', 'consumption', 'cocoon']) {
      const dfls = await db.get(
        'SELECT * FROM mis_dfls_data WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND sheet_type = ?',
        [office.id, month, year, sheetType]
      );
      if (!dfls) continue;
      const ulm = parseDflsJson(dfls.ulm_json);
      const dm = parseDflsJson(dfls.dm_json);
      const um = computeDflsUm(ulm, dm);
      const nextDfls = await db.get(
        'SELECT id FROM mis_dfls_data WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND sheet_type = ?',
        [office.id, next.month, next.year, sheetType]
      );
      const nextUlm = um;
      const nextDm = emptyDflsBlock();
      if (nextDfls) {
        await db.run(
          `UPDATE mis_dfls_data SET ulm_json = ?, dm_json = ?
           WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND sheet_type = ?`,
          [JSON.stringify(nextUlm), JSON.stringify(nextDm), office.id, next.month, next.year, sheetType]
        );
      } else {
        await db.run(
          `INSERT INTO mis_dfls_data (ad_office_id, month, financial_year, sheet_type, ulm_json, dm_json)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [office.id, next.month, next.year, sheetType, JSON.stringify(nextUlm), JSON.stringify(nextDm)]
        );
      }
    }
  }

  return { ok: true, from: { month, year }, to: next, officesProcessed: offices.length };
}

export async function buildExcelWorkbook(db, { month, year, region, ad }) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  for (const sheet of SHEETS) {
    const report = await getReport(db, { sheet: sheet.id, month, year, region, ad });
    const rows = [];

    if (sheet.type === 'plantation-overall') {
      rows.push(['S.No', 'AD Office', 'Base Acre', 'Base Farmer', 'ULM Acre', 'ULM Farmer', 'DM Acre', 'DM Farmer', 'UM Acre', 'UM Farmer']);
      for (const regionBlock of report.regions) {
        rows.push([regionBlock.regionName]);
        for (const row of regionBlock.rows) {
          rows.push([
            row.sno, row.adOffice,
            row.base.acre, row.base.farmer,
            row.ulm.acre, row.ulm.farmer,
            row.dm.acre, row.dm.farmer,
            row.um.acre, row.um.farmer,
          ]);
        }
      }
    } else if (sheet.type === 'plantation-scheme') {
      rows.push(['S.No', 'AD Office', 'Category', 'Target Acre', 'ULM Acre', 'ULM Farmer', 'DM Acre', 'DM Farmer', 'UM Acre', 'UM Farmer']);
      for (const regionBlock of report.regions) {
        rows.push([regionBlock.regionName]);
        for (const row of regionBlock.rows) {
          for (const category of PLANTATION_CATEGORIES) {
            const cat = row.categories[category];
            rows.push([
              row.sno, row.adOffice, category, cat.target.acre,
              cat.ulm.acre, cat.ulm.farmer, cat.dm.acre, cat.dm.farmer, cat.um.acre, cat.um.farmer,
            ]);
          }
        }
      }
    } else {
      rows.push(['S.No', 'AD Office', 'Group', 'Field', 'ULM', 'DM', 'UM']);
      for (const regionBlock of report.regions) {
        rows.push([regionBlock.regionName]);
        for (const row of regionBlock.rows) {
          BV_ROWS.forEach((r) => {
            rows.push([row.sno, row.adOffice, 'BV', r, row.ulm.bv[r], row.dm.bv[r], row.um.bv[r]]);
          });
          rows.push([row.sno, row.adOffice, 'BV', 'Total', row.ulm.bv.Total, row.dm.bv.Total, row.um.bv.Total]);
          CB_ROWS.forEach((r) => {
            rows.push([row.sno, row.adOffice, 'CB', r, row.ulm.cb[r], row.dm.cb[r], row.um.cb[r]]);
          });
          rows.push([row.sno, row.adOffice, 'CB', 'Total', row.ulm.cb.Total, row.dm.cb.Total, row.um.cb.Total]);
          rows.push([row.sno, row.adOffice, 'P1', 'P1', row.ulm.p1.value, row.dm.p1.value, row.um.p1.value]);
          rows.push([row.sno, row.adOffice, 'Grand', 'Total', row.ulm.grandTotal, row.dm.grandTotal, row.um.grandTotal]);
        }
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.label.slice(0, 31));
  }

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
