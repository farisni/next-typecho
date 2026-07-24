"use client";

import { useActionState } from "react";
import {
  continueInstallation,
  initializeInstallationDatabase,
  type InstallStepState,
} from "@/actions/install";

const initialState: InstallStepState = {};

export function EnvironmentContinueForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(continueInstallation, initialState);

  return (
    <form action={action}>
      {state.message && <div className="message error fade" role="alert">{state.message}</div>}
      <p className="submit">
        <button className="btn primary" type="submit" disabled={disabled || pending}>
          {pending ? "正在检测…" : "我准备好了, 开始下一步 »"}
        </button>
      </p>
    </form>
  );
}

export function DatabaseInitializeForm({ hasExistingData }: { hasExistingData: boolean }) {
  const [state, action, pending] = useActionState(initializeInstallationDatabase, initialState);

  return (
    <form action={action}>
      {state.message && <div className="message error fade" role="alert">{state.message}</div>}
      <ul className="typecho-option typecho-option-submit">
        <li>
          {hasExistingData ? (
            <div className="install-data-actions">
              <button name="databaseMode" value="delete" type="submit" className="btn" disabled={pending}>
                删除原有数据
              </button>
              <button name="databaseMode" value="keep" type="submit" className="btn primary" disabled={pending}>
                使用原有数据
              </button>
            </div>
          ) : (
            <button name="databaseMode" value="none" type="submit" className="btn primary" disabled={pending}>
              {pending ? "正在初始化…" : "确认, 开始安装 »"}
            </button>
          )}
        </li>
      </ul>
    </form>
  );
}