import { hashPassword } from "@/lib/auth/password";
import { get, run } from "@/lib/db";
import type { ProfileInput, WritingPreferencesInput } from "@/lib/validation/profile";

export class ProfileFieldConflictError extends Error {
  constructor(public readonly field: "displayName" | "email", message: string) {
    super(message);
  }
}

export function updateProfile(userId: string, username: string, input: ProfileInput) {
  const displayName = input.displayName || username;
  const duplicateName = get(
    "SELECT 1 FROM users WHERE display_name = ? COLLATE NOCASE AND id <> ? LIMIT 1",
    displayName,
    userId,
  );
  if (duplicateName) throw new ProfileFieldConflictError("displayName", "昵称已经存在");

  const duplicateEmail = get(
    `SELECT 1 FROM users
     WHERE id <> ? AND (email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE)
     LIMIT 1`,
    userId,
    input.email,
    input.email,
  );
  if (duplicateEmail) throw new ProfileFieldConflictError("email", "电子邮箱地址已经存在");

  const url = input.url ? new URL(input.url).toString() : "";
  const now = Date.now();
  run(
    "UPDATE users SET display_name = ?, email = ?, url = ?, updated_at = ? WHERE id = ?",
    displayName,
    input.email,
    url,
    now,
    userId,
  );
}

export function saveWritingPreferences(userId: string, input: WritingPreferencesInput) {
  const now = Date.now();
  run(
    `INSERT INTO user_preferences
     (user_id, markdown, xmlrpc_markdown, auto_save, default_allow_comment,
      default_allow_ping, default_allow_feed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       markdown = excluded.markdown,
       xmlrpc_markdown = excluded.xmlrpc_markdown,
       auto_save = excluded.auto_save,
       default_allow_comment = excluded.default_allow_comment,
       default_allow_ping = excluded.default_allow_ping,
       default_allow_feed = excluded.default_allow_feed,
       updated_at = excluded.updated_at`,
    userId,
    Number(input.markdown),
    Number(input.xmlrpcMarkdown),
    Number(input.autoSave),
    Number(input.defaultAllowComment),
    Number(input.defaultAllowPing),
    Number(input.defaultAllowFeed),
    now,
    now,
  );
}

export async function updateProfilePassword(userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  const now = Date.now();
  run(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    passwordHash,
    now,
    userId,
  );
}
