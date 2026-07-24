import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

export function getDatabasePath() {
  const configuredPath = process.env.DATABASE_URL ?? "./data/dev.db";
  return configuredPath === ":memory:" || path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

export function getMigrationsPath() {
  return path.join(process.cwd(), "drizzle", "migrations");
}

export function ensureDatabaseDirectory(databasePath = getDatabasePath()) {
  if (databasePath !== ":memory:") mkdirSync(path.dirname(databasePath), { recursive: true });
}

export function applyMigrations(database: DatabaseSync) {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const migrationsPath = getMigrationsPath();
  const migrations = readdirSync(migrationsPath)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const newlyApplied: string[] = [];

  for (const name of migrations) {
    const sql = readFileSync(path.join(migrationsPath, name), "utf8");

    database.exec("BEGIN IMMEDIATE");
    try {
      // 获取写锁后再次确认，避免多个服务实例同时启动时重复执行同一个 migration。
      const exists = database.prepare("SELECT 1 FROM _migrations WHERE name = ?").get(name);
      if (exists) {
        database.exec("COMMIT");
        continue;
      }
      database.exec(sql);
      database.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run(name, Date.now());
      database.exec("COMMIT");
      newlyApplied.push(name);
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  return newlyApplied;
}