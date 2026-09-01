import { query } from './postgres.js';

// Section-aware office hierarchy: sections -> groups -> offices.
// Replaces the old, section-specific regions/market_offices (POC) and
// mis_regions/mis_ad_offices (MIS) tables with one generic schema.

const SECTION_DEFS = [
  { code: 'POC', name: 'POC', groupLabel: 'Region', officeLabel: 'Market Office' },
  { code: 'MIS', name: 'MIS', groupLabel: 'Region/Unit Group', officeLabel: 'AD Office' },
  { code: 'PLS', name: 'PLS', groupLabel: 'Group', officeLabel: 'Office' },
  { code: 'PRC', name: 'PRC', groupLabel: 'Group', officeLabel: 'Office' },
];

// Used only when there's no legacy table to migrate from (a genuinely fresh
// database) — same data that used to live in postgres.js/mis/constants.js.
const FALLBACK_SEED = {
  // Private Reeling Unit's office list (19 offices) — see also
  // reconcilePocOfficeList() below, which brings an already-seeded database
  // in line with this same list on every boot (this FALLBACK_SEED only
  // fires once, on a genuinely fresh database with no groups yet).
  POC: [
    { group: 'Dharmapuri', offices: ['Hosur', 'Denkanikottai', 'Krishnagiri', 'Dharmapuri', 'Pennagaram'] },
    { group: 'Erode', offices: ['Salem', 'Coimbatore', 'Udumalpet', 'Erode', 'Talavady', 'Coonoor'] },
    { group: 'Vellore', offices: ['Vaniyambadi', 'Tiruvannamalai', 'Villupuram'] },
    { group: 'Trichy', offices: ['Trichy', 'Namakkal'] },
    { group: 'Madurai', offices: ['Dindigul', 'Theni', 'Tenkasi'] },
  ],
  MIS: [
    { group: 'Dharmapuri Region', offices: ['Hosur', 'Denkanikottai', 'Krishnagiri', 'Dharmapuri', 'Pennagaram'] },
    { group: 'Erode Region', offices: ['Salem', 'Coimbatore', 'Udumalpettai', 'Erode', 'Talavadi', 'Coonoor'] },
    { group: 'Vellore Region', offices: ['Vaniyambadi', 'Thiruvannamalai', 'Villuppuram'] },
    { group: 'Trichy Region', offices: ['Trichy', 'Namakkal'] },
    { group: 'Madurai Region', offices: ['Dindigul', 'Theni', 'Tenkasi'] },
  ],
};

