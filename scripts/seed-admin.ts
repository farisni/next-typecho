import "dotenv/config";
import { randomUUID } from "node:crypto";
import { get, run, transaction } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

const username = process.env.ADMIN_USERNAME ?? "admin";
const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.ADMIN_PASSWORD ?? "typecho-admin";

if (password.length < 8) throw new Error("ADMIN_PASSWORD 至少需要 8 个字符");

async function main() {
  const existingUser = get<{ id: string }>("SELECT id FROM users LIMIT 1");
  if (existingUser) {
    const now = Date.now();
    transaction(() => {
      run(
        `INSERT OR IGNORE INTO user_preferences
         (user_id, markdown, xmlrpc_markdown, auto_save, default_allow_comment,
          default_allow_ping, default_allow_feed, created_at, updated_at)
         VALUES (?, 1, 0, 0, 1, 1, 1, ?, ?)`,
        existingUser.id,
        now,
        now,
      );
      run(
        `INSERT OR IGNORE INTO site_settings
         (id, site_name, site_description, site_url, posts_per_page, created_at, updated_at)
         VALUES (1, 'Dust In The Wind', 'Your description here.', 'http://localhost:3000', 5, ?, ?)`,
        now,
        now,
      );
      run("INSERT OR IGNORE INTO installation_state (id, installed_at, version) VALUES (1, ?, 1)", now);
    });
    console.log("Administrator already exists; installation state ensured.");
    return;
  }

  const now = Date.now();
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  transaction(() => {
    run(
      `INSERT INTO users
       (id, username, email, password_hash, display_name, url, role, last_login_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, '', 'administrator', NULL, ?, ?)`,
      userId, username, email, passwordHash, "管理员", now, now,
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
      `INSERT OR IGNORE INTO site_settings
       (id, site_name, site_description, site_url, posts_per_page, created_at, updated_at)
       VALUES (1, 'Dust In The Wind', 'Your description here.', 'http://localhost:3000', 5, ?, ?)`,
      now,
      now,
    );
    run("INSERT INTO installation_state (id, installed_at, version) VALUES (1, ?, 1)", now);
  });
  console.log(`Administrator '${username}' created.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
