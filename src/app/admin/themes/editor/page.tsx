import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { ThemeCssEditor } from "@/components/admin/theme-css-editor";
import { ThemeTabs } from "@/components/admin/theme-tabs";
import { getActiveThemeSlug, getResolvedTheme } from "@/lib/repositories/themes";
import { getThemeDefinition, isThemeSlug } from "@/lib/themes/registry";

export const dynamic = "force-dynamic";

export default async function ThemeEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; file?: string }>;
}) {
  const [activeTheme, query] = await Promise.all([getActiveThemeSlug(), searchParams]);
  const themeSlug = isThemeSlug(query.theme) ? query.theme : activeTheme;
  const definition = getThemeDefinition(themeSlug);
  const resolved = getResolvedTheme(themeSlug);
  const fileNames = [...definition.sourceFiles.map(({ name }) => name), "custom.css"];
  const selectedName = query.file && fileNames.includes(query.file) ? query.file : fileNames[0];
  const selectedSource = definition.sourceFiles.find(({ name }) => name === selectedName);
  const editable = selectedName === "custom.css";

  return (
    <>
      <AdminPageTitle title={`编辑文件 ${selectedName}`} />
      <ThemeTabs current="editor" activeTheme={activeTheme} editedTheme={themeSlug} />
      <div className="typecho-page-main typecho-edit-theme">
        <div className="theme-editor-content">
          {editable ? (
            <ThemeCssEditor theme={themeSlug} content={resolved.customCss} />
          ) : (
            <>
              <div className="message notice theme-editor-notice">
                内置 React 模板随构建发布，为保证生产环境和 RSC 安全，此文件只读；可编辑 custom.css 实时覆盖外观。
              </div>
              <label htmlFor="theme-content" className="sr-only">查看源码</label>
              <textarea
                id="theme-content"
                className="w-100 mono theme-source-editor"
                value={selectedSource?.content ?? ""}
                readOnly
                spellCheck={false}
              />
              <p className="typecho-option typecho-option-submit"><em>此文件无法写入</em></p>
            </>
          )}
        </div>
        <ul className="theme-file-list">
          <li><strong>模板文件</strong></li>
          {fileNames.map((file) => (
            <li className={file === selectedName ? "current" : undefined} key={file}>
              <Link href={`/admin/themes/editor?theme=${themeSlug}&file=${encodeURIComponent(file)}`}>
                {file}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