export async function initHierarchySchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS sections (
      id SERIAL PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      group_label VARCHAR(50) NOT NULL DEFAULT 'Group',
      office_label VARCHAR(50) NOT NULL DEFAULT 'Office'
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      section_id INTEGER NOT NULL REFERENCES sections(id),
      name VARCHAR(255) NOT NULL,
      UNIQUE(section_id, name)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS poc_offices (
      id SERIAL PRIMARY KEY,
      section_id INTEGER NOT NULL REFERENCES sections(id),
      group_id INTEGER NOT NULL REFERENCES groups(id),
      name VARCHAR(255) NOT NULL,
      UNIQUE(group_id, name)
    );
  `);
}

async function tableExists(name) {
  const result = await query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return result.rows.length > 0;
}

// Looks up the FK constraint on table.column, if any, via information_schema
// rather than assuming Postgres's default naming.
async function findForeignKey(table, column) {
  const result = await query(
    `
    SELECT tc.constraint_name, ccu.table_name AS ref_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = $1
      AND kcu.column_name = $2
    `,
    [table, column]
  );
  return result.rows[0] || null;
}

// Drops the FK constraint on table.column if it still points at legacyTable.
// Must run BEFORE the value UPDATE — otherwise the new (already-repointed)
// values violate the still-active old constraint.
async function dropForeignKeyIfPointsTo(table, column, legacyTable) {
  const existing = await findForeignKey(table, column);
  if (existing && existing.ref_table === legacyTable) {
    await query(`ALTER TABLE ${table} DROP CONSTRAINT ${existing.constraint_name}`);
  }
}

// Ensures table.column has an FK constraint pointing at targetTable(id).
async function ensureForeignKey(table, column, targetTable) {
  const existing = await findForeignKey(table, column);
  if (existing && existing.ref_table === targetTable) return;
  if (existing) {
    await query(`ALTER TABLE ${table} DROP CONSTRAINT ${existing.constraint_name}`);
  }
  await query(
    `ALTER TABLE ${table} ADD CONSTRAINT ${table}_${column}_fkey FOREIGN KEY (${column}) REFERENCES ${targetTable}(id)`
  );
}

// Remaps dep.table.dep.column from old ids to new ids using a two-phase
// update: first negate (so no row can transiently collide with an old
// positive id, or with another row's new id, under a UNIQUE constraint that
// includes this column), then flip back to the real positive id. A plain
// single-statement UPDATE isn't safe here — old and new id ranges can
// overlap, and Postgres checks non-deferred UNIQUE constraints per row
// during the statement, not just at the end.
async function remapDependentColumn(table, column, mappingSql, params) {
  await query(
    `
    UPDATE ${table} d
    SET ${column} = -m.new_id
    FROM (${mappingSql}) m
    WHERE d.${column} = m.old_id AND d.${column} > 0
    `,
    params
  );
  await query(`UPDATE ${table} SET ${column} = -${column} WHERE ${column} < 0`);
}

// Migrates one section's legacy region/office tables into groups/offices (if
// the legacy tables still exist), repointing every dependent table's FK
// column and values, then drops the legacy tables. On a fresh install with
// no legacy tables, seeds directly from fallbackSeed instead. Idempotent —
// safe to call on every boot.
async function migrateOrSeedSection({ sectionId, legacyGroupTable, legacyOfficeTable, legacyOfficeGroupColumn, fallbackSeed, dependents }) {
  const legacyExists = await tableExists(legacyOfficeTable);

  const existingGroups = await query('SELECT COUNT(*) AS count FROM groups WHERE section_id = $1', [sectionId]);
  const alreadyPopulated = Number(existingGroups.rows[0].count) > 0;

  if (legacyExists) {
    if (!alreadyPopulated) {
      await query(
        `INSERT INTO groups (section_id, name) SELECT $1, name FROM ${legacyGroupTable}`,
        [sectionId]
      );

      await query(
        `
        INSERT INTO poc_offices (section_id, group_id, name)
        SELECT $1, g.id, lo.name
        FROM ${legacyOfficeTable} lo
        JOIN ${legacyGroupTable} lg ON lg.id = lo.${legacyOfficeGroupColumn}
        JOIN groups g ON g.section_id = $1 AND g.name = lg.name
        `,
        [sectionId]
      );

      console.log(`✅ Migrated ${legacyGroupTable}/${legacyOfficeTable} into groups/poc_offices`);
    }

    for (const dep of dependents) {
      if (dep.refersTo === 'group') {
        await dropForeignKeyIfPointsTo(dep.table, dep.column, legacyGroupTable);
        await remapDependentColumn(
          dep.table,
          dep.column,
          `
          SELECT lg.id AS old_id, g.id AS new_id
          FROM ${legacyGroupTable} lg
          JOIN groups g ON g.section_id = $1 AND g.name = lg.name
          `,
          [sectionId]
        );
        await ensureForeignKey(dep.table, dep.column, 'groups');
      } else {
        await dropForeignKeyIfPointsTo(dep.table, dep.column, legacyOfficeTable);
        await remapDependentColumn(
          dep.table,
          dep.column,
          `
          SELECT lo.id AS old_id, o.id AS new_id
          FROM ${legacyOfficeTable} lo
          JOIN ${legacyGroupTable} lg ON lg.id = lo.${legacyOfficeGroupColumn}
          JOIN groups g ON g.section_id = $1 AND g.name = lg.name
          JOIN poc_offices o ON o.group_id = g.id AND o.name = lo.name
          `,
          [sectionId]
        );
        await ensureForeignKey(dep.table, dep.column, 'poc_offices');
      }
    }

    await query(`DROP TABLE IF EXISTS ${legacyOfficeTable}`);
    await query(`DROP TABLE IF EXISTS ${legacyGroupTable}`);
    console.log(`✅ Dropped legacy tables ${legacyOfficeTable}, ${legacyGroupTable}`);
  } else if (!alreadyPopulated) {
    for (const { group, offices } of fallbackSeed) {
      const groupResult = await query(
        'INSERT INTO groups (section_id, name) VALUES ($1, $2) RETURNING id',
        [sectionId, group]
      );
      const groupId = groupResult.rows[0].id;
      for (const office of offices) {
        await query('INSERT INTO poc_offices (section_id, group_id, name) VALUES ($1, $2, $3)', [sectionId, groupId, office]);
      }
    }
    console.log(`✅ Seeded fallback groups/poc_offices for section ${sectionId}`);
  }
}

export async function migrateAndSeedHierarchy() {
  const sectionCount = await query('SELECT COUNT(*) AS count FROM sections');
  if (Number(sectionCount.rows[0].count) === 0) {
    for (const s of SECTION_DEFS) {
      await query(
        'INSERT INTO sections (code, name, group_label, office_label) VALUES ($1, $2, $3, $4)',
        [s.code, s.name, s.groupLabel, s.officeLabel]
      );
    }
    console.log('✅ Seeded sections (POC, MIS, PLS, PRC)');
  }

  const sectionIdByCode = {};
  const sectionsResult = await query('SELECT id, code FROM sections');
  for (const row of sectionsResult.rows) {
    sectionIdByCode[row.code] = row.id;
  }

  await migrateOrSeedSection({
    sectionId: sectionIdByCode.POC,
    legacyGroupTable: 'regions',
    legacyOfficeTable: 'market_offices',
    legacyOfficeGroupColumn: 'region_id',
    fallbackSeed: FALLBACK_SEED.POC,
    dependents: [
      { table: 'sericulturists', column: 'market_office_id', refersTo: 'office' },
      { table: 'poc_targets', column: 'market_office_id', refersTo: 'office' },
    ],
  });

  await migrateOrSeedSection({
    sectionId: sectionIdByCode.MIS,
    legacyGroupTable: 'mis_regions',
    legacyOfficeTable: 'mis_ad_offices',
    legacyOfficeGroupColumn: 'region_id',
    fallbackSeed: FALLBACK_SEED.MIS,
    dependents: [
      { table: 'mis_users', column: 'region_id', refersTo: 'group' },
      { table: 'mis_users', column: 'ad_office_id', refersTo: 'office' },
      { table: 'mis_plantation_overall', column: 'ad_office_id', refersTo: 'office' },
      { table: 'mis_plantation_scheme', column: 'ad_office_id', refersTo: 'office' },
      { table: 'mis_dfls_data', column: 'ad_office_id', refersTo: 'office' },
    ],
  });
}

// One-time-per-change, idempotent: brings the POC section's office list
// (Private Reeling Unit's — Government Reeling/Twisting moved to their own
// tables earlier this session) in line with FALLBACK_SEED.POC above, even on
// a database where migrateOrSeedSection() already seeded the OLD 17-office
// list and therefore won't touch it again (alreadyPopulated short-circuits
// it forever). Unlike that one-shot seed, this reconciles every boot:
// inserts any office missing from a region's target list, removes any
// office no longer in it. Region groups themselves are unchanged (same 5
// names as before) — only which offices sit under Trichy/Madurai actually
// swap wholesale; Dharmapuri/Erode/Vellore just gain a couple of offices.
// A removal that's still referenced by real data (sericulturists,
// poc_targets, poc_reports) fails its own DELETE harmlessly — logged, not
// thrown — rather than blocking boot or silently orphaning a name mismatch.
export async function reconcilePocOfficeList() {
  const sectionId = await getSectionIdByCode('POC');
  if (!sectionId) return;

  for (const { group: groupName, offices: targetNames } of FALLBACK_SEED.POC) {
    let groupResult = await query('SELECT id FROM groups WHERE section_id = $1 AND name = $2', [sectionId, groupName]);
    let groupId = groupResult.rows[0]?.id;
    if (!groupId) {
      const inserted = await query('INSERT INTO groups (section_id, name) VALUES ($1, $2) RETURNING id', [sectionId, groupName]);
      groupId = inserted.rows[0].id;
    }

    const existing = await query('SELECT id, name FROM poc_offices WHERE section_id = $1 AND group_id = $2', [sectionId, groupId]);
    const existingNames = new Set(existing.rows.map((r) => r.name));
    const targetSet = new Set(targetNames);

    for (const name of targetNames) {
      if (!existingNames.has(name)) {
        await query('INSERT INTO poc_offices (section_id, group_id, name) VALUES ($1, $2, $3)', [sectionId, groupId, name]);
      }
    }

    for (const row of existing.rows) {
      if (targetSet.has(row.name)) continue;
      try {
        await query('DELETE FROM poc_offices WHERE id = $1', [row.id]);
      } catch (error) {
        console.warn(`⚠️  Could not remove stale POC office "${row.name}" (id=${row.id}, region=${groupName}) — likely still referenced by existing data: ${error.message}`);
      }
    }
  }
  console.log('✅ Reconciled Private Reeling office list (POC section, 19 offices)');
}

export async function getSectionIdByCode(code) {
  const result = await query('SELECT id FROM sections WHERE code = $1', [code]);
  return result.rows[0]?.id ?? null;
}

export async function listSections() {
  const result = await query(
    `SELECT id, code, name, group_label AS "groupLabel", office_label AS "officeLabel" FROM sections ORDER BY id`
  );
  return result.rows;
}

export async function listGroups(sectionId) {
  const result = await query(
    'SELECT id, section_id AS "sectionId", name FROM groups WHERE section_id = $1 ORDER BY name',
    [sectionId]
  );
  return result.rows;
}

export async function listOffices(groupId) {
  const result = await query(
    'SELECT id, section_id AS "sectionId", group_id AS "groupId", name FROM poc_offices WHERE group_id = $1 ORDER BY name',
    [groupId]
  );
  return result.rows;
}
