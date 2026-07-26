import { z } from "zod";

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  siteDescription: z.string().trim().max(200),
  postsPerPage: z.coerce.number().int().min(1).max(50),
  boxModel: z.boolean(),
});

export const commentSettingsSchema = z.object({
  commentsPerPage: z.coerce.number().int().min(1).max(100),
  commentsOrder: z.enum(["ASC", "DESC"]),
  commentsDefaultPage: z.enum(["first", "last"]),
  commentsMaxNestingLevels: z.coerce.number().int().min(2).max(7),
  commentsPostInterval: z.coerce.number().int().min(0).max(86400),
  commentsAutoCloseDays: z.coerce.number().int().min(0).max(36500),
  commentsThreaded: z.boolean(),
  commentsMarkdown: z.boolean(),
  commentsShowUrl: z.boolean(),
  commentsUrlNofollow: z.boolean(),
  commentsAvatar: z.boolean(),
  commentsRequireModeration: z.boolean(),
  commentsWhitelist: z.boolean(),
  commentsRequireMail: z.boolean(),
  commentsRequireUrl: z.boolean(),
  commentsCheckReferer: z.boolean(),
  commentsAntiSpam: z.boolean(),
});
