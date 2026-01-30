import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true
  })
);

// Simple in-memory admin for demo
const adminUser = {
  id: 1,
  email: "admin@example.com",
  password: "Admin123!"
};

app.get("/health", (_req, res) => res.json({ ok: true }));

// Simple login endpoint (without bcrypt for demo)
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  if (email === adminUser.email && password === adminUser.password) {
    // Simple token (in production, use JWT)
    const token = "demo_token_" + Date.now();
    res.cookie("pdl_admin_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60 * 1000
    });
    return res.json({ 
      ok: true, 
      admin: { id: adminUser.id, email: adminUser.email } 
    });
  }

  return res.status(401).json({ error: "INVALID_CREDENTIALS" });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("pdl_admin_token", { path: "/" });
  return res.json({ ok: true });
});

// Simple auth middleware
const requireAdmin = (req, res, next) => {
  const token = req.cookies?.pdl_admin_token;
  if (!token || !token.startsWith("demo_token_")) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
  req.admin = { id: 1, email: adminUser.email };
  return next();
};

app.get("/api/admin/me", requireAdmin, (req, res) => {
  return res.json({ ok: true, admin: req.admin });
});

app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  return res.json({
    ok: true,
    message: `Welcome, ${req.admin.email}!`,
    serverTime: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Demo credentials: ${adminUser.email} / ${adminUser.password}`);
});
