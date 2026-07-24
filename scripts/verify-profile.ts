import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dbPath = resolve(process.cwd(), ".data", "profile-verification.db");
let closeVerificationDatabase: (() => void) | undefined;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${dbPath}${suffix}`;
    if (existsSync(file)) rmSync(file, { force: true });
  }

  process.env.DATABASE_URL = dbPath;
  const { database } = await import("../src/lib/db");
  closeVerificationDatabase = () => database.close();
  const { initializeDatabaseSchema } = await import("../src/lib/bootstrap/install-state");
  const { installSite } = await import("../src/lib/bootstrap/install-service");
  const { verifyPassword } = await import("../src/lib/auth/password");
  const { getProfilePageData } = await import("../src/lib/repositories/profile");
  const { saveWritingPreferences, updateProfile, updateProfilePassword } = await import("../src/lib/profile/service");

  initializeDatabaseSchema();
  const installed = await installSite({
    username: "profile-admin",
    email: "admin@example.com",
    password: "original-password",
    siteUrl: "http://localhost:3000",
  });

  const initial = getProfilePageData(installed.userId);
  assert(initial.user.url === "", "个人主页默认值不正确");
  assert(initial.preferences.markdown, "Markdown 默认设置不正确");
  assert(!initial.preferences.xmlrpcMarkdown, "XMLRPC Markdown 默认设置不正确");
  assert(!initial.preferences.autoSave, "自动保存默认设置不正确");
  assert(initial.preferences.defaultAllowComment, "评论默认权限不正确");

  updateProfile(installed.userId, installed.username, {
    displayName: "档案测试",
    url: "https://example.com/profile",
    email: "profile@example.com",
  });
  saveWritingPreferences(installed.userId, {
    markdown: false,
    xmlrpcMarkdown: true,
    autoSave: true,
    defaultAllowComment: false,
    defaultAllowPing: false,
    defaultAllowFeed: true,
  });

  const updated = getProfilePageData(installed.userId);
  assert(updated.user.displayName === "档案测试", "昵称更新失败");
  assert(updated.user.url === "https://example.com/profile", "个人主页更新失败");
  assert(updated.user.email === "profile@example.com", "邮箱更新失败");
  assert(!updated.preferences.markdown && updated.preferences.autoSave, "撰写设置更新失败");
  assert(!updated.preferences.defaultAllowComment && updated.preferences.defaultAllowFeed, "默认权限更新失败");

  updateProfile(installed.userId, installed.username, {
    displayName: "",
    url: "",
    email: "profile@example.com",
  });
  assert(getProfilePageData(installed.userId).user.displayName === installed.username, "空昵称未回退为用户名");

  await updateProfilePassword(installed.userId, "replacement-password");
  const passwordHash = database.prepare("SELECT password_hash AS passwordHash FROM users WHERE id = ?").get(installed.userId) as { passwordHash: string };
  assert(!(await verifyPassword("original-password", passwordHash.passwordHash)), "原密码仍然有效");
  assert(await verifyPassword("replacement-password", passwordHash.passwordHash), "新密码无效");

  console.log("Profile verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    closeVerificationDatabase?.();
    for (const suffix of ["", "-wal", "-shm"]) {
      const file = `${dbPath}${suffix}`;
      if (existsSync(file)) rmSync(file, { force: true });
    }
  });
