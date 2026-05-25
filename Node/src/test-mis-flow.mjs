/**
 * MIS Full Flow Test
 * Run: node src/test-mis-flow.mjs
 * Requires the Node server to NOT be running (uses DB directly).
 */

import { query } from './postgres.js';

const OFFICE   = 'AD Dharmapuri';
const SCHEME   = 'Plantation Overall';
const YEAR     = '2025-26';
const MONTH_1  = 'April';
const MONTH_2  = 'May';

async function run() {
  console.log('\n══════════════════════════════════════════');
  console.log('  MIS Full Flow Test');
  console.log('══════════════════════════════════════════\n');

  // ── 0. Clean up any previous test data ──────────────────────────────
  await query(`
    DELETE FROM mis_reports r
    USING ad_offices o, schemes s, financial_years fy, months m
    WHERE r.office_id = o.id AND r.scheme_id = s.id
      AND r.financial_year_id = fy.id AND r.month_id = m.id
      AND o.office_name = $1 AND s.scheme_name = $2
      AND fy.year_name = $3 AND m.month_name IN ($4, $5)
  `, [OFFICE, SCHEME, YEAR, MONTH_1, MONTH_2]);
  console.log('✓ Cleaned up previous test records\n');

  // ── 1. Resolve IDs ───────────────────────────────────────────────────
  const officeR = await query('SELECT id, region_id FROM ad_offices WHERE office_name=$1', [OFFICE]);
  const schemeR = await query('SELECT id FROM schemes WHERE scheme_name=$1', [SCHEME]);
  const yearR   = await query('SELECT id FROM financial_years WHERE year_name=$1', [YEAR]);
  const month1R = await query('SELECT id FROM months WHERE month_name=$1', [MONTH_1]);
  const month2R = await query('SELECT id FROM months WHERE month_name=$1', [MONTH_2]);

  const officeId = officeR.rows[0]?.id;
  const regionId = officeR.rows[0]?.region_id;
  const schemeId = schemeR.rows[0]?.id;
  const yearId   = yearR.rows[0]?.id;
  const m1Id     = month1R.rows[0]?.id;
  const m2Id     = month2R.rows[0]?.id;

  if (!officeId || !schemeId || !yearId || !m1Id || !m2Id) {
    console.error('✗ Could not resolve IDs — check master data seeding');
    console.log({ officeId, schemeId, yearId, m1Id, m2Id });
    process.exit(1);
  }
  console.log(`✓ IDs resolved: office=${officeId} scheme=${schemeId} year=${yearId} m1=${m1Id} m2=${m2Id}\n`);

  // ── 2. Save April Draft (DM = 50 acre, 10 farmer) ───────────────────
  const aprilInsert = await query(`
    INSERT INTO mis_reports
      (office_id, region_id, scheme_id, financial_year_id, month_id,
       ulm_acre, ulm_farmer, dm_acre, dm_farmer, um_acre, um_farmer, status)
    VALUES ($1,$2,$3,$4,$5, 0,0, 50,10, 50,10, 'Draft')
    RETURNING *
  `, [officeId, regionId, schemeId, yearId, m1Id]);

  const april = aprilInsert.rows[0];
  console.log(`✓ April Draft saved — DM=${april.dm_acre} UM=${april.um_acre} ULM=${april.ulm_acre}`);
  assert(april.dm_acre == 50,  `April DM should be 50, got ${april.dm_acre}`);
  assert(april.um_acre == 50,  `April UM should be 50, got ${april.um_acre}`);
  assert(april.ulm_acre == 0,  `April ULM should be 0, got ${april.ulm_acre}`);

  // ── 3. Load May — should carry forward April's UM as ULM ─────────────
  const prevReport = await query(`
    SELECT um_acre, um_farmer FROM mis_reports
    WHERE office_id=$1 AND scheme_id=$2 AND financial_year_id=$3 AND month_id=$4
    ORDER BY CASE status WHEN 'Approved' THEN 1 WHEN 'Submitted' THEN 2 WHEN 'Draft' THEN 3 ELSE 4 END
    LIMIT 1
  `, [officeId, schemeId, yearId, m1Id]);

  const prevUM = prevReport.rows[0];
  console.log(`✓ Prev month UM fetched — um_acre=${prevUM?.um_acre} um_farmer=${prevUM?.um_farmer}`);
  assert(prevUM,                     'Should find April Draft for carry-forward');
  assert(prevUM.um_acre == 50,       `Prev UM should be 50, got ${prevUM?.um_acre}`);

  // ── 4. Save May Draft (ULM = April UM = 50, DM = 20) ────────────────
  const ulmAcre = parseFloat(prevUM.um_acre) || 0;
  const dmAcre  = 20;
  const umAcre  = ulmAcre + dmAcre;

  const mayInsert = await query(`
    INSERT INTO mis_reports
      (office_id, region_id, scheme_id, financial_year_id, month_id,
       ulm_acre, ulm_farmer, dm_acre, dm_farmer, um_acre, um_farmer, status)
    VALUES ($1,$2,$3,$4,$5, $6,0, $7,5, $8,5, 'Draft')
    RETURNING *
  `, [officeId, regionId, schemeId, yearId, m2Id, ulmAcre, dmAcre, umAcre]);

  const may = mayInsert.rows[0];
  console.log(`✓ May Draft saved — ULM=${may.ulm_acre} DM=${may.dm_acre} UM=${may.um_acre}`);
  assert(may.ulm_acre == 50, `May ULM should be 50 (carry-forward), got ${may.ulm_acre}`);
  assert(may.dm_acre  == 20, `May DM should be 20, got ${may.dm_acre}`);
  assert(may.um_acre  == 70, `May UM should be 70 (50+20), got ${may.um_acre}`);

  // ── 5. Re-save May (update DM to 30) — ULM must be preserved ────────
  const mayUpdate = await query(`
    UPDATE mis_reports SET dm_acre=30, um_acre=$1, updated_at=CURRENT_TIMESTAMP
    WHERE office_id=$2 AND scheme_id=$3 AND financial_year_id=$4 AND month_id=$5
    RETURNING *
  `, [ulmAcre + 30, officeId, schemeId, yearId, m2Id]);

  const mayUpdated = mayUpdate.rows[0];
  console.log(`✓ May re-saved — ULM=${mayUpdated.ulm_acre} DM=${mayUpdated.dm_acre} UM=${mayUpdated.um_acre}`);
  assert(mayUpdated.ulm_acre == 50, `May ULM should still be 50, got ${mayUpdated.ulm_acre}`);
  assert(mayUpdated.dm_acre  == 30, `May DM should be 30, got ${mayUpdated.dm_acre}`);
  assert(mayUpdated.um_acre  == 80, `May UM should be 80 (50+30), got ${mayUpdated.um_acre}`);

  // ── 6. Submit April → UM becomes 50 ─────────────────────────────────
  await query(
    `UPDATE mis_reports SET status='Submitted' WHERE id=$1`,
    [april.id]
  );
  console.log(`✓ April submitted`);

  // ── 7. Final: verify May ULM still = 50 after April submitted ────────
  const mayFinal = await query(
    `SELECT * FROM mis_reports WHERE office_id=$1 AND scheme_id=$2 AND financial_year_id=$3 AND month_id=$4`,
    [officeId, schemeId, yearId, m2Id]
  );
  assert(mayFinal.rows[0].ulm_acre == 50, `May ULM should remain 50, got ${mayFinal.rows[0].ulm_acre}`);
  console.log(`✓ May ULM unchanged after April submitted\n`);

  // ── Cleanup ──────────────────────────────────────────────────────────
  await query(`DELETE FROM mis_reports WHERE id IN ($1, $2)`, [april.id, mayFinal.rows[0].id]);
  console.log('✓ Test records cleaned up\n');
  console.log('══════════════════════════════════════════');
  console.log('  ALL TESTS PASSED ✓');
  console.log('══════════════════════════════════════════\n');
  process.exit(0);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`\n✗ ASSERTION FAILED: ${message}\n`);
    process.exit(1);
  }
}

run().catch(e => {
  console.error('\n✗ Test error:', e.message);
  process.exit(1);
});
