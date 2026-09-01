import { query } from '../postgres.js';

// Normalized child tables for Government Twisting Unit reports, replacing
// the client-computed/localStorage-rolled-over JSONB blob that used to be
// the only thing stored in poc_reports.data for this unit_type. poc_reports
// itself (id/office_id/unit_type/month/fiscal_year/status) is unchanged and
// still owns the report row's lifecycle (create/list/current/submit-lock) —
// these tables just hang field-level values off report_id.
//
// See conversation: adapted from a reference API's report_items/register_rows
// pattern, but Twisting is a REGISTER of multiple named units per report (not
// a single flat report), so per-unit sections use an explicit-column table
// (poc_twisting_units, mirroring the shape a register_rows table would take)
// while the one truly report-level section (Achievement to Target, office-
// wide per an earlier change) uses a generic key-value table
// (poc_report_items) reusable later for Government Reeling Unit's migration.

// [dbColumnPrefix, mis34Constants.js field key] — kept in sync manually since
// this is a one-time schema, not derived from the ESM client constants file.
const PRODUCTION_UNIT_FIELDS = [
  'days_worked', 'mandays_used', 'raw_silk_purchased', 'raw_silk_used_kg',
  'raw_silk_used_rs', 'production_of_twisted_raw_silk', 'total_value_of_production',
];
const NSC_UNIT_FIELDS = [
  'value_of_raw_silk_issued', 'wages_paid', 'eb_charges',
  'consumable_items', 'transport_cost', 'other_expenditures',
];
const COST_SALE_UNIT_FIELDS = ['sale_value_of_twisted_waste', 'estimated_sale_value_of_ready_silk'];

export const TWISTING_UNIT_ULM_DM_FIELDS = [...PRODUCTION_UNIT_FIELDS, ...NSC_UNIT_FIELDS, ...COST_SALE_UNIT_FIELDS];

// [dbColumnPrefix, client camelCase key] — the client (mis34Constants.js's
// PRODUCTION_TABLE_FIELDS/NSC_EXPENDITURE_TABLE_FIELDS/COST_SALE_TABLE_FIELDS)
// sends/receives `${camelKey}Dm`/`${camelKey}Ulm`; the DB uses `${dbPrefix}_dm`
// etc. Kept as one shared list so index.js's request-body mapping and the
// schema/migration above can't drift apart.
export const TWISTING_UNIT_FIELD_KEY_MAP = [
  ['days_worked', 'daysWorked'],
  ['mandays_used', 'mandaysUsed'],
  ['raw_silk_purchased', 'rawSilkPurchased'],
  ['raw_silk_used_kg', 'rawSilkUsedKg'],
  ['raw_silk_used_rs', 'rawSilkUsedRs'],
  ['production_of_twisted_raw_silk', 'productionOfTwistedRawSilk'],
  ['total_value_of_production', 'totalValueOfProduction'],
  ['value_of_raw_silk_issued', 'valueOfRawSilkIssued'],
  ['wages_paid', 'wagesPaid'],
  ['eb_charges', 'ebCharges'],
  ['consumable_items', 'consumableItems'],
  ['transport_cost', 'transportCost'],
  ['other_expenditures', 'otherExpenditures'],
  ['sale_value_of_twisted_waste', 'saleValueOfTwistedWaste'],
  ['estimated_sale_value_of_ready_silk', 'estimatedSaleValueOfReadySilk'],
];

function ulmDmUmColumns(field) {
  return `
    ${field}_ulm NUMERIC NOT NULL DEFAULT 0,
    ${field}_dm NUMERIC NOT NULL DEFAULT 0,
    ${field}_um NUMERIC GENERATED ALWAYS AS (${field}_ulm + ${field}_dm) STORED,`;
}

