import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import {
  applyMigrations,
  ensureDatabaseDirectory,
  getDatabasePath,
} from "@/lib/bootstrap/migrations";

const databasePath = getDatabasePath();
ensureDatabaseDirectory(databasePath);

const globalForDatabase = globalThis as unknown as { sqlite?: DatabaseSync };
export const database = globalForDatabase.sqlite ?? new DatabaseSync(databasePath);
database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
// 页面和布局可能并行渲染；启动时补齐幂等 migration，避免未安装站点先因缺表而 500。
applyMigrations(database);

if (process.env.NODE_ENV !== "production") globalForDatabase.sqlite = database;

export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return database.prepare(sql).all(...params) as unknown as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return database.prepare(sql).get(...params) as unknown as T | undefined;
}

export function run(sql: string, ...params: SQLInputValue[]) {
  return database.prepare(sql).run(...params);
}

export function transaction(work: () => void) {
  database.exec("BEGIN IMMEDIATE");
  try {
    work();
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
