import { relations } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    renderedContent: text("rendered_content"),
    renderedContentUpdatedAt: integer("rendered_content_updated_at", { mode: "timestamp_ms" }),
    status: text("status", { enum: ["draft", "published", "waiting", "hidden", "private"] }).notNull().default("draft"),
    allowComment: integer("allow_comment", { mode: "boolean" }).notNull().default(true),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("posts_status_published_at_idx").on(table.status, table.publishedAt),
    index("posts_category_id_idx").on(table.categoryId),
  ],
);

export const postsToTags = sqliteTable(
  "posts_to_tags",
  {
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  siteName: text("site_name").notNull(),
  siteDescription: text("site_description").notNull(),
  siteUrl: text("site_url").notNull().default("http://localhost:3000"),
  activeTheme: text("active_theme").notNull().default("default"),
  postsPerPage: integer("posts_per_page").notNull().default(10),
  boxModel: integer("box_model", { mode: "boolean" }).notNull().default(true),
  commentsPerPage: integer("comments_per_page").notNull().default(20),
  commentsOrder: text("comments_order", { enum: ["ASC", "DESC"] }).notNull().default("ASC"),
  commentsDefaultPage: text("comments_default_page", { enum: ["first", "last"] }).notNull().default("last"),
  commentsThreaded: integer("comments_threaded", { mode: "boolean" }).notNull().default(true),
  commentsMaxNestingLevels: integer("comments_max_nesting_levels").notNull().default(5),
  commentsMarkdown: integer("comments_markdown", { mode: "boolean" }).notNull().default(true),
  commentsShowUrl: integer("comments_show_url", { mode: "boolean" }).notNull().default(true),
  commentsUrlNofollow: integer("comments_url_nofollow", { mode: "boolean" }).notNull().default(true),
  commentsAvatar: integer("comments_avatar", { mode: "boolean" }).notNull().default(true),
  commentsRequireModeration: integer("comments_require_moderation", { mode: "boolean" }).notNull().default(false),
  commentsWhitelist: integer("comments_whitelist", { mode: "boolean" }).notNull().default(true),
  commentsRequireMail: integer("comments_require_mail", { mode: "boolean" }).notNull().default(true),
  commentsRequireUrl: integer("comments_require_url", { mode: "boolean" }).notNull().default(false),
  commentsCheckReferer: integer("comments_check_referer", { mode: "boolean" }).notNull().default(true),
  commentsAntiSpam: integer("comments_anti_spam", { mode: "boolean" }).notNull().default(true),
  commentsPostInterval: integer("comments_post_interval").notNull().default(60),
  commentsAutoCloseDays: integer("comments_auto_close_days").notNull().default(0),
  ...timestamps,
});

export const themeSettings = sqliteTable("theme_settings", {
  theme: text("theme").primaryKey(),
  configJson: text("config_json").notNull().default("{}"),
  customCss: text("custom_css").notNull().default(""),
  ...timestamps,
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  url: text("url").notNull().default(""),
  role: text("role", { enum: ["administrator"] }).notNull().default("administrator"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
  ...timestamps,
});

export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  markdown: integer("markdown", { mode: "boolean" }).notNull().default(true),
  xmlrpcMarkdown: integer("xmlrpc_markdown", { mode: "boolean" }).notNull().default(false),
  autoSave: integer("auto_save", { mode: "boolean" }).notNull().default(false),
  defaultAllowComment: integer("default_allow_comment", { mode: "boolean" }).notNull().default(true),
  defaultAllowPing: integer("default_allow_ping", { mode: "boolean" }).notNull().default(true),
  defaultAllowFeed: integer("default_allow_feed", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnySQLiteColumn => comments.id, { onDelete: "set null" }),
    replyToId: text("reply_to_id").references((): AnySQLiteColumn => comments.id, { onDelete: "set null" }),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    author: text("author").notNull(),
    mail: text("mail").notNull().default(""),
    url: text("url").notNull().default(""),
    ip: text("ip").notNull().default(""),
    agent: text("agent").notNull().default(""),
    text: text("text").notNull(),
    status: text("status", { enum: ["approved", "waiting", "spam"] }).notNull().default("waiting"),
    ...timestamps,
  },
  (table) => [
    index("comments_post_status_created_idx").on(table.postId, table.status, table.createdAt),
    index("comments_parent_id_idx").on(table.parentId),
    index("comments_reply_to_id_idx").on(table.replyToId),
    index("comments_mail_status_idx").on(table.mail, table.status),
    index("comments_ip_created_idx").on(table.ip, table.createdAt),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const installationState = sqliteTable("installation_state", {
  id: integer("id").primaryKey().default(1),
  installedAt: integer("installed_at", { mode: "timestamp_ms" }).notNull(),
  version: integer("version").notNull().default(1),
});

export const trafficDaily = sqliteTable(
  "traffic_daily",
  {
    date: text("date").notNull(),
    path: text("path").notNull(),
    pageViews: integer("page_views").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.date, table.path] }),
    index("traffic_daily_date_idx").on(table.date),
  ],
);

export const trafficVisitors = sqliteTable(
  "traffic_visitors",
  {
    date: text("date").notNull(),
    path: text("path").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.date, table.path, table.visitorHash] }),
    index("traffic_visitors_date_idx").on(table.date),
  ],
);

export const categoryRelations = relations(categories, ({ many }) => ({ posts: many(posts) }));
export const tagRelations = relations(tags, ({ many }) => ({ postTags: many(postsToTags) }));
export const postRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  postTags: many(postsToTags),
  comments: many(comments),
}));
export const postTagRelations = relations(postsToTags, ({ one }) => ({
  post: one(posts, { fields: [postsToTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postsToTags.tagId], references: [tags.id] }),
}));
export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  comments: many(comments),
}));
export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
export const commentRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  authorUser: one(users, { fields: [comments.authorId], references: [users.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
  replyTarget: one(comments, {
    fields: [comments.replyToId],
    references: [comments.id],
    relationName: "commentReplyTargets",
  }),
  targetedReplies: many(comments, { relationName: "commentReplyTargets" }),
}));

export type Post = typeof posts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type User = typeof users.$inferSelect;
export type Comment = typeof comments.$inferSelect;
