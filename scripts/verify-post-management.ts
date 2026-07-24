import { existsSync, rmSync } from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const databasePath = path.join(process.cwd(), ".data", `post-management-verification-${process.pid}.db`);
  process.env.DATABASE_URL = databasePath;
  const cleanup = () => {
    for (const suffix of ["", "-wal", "-shm"]) {
      const file = `${databasePath}${suffix}`;
      if (existsSync(file)) rmSync(file, { force: true });
    }
  };

  cleanup();
  const { database, run } = await import("../src/lib/db");
  try {
    const { initializeDatabaseSchema } = await import("../src/lib/bootstrap/install-state");
    const { installSite } = await import("../src/lib/bootstrap/install-service");
    const { listPostsForAdmin } = await import("../src/lib/repositories/posts");
    const { bulkManagePostRecords } = await import("../src/lib/posts/admin-service");

    initializeDatabaseSchema();
    await installSite({
      siteUrl: "http://localhost:3000",
      username: "post-admin",
      password: "post-admin-password",
      email: "posts@example.com",
    });
    const category = database.prepare("SELECT id FROM categories WHERE slug = 'default'").get() as { id: string };
    const now = Date.now();
    for (const [id, title, status] of [
      ["post-draft-test", "筛选草稿 Alpha", "draft"],
      ["post-waiting-test", "等待审核 Beta", "waiting"],
      ["post-hidden-test", "隐藏内容 Gamma", "hidden"],
      ["post-private-test", "私密内容 Delta", "private"],
    ] as const) {
      run(
        `INSERT INTO posts
         (id, title, slug, excerpt, content, status, published_at, category_id, created_at, updated_at)
         VALUES (?, ?, ?, NULL, 'content', ?, ?, ?, ?, ?)`,
        id,
        title,
        id,
        status,
        status === "draft" || status === "waiting" ? null : now,
        category.id,
        now,
        now,
      );
    }

    const available = listPostsForAdmin({ status: "available", page: 1, pageSize: 20 });
    assert(available.items.some((post) => post.id === "post-hidden-test"), "可用列表未包含隐藏文章");
    assert(!available.items.some((post) => post.id === "post-draft-test"), "可用列表错误包含草稿");
    assert(available.counts.waiting === 1 && available.counts.draft === 1, "状态计数不正确");

    const waiting = listPostsForAdmin({ status: "waiting", keywords: "等待 Beta", page: 1 });
    assert(waiting.items.length === 1 && waiting.items[0].id === "post-waiting-test", "待审核或多关键词筛选失败");
    const categoryFiltered = listPostsForAdmin({ status: "draft", categoryId: category.id, page: 1 });
    assert(categoryFiltered.items.some((post) => post.id === "post-draft-test"), "分类筛选失败");

    bulkManagePostRecords(["post-draft-test", "post-waiting-test"], "published");
    const publishedRows = database.prepare("SELECT count(*) AS count FROM posts WHERE id IN (?, ?) AND status = 'published'").get("post-draft-test", "post-waiting-test") as { count: number };
    assert(publishedRows.count === 2, "批量公开失败");

    bulkManagePostRecords(["post-hidden-test", "post-private-test"], "delete");
    const deletedRows = database.prepare("SELECT count(*) AS count FROM posts WHERE id IN (?, ?)").get("post-hidden-test", "post-private-test") as { count: number };
    assert(deletedRows.count === 0, "批量删除失败");

    console.log("Post management verification passed.");
  } finally {
    database.close();
    cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
