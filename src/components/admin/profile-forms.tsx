"use client";

import { useActionState, useState } from "react";
import { KeyRound, Save, UserRoundCheck } from "lucide-react";
import {
  changeProfilePassword,
  saveProfile,
  saveWritingOptions,
  type ProfileActionState,
} from "@/actions/profile";
import { Switch } from "@/components/ui/switch";
import type { WritingPreferences } from "@/lib/repositories/profile";

const initialState: ProfileActionState = {};

function FormMessage({ state }: { state: ProfileActionState }) {
  if (!state.message) return null;
  return (
    <div className={`message ${state.status === "success" ? "success" : "error"}`} role="status">
      {state.message}
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="profile-field-error">{messages[0]}</p>;
}

export function ProfileDetailsForm({
  displayName,
  url,
  email,
}: {
  displayName: string;
  url: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(saveProfile, initialState);

  return (
    <form action={action}>
      <FormMessage state={state} />
      <ul className="typecho-option profile-options">
        <li>
          <label className="typecho-label" htmlFor="profile-display-name">昵称</label>
          <input className="text" id="profile-display-name" name="displayName" defaultValue={displayName} autoComplete="nickname" />
          <p className="description-text">用户昵称可以与用户名不同, 用于前台显示.<br />如果你将此项留空, 将默认使用用户名.</p>
          <FieldError messages={state.fieldErrors?.displayName} />
        </li>
        <li>
          <label className="typecho-label" htmlFor="profile-url">个人主页地址</label>
          <input className="text" id="profile-url" name="url" type="url" defaultValue={url} placeholder="https://" autoComplete="url" />
          <p className="description-text">此用户的个人主页地址, 请用 <code>https://</code> 开头.</p>
          <FieldError messages={state.fieldErrors?.url} />
        </li>
        <li>
          <label className="typecho-label" htmlFor="profile-email">邮件地址 *</label>
          <input className="text" id="profile-email" name="email" type="email" defaultValue={email} autoComplete="email" required />
          <p className="description-text">电子邮箱地址将作为此用户的主要联系方式.<br />请不要与系统中现有的电子邮箱地址重复.</p>
          <FieldError messages={state.fieldErrors?.email} />
        </li>
      </ul>
      <p>
        <button className="btn primary admin-action-button" type="submit" disabled={pending}>
          <UserRoundCheck aria-hidden="true" />
          {pending ? "正在更新…" : "更新我的档案"}
        </button>
      </p>
    </form>
  );
}

function SwitchSetting({
  name,
  enabled,
  label,
  children,
}: {
  name: string;
  enabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const [checked, setChecked] = useState(enabled);

  return (
    <li className="profile-switch-setting">
      <div className="profile-switch-copy">
        <label className="typecho-label" htmlFor={`profile-${name}`}>{label}</label>
        <p className="description-text">{children}</p>
      </div>
      <div className="profile-switch-control">
        <Switch
          id={`profile-${name}`}
          checked={checked}
          onCheckedChange={setChecked}
          className="profile-setting-switch"
          aria-label={`${label}，当前${checked ? "开" : "关"}`}
        />
        <span className="profile-switch-state">{checked ? "开" : "关"}</span>
      </div>
      <input type="hidden" name={name} value={checked ? "1" : "0"} />
    </li>
  );
}

export function ProfileWritingOptionsForm({ preferences }: { preferences: WritingPreferences }) {
  const [state, action, pending] = useActionState(saveWritingOptions, initialState);

  return (
    <form action={action}>
      <FormMessage state={state} />
      <ul className="typecho-option profile-options">
        <SwitchSetting name="markdown" enabled={preferences.markdown} label="使用 Markdown 语法编辑和解析内容">
          使用 <a href="https://daringfireball.net/projects/markdown/">Markdown</a> 语法能够使您的撰写过程更加简便直观.<br />此功能开启不会影响以前没有使用 Markdown 语法编辑的内容.
        </SwitchSetting>
        <SwitchSetting name="xmlrpcMarkdown" enabled={preferences.xmlrpcMarkdown} label="在 XMLRPC 接口中使用 Markdown 语法">
          对于完全支持 <a href="https://daringfireball.net/projects/markdown/">Markdown</a> 语法写作的离线编辑器, 打开此选项后将避免内容被转换为 HTML.
        </SwitchSetting>
        <SwitchSetting name="autoSave" enabled={preferences.autoSave} label="自动保存">
          自动保存功能可以更好地保护你的文章不会丢失.
        </SwitchSetting>
        <li>
          <span className="typecho-label">默认允许</span>
          <label className="profile-inline-option"><input type="checkbox" name="defaultAllow" value="comment" defaultChecked={preferences.defaultAllowComment} />可以被评论</label>
          <label className="profile-inline-option"><input type="checkbox" name="defaultAllow" value="ping" defaultChecked={preferences.defaultAllowPing} />可以被引用</label>
          <label className="profile-inline-option"><input type="checkbox" name="defaultAllow" value="feed" defaultChecked={preferences.defaultAllowFeed} />出现在聚合中</label>
          <p className="description-text">设置你经常使用的默认允许权限</p>
        </li>
      </ul>
      <p>
        <button className="btn primary admin-action-button" type="submit" disabled={pending}>
          <Save aria-hidden="true" />
          {pending ? "正在保存…" : "保存设置"}
        </button>
      </p>
    </form>
  );
}

export function ProfilePasswordForm() {
  const [state, action, pending] = useActionState(changeProfilePassword, initialState);

  return (
    <form action={action}>
      <FormMessage state={state} />
      <ul className="typecho-option profile-options">
        <li>
          <label className="typecho-label" htmlFor="profile-password">用户密码</label>
          <input className="w-60" id="profile-password" name="password" type="password" minLength={6} maxLength={200} autoComplete="new-password" required />
          <p className="description-text">为此用户分配一个密码.<br />建议使用特殊字符与字母、数字的混编样式,以增加系统安全性.</p>
          <FieldError messages={state.fieldErrors?.password} />
        </li>
        <li>
          <label className="typecho-label" htmlFor="profile-confirm">用户密码确认</label>
          <input className="w-60" id="profile-confirm" name="confirm" type="password" minLength={6} maxLength={200} autoComplete="new-password" required />
          <p className="description-text">请确认你的密码, 与上面输入的密码保持一致.</p>
          <FieldError messages={state.fieldErrors?.confirm} />
        </li>
      </ul>
      <p>
        <button className="btn primary admin-action-button" type="submit" disabled={pending}>
          <KeyRound aria-hidden="true" />
          {pending ? "正在更新…" : "更新密码"}
        </button>
      </p>
    </form>
  );
}
