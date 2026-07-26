import { get } from "@/lib/db";

export type WritingPreferences = {
  markdown: boolean;
  xmlrpcMarkdown: boolean;
  autoSave: boolean;
  defaultAllowComment: boolean;
  defaultAllowPing: boolean;
  defaultAllowFeed: boolean;
};

type RawPreferences = {
  markdown: number;
  xmlrpcMarkdown: number;
  autoSave: number;
  defaultAllowComment: number;
  defaultAllowPing: number;
  defaultAllowFeed: number;
};

const defaultPreferences: WritingPreferences = {
  markdown: true,
  xmlrpcMarkdown: false,
  autoSave: false,
  defaultAllowComment: true,
  defaultAllowPing: true,
  defaultAllowFeed: true,
};

export function getWritingPreferences(userId: string): WritingPreferences {
  const row = get<RawPreferences>(
    `SELECT markdown, xmlrpc_markdown AS xmlrpcMarkdown, auto_save AS autoSave,
            default_allow_comment AS defaultAllowComment,
            default_allow_ping AS defaultAllowPing,
            default_allow_feed AS defaultAllowFeed
     FROM user_preferences WHERE user_id = ?`,
    userId,
  );

  if (!row) return { ...defaultPreferences };
  return {
    markdown: Boolean(row.markdown),
    xmlrpcMarkdown: Boolean(row.xmlrpcMarkdown),
    autoSave: Boolean(row.autoSave),
    defaultAllowComment: Boolean(row.defaultAllowComment),
    defaultAllowPing: Boolean(row.defaultAllowPing),
    defaultAllowFeed: Boolean(row.defaultAllowFeed),
  };
}

export function getProfilePageData(userId: string) {
  const user = get<{
    id: string;
    username: string;
    email: string;
    displayName: string;
    url: string;
    lastLoginAt: number | null;
  }>(
    `SELECT id, username, email, display_name AS displayName, url,
            last_login_at AS lastLoginAt
     FROM users WHERE id = ?`,
    userId,
  );
  if (!user) throw new Error("用户不存在");

  const publishedPosts = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM posts WHERE status = 'published'",
  )?.count ?? 0;
  const categories = get<{ count: number }>("SELECT COUNT(*) AS count FROM categories")?.count ?? 0;
  const comments = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM comments WHERE status = 'approved'",
  )?.count ?? 0;

  return {
    user: {
      ...user,
      lastLoginAt: user.lastLoginAt === null ? null : new Date(user.lastLoginAt),
    },
    preferences: getWritingPreferences(userId),
    stats: { publishedPosts, comments, categories },
  };
}
