"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth";

type LoginFormProps = {
  referer: string;
  defaultRemember: boolean;
};

const initialState: LoginState = {};

export function LoginForm({ referer, defaultRemember }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} name="login">
      {state.message && <p className="message error login-error" role="alert">{state.message}</p>}
      <p>
        <label htmlFor="name" className="sr-only">用户名或邮箱</label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={state.name}
          placeholder="用户名或邮箱"
          className="text-l w-100"
          autoComplete="username"
          autoFocus
          required
        />
      </p>
      <p>
        <label htmlFor="password" className="sr-only">密码</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="密码"
          className="text-l w-100"
          autoComplete="current-password"
          required
        />
      </p>
      <p className="submit">
        <button type="submit" className="btn btn-l w-100 primary" disabled={pending}>
          {pending ? "登录中…" : "登录"}
        </button>
        <input type="hidden" name="referer" value={referer} />
      </p>
      <p>
        <label htmlFor="remember">
          <input defaultChecked={defaultRemember} type="checkbox" name="remember" value="1" id="remember" /> 下次自动登录
        </label>
      </p>
    </form>
  );
}