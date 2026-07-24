import { PostCard } from "@/components/site/post-card";

type PostListProps = {
  posts: Parameters<typeof PostCard>[0]["post"][];
};

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <article className="post"><h2 className="post-title">没有找到内容</h2></article>;
  }

  return <>{posts.map((post) => <PostCard key={post.slug} post={post} />)}</>;
}
