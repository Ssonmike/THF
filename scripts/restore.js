#!/usr/bin/env node
/**
 * TheHomeFood — Restore script
 * Restores the SQLite database from a backup file.
 *
 * Usage:
 *   node scripts/restore.js ./backups/thf-backup-2026-03-18T10-00-00.db
 *
 * ⚠ WARNING: This will OVERWRITE the current database.
 *   Stop the app before restoring.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const backupFile = process.argv[2];
if (!backupFile) {
  console.error("Usage: node scripts/restore.js <backup-file>");
  console.error("Example: node scripts/restore.js ./backups/thf-backup-2026-03-18T10-00-00.db");
  process.exit(1);
}

const backupPath = path.resolve(backupFile);
if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup file not found: ${backupPath}`);
  process.exit(1);
}

// Find target DB
function findDbPath() {
  const envDb = process.env.DATABASE_URL?.replace("file:", "");
  if (envDb) {
    const candidates = [
      path.resolve(root, "prisma", envDb.startsWith("./") ? envDb.slice(2) : envDb),
      path.resolve(root, envDb),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  const defaults = [
    path.join(root, "prisma", "dev.db"),
    path.join(root, "data", "prod.db"),
  ];
  for (const d of defaults) {
    if (fs.existsSync(d)) return d;
  }
  // If none exists, restore to dev.db
  return path.join(root, "prisma", "dev.db");
}

const dbPath = findDbPath();

console.log(`⚠  Restore will OVERWRITE: ${dbPath}`);
console.log(`   From backup: ${backupPath}`);
console.log("");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Type YES to confirm: ", (answer) => {
  rl.close();
  if (answer.trim() !== "YES") {
    console.log("Cancelled.");
    process.exit(0);
  }

  // Create safety backup of current DB before overwriting
  if (fs.existsSync(dbPath)) {
    const safetyDir = path.join(root, "backups");
    fs.mkdirSync(safetyDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const safetyFile = path.join(safetyDir, `thf-pre-restore-${ts}.db`);
    fs.copyFileSync(dbPath, safetyFile);
    console.log(`✅ Safety backup saved: ${safetyFile}`);
  }

  fs.copyFileSync(backupPath, dbPath);
  console.log(`✅ Restored successfully: ${dbPath}`);
  console.log("   Restart the app to use the restored database.");
});
