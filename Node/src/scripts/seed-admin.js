import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../db.js";

const email = process.env.ADMIN_EMAIL || "admin@example.com";
const password = process.env.ADMIN_PASSWORD || "Admin123!";

const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
if (existing) {
  // eslint-disable-next-line no-console
  console.log(`Admin already exists for ${email} (id=${existing.id}).`);
  process.exit(0);
}

const password_hash = bcrypt.hashSync(password, 12);
const info = db
  .prepare("INSERT INTO admins (email, password_hash) VALUES (?, ?)")
  .run(email, password_hash);

// eslint-disable-next-line no-console
console.log(`Seeded admin id=${info.lastInsertRowid} email=${email}`);
