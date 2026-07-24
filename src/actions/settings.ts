"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/auth/session";
import { run } from "@/lib/db";
import { settingsSchema } from "@/lib/validation/settings";

export async function updateSiteSettings(formData: FormData) {
  await requireAdministrator("/admin/settings");
  const input = settingsSchema.parse({
    siteName: formData.get("siteName"),
    siteDescription: formData.get("siteDescription"),
    postsPerPage: formData.get("postsPerPage"),
  });
  const now = Date.now();

  run(
    `INSERT INTO site_settings
     (id, site_name, site_description, posts_per_page, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET site_name = excluded.site_name,
       site_description = excluded.site_description,
       posts_per_page = excluded.posts_per_page,
       updated_at = excluded.updated_at`,
    input.siteName, input.siteDescription, input.postsPerPage, now, now,
  );
  revalidatePath("/", "layout");
}
