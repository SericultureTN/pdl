import bcrypt from 'bcrypt';
import { query } from './postgres.js';

const SALT_ROUNDS = 12;

// Unified users table: replaces the three separate, unrelated auth tables
// that used to exist (admins, sericulturists, mis_users) with one table and
// one role model (admin / secondary_admin / user).

export async function initUsersSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS poc_users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      address TEXT,
      role TEXT NOT NULL CHECK (role IN ('admin', 'secondary_admin', 'user')),
      designation TEXT,
      section_id INTEGER REFERENCES sections(id),
      group_id INTEGER REFERENCES groups(id),
      office_id INTEGER REFERENCES poc_offices(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
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

async function columnExists(table, column) {
  const result = await query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return result.rows.length > 0;
}

// Idempotent — migrates legacy admins/sericulturists/mis_users rows into
// users (if those tables still exist), then drops them. Safe to call on
// every boot.
export async function migrateAndSeedUsers() {
  const usersCount = await query('SELECT COUNT(*) AS count FROM poc_users');
  const alreadyPopulated = Number(usersCount.rows[0].count) > 0;

  const pocSection = await query(`SELECT id FROM sections WHERE code = 'POC'`);
  const misSection = await query(`SELECT id FROM sections WHERE code = 'MIS'`);
  const pocSectionId = pocSection.rows[0]?.id ?? null;
  const misSectionId = misSection.rows[0]?.id ?? null;

  if (!alreadyPopulated) {
    if (await tableExists('admins')) {
      await query(`
        INSERT INTO poc_users (name, email, password_hash, role, status)
        SELECT 'Administrator', email, password_hash, 'admin', 'active' FROM admins
      `);
      console.log('✅ Migrated admins into poc_users');
    }

    if (await tableExists('sericulturists')) {
      // sericulturists.password is plaintext (compared with `!==` in the old
      // login code), unlike admins/mis_users' bcrypt password_hash — hash it
      // here rather than copying it verbatim, or every migrated account
      // would be silently locked out (bcrypt.compare would never match).
      const legacy = await query(`
        SELECT s.name, s.email, s.phone, s.password, s.address, s.role, s.status,
               s.market_office_id AS office_id, o.group_id
        FROM sericulturists s
        LEFT JOIN poc_offices o ON o.id = s.market_office_id
        WHERE s.email IS NOT NULL
      `);
      for (const row of legacy.rows) {
        const passwordHash = await bcrypt.hash(row.password || '', SALT_ROUNDS);
        await query(
          `
          INSERT INTO poc_users (name, email, phone, password_hash, address, role, designation, section_id, group_id, office_id, status)
          VALUES ($1, $2, $3, $4, $5, 'user', $6, $7, $8, $9, $10)
          `,
          [row.name, row.email, row.phone, passwordHash, row.address, row.role, pocSectionId, row.group_id, row.office_id, row.status]
        );
      }
      console.log(`✅ Migrated ${legacy.rows.length} sericulturists into poc_users (passwords re-hashed)`);
    }

    if (await tableExists('mis_users')) {
      await query(
        `
        INSERT INTO poc_users (name, email, password_hash, role, section_id, group_id, office_id, status)
        SELECT name, email, password_hash,
               CASE role
                 WHEN 'admin' THEN 'admin'
                 WHEN 'supervisor' THEN 'secondary_admin'
                 ELSE 'user'
               END,
               CASE WHEN role = 'ad_user' THEN $1 ELSE NULL END,
               CASE WHEN role = 'ad_user' THEN region_id ELSE NULL END,
               CASE WHEN role = 'ad_user' THEN ad_office_id ELSE NULL END,
               'active'
        FROM mis_users
        `,
        [misSectionId]
      );
      console.log('✅ Migrated mis_users into poc_users (supervisor -> secondary_admin, widened to cross-office)');
    }
  }

  // Repoint poc_targets.created_by (email string) -> set_by_user_id, and
  // rename/ensure the office FK column, regardless of whether we just
  // inserted rows above (idempotent on every boot).
  await ensureTargetsUserColumns();

  if (await tableExists('admins')) await query('DROP TABLE admins');
  if (await tableExists('sericulturists')) await query('DROP TABLE sericulturists');
  if (await tableExists('mis_users')) await query('DROP TABLE mis_users');
}

async function ensureTargetsUserColumns() {
  const hasOfficeId = await columnExists('poc_targets', 'office_id');
  const hasMarketOfficeId = await columnExists('poc_targets', 'market_office_id');
  if (!hasOfficeId && hasMarketOfficeId) {
    await query('ALTER TABLE poc_targets RENAME COLUMN market_office_id TO office_id');
    console.log('✅ Renamed poc_targets.market_office_id -> office_id');
  } else if (!hasOfficeId && !hasMarketOfficeId) {
    await query('ALTER TABLE poc_targets ADD COLUMN office_id INTEGER');
  }

  // No FK on office_id: it means poc_offices(id) for private_reeling/
  // government_twisting targets but govt_reeling_offices(id) for
  // government_reeling targets — two disjoint tables, so a single
  // database-level FK can't be correct for both. Drops the FK any
  // pre-existing database still has from before this split.
  await query(`ALTER TABLE poc_targets DROP CONSTRAINT IF EXISTS poc_targets_office_id_fkey;`);

  // Government Reeling targets are keyed by the raw calendar year the officer
  // picks (not a derived Apr-Mar fiscal_year string, which twisting/private
  // reeling still use for their annual targets) — additive column, doesn't
  // touch fiscal_year/unit_code used by the other two unit types.
  await query('ALTER TABLE poc_targets ADD COLUMN IF NOT EXISTS year INTEGER');
  // Reeling targets are now keyed by year, not fiscal_year — twisting/private
  // reeling still populate fiscal_year for their own annual targets, but it's
  // no longer required for reeling inserts.
  await query('ALTER TABLE poc_targets ALTER COLUMN fiscal_year DROP NOT NULL');
  await query(`
    UPDATE poc_targets
    SET year = CASE
      WHEN month IN ('January', 'February', 'March') THEN split_part(fiscal_year, '-', 2)::integer
      ELSE split_part(fiscal_year, '-', 1)::integer
    END
    WHERE unit_type = 'government_reeling' AND year IS NULL AND fiscal_year ~ '^\\d{4}-\\d{4}$'
  `);

  // Government Reeling targets reverted back to yearly (one row per Office +
  // fiscal year, ÷12 auto-split into monthly D.M — see
  // Client/.../deriveMonthlyFromAnnual.js) after a brief monthly (office +
  // year + month) experiment. Drop that monthly index, restore the
  // office+fiscal_year one. year/month columns are left in place (harmless,
  // unused for reeling going forward) rather than dropped, since older rows
  // may still reference them and dropping columns is not reversible.
  await query('DROP INDEX IF EXISTS targets_current_key_reeling_year_month');
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS targets_current_key_reeling_yearly
      ON poc_targets (office_id, fiscal_year)
      WHERE is_current AND unit_type = 'government_reeling';
  `);

  await query('ALTER TABLE poc_targets ADD COLUMN IF NOT EXISTS set_by_user_id INTEGER REFERENCES poc_users(id)');
  await query(`
    UPDATE poc_targets t
    SET set_by_user_id = u.id
    FROM poc_users u
    WHERE t.created_by = u.email AND t.set_by_user_id IS NULL
  `);
}
