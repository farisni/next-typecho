import Image from "next/image";
import Link from "next/link";
import { activateTheme, previewTheme } from "@/actions/themes";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { ThemeTabs } from "@/components/admin/theme-tabs";
import { getActiveThemeSlug } from "@/lib/repositories/themes";
import { getThemeDefinition, isThemeSlug, themeSlugs } from "@/lib/themes/registry";

export const dynamic = "force-dynamic";

export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string; theme?: string }>;
}) {
  const [activeTheme, query] = await Promise.all([getActiveThemeSlug(), searchParams]);
  const highlightedTheme = isThemeSlug(query.theme) ? query.theme : activeTheme;

  return (
    <>
      <AdminPageTitle title="外观" />
      <ThemeTabs current="available" activeTheme={activeTheme} />
      {query.notice === "activated" && (
        <div className="message success admin-theme-message">外观已经改变</div>
      )}
      {query.error && (
        <div className="message error admin-theme-message">无法完成外观操作，请刷新后重试。</div>
      )}
      <div className="theme-table-scroll">
        <table className="typecho-list-table typecho-theme-list">
          <colgroup><col className="theme-screen-column" /><col /></colgroup>
          <thead>
            <tr><th>截图</th><th>详情</th></tr>
          </thead>
          <tbody>
            {themeSlugs
              .toSorted((left, right) => Number(right === activeTheme) - Number(left === activeTheme))
              .map((slug) => {
                const theme = getThemeDefinition(slug);
                const active = slug === activeTheme;
                return (
                  <tr
                    id={`theme-${slug}`}
                    className={active || highlightedTheme === slug && query.notice ? "current" : undefined}
                    key={slug}
                  >
                    <td valign="top">
                      <Image
                        className="theme-screenshot"
                        src={theme.screenshotPath}
                        alt={`${theme.title} 外观截图`}
                        width={600}
                        height={500}
                        priority={active}
                      />
                    </td>
                    <td valign="top">
                      <h3>{theme.title}</h3>
                      <cite>
                        作者: <a href={theme.homepage}>{theme.author}</a>
                        <span>版本: {theme.version}</span>
                      </cite>
                      <p>{theme.description}</p>
                      {active ? (
                        <p className="theme-current-label">当前使用的外观</p>
                      ) : (
                        <div className="theme-row-actions">
                          <Link href={`/admin/themes/editor?theme=${slug}`}>编辑</Link>
                          <form action={previewTheme}>
                            <input type="hidden" name="theme" value={slug} />
                            <button type="submit">预览</button>
                          </form>
                          <form action={activateTheme}>
                            <input type="hidden" name="theme" value={slug} />
                            <button type="submit">启用</button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}
