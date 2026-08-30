import express from 'express';
import jwt from 'jsonwebtoken';
import { getReport, saveDmData, rolloverMonth, buildExcelWorkbook } from './reportService.js';
import { REGIONS, FINANCIAL_YEARS, FY_MONTHS } from './constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'local_dev_secret_change_me_in_production';

export function createMisRouter(getDb) {
  const router = express.Router();

  // Login is unified at POST /api/login (Node/src/auth.js) — this module
  // only needs to translate that shared JWT/users-table identity into the
  // {misRole, region_id, ad_office_id} shape reportService.js expects.
  async function resolveMisUser(req) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const db = getDb();

      const user = await db.get(
        'SELECT id, name, email, role, section_id, group_id, office_id, status FROM poc_users WHERE id = ?',
        [decoded.id]
      );
      if (!user || user.status !== 'active') return null;

      const misSection = await db.get(`SELECT id FROM sections WHERE code = 'MIS'`);
      const inMisSection = user.section_id === (misSection?.id ?? null);

      let misRole = 'ad_user';
      if (user.role === 'admin') misRole = 'admin';
      else if (user.role === 'secondary_admin') misRole = 'supervisor'; // cross-office, read-only

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        misRole,
        region_id: misRole === 'ad_user' && inMisSection ? user.group_id : null,
        ad_office_id: misRole === 'ad_user' && inMisSection ? user.office_id : null,
      };
    } catch {
      return null;
    }
  }

  async function requireMisAuth(req, res, next) {
    const user = await resolveMisUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.misUser = user;
    next();
  }

  async function requireMisAdmin(req, res, next) {
    if (req.misUser?.misRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }

  router.get('/report', requireMisAuth, async (req, res) => {
    try {
      const { sheet = 'plantation-overall', month = 'July', year = '2025-26', region = 'All', ad = 'All' } = req.query;
      const db = getDb();
      res.set('Cache-Control', 'no-store');
      const report = await getReport(db, { sheet, month, year, region, ad }, req.misUser);
      return res.json(report);
    } catch (error) {
      console.error('Report error:', error);
      return res.status(400).json({ error: error.message || 'Failed to load report' });
    }
  });

  router.post('/data/save', requireMisAuth, async (req, res) => {
    try {
      const db = getDb();
      const report = await saveDmData(db, req.body, req.misUser);
      return res.json({ ok: true, report });
    } catch (error) {
      console.error('Save error:', error);
      return res.status(400).json({ error: error.message || 'Failed to save data' });
    }
  });

  router.post('/admin/rollover', requireMisAuth, requireMisAdmin, async (req, res) => {
    try {
      const month = req.query.month || req.body?.month;
      const year = req.query.year || req.body?.year;
      if (!month || !year) {
        return res.status(400).json({ error: 'month and year are required' });
      }
      const db = getDb();
      const result = await rolloverMonth(db, month, year);
      return res.json(result);
    } catch (error) {
      console.error('Rollover error:', error);
      return res.status(400).json({ error: error.message || 'Rollover failed' });
    }
  });

  router.get('/export/excel', requireMisAuth, async (req, res) => {
    try {
      const { month = 'July', year = '2025-26', region = 'All', ad = 'All' } = req.query;
      const db = getDb();
      const buffer = await buildExcelWorkbook(db, { month, year, region, ad });
      const filename = `Silk-Samagra-MIS-${year}-${month}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (error) {
      console.error('Export error:', error);
      return res.status(500).json({ error: 'Export failed' });
    }
  });

  router.get('/meta', requireMisAuth, async (_req, res) => {
    return res.json({
      ok: true,
      regions: REGIONS.map((r) => ({ id: r.id, name: r.name, adOffices: r.adOffices })),
      financialYears: FINANCIAL_YEARS,
      months: FY_MONTHS,
    });
  });

  return router;
}
