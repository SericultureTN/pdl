import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { testConnection, initializeDatabase, renamePocTables, closePool, query, transaction } from './postgres.js';
import { initHierarchySchema, migrateAndSeedHierarchy, getSectionIdByCode, listSections, listGroups, listOffices } from './hierarchy.js';
import { initUsersSchema, migrateAndSeedUsers } from './user-migration.js';
import {
  usersService,
  signUserToken,
  getAuthCookieName,
  cookieOptions,
  requireAuth,
  requireRole,
  assertOwnOffice,
} from './auth.js';
import { initReportsSchema, reportsService, isMonthlyReelingType } from './reports.js';
import { initGovtReelingOfficesSchema, listGovtReelingOffices } from './govtReelingOffices.js';
import { buildGovtReelingWorkbook } from './govtReelingExport.js';
import { getConsolidatedReport } from './govtReelingConsolidated.js';
import { buildConsolidatedWorkbook } from './govtReelingConsolidatedExport.js';
import { createMisRouter } from './mis/routes.js';
import { initMisPostgres } from './mis/init-postgres.js';
import { seedMisIfEmpty } from './mis/seed.js';
import { createPgAdapter } from './mis/pg-adapter.js';

const app = express();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Allow LAN access (e.g. http://192.168.1.5:5173) during local development
      if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) {
        return callback(null, true);
      }

      const allowedOrigins = CORS_ORIGIN.split(',').map((o) => o.trim());
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// Health check
app.get("/health", async (_req, res) => {
  const dbConnected = await testConnection();
  return res.json({ 
    ok: dbConnected, 
    database: dbConnected ? 'connected' : 'disconnected',
    type: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint — single unified users table (admin / secondary_admin / user)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await usersService.login(email, password);
    if (!result.ok) {
      return res.status(401).json({ error: result.error });
    }

    const token = signUserToken(result.user);
    res.cookie(getAuthCookieName(), token, cookieOptions());

    return res.json({ ok: true, user: result.user });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie(getAuthCookieName(), { path: "/" });
  return res.json({ ok: true });
});

// Get current user info (fresh DB read, not just JWT claims, so renamed
// offices/groups/sections show up immediately without re-login)
app.get("/api/me", requireAuth, async (req, res) => {
  const result = await usersService.getById(req.user.id);
  if (!result.ok) {
    return res.status(404).json({ error: result.error });
  }
  return res.json({ ok: true, user: result.user });
});

app.get("/api/admin/dashboard", requireRole('admin', 'secondary_admin'), async (req, res) => {
  try {
    const statsResult = await usersService.getStatistics();
    return res.json({
      ok: true,
      message: `Welcome, ${req.user.email}!`,
      admin: { id: req.user.id, email: req.user.email },
      serverTime: new Date().toISOString(),
      statistics: statsResult.ok ? statsResult.statistics : null
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// User Management Routes (admin only)
app.get("/api/users", requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const role = req.query.role || '';

    const result = await usersService.list(page, limit, search, status, role);
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/statistics", requireRole('admin'), async (req, res) => {
  try {
    const result = await usersService.getStatistics();
    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }
    return res.json({ ok: true, statistics: result.statistics });
  } catch (error) {
    console.error('Get statistics error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/:id", requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const result = await usersService.getById(id);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    return res.json({ ok: true, user: result.user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/users", requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, address, role, designation, section_id, group_id, office_id, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const result = await usersService.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      role,
      designation: designation?.trim() || null,
      section_id: section_id || null,
      group_id: group_id || null,
      office_id: office_id || null,
      status: status || 'active',
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({ ok: true, user: result.user });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/users/:id", requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { name, email, password, phone, address, role, designation, section_id, group_id, office_id, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const result = await usersService.update(id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      role,
      designation: designation?.trim() || null,
      section_id: section_id || null,
      group_id: group_id || null,
      office_id: office_id || null,
      status: status || 'active',
    });

    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }

    return res.json({ ok: true, user: result.user });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/users/:id", requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const result = await usersService.delete(id);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    return res.json({ ok: true, message: "User deleted successfully" });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/users/bulk/status", requireRole('admin'), async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs array is required" });
    }
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'active' or 'inactive'" });
    }
    const result = await usersService.bulkUpdateStatus(ids, status);
    return res.json({ ok: true, message: `Updated ${result.updatedCount} users` });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/users/bulk", requireRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs array is required" });
    }
    const result = await usersService.bulkDelete(ids);
    return res.json({ ok: true, message: `Deleted ${result.deletedCount} users` });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/regions -> all POC regions (groups under the POC section)
app.get("/api/regions", requireAuth, async (req, res) => {
  try {
    const pocSectionId = await getSectionIdByCode('POC');
    const result = await query(
      'SELECT id, name FROM groups WHERE section_id = $1 ORDER BY name ASC',
      [pocSectionId]
    );
    return res.json({ ok: true, regions: result.rows });
  } catch (error) {
    console.error('Get regions error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/market-offices?region_id=  -> offices belonging to that region (region_id required)
app.get("/api/market-offices", requireAuth, async (req, res) => {
  try {
    const regionId = Number(req.query.region_id);
    if (!Number.isInteger(regionId)) {
      return res.status(400).json({ error: "region_id is required" });
    }

    const result = await query(
      'SELECT id, name, group_id AS region_id FROM poc_offices WHERE group_id = $1 ORDER BY name ASC',
      [regionId]
    );
    return res.json({ ok: true, marketOffices: result.rows });
  } catch (error) {
    console.error('Get market offices error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/govt-reeling-offices -> Government Reeling Unit's own flat office
// list (not the shared poc_offices hierarchy Private Reeling/Twisting use —
// see govtReelingOffices.js). Small, fixed list — returned whole, grouped by
// region client-side.
app.get("/api/govt-reeling-offices", requireAuth, async (req, res) => {
  try {
    const offices = await listGovtReelingOffices();
    return res.json({ ok: true, offices });
  } catch (error) {
    console.error('Get govt reeling offices error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Generic section-aware hierarchy endpoints (POC/MIS/PLS/PRC). Not yet wired
// into any screen — held in reserve for a future Section-aware picker.
app.get("/api/sections", requireAuth, async (req, res) => {
  try {
    const sections = await listSections();
    return res.json({ ok: true, sections });
  } catch (error) {
    console.error('Get sections error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/groups", requireAuth, async (req, res) => {
  try {
    const sectionId = Number(req.query.section_id);
    if (!Number.isInteger(sectionId)) {
      return res.status(400).json({ error: "section_id is required" });
    }
    const groups = await listGroups(sectionId);
    return res.json({ ok: true, groups });
  } catch (error) {
    console.error('Get groups error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/offices", requireAuth, async (req, res) => {
  try {
    const groupId = Number(req.query.group_id);
    if (!Number.isInteger(groupId)) {
      return res.status(400).json({ error: "group_id is required" });
    }
    const offices = await listOffices(groupId);
    return res.json({ ok: true, offices });
  } catch (error) {
    console.error('Get offices error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const TARGET_UNIT_TYPES = ['government_reeling', 'government_twisting', 'private_reeling'];

function toTargetPayload(row) {
  if (!row) return null;
  return {
    id: row.id,
    unitType: row.unit_type,
    unitCode: row.unit_code,
    fiscalYear: row.fiscal_year,
    year: row.year,
    month: row.month,
    officeId: row.office_id,
    // Derived via join, never stored on targets. For government_reeling this
    // is a region NAME (text), not a numeric id — see TARGETS_WITH_REGION_SELECT.
    regionId: row.region_id ?? null,
    officeName: row.office_name ?? null,
    physicalTarget: row.physical_target || {},
    // Annual figure (Budget Annual) for every unit type, incl. government_reeling
    // — see deriveMonthlyFromAnnual.js on the client for the ÷12 monthly split.
    budgetOutlay: row.budget_annual || null,
    lockedAt: row.locked_at,
    revisedFromTargetId: row.revised_from_target_id,
    revisionReason: row.revision_reason,
    createdAt: row.created_at,
    createdBy: row.created_by,
    setByUserId: row.set_by_user_id,
  };
}

// office_id means govt_reeling_offices(id) for government_reeling targets
// but poc_offices(id) for private_reeling/government_twisting — two
// disjoint tables, so the join must be type-conditional (a single
// unconditional join would silently show wrong/missing region+office data
// for whichever type it wasn't written for). region_id is a region NAME
// (text) for government_reeling since govt_reeling_offices has no separate
// regions table, but stays the numeric group_id for the other two.
const TARGETS_WITH_REGION_SELECT = `
  SELECT t.*,
    COALESCE(gro.region, mo.group_id::text) AS region_id,
    COALESCE(gro.name, mo.name) AS office_name
  FROM poc_targets t
  LEFT JOIN govt_reeling_offices gro ON gro.id = t.office_id AND t.unit_type = 'government_reeling'
  LEFT JOIN poc_offices mo ON mo.id = t.office_id AND t.unit_type <> 'government_reeling'
`;

// government_reeling is office-keyed (office_id + fiscal_year); twisting/
// private_reeling are unit-code-keyed (unit_code + fiscal_year). All three
// are annual now — a single Yearly Target/Budget Annual per fiscal year,
// auto-divided ÷12 into monthly D.M client-side (deriveMonthlyFromAnnual.js).
const OFFICE_KEYED_TARGET_TYPES = new Set(['government_reeling']);

// GET /api/targets?unitType=&unitCode=&fiscalYear=              -> current target for one unit (unit-code-keyed types)
// GET /api/targets?unitType=government_reeling&officeId=&fiscalYear= -> current target for one office (office-keyed)
// GET /api/targets?unitType=&fiscalYear=                         -> all current targets for that type+year (scoped)
app.get("/api/targets", requireAuth, async (req, res) => {
  try {
    const { unitType, unitCode, fiscalYear } = req.query;
    let officeId = req.query.officeId ? Number(req.query.officeId) : null;

    if (!unitType || !TARGET_UNIT_TYPES.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: " + TARGET_UNIT_TYPES.join(', ') });
    }
    if (!fiscalYear) {
      return res.status(400).json({ error: "fiscalYear is required" });
    }
    const officeKeyed = OFFICE_KEYED_TARGET_TYPES.has(unitType);

    if (req.user.role === 'user') {
      officeId = req.user.officeId;
    }

    if (officeKeyed && officeId) {
      const result = await query(
        `${TARGETS_WITH_REGION_SELECT} WHERE t.unit_type = $1 AND t.office_id = $2 AND t.fiscal_year = $3 AND t.is_current LIMIT 1`,
        [unitType, officeId, fiscalYear]
      );
      if (!assertOwnOffice(result.rows[0]?.office_id ?? null, req, res)) return;
      return res.json({ ok: true, target: toTargetPayload(result.rows[0]) });
    }

    if (!officeKeyed && unitCode) {
      const result = await query(
        `${TARGETS_WITH_REGION_SELECT} WHERE t.unit_type = $1 AND t.unit_code = $2 AND t.fiscal_year = $3 AND t.is_current LIMIT 1`,
        [unitType, unitCode, fiscalYear]
      );
      return res.json({ ok: true, target: toTargetPayload(result.rows[0]) });
    }

    const params = [unitType, fiscalYear];
    let listSql = `${TARGETS_WITH_REGION_SELECT} WHERE t.unit_type = $1 AND t.fiscal_year = $2 AND t.is_current`;
    if (officeId) {
      params.push(officeId);
      listSql += ` AND t.office_id = $${params.length}`;
    }
    listSql += ' ORDER BY t.office_id ASC, t.unit_code ASC';

    const result = await query(listSql, params);
    return res.json({ ok: true, targets: result.rows.map(toTargetPayload) });
  } catch (error) {
    console.error('Get targets error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/targets  { unitType, unitCode?, fiscalYear, officeId, physicalTarget, budgetOutlay }
// government_reeling: fiscalYear + officeId. government_twisting / private_reeling: fiscalYear + unitCode.
app.post("/api/targets", requireRole('admin', 'secondary_admin'), async (req, res) => {
  try {
    const { unitType, unitCode, fiscalYear, officeId, physicalTarget, budgetOutlay } = req.body || {};

    if (!unitType || !TARGET_UNIT_TYPES.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: " + TARGET_UNIT_TYPES.join(', ') });
    }
    if (!Number.isInteger(officeId)) {
      return res.status(400).json({ error: "officeId is required" });
    }
    if (!fiscalYear || !String(fiscalYear).trim()) {
      return res.status(400).json({ error: "fiscalYear is required" });
    }

    const officeKeyed = OFFICE_KEYED_TARGET_TYPES.has(unitType);
    if (!officeKeyed && (!unitCode || !String(unitCode).trim())) {
      return res.status(400).json({ error: "unitCode is required" });
    }

    const existing = officeKeyed
      ? await query(
          `SELECT id FROM poc_targets WHERE unit_type = $1 AND office_id = $2 AND fiscal_year = $3 AND is_current LIMIT 1`,
          [unitType, officeId, fiscalYear]
        )
      : await query(
          `SELECT id FROM poc_targets WHERE unit_type = $1 AND unit_code = $2 AND fiscal_year = $3 AND is_current LIMIT 1`,
          [unitType, unitCode, fiscalYear]
        );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "A target already exists for this period. Use Revise Target to change it." });
    }

    const result = await query(
      `INSERT INTO poc_targets (unit_type, unit_code, fiscal_year, office_id, physical_target, budget_annual, created_by, set_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        unitType,
        officeKeyed ? null : unitCode,
        fiscalYear,
        officeId,
        physicalTarget || {},
        budgetOutlay ?? null,
        req.user.email,
        req.user.id,
      ]
    );

    return res.status(201).json({ ok: true, target: toTargetPayload(result.rows[0]) });
  } catch (error) {
    console.error('Create target error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/targets/:id/revise  { physicalTarget?, budgetOutlay?, reason }
app.post("/api/targets/:id/revise", requireRole('admin', 'secondary_admin'), async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { physicalTarget, budgetOutlay, reason } = req.body || {};

    if (!Number.isInteger(targetId)) {
      return res.status(400).json({ error: "Invalid target id" });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: "A reason is required to revise a target" });
    }

    const revised = await transaction(async (client) => {
      const current = await client.query(`SELECT * FROM poc_targets WHERE id = $1 AND is_current LIMIT 1`, [targetId]);
      if (current.rows.length === 0) {
        return null;
      }
      const prior = current.rows[0];

      await client.query(`UPDATE poc_targets SET is_current = FALSE WHERE id = $1`, [targetId]);

      const inserted = await client.query(
        `INSERT INTO poc_targets (unit_type, unit_code, fiscal_year, year, month, office_id, physical_target, budget_annual, revised_from_target_id, revision_reason, created_by, set_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          prior.unit_type,
          prior.unit_code,
          prior.fiscal_year,
          prior.year,
          prior.month,
          prior.office_id,
          physicalTarget ?? prior.physical_target,
          budgetOutlay !== undefined ? budgetOutlay : prior.budget_annual,
          targetId,
          reason,
          req.user.email,
          req.user.id,
        ]
      );
      return inserted.rows[0];
    });

    if (!revised) {
      return res.status(404).json({ error: "Target not found" });
    }

    return res.status(201).json({ ok: true, target: toTargetPayload(revised) });
  } catch (error) {
    console.error('Revise target error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports?unitType=&fiscalYear=&officeId=  -> list (scoped)
app.get("/api/reports", requireAuth, async (req, res) => {
  try {
    const { unitType, fiscalYear } = req.query;
    if (!unitType || !TARGET_UNIT_TYPES.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: " + TARGET_UNIT_TYPES.join(', ') });
    }
    if (!fiscalYear) {
      return res.status(400).json({ error: "fiscalYear is required" });
    }

    const officeId = req.user.role === 'user' ? req.user.officeId : (req.query.officeId ? Number(req.query.officeId) : null);
    const sectionId = req.user.role === 'user' ? null : (req.query.sectionId ? Number(req.query.sectionId) : null);
    const groupId = req.user.role === 'user' ? null : (req.query.groupId ? Number(req.query.groupId) : null);

    const reports = await reportsService.list({ unitType, fiscalYear, officeId, sectionId, groupId });
    return res.json({ ok: true, reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/current?unitType=&fiscalYear=&officeId=&month=&unitCode=
app.get("/api/reports/current", requireAuth, async (req, res) => {
  try {
    const { unitType, fiscalYear, unitCode, month } = req.query;
    if (!unitType || !TARGET_UNIT_TYPES.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: " + TARGET_UNIT_TYPES.join(', ') });
    }
    if (!fiscalYear) {
      return res.status(400).json({ error: "fiscalYear is required" });
    }

    const officeId = req.user.role === 'user' ? req.user.officeId : (req.query.officeId ? Number(req.query.officeId) : null);
    const report = await reportsService.getCurrent({ unitType, officeId, unitCode, fiscalYear, month });
    if (report && !assertOwnOffice(report.officeId, req, res)) return;
    return res.json({ ok: true, report });
  } catch (error) {
    console.error('Get current report error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reports  { unitType, officeId?, unitCode?, fiscalYear, month?, data }  -> upsert draft
app.post("/api/reports", requireRole('admin', 'user'), async (req, res) => {
  try {
    const { unitType, unitCode, fiscalYear, month, data } = req.body || {};
    let { officeId } = req.body || {};

    if (!unitType || !TARGET_UNIT_TYPES.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: " + TARGET_UNIT_TYPES.join(', ') });
    }
    if (!fiscalYear) {
      return res.status(400).json({ error: "fiscalYear is required" });
    }

    // A 'user' can only ever save their own office's report — the client
    // value is ignored entirely, not just validated.
    if (req.user.role === 'user') {
      officeId = req.user.officeId;
    }

    if (isMonthlyReelingType(unitType) && !officeId) {
      return res.status(400).json({ error: "officeId is required for government_reeling reports" });
    }

    const report = await reportsService.saveDraft({ unitType, officeId, unitCode, fiscalYear, month, data: data || {} });
    return res.status(201).json({ ok: true, report });
  } catch (error) {
    console.error('Save report error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/reports/:id  { data }
app.put("/api/reports/:id", requireRole('admin', 'user'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid report id" });
    }
    const existing = await reportsService.getById(id);
    if (!existing) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (!assertOwnOffice(existing.officeId, req, res)) return;

    const updated = await reportsService.updateData(id, req.body?.data || {});
    if (!updated) {
      return res.status(409).json({ error: "Report is already submitted and cannot be edited" });
    }
    return res.json({ ok: true, report: updated });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reports/:id/submit
app.post("/api/reports/:id/submit", requireRole('admin', 'user'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid report id" });
    }
    const existing = await reportsService.getById(id);
    if (!existing) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (!assertOwnOffice(existing.officeId, req, res)) return;

    const submitted = await reportsService.submit(id, req.user.id);
    return res.json({ ok: true, report: submitted });
  } catch (error) {
    console.error('Submit report error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/export/excel?unitType=government_reeling&officeId=all&fiscalYear=&month=
// Admin/secondary_admin only: one workbook covering every office for a month.
app.get("/api/reports/export/excel", requireRole('admin', 'secondary_admin'), async (req, res) => {
  try {
    const { unitType, fiscalYear, month } = req.query;
    if (!unitType || !TARGET_UNIT_TYPES.includes(unitType)) {
      return res.status(400).json({ error: "unitType must be one of: " + TARGET_UNIT_TYPES.join(', ') });
    }
    if (!fiscalYear) {
      return res.status(400).json({ error: "fiscalYear is required" });
    }

    const reports = await reportsService.list({ unitType, fiscalYear });
    const filtered = month ? reports.filter((r) => r.month === month) : reports;
    const withData = filtered.filter((r) => r.data && Object.keys(r.data).length > 0);
    if (withData.length === 0) {
      return res.status(404).json({ error: "No reports found for this period" });
    }

    // buildGovtReelingWorkbook below is government_reeling-specific, so its
    // office_ids are always govt_reeling_offices ids, never poc_offices.
    const officeIds = [...new Set(withData.map((r) => r.officeId))];
    const officeRows = await query('SELECT id, name FROM govt_reeling_offices WHERE id = ANY($1)', [officeIds]);
    const officeNameById = Object.fromEntries(officeRows.rows.map((o) => [o.id, o.name]));

    const buffer = await buildGovtReelingWorkbook(
      withData.map((r) => ({ officeName: officeNameById[r.officeId] || `Office ${r.officeId}`, data: r.data }))
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="government-reeling-${fiscalYear}${month ? `-${month}` : ''}-all-offices.xlsx"`);
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export all-offices Excel error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/govt-reeling/consolidated?fiscalYear=2026-2027&months=April,May
// Cross-office consolidated report matching the department's GSRU workbook —
// one row per office (govt_reeling_offices), one JSON object per requested
// month. Admin/secondary_admin only, same as the all-offices export above.
app.get("/api/reports/govt-reeling/consolidated", requireRole('admin', 'secondary_admin'), async (req, res) => {
  try {
    const { fiscalYear: fiscalYearLabel, months } = req.query;
    if (!fiscalYearLabel || !/^\d{4}-\d{4}$/.test(fiscalYearLabel)) {
      return res.status(400).json({ error: "fiscalYear is required, format YYYY-YYYY" });
    }
    if (!months) {
      return res.status(400).json({ error: "months is required, e.g. months=April,May" });
    }
    const monthList = String(months).split(',').map((m) => m.trim()).filter(Boolean);
    const fiscalYear = Number(fiscalYearLabel.split('-')[0]);

    const results = await Promise.all(
      monthList.map((month) => getConsolidatedReport({ fiscalYear, fiscalYearLabel, month }))
    );
    return res.json({ ok: true, months: results });
  } catch (error) {
    console.error('Get consolidated report error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/govt-reeling/consolidated/export/excel?fiscalYear=2026-2027&months=April,May
app.get("/api/reports/govt-reeling/consolidated/export/excel", requireRole('admin', 'secondary_admin'), async (req, res) => {
  try {
    const { fiscalYear: fiscalYearLabel, months } = req.query;
    if (!fiscalYearLabel || !/^\d{4}-\d{4}$/.test(fiscalYearLabel)) {
      return res.status(400).json({ error: "fiscalYear is required, format YYYY-YYYY" });
    }
    if (!months) {
      return res.status(400).json({ error: "months is required, e.g. months=April,May" });
    }
    const monthList = String(months).split(',').map((m) => m.trim()).filter(Boolean);
    const fiscalYear = Number(fiscalYearLabel.split('-')[0]);

    const monthsData = await Promise.all(
      monthList.map((month) => getConsolidatedReport({ fiscalYear, fiscalYearLabel, month }))
    );
    const buffer = await buildConsolidatedWorkbook(monthsData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="GSRU-${fiscalYearLabel}.xlsx"`);
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export consolidated Excel error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/:id/export/excel — single report
app.get("/api/reports/:id/export/excel", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid report id" });
    }
    const report = await reportsService.getById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (!assertOwnOffice(report.officeId, req, res)) return;

    const buffer = await buildGovtReelingWorkbook({ data: report.data });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="government-reeling-report-${id}.xlsx"`);
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export report Excel error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware — registered in startServer after MIS routes

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Starting server...');
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server not started.');
      process.exit(1);
    }

    await renamePocTables();

    await initHierarchySchema();
    await initUsersSchema();
    await initReportsSchema();
    await initGovtReelingOfficesSchema();

    const schemaInitialized = await initializeDatabase();
    if (!schemaInitialized) {
      console.error('❌ Failed to initialize database schema.');
      process.exit(1);
    }

    const misDb = createPgAdapter(query);
    await initMisPostgres(misDb);

    await migrateAndSeedHierarchy();
    await migrateAndSeedUsers();

    const adminCheck = await query(`SELECT id FROM poc_users WHERE role = 'admin' LIMIT 1`);
    if (adminCheck.rows.length === 0) {
      await usersService.create({
        name: 'Administrator',
        email: 'admin@example.com',
        password: 'Admin123!',
        role: 'admin',
      });
      console.log('✅ Default admin created: admin@example.com / Admin123!');
    }

    await seedMisIfEmpty(misDb);

    app.use('/api', createMisRouter(() => misDb));

    app.use((err, _req, res, _next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    app.use((_req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    if (process.env.VERCEL) {
      console.log('✅ Server ready for serverless deployment');
      return;
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔑 Login: http://localhost:${PORT}/api/login`);
      console.log(`📋 MIS viewer API: http://localhost:${PORT}/api/report`);
      console.log(`🌐 LAN: use your PC IP, e.g. http://<your-ip>:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize server for serverless
startServer();

// Export for Vercel serverless
export default app;
