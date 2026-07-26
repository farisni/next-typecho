import { get } from "@/lib/db";

export const DEFAULT_SITE_SETTINGS = {
  siteName: "Next Typecho",
  siteDescription: "人生如逆旅，我亦是行人。",
  postsPerPage: 6,
  boxModel: true,
};

export const DEFAULT_COMMENT_SETTINGS = {
  commentsPerPage: 20,
  commentsOrder: "ASC" as const,
  commentsDefaultPage: "last" as const,
  commentsThreaded: true,
  commentsMaxNestingLevels: 2,
  commentsMarkdown: true,
  commentsShowUrl: true,
  commentsUrlNofollow: true,
  commentsAvatar: true,
  commentsRequireModeration: false,
  commentsWhitelist: true,
  commentsRequireMail: true,
  commentsRequireUrl: false,
  commentsCheckReferer: true,
  commentsAntiSpam: true,
  commentsPostInterval: 60,
  commentsAutoCloseDays: 0,
};

type SettingRow = {
  siteName: string;
  siteDescription: string;
  postsPerPage: number;
  boxModel: number;
};

export async function getSiteSettings() {
  const settings = get<SettingRow>(`
    SELECT site_name AS siteName, site_description AS siteDescription,
           posts_per_page AS postsPerPage, box_model AS boxModel
    FROM site_settings WHERE id = 1
  `);

  return settings ? { ...settings, boxModel: Boolean(settings.boxModel) } : DEFAULT_SITE_SETTINGS;
}

type RawCommentSettings = {
  commentsPerPage: number;
  commentsOrder: "ASC" | "DESC";
  commentsDefaultPage: "first" | "last";
  commentsThreaded: number;
  commentsMaxNestingLevels: number;
  commentsMarkdown: number;
  commentsShowUrl: number;
  commentsUrlNofollow: number;
  commentsAvatar: number;
  commentsRequireModeration: number;
  commentsWhitelist: number;
  commentsRequireMail: number;
  commentsRequireUrl: number;
  commentsCheckReferer: number;
  commentsAntiSpam: number;
  commentsPostInterval: number;
  commentsAutoCloseDays: number;
};

export function getCommentSettings() {
  const settings = get<RawCommentSettings>(`
    SELECT comments_per_page AS commentsPerPage,
           comments_order AS commentsOrder,
           comments_default_page AS commentsDefaultPage,
           comments_threaded AS commentsThreaded,
           comments_max_nesting_levels AS commentsMaxNestingLevels,
           comments_markdown AS commentsMarkdown,
           comments_show_url AS commentsShowUrl,
           comments_url_nofollow AS commentsUrlNofollow,
           comments_avatar AS commentsAvatar,
           comments_require_moderation AS commentsRequireModeration,
           comments_whitelist AS commentsWhitelist,
           comments_require_mail AS commentsRequireMail,
           comments_require_url AS commentsRequireUrl,
           comments_check_referer AS commentsCheckReferer,
           comments_anti_spam AS commentsAntiSpam,
           comments_post_interval AS commentsPostInterval,
           comments_auto_close_days AS commentsAutoCloseDays
    FROM site_settings WHERE id = 1
  `);

  if (!settings) return { ...DEFAULT_COMMENT_SETTINGS };
  return {
    ...settings,
    commentsThreaded: Boolean(settings.commentsThreaded),
    commentsMarkdown: Boolean(settings.commentsMarkdown),
    commentsShowUrl: Boolean(settings.commentsShowUrl),
    commentsUrlNofollow: Boolean(settings.commentsUrlNofollow),
    commentsAvatar: Boolean(settings.commentsAvatar),
    commentsRequireModeration: Boolean(settings.commentsRequireModeration),
    commentsWhitelist: Boolean(settings.commentsWhitelist),
    commentsRequireMail: Boolean(settings.commentsRequireMail),
    commentsRequireUrl: Boolean(settings.commentsRequireUrl),
    commentsCheckReferer: Boolean(settings.commentsCheckReferer),
    commentsAntiSpam: Boolean(settings.commentsAntiSpam),
  };
}
