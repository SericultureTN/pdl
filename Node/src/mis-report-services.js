import { query, transaction } from './postgres.js';

// ─────────────────────────────────────────────
// MASTER DATA
// ─────────────────────────────────────────────

export const getMasterData = {
  async regions() {
    const r = await query('SELECT * FROM regions ORDER BY id');
    return { ok: true, regions: r.rows };
  },

  async adOffices(regionId = null) {
    const sql = regionId
      ? `SELECT o.*, r.region_name FROM ad_offices o
         JOIN regions r ON r.id = o.region_id
         WHERE o.region_id = $1 AND o.is_active = TRUE ORDER BY o.id`
      : `SELECT o.*, r.region_name FROM ad_offices o
         JOIN regions r ON r.id = o.region_id
         WHERE o.is_active = TRUE ORDER BY o.id`;
    const r = regionId ? await query(sql, [regionId]) : await query(sql);
    return { ok: true, offices: r.rows };
  },

  async financialYears() {
    const r = await query('SELECT * FROM financial_years ORDER BY id DESC');
    return { ok: true, years: r.rows };
  },

  async months() {
    const r = await query('SELECT * FROM months ORDER BY month_order');
    return { ok: true, months: r.rows };
  },

  async schemes() {
    const r = await query('SELECT * FROM schemes WHERE is_active = TRUE ORDER BY id');
    return { ok: true, schemes: r.rows };
  },
};

// ─────────────────────────────────────────────
// TARGETS
// ─────────────────────────────────────────────

