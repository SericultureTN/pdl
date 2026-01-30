import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const COOKIE_NAME = "pdl_admin_token";

export function signAdminToken({ adminId, email }) {
  return jwt.sign({ sub: adminId, email, role: "admin" }, JWT_SECRET, {
    expiresIn: "2h"
  });
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
    req.admin = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
}

export function cookieOptions(req) {
  // for local dev: frontend is http://localhost:5173 and backend is http://localhost:4000
  // SameSite "lax" works with top-level navigation; for XHR cross-site cookie use "none" + secure.
  // We'll default to Lax + non-secure for local HTTP.
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60 * 1000
  };
}

