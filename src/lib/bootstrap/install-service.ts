import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import { database, get, run, transaction } from "@/lib/db";
import type { InstallAdministratorInput } from "@/lib/validation/install";

export class InstallationAlreadyCompleteError extends Error {}
export class ExistingAdministratorError extends Error {}

function ensureDefaultSettings(now: number) {
  run(
    `INSERT OR IGNORE INTO site_settings
     (id, site_name, site_description, site_url, active_theme, posts_per_page, created_at, updated_at)
     VALUES (1, 'Dust In The Wind', '人生如逆旅，我亦是行人。', 'http://localhost:3000', 'lite', 5, ?, ?)`,
    now,
    now,
  );
}

export function prepareExistingInstallation(mode: "keep" | "delete") {
  const now = Date.now();
  let existingUserId: string | null = null;

  transaction(() => {
    if (get("SELECT 1 FROM installation_state WHERE id = 1")) {
      throw new InstallationAlreadyCompleteError();
    }

    if (mode === "delete") {
      database.exec(`
        DELETE FROM sessions;
        DELETE FROM posts_to_tags;
        DELETE FROM posts;
        DELETE FROM tags;
        DELETE FROM categories;
        DELETE FROM user_preferences;
        DELETE FROM users;
        DELETE FROM theme_settings;
        DELETE FROM site_settings;
      `);
      return;
    }

    existingUserId = get<{ id: string }>("SELECT id FROM users LIMIT 1")?.id ?? null;
    if (existingUserId) {
      ensureDefaultSettings(now);
      run(
        `INSERT OR IGNORE INTO user_preferences
         (user_id, markdown, xmlrpc_markdown, auto_save, default_allow_comment,
          default_allow_ping, default_allow_feed, created_at, updated_at)
         VALUES (?, 1, 0, 0, 1, 1, 1, ?, ?)`,
        existingUserId,
        now,
        now,
      );
      run(
        "INSERT INTO installation_state (id, installed_at, version) VALUES (1, ?, 1)",
        now,
      );
    }
  });

  return existingUserId;
}

export async function installSite(input: InstallAdministratorInput) {
  const password = input.password || randomBytes(12).toString("base64url").slice(0, 12);
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const now = Date.now();
  const siteUrl = input.siteUrl.replace(/\/+$/, "");

  transaction(() => {
    if (get("SELECT 1 FROM installation_state WHERE id = 1")) {
      throw new InstallationAlreadyCompleteError();
    }
    if (get("SELECT 1 FROM users LIMIT 1")) throw new ExistingAdministratorError();

    run(
      `INSERT INTO users
       (id, username, email, password_hash, display_name, url, role, last_login_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, '', 'administrator', NULL, ?, ?)`,
      userId,
      input.username,
      input.email,
      passwordHash,
      input.username,
      now,
      now,
    );
    run(
      `INSERT INTO user_preferences
       (user_id, markdown, xmlrpc_markdown, auto_save, default_allow_comment,
        default_allow_ping, default_allow_feed, created_at, updated_at)
       VALUES (?, 1, 0, 0, 1, 1, 1, ?, ?)`,
      userId,
      now,
      now,
    );
    run(
      `INSERT INTO site_settings
       (id, site_name, site_description, site_url, active_theme, posts_per_page, created_at, updated_at)
       VALUES (1, 'Dust In The Wind', '人生如逆旅，我亦是行人。', ?, 'lite', 5, ?, ?)
       ON CONFLICT(id) DO UPDATE SET site_url = excluded.site_url, updated_at = excluded.updated_at`,
      siteUrl,
      now,
      now,
    );

    const categoryId = get<{ id: string }>("SELECT id FROM categories WHERE slug = 'default'")?.id
      ?? randomUUID();
    run(
      `INSERT OR IGNORE INTO categories (id, name, slug, created_at, updated_at)
       VALUES (?, '默认分类', 'default', ?, ?)`,
      categoryId,
      now,
      now,
    );

    if (!get("SELECT 1 FROM posts LIMIT 1")) {
      run(
        `INSERT INTO posts
         (id, title, slug, excerpt, content, status, published_at, category_id, created_at, updated_at)
         VALUES (?, '欢迎使用 Typecho', 'start', NULL, ?, 'published', ?, ?, ?, ?)`,
        randomUUID(),
        "如果您看到这篇文章,表示您的 blog 已经安装成功.",
        now,
        categoryId,
        now,
        now,
      );
    }

    // 安装标记最后写入；此前任一步失败都会回滚，避免出现半安装状态。
    run("INSERT INTO installation_state (id, installed_at, version) VALUES (1, ?, 1)", now);
  });

  return { userId, username: input.username, password, siteUrl };
}
