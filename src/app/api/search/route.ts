import { searchCachedPosts } from "@/lib/search-cache";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return Response.json({ items: [] });
  }

  return Response.json({ items: searchCachedPosts(query, 8) });
}
