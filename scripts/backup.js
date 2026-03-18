#!/usr/bin/env node
/**
 * TheHomeFood — Backup script
 * Creates a timestamped copy of the SQLite database.
 *
 * Usage:
 *   node scripts/backup.js
 *   node scripts/backup.js ./my-backup-dir
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Find the database file
function findDbPath() {
  const envDb = process.env.DATABASE_URL?.replace("file:", "");
  if (envDb) {
    // Resolve relative to prisma/ directory
    const candidates = [
      path.resolve(root, "prisma", envDb.startsWith("./") ? envDb.slice(2) : envDb),
      path.resolve(root, envDb),
      path.resolve(envDb),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  // Fallback defaults
  const defaults = [
    path.join(root, "prisma", "dev.db"),
    path.join(root, "data", "prod.db"),
  ];
  for (const d of defaults) {
    if (fs.existsSync(d)) return d;
  }
  return null;
}

const dbPath = findDbPath();
if (!dbPath) {
  console.error("❌ Database file not found. Run migrations first.");
  process.exit(1);
}

const backupDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "backups");
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const backupFile = path.join(backupDir, `thf-backup-${timestamp}.db`);

fs.copyFileSync(dbPath, backupFile);
console.log(`✅ Backup created: ${backupFile}`);
console.log(`   Source: ${dbPath}`);
