import "server-only";

import { listAllPublishedPosts } from "@/lib/repositories/posts";

export type CachedSearchPost = {
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  tags: string[];
};

type SearchCacheEntry = CachedSearchPost & {
  searchText: string;
};

type SearchCacheState = {
  entries: SearchCacheEntry[];
  builtAt: number;
};

const globalForSearchCache = globalThis as typeof globalThis & {
  nextTypechoSearchCache?: SearchCacheState;
};

function normalizeSearchText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("zh-CN");
}

export function clearSearchCache() {
  globalForSearchCache.nextTypechoSearchCache = undefined;
}

export function rebuildSearchCache() {
  const entries = listAllPublishedPosts().map<SearchCacheEntry>((post) => {
    const categoryName = post.category?.name ?? null;
    const tags = post.tags.map((tag) => tag.name);

    return {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      categoryName,
      tags,
      searchText: normalizeSearchText([
        post.title,
        post.slug,
        post.excerpt ?? "",
        categoryName ?? "",
        ...tags,
      ].join(" ")),
    };
  });

  const state = {
    entries,
    builtAt: Date.now(),
  };
  globalForSearchCache.nextTypechoSearchCache = state;

  return {
    count: entries.length,
    builtAt: state.builtAt,
  };
}

export function refreshSearchCache() {
  clearSearchCache();
  return rebuildSearchCache();
}

function getSearchCache() {
  if (!globalForSearchCache.nextTypechoSearchCache) {
    rebuildSearchCache();
  }

  return globalForSearchCache.nextTypechoSearchCache!;
}

export function searchCachedPosts(query: string, limit = 8): CachedSearchPost[] {
  const words = normalizeSearchText(query)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);

  if (!words.length) return [];

  return getSearchCache().entries
    .filter((entry) => words.every((word) => entry.searchText.includes(word)))
    .slice(0, limit)
    .map(({ searchText: _searchText, ...post }) => post);
}
