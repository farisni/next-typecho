"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdministrator } from "@/lib/auth/session";
import { getActiveThemeSlug } from "@/lib/repositories/themes";
import { THEME_PREVIEW_COOKIE_NAME } from "@/lib/themes/request";
import { getThemeDefinition } from "@/lib/themes/registry";
import {
  activateTheme as activateThemeInDatabase,
  saveThemeConfig as saveThemeConfigInDatabase,
  saveThemeCustomCss as saveThemeCustomCssInDatabase,
} from "@/lib/themes/service";
import {
  themeCustomCssSchema,
  themeSlugSchema,
} from "@/lib/validation/themes";

export type ThemeSettingsState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function activateTheme(formData: FormData) {
  await requireAdministrator("/admin/themes");
  const result = themeSlugSchema.safeParse(formData.get("theme"));
  if (!result.success) redirect("/admin/themes?error=invalid-theme");

  activateThemeInDatabase(result.data);
  (await cookies()).delete(THEME_PREVIEW_COOKIE_NAME);
  revalidatePath("/", "layout");
  revalidatePath("/admin/themes", "layout");
  redirect(`/admin/themes?notice=activated&theme=${encodeURIComponent(result.data)}`);
}

export async function previewTheme(formData: FormData) {
  await requireAdministrator("/admin/themes");
  const result = themeSlugSchema.safeParse(formData.get("theme"));
  if (!result.success) redirect("/admin/themes?error=invalid-theme");

  (await cookies()).set(THEME_PREVIEW_COOKIE_NAME, result.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  redirect("/");
}

export async function stopThemePreview() {
  await requireAdministrator("/admin/themes");
  (await cookies()).delete(THEME_PREVIEW_COOKIE_NAME);
  redirect("/admin/themes");
}

export async function saveThemeSettings(
  _state: ThemeSettingsState,
  formData: FormData,
): Promise<ThemeSettingsState> {
  void _state;
  await requireAdministrator("/admin/themes/settings");
  const themeResult = themeSlugSchema.safeParse(formData.get("theme"));
  if (!themeResult.success || themeResult.data !== getActiveThemeSlug()) {
    return { status: "error", message: "只能设置当前启用的外观。" };
  }

  const definition = getThemeDefinition(themeResult.data);
  const rawConfig = Object.fromEntries(
    definition.settings.map((field) => [
      field.name,
      field.kind === "checkbox-group"
        ? formData.getAll(field.name).map(String)
        : formData.get(field.name)?.toString() ?? "",
    ]),
  );
  const result = definition.configSchema.safeParse(rawConfig);

  if (!result.success) {
    return {
      status: "error",
      message: "请检查外观设置。",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[] | undefined>,
    };
  }

  saveThemeConfigInDatabase(themeResult.data, result.data);
  revalidatePath("/", "layout");
  revalidatePath("/admin/themes/settings");
  return { status: "success", message: "外观设置已经保存" };
}

export async function saveThemeCustomCss(
  _state: ThemeSettingsState,
  formData: FormData,
): Promise<ThemeSettingsState> {
  void _state;
  await requireAdministrator("/admin/themes/editor");
  const themeResult = themeSlugSchema.safeParse(formData.get("theme"));
  const cssResult = themeCustomCssSchema.safeParse(formData.get("content"));
  if (!themeResult.success || !cssResult.success) {
    return {
      status: "error",
      message: cssResult.success ? "外观名称无效。" : cssResult.error.issues[0]?.message,
    };
  }

  saveThemeCustomCssInDatabase(themeResult.data, cssResult.data);
  revalidatePath("/", "layout");
  revalidatePath("/admin/themes/editor");
  return { status: "success", message: "文件 custom.css 的更改已经保存" };
}
