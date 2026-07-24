"use server";

import { requireAdministrator } from "@/lib/auth/session";
import { imageStorage } from "@/lib/storage/local-storage";

export async function uploadImage(formData: FormData) {
  await requireAdministrator("/admin/posts/new");
  const file = formData.get("image");
  if (!(file instanceof File)) throw new Error("请选择图片");
  return imageStorage.save(file);
}
