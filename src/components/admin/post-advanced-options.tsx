"use client";

import { useState } from "react";
import type { WritingPreferences } from "@/lib/repositories/profile";

export function PostAdvancedOptions({
  preferences,
  status,
  allowComment,
}: {
  preferences?: WritingPreferences;
  status?: string;
  allowComment?: boolean;
}) {
  const initialVisibility = ["hidden", "private", "waiting"].includes(status ?? "") ? status! : "publish";
  const [visibility, setVisibility] = useState(initialVisibility);

  return (
    <details id="advance-panel">
      <summary className="btn btn-xs">
        高级选项 <i className="i-caret-down" aria-hidden="true" />
      </summary>

      <section className="typecho-post-option visibility-option">
        <label htmlFor="visibility" className="typecho-label">公开度</label>
        <p>
          <select
            id="visibility"
            name="visibility"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
          >
            <option value="publish">公开</option>
            <option value="hidden">隐藏</option>
            <option value="password">密码保护</option>
            <option value="private">私密</option>
            <option value="waiting">待审核</option>
          </select>
        </p>
        {visibility === "password" && (
          <p id="post-password">
            <label htmlFor="protect-pwd" className="sr-only">内容密码</label>
            <input
              type="text"
              name="password"
              id="protect-pwd"
              className="text-s"
              size={16}
              placeholder="内容密码"
              autoComplete="off"
            />
          </p>
        )}
      </section>

      <section className="typecho-post-option allow-option">
        <span className="typecho-label">权限控制</span>
        <ul>
          <li><input id="allowComment" name="allowComment" type="checkbox" value="1" defaultChecked={allowComment ?? preferences?.defaultAllowComment ?? true} /><label htmlFor="allowComment">允许评论</label></li>
          <li><input id="allowPing" name="allowPing" type="checkbox" value="1" defaultChecked={preferences?.defaultAllowPing ?? true} /><label htmlFor="allowPing">允许被引用</label></li>
          <li><input id="allowFeed" name="allowFeed" type="checkbox" value="1" defaultChecked={preferences?.defaultAllowFeed ?? true} /><label htmlFor="allowFeed">允许在聚合中出现</label></li>
        </ul>
      </section>

      <section className="typecho-post-option">
        <label htmlFor="trackback" className="typecho-label">引用通告</label>
        <p><textarea id="trackback" className="w-100 mono" name="trackback" rows={2} /></p>
        <p className="description">每一行一个引用地址, 用回车隔开</p>
      </section>
    </details>
  );
}
