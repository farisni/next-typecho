"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticateUser,
  createSession,
  deleteCurrentSession,
  sanitizeAdminReferer,
} from "@/lib/auth/session";
import { requireInstallation } from "@/lib/bootstrap/install-guard";
import { THEME_PREVIEW_COOKIE_NAME } from "@/lib/themes/request";

const loginSchema = z.object({
  name: z.string().trim().min(1),
  password: z.string().min(1).max(200),
  remember: z.boolean(),
  referer: z.string().optional(),
});

export type LoginState = {
  message?: string;
  name?: string;
};

async function clearThemePreview() {
  (await cookies()).delete(THEME_PREVIEW_COOKIE_NAME);
}

export async function login(_state: LoginState | undefined, formData: FormData): Promise<LoginState> {
  requireInstallation();
  const result = loginSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
    remember: formData.get("remember") === "1",
    referer: formData.get("referer")?.toString(),
  });

  if (!result.success) {
    return { message: "请输入用户名和密码", name: formData.get("name")?.toString() };
  }

  const user = await authenticateUser(result.data.name, result.data.password);
  if (!user) {
    return { message: "用户名或密码无效", name: result.data.name };
  }

  await clearThemePreview();
  await createSession(user.id, result.data.remember);
  redirect(sanitizeAdminReferer(result.data.referer));
}

export async function logout() {
  await deleteCurrentSession();
  await clearThemePreview();
  redirect("/login?logout=1");
}

export async function logoutFromSite() {
  await deleteCurrentSession();
  await clearThemePreview();
  redirect("/");
}