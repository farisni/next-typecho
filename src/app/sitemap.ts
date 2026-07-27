import type { MetadataRoute } from "next";
import { listAllPublishedPosts } from "@/lib/repositories/posts";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.farisni.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = listAllPublishedPosts();
  const { categories, tags } = await listTaxonomies();
  const latestUpdate = posts.reduce<Date | undefined>(
    (latest, post) => (!latest || post.updatedAt > latest ? post.updatedAt : latest),
    undefined,
  );

  return [
    {
      url: siteUrl,
      lastModified: latestUpdate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/posts`,
      lastModified: latestUpdate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/sitemap.html`,
      lastModified: latestUpdate,
      changeFrequency: "daily",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/start-page.html`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((category) => ({
      url: `${siteUrl}/categories/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tags.map((tag) => ({
      url: `${siteUrl}/tags/${tag.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
