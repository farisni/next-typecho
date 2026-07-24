"use client";

import { useActionState } from "react";
import { saveThemeSettings, type ThemeSettingsState } from "@/actions/themes";
import {
  defaultSidebarBlocks,
  type ClassicThemeConfig,
  type DefaultThemeConfig,
  type ThemeSlug,
} from "@/lib/themes/registry";

const initialState: ThemeSettingsState = {};

const sidebarLabels: Record<(typeof defaultSidebarBlocks)[number], string> = {
  ShowRecentPosts: "显示最新文章",
  ShowRecentComments: "显示最近回复",
  ShowCategory: "显示分类",
  ShowArchive: "显示归档",
  ShowOther: "显示其它杂项",
};

function Message({ state }: { state: ThemeSettingsState }) {
  if (!state.message) return null;
  return (
    <div className={`message ${state.status === "success" ? "success" : "error"}`} role="status">
      {state.message}
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="description-text theme-field-error">{messages[0]}</p>;
}

export function ThemeSettingsForm({
  theme,
  config,
}: {
  theme: ThemeSlug;
  config: DefaultThemeConfig | ClassicThemeConfig;
}) {
  const [state, action, pending] = useActionState(saveThemeSettings, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="theme" value={theme} />
      <Message state={state} />
      <ul className="typecho-option">
        <li>
          <label className="typecho-label" htmlFor="theme-logo-url">
            {theme === "default" ? "站点 LOGO 地址" : "网站 Logo"}
          </label>
          <input
            className="text"
            id="theme-logo-url"
            name="logoUrl"
            type="url"
            defaultValue={config.logoUrl}
            placeholder="https://example.com/logo.png"
          />
          <p className="description-text">
            {theme === "default"
              ? "在这里填入一个图片 URL 地址, 以在网站标题前加上一个 LOGO"
              : "在这里填写图片 URL，网站将显示 Logo"}
          </p>
          <FieldError messages={state.fieldErrors?.logoUrl} />
        </li>
        {theme === "default" ? (
          <li>
            <span className="typecho-label">侧边栏显示</span>
            <div className="theme-checkbox-list">
              {defaultSidebarBlocks.map((block) => (
                <label key={block}>
                  <input
                    type="checkbox"
                    name="sidebarBlocks"
                    value={block}
                    defaultChecked={(config as DefaultThemeConfig).sidebarBlocks.includes(block)}
                  />
                  {sidebarLabels[block]}
                </label>
              ))}
            </div>
            <FieldError messages={state.fieldErrors?.sidebarBlocks} />
          </li>
        ) : (
          <li>
            <label className="typecho-label" htmlFor="theme-color-schema">外观风格</label>
            <select
              id="theme-color-schema"
              name="colorSchema"
              defaultValue={(config as ClassicThemeConfig).colorSchema}
            >
              <option value="auto">自动</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="customize">自定义</option>
            </select>
            <p className="description-text">选择自定义时将使用 Classic 22 的官方示例配色，可继续通过 custom.css 覆盖。</p>
            <FieldError messages={state.fieldErrors?.colorSchema} />
          </li>
        )}
      </ul>
      <ul className="typecho-option typecho-option-submit">
        <li>
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "正在保存…" : "保存设置"}
          </button>
        </li>
      </ul>
    </form>
  );
}
