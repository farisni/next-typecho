import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { ThemeSettingsForm } from "@/components/admin/theme-settings-form";
import { ThemeTabs } from "@/components/admin/theme-tabs";
import { getActiveResolvedTheme } from "@/lib/repositories/themes";
import { getThemeDefinition } from "@/lib/themes/registry";

export const dynamic = "force-dynamic";

export default function ThemeSettingsPage() {
  const theme = getActiveResolvedTheme();
  const definition = getThemeDefinition(theme.slug);

  return (
    <>
      <AdminPageTitle title="设置外观" />
      <ThemeTabs current="settings" activeTheme={theme.slug} />
      <div className="admin-option-wrap theme-settings-wrap">
        <h3>{definition.title}</h3>
        <ThemeSettingsForm theme={theme.slug} config={theme.config} />
      </div>
    </>
  );
}
