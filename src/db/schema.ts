import { relations } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const categoryRelations = relations(categories, ({ many }) => ({ posts: many(posts) }));
export const tagRelations = relations(tags, ({ many }) => ({ postTags: many(postsToTags) }));
export const postRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  postTags: many(postsToTags),
}));
export const postTagRelations = relations(postsToTags, ({ one }) => ({
  post: one(posts, { fields: [postsToTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postsToTags.tagId], references: [tags.id] }),
}));
export const userRelations = relations(users, ({ many }) => ({ sessions: many(sessions) }));
export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type Post = typeof posts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type User = typeof users.$inferSelect;
