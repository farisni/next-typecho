"use client";

import Link from "next/link";
import { Gift, MessageSquare, ThumbsUp } from "lucide-react";
import type { LatestComment } from "@/lib/repositories/comments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabKey = "popular" | "comments" | "recommend";

type TabConfig = {
  label: string;
  value: TabKey;
  icon: typeof ThumbsUp;
};

const tabs: TabConfig[] = [
  { label: "热门文章", value: "popular", icon: ThumbsUp },
  { label: "最新评论", value: "comments", icon: MessageSquare },
  { label: "推荐内容", value: "recommend", icon: Gift },
];

type PopularPost = {
  title: string;
  slug: string;
  commentCount: number;
};

export type SidebarTabsProps = {
  posts: PopularPost[];
  comments: LatestComment[];
};

function PostList({ posts }: { posts: PopularPost[] }) {
  return (
    <ul className="handsome-popular-list">
      {posts.slice(0, 5).map((post, index) => (
        <li key={post.slug}>
          <span className="lite-post-rank" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="lite-popular-copy">
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CommentList({ comments }: { comments: LatestComment[] }) {
  if (comments.length === 0) {
    return <p className="lite-sidebar-empty">暂无评论</p>;
  }

  return (
    <ul className="handsome-popular-list lite-latest-comment-list">
      {comments.map((comment, index) => (
        <li key={comment.id}>
          <span className="lite-post-rank" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="lite-popular-copy">
            <Link
              href={`/posts/${comment.postSlug}#comment-${comment.id}`}
              title={comment.text}
            >
              {comment.text}
            </Link>
            <span
              className="lite-latest-comment-meta"
              title={`${comment.author} · ${comment.postTitle} · ${comment.createdLabel}`}
            >
              {comment.author} · {comment.postTitle}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SidebarTabs({ posts, comments }: SidebarTabsProps) {
  return (
    <Tabs defaultValue="popular" aria-label="侧栏内容类型">
      <div className="handsome-sidebar-tabs-wrap">
        <TabsList variant="default" suppressHydrationWarning>
          {tabs.map(({ label, icon: Icon, value }) => (
            <TabsTrigger value={value} key={label} aria-label={label}>
              <Icon aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value="popular" className="lite-sidebar-tab-compact">
        <PostList posts={posts} />
      </TabsContent>
      <TabsContent value="comments" className="lite-sidebar-tab-compact">
        <CommentList comments={comments} />
      </TabsContent>
      <TabsContent value="recommend">
        <PostList posts={posts} />
      </TabsContent>
    </Tabs>
  );
}