export const targetServices = {
  async upsert({ officeId, schemeId, financialYearId, targetAcre, targetFarmer }) {
    const r = await query(
      `INSERT INTO targets (office_id, scheme_id, financial_year_id, target_acre, target_farmer)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (office_id, scheme_id, financial_year_id)
       DO UPDATE SET target_acre=$4, target_farmer=$5
       RETURNING *`,
      [officeId, schemeId, financialYearId, targetAcre || 0, targetFarmer || 0]
    );
    return { ok: true, target: r.rows[0] };
  },

  async getForOffice({ officeId, schemeId, financialYearId }) {
    const r = await query(
      `SELECT * FROM targets WHERE office_id=$1 AND scheme_id=$2 AND financial_year_id=$3`,
      [officeId, schemeId, financialYearId]
    );
    return { ok: true, target: r.rows[0] || null };
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function resolveIds({ officeName, schemeName, yearName, monthName }) {
  const [officeR, schemeR, yearR, monthR] = await Promise.all([
    query('SELECT id, region_id FROM ad_offices WHERE office_name=$1', [officeName]),
    query('SELECT id FROM schemes WHERE scheme_name=$1', [schemeName]),
    query('SELECT id FROM financial_years WHERE year_name=$1', [yearName]),
    query('SELECT id FROM months WHERE month_name=$1', [monthName]),
  ]);
  if (!officeR.rows[0]) throw new Error(`AD office not found: ${officeName}`);
  if (!schemeR.rows[0]) throw new Error(`Scheme not found: ${schemeName}`);
  if (!yearR.rows[0])   throw new Error(`Financial year not found: ${yearName}`);
  if (!monthR.rows[0])  throw new Error(`Month not found: ${monthName}`);
  return {
    officeId:  officeR.rows[0].id,
    regionId:  officeR.rows[0].region_id,
    schemeId:  schemeR.rows[0].id,
    yearId:    yearR.rows[0].id,
    monthId:   monthR.rows[0].id,
  };
}

// Previous month logic (financial year April→March)
const MONTH_ORDER = [
  'April','May','June','July','August','September',
  'October','November','December','January','February','March'
];

function prevMonthInfo(yearName, monthName) {
  const idx = MONTH_ORDER.indexOf(monthName);
  if (idx > 0) {
    return { yearName, monthName: MONTH_ORDER[idx - 1] };
  }
  // April → March of previous financial year
  const m = yearName.match(/(\d{4})-(\d{2})/);
  if (!m) return null;
  const prevStartYear = parseInt(m[1]) - 1;
  const prevEndYear   = parseInt(m[2], 10) - 1;
  const prevYearName  = `${prevStartYear}-${String(prevEndYear).padStart(2, '0')}`;
  return { yearName: prevYearName, monthName: 'March' };
}

// ─────────────────────────────────────────────
// MIS REPORT SERVICES
// ─────────────────────────────────────────────

export const misReportServices = {

  /**
   * Load current month report for an office+scheme+year+month.
   * Auto-populates ULM from previous month's UM if no record exists yet.
   */
  async loadReport({ officeName, schemeName, yearName, monthName }) {
    const ids = await resolveIds({ officeName, schemeName, yearName, monthName });

    // Check if record already exists
    const existing = await query(
      `SELECT r.*, o.office_name, o.office_code, rg.region_name,
              s.scheme_name, fy.year_name, m.month_name
       FROM mis_reports r
       JOIN ad_offices o ON o.id = r.office_id
       JOIN regions rg ON rg.id = r.region_id
       JOIN schemes s ON s.id = r.scheme_id
       JOIN financial_years fy ON fy.id = r.financial_year_id
       JOIN months m ON m.id = r.month_id
       WHERE r.office_id=$1 AND r.scheme_id=$2
         AND r.financial_year_id=$3 AND r.month_id=$4`,
      [ids.officeId, ids.schemeId, ids.yearId, ids.monthId]
    );

    if (existing.rows[0]) {
      return { ok: true, report: existing.rows[0], source: 'existing' };
    }

    // No record — fetch previous month UM for carry-forward
    const prev = prevMonthInfo(yearName, monthName);
    let ulmAcre = 0, ulmFarmer = 0;

    if (prev) {
      try {
        const prevIds = await resolveIds({
          officeName, schemeName,
          yearName: prev.yearName, monthName: prev.monthName,
        });
        const prevReport = await query(
          `SELECT um_acre, um_farmer FROM mis_reports
           WHERE office_id=$1 AND scheme_id=$2
             AND financial_year_id=$3 AND month_id=$4
             AND status IN ('Submitted','Approved')`,
          [prevIds.officeId, prevIds.schemeId, prevIds.yearId, prevIds.monthId]
        );
        if (prevReport.rows[0]) {
          ulmAcre   = parseFloat(prevReport.rows[0].um_acre)   || 0;
          ulmFarmer = parseInt(prevReport.rows[0].um_farmer, 10) || 0;
        }
      } catch (_) { /* previous year may not exist yet */ }
    }

    // Fetch target
    const targetRow = await query(
      `SELECT target_acre, target_farmer FROM targets
       WHERE office_id=$1 AND scheme_id=$2 AND financial_year_id=$3`,
      [ids.officeId, ids.schemeId, ids.yearId]
    );
    const targetAcre   = targetRow.rows[0] ? parseFloat(targetRow.rows[0].target_acre)   || 0 : 0;
    const targetFarmer = targetRow.rows[0] ? parseInt(targetRow.rows[0].target_farmer, 10) || 0 : 0;

    return {
      ok: true,
      report: {
        id: null,
        office_id: ids.officeId, region_id: ids.regionId,
        scheme_id: ids.schemeId, financial_year_id: ids.yearId, month_id: ids.monthId,
        office_name: officeName, scheme_name: schemeName,
        year_name: yearName, month_name: monthName,
        target_acre: targetAcre, target_farmer: targetFarmer,
        ulm_acre: ulmAcre, ulm_farmer: ulmFarmer,
        dm_acre: 0, dm_farmer: 0,
        um_acre: ulmAcre, um_farmer: ulmFarmer,
        status: 'Draft',
      },
      source: 'new',
    };
  },

  /**
   * Load reports for ALL offices for a scheme+year+month (MIS Admin / Super Admin view).
   */
  async loadAllOfficesReport({ schemeName, yearName, monthName }) {
    const [schemeR, yearR, monthR] = await Promise.all([
      query('SELECT id FROM schemes WHERE scheme_name=$1', [schemeName]),
      query('SELECT id FROM financial_years WHERE year_name=$1', [yearName]),
      query('SELECT id FROM months WHERE month_name=$1', [monthName]),
    ]);
    if (!schemeR.rows[0]) throw new Error(`Scheme not found: ${schemeName}`);
    if (!yearR.rows[0])   throw new Error(`Financial year not found: ${yearName}`);
    if (!monthR.rows[0])  throw new Error(`Month not found: ${monthName}`);

    const schemeId = schemeR.rows[0].id;
    const yearId   = yearR.rows[0].id;
    const monthId  = monthR.rows[0].id;

    // Get all active offices
    const offices = await query(
      `SELECT o.*, r.region_name FROM ad_offices o
       JOIN regions r ON r.id = o.region_id
       WHERE o.is_active = TRUE ORDER BY o.id`
    );

    // Get all existing reports for this scheme+year+month
    const reports = await query(
      `SELECT r.*, o.office_name, o.office_code, rg.region_name
       FROM mis_reports r
       JOIN ad_offices o ON o.id = r.office_id
       JOIN regions rg ON rg.id = r.region_id
       WHERE r.scheme_id=$1 AND r.financial_year_id=$2 AND r.month_id=$3`,
      [schemeId, yearId, monthId]
    );
    const reportMap = {};
    reports.rows.forEach(r => { reportMap[r.office_id] = r; });

    // Get previous month UMs for carry-forward
    const prev = prevMonthInfo(yearName, monthName);
    const prevReportMap = {};
    if (prev) {
      try {
        const prevYearR = await query('SELECT id FROM financial_years WHERE year_name=$1', [prev.yearName]);
        const prevMonthR = await query('SELECT id FROM months WHERE month_name=$1', [prev.monthName]);
        if (prevYearR.rows[0] && prevMonthR.rows[0]) {
          const prevReports = await query(
            `SELECT office_id, um_acre, um_farmer FROM mis_reports
             WHERE scheme_id=$1 AND financial_year_id=$2 AND month_id=$3
               AND status IN ('Submitted','Approved')`,
            [schemeId, prevYearR.rows[0].id, prevMonthR.rows[0].id]
          );
          prevReports.rows.forEach(r => { prevReportMap[r.office_id] = r; });
        }
      } catch (_) {}
    }

    // Get targets
    const targets = await query(
      `SELECT office_id, target_acre, target_farmer FROM targets
       WHERE scheme_id=$1 AND financial_year_id=$2`,
      [schemeId, yearId]
    );
    const targetMap = {};
    targets.rows.forEach(t => { targetMap[t.office_id] = t; });

    // Merge: existing record OR new draft with carry-forward ULM
    const rows = offices.rows.map((office, idx) => {
      if (reportMap[office.id]) return reportMap[office.id];
      const prevUM  = prevReportMap[office.id];
      const target  = targetMap[office.id];
      const ulmAcre   = prevUM ? parseFloat(prevUM.um_acre)   || 0 : 0;
      const ulmFarmer = prevUM ? parseInt(prevUM.um_farmer, 10) || 0 : 0;
      return {
        id: null, slNo: idx + 1,
        office_id: office.id, region_id: office.region_id,
        office_name: office.office_name, region_name: office.region_name,
        scheme_id: schemeId, financial_year_id: yearId, month_id: monthId,
        target_acre:   target ? parseFloat(target.target_acre)   || 0 : 0,
        target_farmer: target ? parseInt(target.target_farmer, 10) || 0 : 0,
        ulm_acre: ulmAcre, ulm_farmer: ulmFarmer,
        dm_acre: 0, dm_farmer: 0,
        um_acre: ulmAcre, um_farmer: ulmFarmer,
        status: 'Draft',
      };
    });

    return { ok: true, rows };
  },

  /**
   * Save (upsert) a single office report. Auto-calculates UM = ULM + DM.
   */
  async saveReport({ officeName, schemeName, yearName, monthName, dmAcre, dmFarmer, submittedBy = null, status = 'Draft' }) {
    const ids = await resolveIds({ officeName, schemeName, yearName, monthName });

    // Fetch ULM from previous month
    const prev = prevMonthInfo(yearName, monthName);
    let ulmAcre = 0, ulmFarmer = 0;
    if (prev) {
      try {
        const prevIds = await resolveIds({ officeName, schemeName, yearName: prev.yearName, monthName: prev.monthName });
        const prevR = await query(
          `SELECT um_acre, um_farmer FROM mis_reports
           WHERE office_id=$1 AND scheme_id=$2 AND financial_year_id=$3 AND month_id=$4
             AND status IN ('Submitted','Approved')`,
          [prevIds.officeId, prevIds.schemeId, prevIds.yearId, prevIds.monthId]
        );
        if (prevR.rows[0]) {
          ulmAcre   = parseFloat(prevR.rows[0].um_acre)   || 0;
          ulmFarmer = parseInt(prevR.rows[0].um_farmer, 10) || 0;
        }
      } catch (_) {}
    }

    const dm_acre   = parseFloat(dmAcre)   || 0;
    const dm_farmer = parseInt(dmFarmer, 10) || 0;
    const um_acre   = ulmAcre + dm_acre;
    const um_farmer = ulmFarmer + dm_farmer;

    const submittedAt = status === 'Submitted' ? new Date() : null;

    const r = await query(
      `INSERT INTO mis_reports
         (office_id, region_id, scheme_id, financial_year_id, month_id,
          ulm_acre, ulm_farmer, dm_acre, dm_farmer, um_acre, um_farmer,
          status, submitted_by, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (office_id, scheme_id, financial_year_id, month_id)
       DO UPDATE SET
         dm_acre=$8, dm_farmer=$9,
         ulm_acre=$6, ulm_farmer=$7,
         um_acre=$10, um_farmer=$11,
         status=$12,
         submitted_by=COALESCE($13, mis_reports.submitted_by),
         submitted_at=COALESCE($14, mis_reports.submitted_at),
         updated_at=CURRENT_TIMESTAMP
       RETURNING *`,
      [
        ids.officeId, ids.regionId, ids.schemeId, ids.yearId, ids.monthId,
        ulmAcre, ulmFarmer, dm_acre, dm_farmer, um_acre, um_farmer,
        status, submittedBy, submittedAt,
      ]
    );
    return { ok: true, report: r.rows[0] };
  },

  /**
   * Bulk save rows (all offices for one scheme+year+month).
   */
  async saveBulkReports({ rows, schemeName, yearName, monthName, submittedBy = null, status = 'Draft' }) {
    const results = await Promise.all(
      rows.map(row => this.saveReport({
        officeName: row.adOffice || row.office_name,
        schemeName, yearName, monthName,
        dmAcre: row.dm_acre, dmFarmer: row.dm_farmer,
        submittedBy, status,
      }))
    );
    return { ok: true, saved: results.length };
  },

  /**
   * Update report status (Approved / Rejected).
   */
  async updateStatus({ reportId, status, updatedBy }) {
    const allowed = ['Submitted', 'Approved', 'Rejected', 'Draft'];
    if (!allowed.includes(status)) return { ok: false, error: 'Invalid status' };

    const r = await query(
      `UPDATE mis_reports SET status=$1, updated_at=CURRENT_TIMESTAMP
       WHERE id=$2 RETURNING *`,
      [status, reportId]
    );
    if (!r.rows[0]) return { ok: false, error: 'Report not found' };
    return { ok: true, report: r.rows[0] };
  },

  /**
   * GET /mis-report — filtered list.
   * Enforces office-level restriction for AD Office User role.
   */
  async getReports({ schemeId, yearId, monthId, officeId, status, limit = 100, offset = 0 }) {
    const conditions = [];
    const params = [];
    let p = 1;

    if (schemeId) { conditions.push(`r.scheme_id=$${p++}`); params.push(schemeId); }
    if (yearId)   { conditions.push(`r.financial_year_id=$${p++}`); params.push(yearId); }
    if (monthId)  { conditions.push(`r.month_id=$${p++}`); params.push(monthId); }
    if (officeId) { conditions.push(`r.office_id=$${p++}`); params.push(officeId); }
    if (status)   { conditions.push(`r.status=$${p++}`); params.push(status); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(limit, offset);

    const sql = `
      SELECT r.*,
             o.office_name, o.office_code, rg.region_name,
             s.scheme_name, fy.year_name, m.month_name
      FROM mis_reports r
      JOIN ad_offices o ON o.id = r.office_id
      JOIN regions rg ON rg.id = r.region_id
      JOIN schemes s ON s.id = r.scheme_id
      JOIN financial_years fy ON fy.id = r.financial_year_id
      JOIN months m ON m.id = r.month_id
      ${where}
      ORDER BY fy.id DESC, m.month_order, o.id
      LIMIT $${p++} OFFSET $${p}
    `;
    const r = await query(sql, params);
    return { ok: true, reports: r.rows };
  },

  /**
   * Dashboard summary — count by status for a given scheme+year.
   */
  async dashboardSummary({ schemeId, yearId } = {}) {
    const conditions = [];
    const params = [];
    let p = 1;
    if (schemeId) { conditions.push(`scheme_id=$${p++}`); params.push(schemeId); }
    if (yearId)   { conditions.push(`financial_year_id=$${p++}`); params.push(yearId); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [statusCounts, totalOffices, recentActivity] = await Promise.all([
      query(`SELECT status, COUNT(*) as count FROM mis_reports ${where} GROUP BY status`, params),
      query('SELECT COUNT(*) as count FROM ad_offices WHERE is_active=TRUE'),
      query(`
        SELECT r.id, o.office_name, m.month_name, fy.year_name, r.status, r.updated_at
        FROM mis_reports r
        JOIN ad_offices o ON o.id = r.office_id
        JOIN months m ON m.id = r.month_id
        JOIN financial_years fy ON fy.id = r.financial_year_id
        ${where}
        ORDER BY r.updated_at DESC LIMIT 10
      `, params),
    ]);

    const counts = { Draft: 0, Submitted: 0, Approved: 0, Rejected: 0 };
    statusCounts.rows.forEach(r => { counts[r.status] = parseInt(r.count, 10); });

    return {
      ok: true,
      summary: {
        totalOffices: parseInt(totalOffices.rows[0].count, 10),
        totalReports: Object.values(counts).reduce((a, b) => a + b, 0),
        ...counts,
        recentActivity: recentActivity.rows,
      },
    };
  },

  /**
   * Submission status per office for a given scheme+year+month.
   */
  async submissionStatus({ schemeId, yearId, monthId }) {
    const offices = await query(
      `SELECT o.id, o.office_name, o.office_code, r.region_name
       FROM ad_offices o JOIN regions r ON r.id = o.region_id
       WHERE o.is_active=TRUE ORDER BY o.id`
    );
    const reports = await query(
      `SELECT office_id, status FROM mis_reports
       WHERE scheme_id=$1 AND financial_year_id=$2 AND month_id=$3`,
      [schemeId, yearId, monthId]
    );
    const reportMap = {};
    reports.rows.forEach(r => { reportMap[r.office_id] = r.status; });

    const rows = offices.rows.map((o, i) => ({
      slNo: i + 1,
      office_id: o.id,
      office_name: o.office_name,
      office_code: o.office_code,
      region_name: o.region_name,
      status: reportMap[o.id] || 'Not Started',
    }));

    return { ok: true, rows };
  },
};
