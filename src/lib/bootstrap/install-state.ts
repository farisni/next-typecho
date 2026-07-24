import { accessSync, constants, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  applyMigrations,
  ensureDatabaseDirectory,
  getDatabasePath,
  getMigrationsPath,
} from "@/lib/bootstrap/migrations";

export type InstallationStatus = "needs-schema" | "needs-administrator" | "installed";

export type InstallationState = {
  status: InstallationStatus;
  hasExistingData: boolean;
  hasUsers: boolean;
};

export type EnvironmentCheck = {
  label: string;
  description: string;
  ok: boolean;
};

const requiredTables = [
  "categories",
  "posts",
  "posts_to_tags",
  "sessions",
  "site_settings",
  "tags",
  "theme_settings",
  "user_preferences",
  "users",
  "installation_state",
];

function tableExists(database: DatabaseSync, name: string) {
  return Boolean(
    database.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name),
  );
}

export function inspectInstallationState(): InstallationState {
  const databasePath = getDatabasePath();
  if (databasePath === ":memory:" || !existsSync(databasePath)) {
    return { status: "needs-schema", hasExistingData: false, hasUsers: false };
  }

  let database: DatabaseSync;
  try {
    database = new DatabaseSync(databasePath);
  } catch {
    return { status: "needs-schema", hasExistingData: false, hasUsers: false };
  }

  try {
    database.exec("PRAGMA busy_timeout = 2000;");
    if (!requiredTables.every((table) => tableExists(database, table))) {
      return { status: "needs-schema", hasExistingData: false, hasUsers: false };
    }

    const installed = Boolean(
      database.prepare("SELECT 1 FROM installation_state WHERE id = 1").get(),
    );
    const hasUsers = Boolean(database.prepare("SELECT 1 FROM users LIMIT 1").get());
    const hasExistingData = ["categories", "posts", "site_settings", "tags", "users"]
      .some((table) => Boolean(database.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get()));

    return {
      status: installed ? "installed" : "needs-administrator",
      hasExistingData,
      hasUsers,
    };
  } catch {
    return { status: "needs-schema", hasExistingData: false, hasUsers: false };
  } finally {
    database.close();
  }
}

export function checkInstallEnvironment(): EnvironmentCheck[] {
  const databasePath = getDatabasePath();
  const uploadsPath = path.join(process.cwd(), "public", "uploads");
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const checks: EnvironmentCheck[] = [
    {
      label: "Node.js 运行环境",
      description: `当前版本 ${process.versions.node}，最低需要 24.0.0`,
      ok: nodeMajor >= 24,
    },
    {
      label: "SQLite 数据库",
      description: databasePath === ":memory:" ? "安装程序不支持临时内存数据库" : databasePath,
      ok: databasePath !== ":memory:",
    },
  ];

  try {
    accessSync(getMigrationsPath(), constants.R_OK);
    checks.push({ label: "数据库迁移文件", description: "migration 文件可读取", ok: true });
  } catch {
    checks.push({ label: "数据库迁移文件", description: "drizzle/migrations 无法读取", ok: false });
  }

  try {
    ensureDatabaseDirectory(databasePath);
    if (databasePath !== ":memory:") accessSync(path.dirname(databasePath), constants.R_OK | constants.W_OK);
    checks.push({ label: "数据库目录权限", description: "数据库目录可读写", ok: true });
  } catch {
    checks.push({ label: "数据库目录权限", description: "数据库目录无法写入", ok: false });
  }

  try {
    mkdirSync(uploadsPath, { recursive: true });
    accessSync(uploadsPath, constants.R_OK | constants.W_OK);
    checks.push({ label: "上传目录权限", description: "public/uploads 可读写", ok: true });
  } catch {
    checks.push({ label: "上传目录权限", description: "public/uploads 无法写入", ok: false });
  }

  return checks;
}

export function initializeDatabaseSchema() {
  const databasePath = getDatabasePath();
  ensureDatabaseDirectory(databasePath);
  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    return applyMigrations(database);
  } finally {
    database.close();
  }
}