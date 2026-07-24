import "dotenv/config";
import { database, run, transaction } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

const now = Date.now();
const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "typecho-admin";

if (adminPassword.length < 8) throw new Error("ADMIN_PASSWORD 至少需要 8 个字符");

async function main() {
  const adminPasswordHash = await hashPassword(adminPassword);

  transaction(() => {
  database.exec(`
    DELETE FROM installation_state;
    DELETE FROM sessions;
    DELETE FROM user_preferences;
    DELETE FROM users;
    DELETE FROM posts_to_tags;
    DELETE FROM posts;
    DELETE FROM tags;
    DELETE FROM categories;
    DELETE FROM theme_settings;
    DELETE FROM site_settings;
  `);

  run("INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", "category-development", "开发", "development", now, now);
  run("INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", "category-notes", "随笔", "notes", now, now);
  run("INSERT INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", "tag-nextjs", "Next.js", "nextjs", now, now);
  run("INSERT INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", "tag-markdown", "Markdown", "markdown", now, now);
  run("INSERT INTO site_settings (id, site_name, site_description, posts_per_page, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?)", "Next Typecho", "Your description here.", 6, now, now);
  run(
    `INSERT INTO users
     (id, username, email, password_hash, display_name, url, role, last_login_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', 'administrator', NULL, ?, ?)`,
    "user-admin", adminUsername, adminEmail, adminPasswordHash, "管理员", now, now,
  );
  run(
    `INSERT INTO user_preferences
     (user_id, markdown, xmlrpc_markdown, auto_save, default_allow_comment,
      default_allow_ping, default_allow_feed, created_at, updated_at)
     VALUES ('user-admin', 1, 0, 0, 1, 1, 1, ?, ?)`,
    now,
    now,
  );

  run(
    "INSERT INTO posts (id, title, slug, excerpt, content, status, published_at, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    "post-welcome",
    "欢迎来到 Next Typecho",
    "welcome-to-next-typecho",
    "这是第一篇示例文章，用来验证发布、分类、标签和 Markdown 渲染流程。",
    "# 欢迎\n\nNext Typecho 是一个使用 **Next.js App Router** 构建的轻量博客 CMS。\n\n- Server Components 负责读取内容\n- Server Actions 负责写入数据\n- Markdown 内容经过安全过滤后渲染\n\n> 保持内容创作简单，把复杂性留在清晰的边界里。",
    "published",
    new Date("2026-07-20T08:00:00.000Z").getTime(),
    "category-development",
    now,
    now,
  );
  run(
    "INSERT INTO posts (id, title, slug, excerpt, content, status, published_at, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    "post-markdown-writing",
    "使用 Markdown 专注写作",
    "markdown-writing",
    "Markdown 源文便于编辑、迁移和版本管理。",
    "## 一份简单的写作约定\n\n正文保存为 Markdown，而不是未经约束的 HTML。\n\n```ts\nconst safe = true;\n```\n\n表格、任务列表等 GFM 语法也可以正常使用。",
    "published",
    new Date("2026-07-22T08:00:00.000Z").getTime(),
    "category-notes",
    now,
    now,
  );
  run(
    "INSERT INTO posts (id, title, slug, excerpt, content, status, published_at, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    "post-next-step",
    "下一阶段计划",
    "next-step",
    "这是一篇草稿，不会出现在公开站点。",
    "完善表单反馈、测试和管理端认证。",
    "draft",
    null,
    "category-development",
    now,
    now,
  );

  run("INSERT INTO posts_to_tags (post_id, tag_id) VALUES (?, ?)", "post-welcome", "tag-nextjs");
  run("INSERT INTO posts_to_tags (post_id, tag_id) VALUES (?, ?)", "post-welcome", "tag-markdown");
  run("INSERT INTO posts_to_tags (post_id, tag_id) VALUES (?, ?)", "post-markdown-writing", "tag-markdown");
  run("INSERT INTO posts_to_tags (post_id, tag_id) VALUES (?, ?)", "post-next-step", "tag-nextjs");
  run("INSERT INTO installation_state (id, installed_at, version) VALUES (1, ?, 1)", now);
  });

  console.log(`Seed data and administrator '${adminUsername}' created.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
