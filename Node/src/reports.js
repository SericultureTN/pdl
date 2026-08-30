import { query } from './postgres.js';

// Real backend persistence for the POC report entry forms (MIS-37 government
// reeling, MIS-34 twisting, MIS-40 private reeling), replacing the
// localStorage-only storage they used before. `data` is an opaque JSONB blob
// holding each form's own tab1/tab2/tab3 payload — mirrors how
// targets.physical_target/budget_annual and mis_dfls_data.ulm_json/dm_json
// already store form data in this codebase, rather than modeling every
// field as a column.

export async function initReportsSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS poc_reports (
      id SERIAL PRIMARY KEY,
      unit_type VARCHAR(30) NOT NULL CHECK (unit_type IN ('government_reeling', 'government_twisting', 'private_reeling')),
      unit_code VARCHAR(100),
      -- No FK: office_id means poc_offices(id) for private_reeling/
      -- government_twisting but govt_reeling_offices(id) for
      -- government_reeling — two disjoint tables that both use their own
      -- auto-incrementing ids, so a single database-level FK can't point at
      -- the right one. Every query is already scoped by unit_type, so this
      -- is unambiguous in practice; see govtReelingOffices.js.
      office_id INTEGER,
      month VARCHAR(20),
      fiscal_year VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      submitted_by_user_id INTEGER REFERENCES poc_users(id),
      submitted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  // Drops the FK that pre-existing databases still have from before
  // government_reeling offices moved to their own table (see comment above).
  await query(`ALTER TABLE poc_reports DROP CONSTRAINT IF EXISTS reports_office_id_fkey;`);

  await migrateMonthAndFiscalYearToInteger();

  // Widened from 'government_reeling' only to also cover 'government_twisting'
  // and 'private_reeling' as each of their register forms moved from
  // unitCode/annual keying to office/month keying (matching how reeling
  // reports already work). Old index definitions are dropped first since
  // CREATE ... IF NOT EXISTS won't alter an index that already exists under
  // the same name with a stale WHERE clause. reports_unit_key is now vacuous
  // (every current unit_type is monthly) but stays in place for any future
  // annual/unit-code-keyed report type. Also re-run (idempotently) after the
  // month/fiscal_year migration below, since DROP COLUMN silently drops any
  // index that depends on that column.
  await query(`DROP INDEX IF EXISTS reports_office_key;`);
  await query(`DROP INDEX IF EXISTS reports_unit_key;`);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS reports_office_key
      ON poc_reports (office_id, unit_type, fiscal_year, month)
      WHERE unit_type IN ('government_reeling', 'government_twisting', 'private_reeling');
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS reports_unit_key
      ON poc_reports (unit_code, unit_type, fiscal_year)
      WHERE unit_type NOT IN ('government_reeling', 'government_twisting', 'private_reeling');
  `);
}

export function isMonthlyReelingType(unitType) {
  return unitType === 'government_reeling' || unitType === 'government_twisting' || unitType === 'private_reeling';
}

// Idempotent, one-time column type migration: month TEXT ("April") ->
// INTEGER (1-12, fiscal order — April=1 .. March=12, matching
// FISCAL_MONTH_ORDER in Client/src/components/FiscalYearMonthPicker.jsx),
// fiscal_year TEXT ("2025-2026") -> INTEGER (the starting year, 2025). Every
// caller in this file keeps sending/receiving the familiar string forms —
// see monthNameToInt/monthIntToName/fiscalYearToInt/fiscalYearToString below
// — so this is purely a storage-layer change, invisible to the 3 report
// forms and their reportsApi.js clients.
async function migrateMonthAndFiscalYearToInteger() {
  const monthCol = await query(
    `SELECT data_type FROM information_schema.columns WHERE table_name = 'poc_reports' AND column_name = 'month'`
  );
  if (monthCol.rows[0]?.data_type === 'character varying') {
    await query(`ALTER TABLE poc_reports ADD COLUMN month_int INTEGER;`);
    await query(`
      UPDATE poc_reports SET month_int = CASE month
        WHEN 'April' THEN 1 WHEN 'May' THEN 2 WHEN 'June' THEN 3 WHEN 'July' THEN 4
        WHEN 'August' THEN 5 WHEN 'September' THEN 6 WHEN 'October' THEN 7
        WHEN 'November' THEN 8 WHEN 'December' THEN 9 WHEN 'January' THEN 10
        WHEN 'February' THEN 11 WHEN 'March' THEN 12 END
      WHERE month IS NOT NULL;
    `);
    await query(`ALTER TABLE poc_reports DROP COLUMN month;`);
    await query(`ALTER TABLE poc_reports RENAME COLUMN month_int TO month;`);
    await query(`ALTER TABLE poc_reports ADD CONSTRAINT month_range CHECK (month IS NULL OR month BETWEEN 1 AND 12);`);
    console.log('✅ Migrated poc_reports.month TEXT -> INTEGER');
  }

  const fyCol = await query(
    `SELECT data_type FROM information_schema.columns WHERE table_name = 'poc_reports' AND column_name = 'fiscal_year'`
  );
  if (fyCol.rows[0]?.data_type === 'character varying') {
    await query(`ALTER TABLE poc_reports ADD COLUMN fiscal_year_int INTEGER;`);
    await query(`UPDATE poc_reports SET fiscal_year_int = split_part(fiscal_year, '-', 1)::INTEGER;`);
    await query(`ALTER TABLE poc_reports DROP COLUMN fiscal_year;`);
    await query(`ALTER TABLE poc_reports RENAME COLUMN fiscal_year_int TO fiscal_year;`);
    await query(`ALTER TABLE poc_reports ALTER COLUMN fiscal_year SET NOT NULL;`);
    console.log('✅ Migrated poc_reports.fiscal_year TEXT -> INTEGER');
  }
}

// April=1 .. March=12 — matches FISCAL_MONTH_ORDER used across the client.
const FISCAL_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
];

function monthNameToInt(monthName) {
  if (!monthName) return null;
  const idx = FISCAL_MONTHS.indexOf(monthName);
  return idx === -1 ? null : idx + 1;
}

function monthIntToName(monthInt) {
  return monthInt == null ? null : FISCAL_MONTHS[monthInt - 1] ?? null;
}

function fiscalYearToInt(fiscalYear) {
  if (fiscalYear == null) return null;
  const startYear = parseInt(String(fiscalYear).split('-')[0], 10);
  return Number.isFinite(startYear) ? startYear : null;
}

function fiscalYearToString(startYear) {
  return startYear == null ? null : `${startYear}-${startYear + 1}`;
}

function toReportPayload(row) {
  if (!row) return null;
  return {
    id: row.id,
    unitType: row.unit_type,
    unitCode: row.unit_code,
    officeId: row.office_id,
    month: monthIntToName(row.month),
    fiscalYear: fiscalYearToString(row.fiscal_year),
    status: row.status,
    data: row.data || {},
    submittedByUserId: row.submitted_by_user_id,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const reportsService = {
  async getById(id) {
    const result = await query('SELECT * FROM poc_reports WHERE id = $1', [id]);
    return toReportPayload(result.rows[0]);
  },

  async getCurrent({ unitType, officeId, unitCode, fiscalYear, month }) {
    if (isMonthlyReelingType(unitType)) {
      const result = await query(
        'SELECT * FROM poc_reports WHERE unit_type = $1 AND office_id = $2 AND fiscal_year = $3 AND month = $4 LIMIT 1',
        [unitType, officeId, fiscalYearToInt(fiscalYear), monthNameToInt(month)]
      );
      return toReportPayload(result.rows[0]);
    }
    const result = await query(
      'SELECT * FROM poc_reports WHERE unit_type = $1 AND unit_code = $2 AND fiscal_year = $3 LIMIT 1',
      [unitType, unitCode, fiscalYearToInt(fiscalYear)]
    );
    return toReportPayload(result.rows[0]);
  },

  async list({ unitType, fiscalYear, officeId, sectionId, groupId }) {
    const conditions = ['unit_type = $1', 'fiscal_year = $2'];
    const params = [unitType, fiscalYearToInt(fiscalYear)];

    if (officeId) {
      params.push(officeId);
      conditions.push(`office_id = $${params.length}`);
    } else if (groupId || sectionId) {
      if (groupId) {
        params.push(groupId);
        conditions.push(`office_id IN (SELECT id FROM poc_offices WHERE group_id = $${params.length})`);
      } else if (sectionId) {
        params.push(sectionId);
        conditions.push(`office_id IN (SELECT id FROM poc_offices WHERE section_id = $${params.length})`);
      }
    }

    const result = await query(
      `SELECT * FROM poc_reports WHERE ${conditions.join(' AND ')} ORDER BY office_id ASC, month ASC, unit_code ASC`,
      params
    );
    return result.rows.map(toReportPayload);
  },

  // Upsert semantics: create the draft if it doesn't exist for this natural
  // key, otherwise update its data in place (drafts are edited, not
  // versioned like targets' revision history).
  async saveDraft({ unitType, officeId, unitCode, fiscalYear, month, data }) {
    const monthly = isMonthlyReelingType(unitType);
    const fiscalYearInt = fiscalYearToInt(fiscalYear);
    const monthInt = monthNameToInt(month);
    const existing = monthly
      ? await query('SELECT id FROM poc_reports WHERE unit_type = $1 AND office_id = $2 AND fiscal_year = $3 AND month = $4', [unitType, officeId, fiscalYearInt, monthInt])
      : await query('SELECT id FROM poc_reports WHERE unit_type = $1 AND unit_code = $2 AND fiscal_year = $3', [unitType, unitCode, fiscalYearInt]);

    if (existing.rows.length > 0) {
      const result = await query(
        'UPDATE poc_reports SET data = $1, updated_at = now() WHERE id = $2 RETURNING *',
        [data, existing.rows[0].id]
      );
      return toReportPayload(result.rows[0]);
    }

    const result = await query(
      `INSERT INTO poc_reports (unit_type, unit_code, office_id, month, fiscal_year, data)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [unitType, monthly ? null : unitCode, monthly ? officeId : null, monthly ? monthInt : null, fiscalYearInt, data]
    );
    return toReportPayload(result.rows[0]);
  },

  async updateData(id, data) {
    const result = await query(
      `UPDATE poc_reports SET data = $1, updated_at = now() WHERE id = $2 AND status = 'draft' RETURNING *`,
      [data, id]
    );
    return toReportPayload(result.rows[0]);
  },

  async submit(id, submittedByUserId) {
    const result = await query(
      `UPDATE poc_reports SET status = 'submitted', submitted_by_user_id = $1, submitted_at = now(), updated_at = now() WHERE id = $2 RETURNING *`,
      [submittedByUserId, id]
    );
    return toReportPayload(result.rows[0]);
  },
};
