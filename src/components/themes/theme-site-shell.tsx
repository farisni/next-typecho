import Link from "next/link";
import { stopThemePreview } from "@/actions/themes";
import type { AuthUser } from "@/lib/auth/session";
import type { resolveThemeForRequest } from "@/lib/themes/request";
import { getThemeDefinition } from "@/lib/themes/registry";
import { getThemeRenderer } from "@/themes/renderers";

function ThemePreviewBar({ title }: { title: string }) {
  return (
    <div className="theme-preview-bar" role="status">
      <span>正在预览 <strong>{title}</strong></span>
      <Link href="/admin/themes">返回外观管理</Link>
      <form action={stopThemePreview}><button type="submit">停止预览</button></form>
    </div>
  );
}

export function ThemeSiteShell({
  name,
  description,
  user,
  theme,
  children,
}: {
  name: string;
  description: string;
  user: AuthUser | null;
  theme: Awaited<ReturnType<typeof resolveThemeForRequest>>;
  children: React.ReactNode;
}) {
  const definition = getThemeDefinition(theme.slug);
  const ThemeRenderer = getThemeRenderer(theme.slug);
  const customStyle = theme.customCss ? <style data-theme-custom-css>{theme.customCss}</style> : null;

  return (
    <ThemeRenderer
      name={name}
      description={description}
      user={user}
      config={theme.config}
      customStyle={customStyle}
      previewBar={theme.isPreview ? <ThemePreviewBar title={definition.title} /> : null}
    >
      {children}
    </ThemeRenderer>
  );
}
