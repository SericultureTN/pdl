import {
  REGIONS,
  FY_MONTHS,
  FINANCIAL_YEARS,
  PLANTATION_CATEGORIES,
  BV_ROWS,
  CB_ROWS,
} from './constants.js';

export const SAMPLE_ULM = { acre: 8, farmer: 4 };
export const SAMPLE_DM = { acre: 0, farmer: 0 };
export const SAMPLE_BASE = { acre: 120, farmer: 60 };

export const SAMPLE_DFLs_ULM = {
  bv: { Govt: 120, NSSO: 85, 'TN Pvt': 45, 'Other State': 30 },
  cb: { 'Other State': 22, NSSO: 18 },
  p1: { value: 50 },
};

function getPreviousMonthYear(month, year) {
  const idx = FY_MONTHS.indexOf(month);
  if (idx <= 0) {
    const start = parseInt(year.split('-')[0], 10) - 1;
    return { month: 'March', year: `${start}-${String(start + 1).slice(-2)}` };
  }
  return { month: FY_MONTHS[idx - 1], year };
}

export async function seedMisIfEmpty(db) {
  const regionCount = await db.get('SELECT COUNT(*) as count FROM mis_regions');
  const count = Number(regionCount?.count ?? 0);
  if (count > 0) return;

  for (const region of REGIONS) {
    const result = await db.run('INSERT INTO mis_regions (name) VALUES (?)', [region.name]);
    const regionId = result.lastID;
    for (const office of region.adOffices) {
      await db.run('INSERT INTO mis_ad_offices (name, region_id) VALUES (?, ?)', [office, regionId]);
    }
  }

  const offices = await db.all('SELECT id FROM mis_ad_offices ORDER BY id');
  const defaultMonth = 'July';
  const defaultYear = '2025-26';

  for (const office of offices) {
    await db.run(
      `INSERT INTO mis_plantation_overall
       (ad_office_id, month, financial_year, base_acre, base_farmer, ulm_acre, ulm_farmer, dm_acre, dm_farmer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        office.id,
        defaultMonth,
        defaultYear,
        SAMPLE_BASE.acre,
        SAMPLE_BASE.farmer,
        SAMPLE_ULM.acre,
        SAMPLE_ULM.farmer,
        SAMPLE_DM.acre,
        SAMPLE_DM.farmer,
      ]
    );

    for (const schemeYear of FINANCIAL_YEARS) {
      for (const category of PLANTATION_CATEGORIES) {
        await db.run(
          `INSERT INTO mis_plantation_scheme
           (ad_office_id, month, financial_year, scheme_year, category, ulm_acre, ulm_farmer, dm_acre, dm_farmer)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            office.id,
            defaultMonth,
            defaultYear,
            schemeYear,
            category,
            SAMPLE_ULM.acre,
            SAMPLE_ULM.farmer,
            SAMPLE_DM.acre,
            SAMPLE_DM.farmer,
          ]
        );
      }
    }

    for (const sheetType of ['distribution', 'consumption', 'cocoon']) {
      await db.run(
        `INSERT INTO mis_dfls_data (ad_office_id, month, financial_year, sheet_type, ulm_json, dm_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          office.id,
          defaultMonth,
          defaultYear,
          sheetType,
          JSON.stringify(SAMPLE_DFLs_ULM),
          JSON.stringify({
            bv: Object.fromEntries(BV_ROWS.map((r) => [r, 0])),
            cb: Object.fromEntries(CB_ROWS.map((r) => [r, 0])),
            p1: { value: 0 },
          }),
        ]
      );
    }
  }

  console.log('✅ MIS reference data and sample records seeded');
}

export async function ensureMisMonthRecords(db, month, financialYear, officeIds = null) {
  let offices;
  if (officeIds?.length) {
    const placeholders = officeIds.map(() => '?').join(', ');
    offices = await db.all(
      `SELECT id FROM mis_ad_offices WHERE id IN (${placeholders})`,
      officeIds
    );
  } else {
    offices = await db.all('SELECT id FROM mis_ad_offices');
  }

  for (const office of offices) {
    const existing = await db.get(
      'SELECT id FROM mis_plantation_overall WHERE ad_office_id = ? AND month = ? AND financial_year = ?',
      [office.id, month, financialYear]
    );
    if (existing) continue;

    const prev = getPreviousMonthYear(month, financialYear);
    const prevRow = await db.get(
      'SELECT * FROM mis_plantation_overall WHERE ad_office_id = ? AND month = ? AND financial_year = ?',
      [office.id, prev.month, prev.year]
    );

    const ulmAcre = prevRow ? Number(prevRow.ulm_acre) + Number(prevRow.dm_acre) : SAMPLE_ULM.acre;
    const ulmFarmer = prevRow ? Number(prevRow.ulm_farmer) + Number(prevRow.dm_farmer) : SAMPLE_ULM.farmer;

    await db.run(
      `INSERT INTO mis_plantation_overall
       (ad_office_id, month, financial_year, base_acre, base_farmer, ulm_acre, ulm_farmer, dm_acre, dm_farmer)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [office.id, month, financialYear, SAMPLE_BASE.acre, SAMPLE_BASE.farmer, ulmAcre, ulmFarmer]
    );

    for (const schemeYear of FINANCIAL_YEARS) {
      for (const category of PLANTATION_CATEGORIES) {
        const prevScheme = await db.get(
          `SELECT * FROM mis_plantation_scheme
           WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND scheme_year = ? AND category = ?`,
          [office.id, prev.month, prev.year, schemeYear, category]
        );
        const sUlmA = prevScheme ? Number(prevScheme.ulm_acre) + Number(prevScheme.dm_acre) : SAMPLE_ULM.acre;
        const sUlmF = prevScheme ? Number(prevScheme.ulm_farmer) + Number(prevScheme.dm_farmer) : SAMPLE_ULM.farmer;
        await db.run(
          `INSERT INTO mis_plantation_scheme
           (ad_office_id, month, financial_year, scheme_year, category, ulm_acre, ulm_farmer, dm_acre, dm_farmer)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
          [office.id, month, financialYear, schemeYear, category, sUlmA, sUlmF]
        );
      }
    }

    for (const sheetType of ['distribution', 'consumption', 'cocoon']) {
      const prevDfls = await db.get(
        'SELECT * FROM mis_dfls_data WHERE ad_office_id = ? AND month = ? AND financial_year = ? AND sheet_type = ?',
        [office.id, prev.month, prev.year, sheetType]
      );
      let ulmJson = JSON.stringify(SAMPLE_DFLs_ULM);
      if (prevDfls) {
        try {
          const ulm = JSON.parse(prevDfls.ulm_json || '{}');
          const dm = JSON.parse(prevDfls.dm_json || '{}');
          const merged = {
            bv: {},
            cb: {},
            p1: { value: (ulm.p1?.value || 0) + (dm.p1?.value || 0) },
          };
          BV_ROWS.forEach((r) => {
            merged.bv[r] = (ulm.bv?.[r] || 0) + (dm.bv?.[r] || 0);
          });
          CB_ROWS.forEach((r) => {
            merged.cb[r] = (ulm.cb?.[r] || 0) + (dm.cb?.[r] || 0);
          });
          ulmJson = JSON.stringify(merged);
        } catch {
          ulmJson = prevDfls.ulm_json;
        }
      }
      const emptyDm = JSON.stringify({
        bv: Object.fromEntries(BV_ROWS.map((r) => [r, 0])),
        cb: Object.fromEntries(CB_ROWS.map((r) => [r, 0])),
        p1: { value: 0 },
      });
      await db.run(
        `INSERT INTO mis_dfls_data (ad_office_id, month, financial_year, sheet_type, ulm_json, dm_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [office.id, month, financialYear, sheetType, ulmJson, emptyDm]
      );
    }
  }
}
