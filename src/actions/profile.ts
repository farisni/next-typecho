"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/auth/session";
import {
  ProfileFieldConflictError,
  saveWritingPreferences,
  updateProfile,
  updateProfilePassword,
} from "@/lib/profile/service";
import {
  profilePasswordSchema,
  profileSchema,
  writingPreferencesSchema,
} from "@/lib/validation/profile";

export type ProfileActionState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function saveProfile(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void _state;
  const user = await requireAdministrator("/admin/profile");
  const result = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    url: formData.get("url"),
    email: formData.get("email"),
  });
  if (!result.success) {
    return {
      status: "error",
      message: "请检查个人资料。",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  try {
    updateProfile(user.id, user.username, result.data);
  } catch (error) {
    if (error instanceof ProfileFieldConflictError) {
      return {
        status: "error",
        message: "请检查个人资料。",
        fieldErrors: { [error.field]: [error.message] },
      };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/profile");
  return { status: "success", message: "您的档案已经更新" };
}

export async function saveWritingOptions(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void _state;
  const user = await requireAdministrator("/admin/profile");
  const defaultAllow = new Set(formData.getAll("defaultAllow").map(String));
  const result = writingPreferencesSchema.safeParse({
    markdown: formData.get("markdown") === "1",
    xmlrpcMarkdown: formData.get("xmlrpcMarkdown") === "1",
    autoSave: formData.get("autoSave") === "1",
    defaultAllowComment: defaultAllow.has("comment"),
    defaultAllowPing: defaultAllow.has("ping"),
    defaultAllowFeed: defaultAllow.has("feed"),
  });
  if (!result.success) return { status: "error", message: "撰写设置格式错误。" };

  saveWritingPreferences(user.id, result.data);
  revalidatePath("/admin/profile");
  revalidatePath("/admin/posts/new");
  return { status: "success", message: "设置已经保存" };
}

export async function changeProfilePassword(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  void _state;
  const user = await requireAdministrator("/admin/profile");
  const result = profilePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!result.success) {
    return {
      status: "error",
      message: "请检查密码。",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  // 保持原版语义：修改密码后当前登录会话继续有效。
  await updateProfilePassword(user.id, result.data.password);
  revalidatePath("/admin/profile");
  return { status: "success", message: "密码已经成功修改" };
}
