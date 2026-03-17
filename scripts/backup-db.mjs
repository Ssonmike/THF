import fs from "node:fs";
import path from "node:path";
import { resolveDatabaseFilePath, getProjectRoot } from "./db-path.mjs";

const databasePath = resolveDatabaseFilePath();
const backupsDirectory = path.join(getProjectRoot(), "backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupsDirectory, `nutri-week-${timestamp}.db`);

fs.mkdirSync(backupsDirectory, { recursive: true });
fs.copyFileSync(databasePath, backupPath);

console.log(`Backup created at ${backupPath}`);
