"use client";

import Link from "next/link";
import { useActionState } from "react";
import { completeInstallation, type CompleteInstallState } from "@/actions/install";

const initialState: CompleteInstallState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="message error field-error" role="alert">{messages[0]}</p>;
}

export function AdministratorInstallForm({ defaultSiteUrl }: { defaultSiteUrl: string }) {
  const [state, action, pending] = useActionState(completeInstallation, initialState);

  if (state.success) {
    return (
      <div className="install-success">
        <div className="typecho-page-title"><h2>安装成功</h2></div>
        <div id="typecho-welcome">
          <p>
            您的用户名是: <strong className="warning">{state.success.username}</strong><br />
            您的密码是: <strong className="warning">{state.success.password}</strong>
          </p>
          <ul>
            <li><Link href="/admin">点击这里访问您的控制面板</Link></li>
            <li><a href={state.success.siteUrl}>点击这里查看您的 Blog</a></li>
          </ul>
          <p>希望您能尽情享用 Typecho 带来的乐趣!</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} autoComplete="off">
      {state.message && <div className="message error fade" role="alert">{state.message}</div>}
      <ul className="typecho-option">
        <li>
          <label className="typecho-label" htmlFor="siteUrl">网站地址</label>
          <input type="url" name="siteUrl" id="siteUrl" className="text" defaultValue={state.values?.siteUrl ?? defaultSiteUrl} />
          <p className="description-text">这是程序自动匹配的网站路径, 如果不正确请修改它</p>
          <FieldError messages={state.fieldErrors?.siteUrl} />
        </li>
      </ul>
      <ul className="typecho-option">
        <li>
          <label className="typecho-label" htmlFor="username">用户名</label>
          <input autoComplete="new-password" type="text" name="username" id="username" className="text" defaultValue={state.values?.username} />
          <p className="description-text">请填写您的用户名</p>
          <FieldError messages={state.fieldErrors?.username} />
        </li>
      </ul>
      <ul className="typecho-option">
        <li>
          <label className="typecho-label" htmlFor="password">登录密码</label>
          <input type="password" name="password" id="password" className="text" autoComplete="new-password" />
          <p className="description-text">请填写至少 8 个字符的登录密码, 如果留空系统将为您随机生成一个</p>
          <FieldError messages={state.fieldErrors?.password} />
        </li>
      </ul>
      <ul className="typecho-option">
        <li>
          <label className="typecho-label" htmlFor="email">邮件地址</label>
          <input autoComplete="new-password" type="email" name="email" id="email" className="text" defaultValue={state.values?.email} />
          <p className="description-text">请填写一个您的常用邮箱</p>
          <FieldError messages={state.fieldErrors?.email} />
        </li>
      </ul>
      <ul className="typecho-option typecho-option-submit">
        <li><button type="submit" className="btn primary" disabled={pending}>{pending ? "正在安装…" : "继续安装 »"}</button></li>
      </ul>
    </form>
  );
}