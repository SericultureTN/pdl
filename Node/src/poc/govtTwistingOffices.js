import { query } from '../postgres.js';

// Government Twisting Unit's own office list — deliberately NOT part of the
// shared poc_offices hierarchy (which Private Reeling still uses) and NOT
// merged with Government Reeling Unit's own govt_reeling_offices list (which
// has Salem -old/-new, Talavadi, Tenkasi (Nannagaram)/(Nagercoil) variants).
// Twisting's list is smaller and deliberately independent — see conversation.
// Only regions that actually have a Twisting office are listed; Vellore and
// Trichy have none and are excluded entirely rather than shown empty.
const OFFICES = [
  { name: 'Hosur', region: 'Dharmapuri Region' },
  { name: 'Salem', region: 'Erode Region' },
  { name: 'Talavady', region: 'Erode Region' },
  { name: 'Tenkasi', region: 'Madurai Region' },
];

export async function initGovtTwistingOfficesSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS govt_twisting_offices (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      region VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (name, region)
    );
  `);

  const existing = await query('SELECT COUNT(*) AS count FROM govt_twisting_offices');
  if (Number(existing.rows[0].count) === 0) {
    for (const office of OFFICES) {
      await query('INSERT INTO govt_twisting_offices (name, region) VALUES ($1, $2)', [office.name, office.region]);
    }
    console.log('✅ Seeded govt_twisting_offices (4 offices)');
  }
}

export async function listGovtTwistingOffices() {
  const result = await query('SELECT id, name, region FROM govt_twisting_offices ORDER BY region, name');
  return result.rows;
}

export async function getGovtTwistingOfficeById(id) {
  const result = await query('SELECT id, name, region FROM govt_twisting_offices WHERE id = $1', [id]);
  return result.rows[0] || null;
}
