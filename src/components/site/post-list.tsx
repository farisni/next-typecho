import { PostCard } from "@/components/site/post-card";

type PostListProps = {
  posts: Parameters<typeof PostCard>[0]["post"][];
  featuredFirst?: boolean;
};

export function PostList({ posts, featuredFirst = true }: PostListProps) {
  if (posts.length === 0) {
    return <article className="post"><h2 className="post-title">没有找到内容</h2></article>;
  }

  return (
    <>
      {posts.map((post, index) => {
        const featured = featuredFirst && index === 0;
        const standardIndex = index - (featuredFirst ? 1 : 0);

        return (
          <PostCard
            key={post.slug}
            post={post}
            featured={featured}
            alternate={!featured && standardIndex % 2 === 1}
          />
        );
      })}
    </>
  );
}
