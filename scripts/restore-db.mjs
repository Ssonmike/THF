import fs from "node:fs";
import path from "node:path";
import { resolveDatabaseFilePath, getProjectRoot } from "./db-path.mjs";

const sourcePath = process.argv[2];

if (!sourcePath) {
  console.error("Usage: npm run restore -- <path-to-backup.db>");
  process.exit(1);
}

const databasePath = resolveDatabaseFilePath();
const backupsDirectory = path.join(getProjectRoot(), "backups");
const safetyTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
const safetyBackupPath = path.join(backupsDirectory, `pre-restore-${safetyTimestamp}.db`);

fs.mkdirSync(backupsDirectory, { recursive: true });

if (fs.existsSync(databasePath)) {
  fs.copyFileSync(databasePath, safetyBackupPath);
}

fs.copyFileSync(path.resolve(sourcePath), databasePath);

console.log(`Database restored from ${sourcePath}`);
console.log(`Safety backup saved at ${safetyBackupPath}`);
