import { existsSync, rmSync } from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const databasePath = path.join(process.cwd(), "data", `install-verification-${process.pid}.db`);
  process.env.DATABASE_URL = databasePath;

  const cleanup = () => {
    for (const suffix of ["", "-wal", "-shm"]) {
      const file = `${databasePath}${suffix}`;
      if (existsSync(file)) rmSync(file, { force: true });
    }
  };

  cleanup();
  try {
    const {
      checkInstallEnvironment,
      initializeDatabaseSchema,
      inspectInstallationState,
    } = await import("../src/lib/bootstrap/install-state");

    assert(inspectInstallationState().status === "needs-schema", "全新数据库应处于待初始化状态");
    assert(checkInstallEnvironment().every(({ ok }) => ok), "安装环境检查未通过");
    initializeDatabaseSchema();
    assert(
      inspectInstallationState().status === "needs-administrator",
      "migration 后应等待创建管理员",
    );

    const { InstallationAlreadyCompleteError, installSite, prepareExistingInstallation } =
      await import("../src/lib/bootstrap/install-service");
    const { installAdministratorSchema } = await import("../src/lib/validation/install");
    assert(
      !installAdministratorSchema.safeParse({
        siteUrl: "http://localhost:3100",
        username: "weak-password",
        password: "short",
        email: "weak@example.com",
      }).success,
      "安装程序不应接受少于 8 个字符的手动密码",
    );
    const result = await installSite({
      siteUrl: "http://localhost:3100/",
      username: "typecho",
      email: "admin@localhost.local",
    });
    assert(result.password.length === 12, "留空密码时应生成 12 位随机密码");
    assert(inspectInstallationState().status === "installed", "安装完成标记未写入");

    const { database } = await import("../src/lib/db");
    assert(
      database.prepare("SELECT site_url AS siteUrl FROM site_settings WHERE id = 1").get()?.siteUrl
        === "http://localhost:3100",
      "站点地址未规范化写入",
    );
    assert(
      database.prepare("SELECT active_theme AS activeTheme FROM site_settings WHERE id = 1").get()?.activeTheme
        === "default",
      "新站点未默认启用 Default 外观",
    );
    assert(Boolean(database.prepare("SELECT 1 FROM users WHERE username = 'typecho'").get()), "管理员未创建");
    assert(
      Boolean(database.prepare("SELECT 1 FROM user_preferences WHERE user_id = ?").get(result.userId)),
      "管理员默认撰写设置未创建",
    );
    assert(Boolean(database.prepare("SELECT 1 FROM posts WHERE slug = 'start'").get()), "欢迎文章未创建");
    assert(Boolean(database.prepare("SELECT 1 FROM categories WHERE slug = 'default'").get()), "默认分类未创建");

    let duplicateBlocked = false;
    try {
      await installSite({
        siteUrl: "http://localhost:3100",
        username: "another",
        password: "another-password",
        email: "another@example.com",
      });
    } catch (error) {
      duplicateBlocked = error instanceof InstallationAlreadyCompleteError;
    }
    assert(duplicateBlocked, "重复安装未被阻止");

    database.prepare("DELETE FROM installation_state").run();
    assert(
      prepareExistingInstallation("keep") === result.userId,
      "保留原有数据时应复用已有管理员",
    );
    assert(inspectInstallationState().status === "installed", "保留原有数据后未恢复安装标记");

    database.prepare("DELETE FROM installation_state").run();
    prepareExistingInstallation("delete");
    assert(!database.prepare("SELECT 1 FROM users LIMIT 1").get(), "删除原有数据后仍存在用户");
    assert(!database.prepare("SELECT 1 FROM posts LIMIT 1").get(), "删除原有数据后仍存在文章");
    assert(
      inspectInstallationState().status === "needs-administrator",
      "删除原有数据后应重新等待创建管理员",
    );

    const concurrentResults = await Promise.allSettled([
      installSite({
        siteUrl: "http://localhost:3200",
        username: "reinstalled",
        password: "reinstalled-password",
        email: "reinstalled@example.com",
      }),
      installSite({
        siteUrl: "http://localhost:3200",
        username: "concurrent",
        password: "concurrent-password",
        email: "concurrent@example.com",
      }),
    ]);
    assert(
      concurrentResults.filter(({ status }) => status === "fulfilled").length === 1
        && concurrentResults.filter(({ status }) => status === "rejected").length === 1,
      "并发安装必须恰好成功一次",
    );
    const rejected = concurrentResults.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    assert(
      rejected?.reason instanceof InstallationAlreadyCompleteError,
      "并发失败的一方应由重复安装保护拒绝",
    );
    assert(inspectInstallationState().status === "installed", "清空后的重新安装未完成");

    database.close();
    console.log("Installation verification passed.");
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});