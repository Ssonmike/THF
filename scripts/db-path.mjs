import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const prismaDirectory = path.join(projectRoot, "prisma");

export function resolveDatabaseFilePath(databaseUrl = process.env.DATABASE_URL || "file:./dev.db") {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only SQLite file: URLs are supported by these scripts.");
  }

  const rawPath = databaseUrl.replace(/^file:/, "");

  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  return path.resolve(prismaDirectory, rawPath);
}

export function getProjectRoot() {
  return projectRoot;
}
