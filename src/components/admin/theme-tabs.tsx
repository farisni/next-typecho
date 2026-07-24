import Link from "next/link";
import { getThemeDefinition, type ThemeSlug } from "@/lib/themes/registry";

type ThemeTabsProps = {
  current: "available" | "editor" | "settings";
  activeTheme: ThemeSlug;
  editedTheme?: ThemeSlug;
};

export function ThemeTabs({ current, activeTheme, editedTheme = activeTheme }: ThemeTabsProps) {
  const editedTitle = getThemeDefinition(editedTheme).title;

  return (
    <ul className="typecho-option-tabs fix-tabs theme-tabs">
      <li className={current === "available" ? "current" : undefined}>
        <Link href="/admin/themes">可以使用的外观</Link>
      </li>
      <li className={current === "editor" ? "current" : undefined}>
        <Link href={`/admin/themes/editor?theme=${editedTheme}`}>
          {editedTheme === activeTheme ? "编辑当前外观" : <>编辑 <cite>{editedTitle}</cite> 外观</>}
        </Link>
      </li>
      <li className={current === "settings" ? "current" : undefined}>
        <Link href="/admin/themes/settings">设置外观</Link>
      </li>
    </ul>
  );
}