export async function initTwistingReportSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS poc_report_items (
      id SERIAL PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES poc_reports(id) ON DELETE CASCADE,
      section VARCHAR(60) NOT NULL,
      item_key VARCHAR(60) NOT NULL,
      field_key VARCHAR(60) NOT NULL,
      ulm_value NUMERIC NOT NULL DEFAULT 0,
      dm_value NUMERIC NOT NULL DEFAULT 0,
      um_value NUMERIC GENERATED ALWAYS AS (ulm_value + dm_value) STORED,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (report_id, section, item_key, field_key)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS poc_twisting_units (
      id SERIAL PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES poc_reports(id) ON DELETE CASCADE,
      unit_name VARCHAR(255) NOT NULL,
      unit_code VARCHAR(100),
      spindles_installed NUMERIC NOT NULL DEFAULT 0,
      installed_production_capacity NUMERIC NOT NULL DEFAULT 0,
      spindles_in_use NUMERIC NOT NULL DEFAULT 0,
      ${TWISTING_UNIT_ULM_DM_FIELDS.map(ulmDmUmColumns).join('')}
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (report_id, unit_name)
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_report_items_report ON poc_report_items(report_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_twisting_units_report ON poc_twisting_units(report_id);`);

  await migrateJsonbTwistingReports();
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// One-time, idempotent: unpack any existing government_twisting poc_reports
// row's JSONB `data` blob (the old localStorage-rollover shape — see
// mis34DefaultValues.js on the client) into the new normalized tables. Skips
// reports that already have rows in poc_twisting_units, so it's a no-op on
// every boot after the first. `data` itself is left in place, unused.
async function migrateJsonbTwistingReports() {
  const { rows: reports } = await query(
    `SELECT id, data FROM poc_reports
     WHERE unit_type = 'government_twisting'
       AND NOT EXISTS (SELECT 1 FROM poc_twisting_units WHERE report_id = poc_reports.id)`
  );
  if (reports.length === 0) return;

  let migrated = 0;
  for (const report of reports) {
    const data = report.data || {};
    const achievement = data.achievementToTarget;
    if (achievement) {
      await upsertReportItem(report.id, 'achievement_target', 'target', 'twistedSilkProductionKg', achievement.targetUlm, achievement.targetDm);
      await upsertReportItem(report.id, 'achievement_target', 'achieved', 'twistedSilkProductionKg', achievement.achievedUlm, achievement.achievedDm);
    }
    const units = Array.isArray(data.units) ? data.units : [];
    for (const unit of units) {
      if (!unit?.unitName) continue;
      await insertMigratedUnit(report.id, unit);
    }
    if (achievement || units.length > 0) migrated += 1;
  }
  if (migrated > 0) console.log(`✅ Migrated ${migrated} government_twisting report(s) from JSONB into poc_twisting_units/poc_report_items`);
}

async function upsertReportItem(reportId, section, itemKey, fieldKey, ulm, dm) {
  await query(
    `INSERT INTO poc_report_items (report_id, section, item_key, field_key, ulm_value, dm_value)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (report_id, section, item_key, field_key) DO NOTHING`,
    [reportId, section, itemKey, fieldKey, num(ulm), num(dm)]
  );
}

async function insertMigratedUnit(reportId, unit) {
  const pd = unit.productionDetails || {};
  const nsc = unit.nscExpenditure || {};
  const cs = unit.costSaleValue || {};
  const fieldMap = [
    ['days_worked', pd.daysWorkedUlm, pd.daysWorkedDm],
    ['mandays_used', pd.mandaysUsedUlm, pd.mandaysUsedDm],
    ['raw_silk_purchased', pd.rawSilkPurchasedUlm, pd.rawSilkPurchasedDm],
    ['raw_silk_used_kg', pd.rawSilkUsedKgUlm, pd.rawSilkUsedKgDm],
    ['raw_silk_used_rs', pd.rawSilkUsedRsUlm, pd.rawSilkUsedRsDm],
    ['production_of_twisted_raw_silk', pd.productionOfTwistedRawSilkUlm, pd.productionOfTwistedRawSilkDm],
    ['total_value_of_production', pd.totalValueOfProductionUlm, pd.totalValueOfProductionDm],
    ['value_of_raw_silk_issued', nsc.valueOfRawSilkIssuedUlm, nsc.valueOfRawSilkIssuedDm],
    ['wages_paid', nsc.wagesPaidUlm, nsc.wagesPaidDm],
    ['eb_charges', nsc.ebChargesUlm, nsc.ebChargesDm],
    ['consumable_items', nsc.consumableItemsUlm, nsc.consumableItemsDm],
    ['transport_cost', nsc.transportCostUlm, nsc.transportCostDm],
    ['other_expenditures', nsc.otherExpendituresUlm, nsc.otherExpendituresDm],
    ['sale_value_of_twisted_waste', cs.saleValueOfTwistedWasteUlm, cs.saleValueOfTwistedWasteDm],
    ['estimated_sale_value_of_ready_silk', cs.estimatedSaleValueOfReadySilkUlm, cs.estimatedSaleValueOfReadySilkDm],
  ];
  const cols = ['report_id', 'unit_name', 'unit_code', 'spindles_installed', 'installed_production_capacity', 'spindles_in_use'];
  const values = [reportId, unit.unitName, unit.unitCode || null, num(pd.spindlesInstalled), num(pd.installedProductionCapacity), num(pd.spindlesInUse)];
  fieldMap.forEach(([col, ulm, dm]) => {
    cols.push(`${col}_ulm`, `${col}_dm`);
    values.push(num(ulm), num(dm));
  });
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  await query(
    `INSERT INTO poc_twisting_units (${cols.join(', ')}) VALUES (${placeholders})
     ON CONFLICT (report_id, unit_name) DO NOTHING`,
    values
  );
}
