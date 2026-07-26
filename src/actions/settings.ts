"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/auth/session";
import { run } from "@/lib/db";
import { commentSettingsSchema, settingsSchema } from "@/lib/validation/settings";

export async function updateSiteSettings(formData: FormData) {
  await requireAdministrator("/admin/settings");
  const input = settingsSchema.parse({
    siteName: formData.get("siteName"),
    siteDescription: formData.get("siteDescription"),
    postsPerPage: formData.get("postsPerPage"),
    boxModel: formData.get("boxModel") === "on",
  });
  const now = Date.now();

  run(
    `INSERT INTO site_settings
     (id, site_name, site_description, posts_per_page, box_model, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET site_name = excluded.site_name,
       site_description = excluded.site_description,
       posts_per_page = excluded.posts_per_page,
       box_model = excluded.box_model,
       updated_at = excluded.updated_at`,
    input.siteName, input.siteDescription, input.postsPerPage, input.boxModel ? 1 : 0, now, now,
  );
  revalidatePath("/", "layout");
}

export async function updateCommentSettings(formData: FormData) {
  await requireAdministrator("/admin/settings/comments");
  const input = commentSettingsSchema.parse({
    commentsPerPage: formData.get("commentsPerPage"),
    commentsOrder: formData.get("commentsOrder"),
    commentsDefaultPage: formData.get("commentsDefaultPage"),
    commentsMaxNestingLevels: formData.get("commentsMaxNestingLevels"),
    commentsPostInterval: formData.get("commentsPostInterval"),
    commentsAutoCloseDays: formData.get("commentsAutoCloseDays"),
    commentsThreaded: formData.get("commentsThreaded") === "on",
    commentsMarkdown: formData.get("commentsMarkdown") === "on",
    commentsShowUrl: formData.get("commentsShowUrl") === "on",
    commentsUrlNofollow: formData.get("commentsUrlNofollow") === "on",
    commentsAvatar: formData.get("commentsAvatar") === "on",
    commentsRequireModeration: formData.get("commentsRequireModeration") === "on",
    commentsWhitelist: formData.get("commentsWhitelist") === "on",
    commentsRequireMail: formData.get("commentsRequireMail") === "on",
    commentsRequireUrl: formData.get("commentsRequireUrl") === "on",
    commentsCheckReferer: formData.get("commentsCheckReferer") === "on",
    commentsAntiSpam: formData.get("commentsAntiSpam") === "on",
  });

  run(
    `UPDATE site_settings SET
       comments_per_page = ?, comments_order = ?, comments_default_page = ?,
       comments_threaded = ?, comments_max_nesting_levels = ?,
       comments_markdown = ?, comments_show_url = ?, comments_url_nofollow = ?,
       comments_avatar = ?, comments_require_moderation = ?, comments_whitelist = ?,
       comments_require_mail = ?, comments_require_url = ?, comments_check_referer = ?,
       comments_anti_spam = ?, comments_post_interval = ?,
       comments_auto_close_days = ?, updated_at = ?
     WHERE id = 1`,
    input.commentsPerPage,
    input.commentsOrder,
    input.commentsDefaultPage,
    input.commentsThreaded ? 1 : 0,
    input.commentsMaxNestingLevels,
    input.commentsMarkdown ? 1 : 0,
    input.commentsShowUrl ? 1 : 0,
    input.commentsUrlNofollow ? 1 : 0,
    input.commentsAvatar ? 1 : 0,
    input.commentsRequireModeration ? 1 : 0,
    input.commentsWhitelist ? 1 : 0,
    input.commentsRequireMail ? 1 : 0,
    input.commentsRequireUrl ? 1 : 0,
    input.commentsCheckReferer ? 1 : 0,
    input.commentsAntiSpam ? 1 : 0,
    input.commentsPostInterval,
    input.commentsAutoCloseDays,
    Date.now(),
  );
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/comments");
}
