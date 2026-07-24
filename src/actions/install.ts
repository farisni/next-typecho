"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";
import {
  checkInstallEnvironment,
  initializeDatabaseSchema,
  inspectInstallationState,
} from "@/lib/bootstrap/install-state";
import {
  databaseModeSchema,
  installAdministratorSchema,
} from "@/lib/validation/install";

export type InstallStepState = {
  message?: string;
};

export type CompleteInstallState = {
  message?: string;
  fieldErrors?: Partial<Record<"siteUrl" | "username" | "password" | "email", string[]>>;
  values?: { siteUrl?: string; username?: string; email?: string };
  success?: { username: string; password: string; siteUrl: string };
};

export async function continueInstallation(_state: InstallStepState): Promise<InstallStepState> {
  void _state;
  if (inspectInstallationState().status === "installed") redirect("/");
  const failed = checkInstallEnvironment().filter(({ ok }) => !ok);
  if (failed.length) return { message: failed.map(({ description }) => description).join("；") };
  redirect("/install?step=2");
}

export async function initializeInstallationDatabase(
  _state: InstallStepState,
  formData: FormData,
): Promise<InstallStepState> {
  if (inspectInstallationState().status === "installed") redirect("/");

  const failed = checkInstallEnvironment().filter(({ ok }) => !ok);
  if (failed.length) return { message: failed.map(({ description }) => description).join("；") };

  const modeResult = databaseModeSchema.safeParse(formData.get("databaseMode") ?? "none");
  if (!modeResult.success) return { message: "确认您的配置" };

  let destination = "/install?step=3";
  try {
    initializeDatabaseSchema();
    const state = inspectInstallationState();
    if (state.status === "installed") destination = "/";

    if (destination !== "/" && state.hasExistingData && modeResult.data === "none") {
      return { message: "安装程序检查到原有数据已经存在，请选择保留或删除原有数据。" };
    }

    if (destination !== "/" && modeResult.data !== "none") {
      const { prepareExistingInstallation } = await import("@/lib/bootstrap/install-service");
      const existingUserId = prepareExistingInstallation(modeResult.data);
      if (existingUserId) destination = "/login";
    }
  } catch (error) {
    console.error("Failed to initialize installation database", error);
    return { message: "安装程序无法初始化数据库，请检查数据库文件及目录权限后重试。" };
  }

  redirect(destination);
}

export async function completeInstallation(
  _state: CompleteInstallState,
  formData: FormData,
): Promise<CompleteInstallState> {
  const currentState = inspectInstallationState();
  if (currentState.status === "installed") redirect("/");
  if (currentState.status === "needs-schema") {
    return { message: "数据库结构尚未初始化，请返回上一步。" };
  }

  const values = {
    siteUrl: formData.get("siteUrl")?.toString(),
    username: formData.get("username")?.toString(),
    email: formData.get("email")?.toString(),
  };
  const result = installAdministratorSchema.safeParse({
    ...values,
    password: formData.get("password")?.toString() || undefined,
  });

  if (!result.success) {
    return {
      message: "请检查您填写的安装信息。",
      fieldErrors: result.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const { installSite } = await import("@/lib/bootstrap/install-service");
    const success = await installSite(result.data);
    await createSession(success.userId, false);
    revalidatePath("/", "layout");
    return {
      success: {
        username: success.username,
        password: success.password,
        siteUrl: success.siteUrl,
      },
    };
  } catch (error) {
    const { ExistingAdministratorError, InstallationAlreadyCompleteError } =
      await import("@/lib/bootstrap/install-service");
    if (error instanceof InstallationAlreadyCompleteError) redirect("/");
    if (error instanceof ExistingAdministratorError) {
      return { message: "检测到已有管理员，请返回数据库配置并选择如何处理原有数据。", values };
    }
    console.error("Failed to complete installation", error);
    return { message: "安装程序写入数据时发生错误，请稍后重试。", values };
  }
}