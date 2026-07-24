import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get, run, transaction } from "@/lib/db";
import {
  REMEMBER_COOKIE_NAME,
  REMEMBER_SESSION_DURATION_MS,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";
import { requireInstallation } from "@/lib/bootstrap/install-guard";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: "administrator";
  lastLoginAt: Date | null;
};

type RawAuthUser = Omit<AuthUser, "lastLoginAt"> & { lastLoginAt: number | null };

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hydrateUser(user: RawAuthUser): AuthUser {
  return {
    ...user,
    lastLoginAt: user.lastLoginAt === null ? null : new Date(user.lastLoginAt),
  };
}

export function sanitizeAdminReferer(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";

  const url = new URL(value, "http://next-typecho.local");
  return url.pathname.startsWith("/admin")
    ? `${url.pathname}${url.search}${url.hash}`
    : "/admin";
}

export async function authenticateUser(identifier: string, password: string) {
  const user = get<RawAuthUser & { passwordHash: string }>(
    `SELECT id, username, email, password_hash AS passwordHash,
            display_name AS displayName, role, last_login_at AS lastLoginAt
     FROM users
     WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE
     LIMIT 1`,
    identifier,
    identifier,
  );

  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  return hydrateUser({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
  });
}

export async function createSession(userId: string, remember: boolean) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  const duration = remember ? REMEMBER_SESSION_DURATION_MS : SESSION_DURATION_MS;
  const expiresAt = now + duration;

  transaction(() => {
    run("DELETE FROM sessions WHERE expires_at <= ?", now);
    run(
      "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
      tokenHash,
      userId,
      expiresAt,
      now,
    );
    run("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?", now, now, userId);
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    priority: "high",
    ...(remember ? { expires: new Date(expiresAt) } : {}),
  });

  if (remember) {
    cookieStore.set(REMEMBER_COOKIE_NAME, "1", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + REMEMBER_SESSION_DURATION_MS),
    });
  } else {
    cookieStore.delete(REMEMBER_COOKIE_NAME);
  }
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const now = Date.now();
  const user = get<RawAuthUser>(
    `SELECT u.id, u.username, u.email, u.display_name AS displayName,
            u.role, u.last_login_at AS lastLoginAt
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?
     LIMIT 1`,
    hashSessionToken(token),
    now,
  );

  return user ? hydrateUser(user) : null;
}

export async function requireAdministrator(referer = "/admin") {
  requireInstallation();
  const user = await getCurrentUser();
  if (!user || user.role !== "administrator") {
    redirect(`/login?referer=${encodeURIComponent(sanitizeAdminReferer(referer))}`);
  }
  return user;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", hashSessionToken(token));
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getRememberPreference() {
  return (await cookies()).get(REMEMBER_COOKIE_NAME)?.value === "1";
}