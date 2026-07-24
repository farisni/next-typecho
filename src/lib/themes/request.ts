import { cookies } from "next/headers";
import type { AuthUser } from "@/lib/auth/session";
import { getActiveThemeSlug, getResolvedTheme } from "@/lib/repositories/themes";
import { isThemeSlug } from "@/lib/themes/registry";

export const THEME_PREVIEW_COOKIE_NAME = "__next_typecho_theme_preview";

export async function resolveThemeForRequest(user: AuthUser | null) {
  const activeSlug = getActiveThemeSlug();
  const previewValue = (await cookies()).get(THEME_PREVIEW_COOKIE_NAME)?.value;
  const previewSlug = user?.role === "administrator" && isThemeSlug(previewValue)
    ? previewValue
    : null;
  const resolved = getResolvedTheme(previewSlug ?? activeSlug);

  return {
    ...resolved,
    activeSlug,
    isPreview: previewSlug !== null && previewSlug !== activeSlug,
  };
}
