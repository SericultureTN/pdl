import { query } from './postgres.js';

// Government Reeling Unit's own office list — deliberately NOT part of the
// shared poc_offices hierarchy (which Private Reeling and Twisting still
// use). Flat (no section/group indirection needed for a single report
// type): just id/name/region. See conversation: replacing the 8-office
// Government Reeling list inside the shared poc_offices table would have
// silently changed Private Reeling/Twisting's office list too, since all
// three read through the same table with no per-report-type filtering.
const OFFICES = [
  { name: 'Hosur', region: 'Dharmapuri Region' },
  { name: 'Salem -old', region: 'Erode Region' },
  { name: 'Salem -new', region: 'Erode Region' },
  { name: 'Talavadi', region: 'Erode Region' },
  { name: 'Tenkasi (Nannagaram)', region: 'Madurai Region' },
  { name: 'Tenkasi (Nagercoil)', region: 'Madurai Region' },
  { name: 'Trichy (Pudukkottai)', region: 'Trichy Region' },
  { name: 'Dindigul (Sivagangai)', region: 'Madurai Region' },
];

export async function initGovtReelingOfficesSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS govt_reeling_offices (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      region VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (name, region)
    );
  `);

  const existing = await query('SELECT COUNT(*) AS count FROM govt_reeling_offices');
  if (Number(existing.rows[0].count) === 0) {
    for (const office of OFFICES) {
      await query('INSERT INTO govt_reeling_offices (name, region) VALUES ($1, $2)', [office.name, office.region]);
    }
    console.log('✅ Seeded govt_reeling_offices (8 offices)');
  }
}

export async function listGovtReelingOffices() {
  const result = await query('SELECT id, name, region FROM govt_reeling_offices ORDER BY region, name');
  return result.rows;
}

export async function getGovtReelingOfficeById(id) {
  const result = await query('SELECT id, name, region FROM govt_reeling_offices WHERE id = $1', [id]);
  return result.rows[0] || null;
}
