"use client";

import { useActionState } from "react";
import { saveThemeCustomCss, type ThemeSettingsState } from "@/actions/themes";
import type { ThemeSlug } from "@/lib/themes/registry";

const initialState: ThemeSettingsState = {};

export function ThemeCssEditor({ theme, content }: { theme: ThemeSlug; content: string }) {
  const [state, action, pending] = useActionState(saveThemeCustomCss, initialState);

  return (
    <form action={action} name="theme" id="theme">
      <input type="hidden" name="theme" value={theme} />
      {state.message && (
        <div className={`message ${state.status === "success" ? "success" : "error"}`} role="status">
          {state.message}
        </div>
      )}
      <label htmlFor="theme-content" className="sr-only">编辑源码</label>
      <textarea
        name="content"
        id="theme-content"
        className="w-100 mono theme-source-editor"
        defaultValue={content}
        spellCheck={false}
      />
      <p className="typecho-option typecho-option-submit">
        <button type="submit" className="btn primary" disabled={pending}>
          {pending ? "正在保存…" : "保存文件"}
        </button>
      </p>
    </form>
  );
}
