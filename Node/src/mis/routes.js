import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getReport, saveDmData, rolloverMonth, buildExcelWorkbook } from './reportService.js';
import { REGIONS, FINANCIAL_YEARS, FY_MONTHS } from './constants.js';

const JWT_SECRET = process.env.JWT_SECRET || 'local_dev_secret_change_me_in_production';

export function createMisRouter(getDb) {
  const router = express.Router();

  async function resolveMisUser(req) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const db = getDb();

      if (decoded.misRole) {
        const misUser = await db.get(
          'SELECT id, name, email, role as misRole, region_id, ad_office_id FROM mis_users WHERE id = ?',
          [decoded.id]
        );
        if (misUser) return misUser;
      }

      if (decoded.email) {
        const misByEmail = await db.get(
          'SELECT id, name, email, role as misRole, region_id, ad_office_id FROM mis_users WHERE email = ?',
          [decoded.email]
        );
        if (misByEmail) return misByEmail;
      }

      if (decoded.type === 'admin' || decoded.role === 'admin' || decoded.misRole === 'admin') {
        const admin = await db.get('SELECT id, email FROM admins WHERE id = ?', [decoded.id]);
        if (admin) {
          return { id: admin.id, email: admin.email, name: 'Administrator', misRole: 'admin', region_id: null, ad_office_id: null };
        }
        return { id: decoded.id, email: decoded.email, name: 'Administrator', misRole: 'admin', region_id: null, ad_office_id: null };
      }

      return null;
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

  router.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const db = getDb();
      let user = await db.get('SELECT * FROM mis_users WHERE email = ?', [email]);

      if (user && (await bcrypt.compare(password, user.password_hash))) {
        const token = jwt.sign(
          { id: user.id, email: user.email, misRole: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 86400000 });
        return res.json({
          ok: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            regionId: user.region_id,
            adOfficeId: user.ad_office_id,
          },
        });
      }

      const admin = await db.get('SELECT * FROM admins WHERE email = ?', [email]);
      if (admin && (await bcrypt.compare(password, admin.password_hash))) {
        const token = jwt.sign({ id: admin.id, email: admin.email, type: 'admin', misRole: 'admin' }, JWT_SECRET, {
          expiresIn: '24h',
        });
        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 86400000 });
        return res.json({
          ok: true,
          token,
          user: { id: admin.id, email: admin.email, name: 'Administrator', role: 'admin' },
        });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
      console.error('MIS login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  });

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

export async function seedMisUsers(db) {
  const count = await db.get('SELECT COUNT(*) as count FROM mis_users');
  if (count.count > 0) return;

  const regions = await db.all('SELECT id, name FROM mis_regions');
  const offices = await db.all('SELECT id, name, region_id FROM mis_ad_offices');
  const erodeRegion = regions.find((r) => r.name === 'Erode Region');
  const hosurOffice = offices.find((o) => o.name === 'Hosur');

  const users = [
    {
      name: 'MIS Admin',
      email: 'mis.admin@tn.gov.in',
      password: 'Admin123!',
      role: 'admin',
      region_id: null,
      ad_office_id: null,
    },
    {
      name: 'Erode Supervisor',
      email: 'supervisor.erode@tn.gov.in',
      password: 'Super123!',
      role: 'supervisor',
      region_id: erodeRegion?.id || null,
      ad_office_id: null,
    },
    {
      name: 'Hosur AD User',
      email: 'ad.hosur@tn.gov.in',
      password: 'AdUser123!',
      role: 'ad_user',
      region_id: hosurOffice?.region_id || null,
      ad_office_id: hosurOffice?.id || null,
    },
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    await db.run(
      'INSERT INTO mis_users (name, email, password_hash, role, region_id, ad_office_id) VALUES (?, ?, ?, ?, ?, ?)',
      [user.name, user.email, hash, user.role, user.region_id, user.ad_office_id]
    );
    console.log(`✅ MIS user: ${user.email} / ${user.password} (${user.role})`);
  }
}
