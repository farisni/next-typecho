import { searchPublishedPosts } from "@/lib/repositories/posts";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return Response.json({ items: [] });
  }

  const { items } = searchPublishedPosts(query, 1, 8);

  return Response.json({
    items: items.map((post) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      categoryName: post.category?.name ?? null,
      tags: post.tags.map((tag) => tag.name),
    })),
  });
}
