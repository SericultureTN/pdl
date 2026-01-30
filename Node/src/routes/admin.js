import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db.js";
import { cookieOptions, getAuthCookieName, requireAdmin, signAdminToken } from "../auth.js";

export const adminRouter = express.Router();

adminRouter.post("/login", (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "INVALID_BODY" });

  const { email, password } = parsed.data;
  const admin = db
    .prepare("SELECT id, email, password_hash FROM admins WHERE email = ?")
    .get(email);

  if (!admin) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  const ok = bcrypt.compareSync(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const token = signAdminToken({ adminId: admin.id, email: admin.email });
  res.cookie(getAuthCookieName(), token, cookieOptions(req));
  return res.json({ ok: true, admin: { id: admin.id, email: admin.email } });
});

adminRouter.post("/logout", (req, res) => {
  res.clearCookie(getAuthCookieName(), { path: "/" });
  return res.json({ ok: true });
});

adminRouter.get("/me", requireAdmin, (req, res) => {
  return res.json({ ok: true, admin: req.admin });
});

adminRouter.get("/dashboard", requireAdmin, (req, res) => {
  return res.json({
    ok: true,
    message: `Welcome, ${req.admin.email}!`,
    serverTime: new Date().toISOString()
  });
});

