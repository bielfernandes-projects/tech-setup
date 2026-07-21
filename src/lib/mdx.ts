import type { Article, Category, Tag } from "./types";
import { supabase } from "./supabase";

function getClient() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function normalizeCategory(cat: unknown): Article["category"] {
  if (Array.isArray(cat)) return cat.length > 0 ? cat[0] : null;
  return cat as Article["category"];
}

function normalizeTags(tags: unknown): Tag[] {
  if (!Array.isArray(tags)) return [];
  const flat = tags.map((t: unknown) => {
    if (typeof t === "object" && t !== null && "tags" in t) {
      return (t as { tags: Tag }).tags;
    }
    return t as Tag;
  }).flat();
  const seen = new Set<string>();
  return flat.filter((tag) => {
    if (!tag?.slug || seen.has(tag.slug)) return false;
    seen.add(tag.slug);
    return true;
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data } = await getClient()
    .from("articles")
    .select("id, title, slug, content, excerpt, hero_image_url, published_at, created_at, updated_at, category:categories(name, slug), article_tags(tag:tags(name, slug))")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return null;

  const tags = normalizeTags(data.article_tags);
  return { ...data, category: normalizeCategory(data.category), tags } as Article;
}

export async function getRecentArticles(limit = 10): Promise<Article[]> {
  const { data } = await getClient()
    .from("articles")
    .select("id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((d) => ({ ...d, category: normalizeCategory(d.category) } as Article));
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  const { data } = await getClient()
    .from("articles")
    .select("slug")
    .eq("status", "published");

  return (data ?? []).map((a) => a.slug);
}

export async function getArticlesByCategory(slug: string, limit = 50): Promise<Article[]> {
  const { data: cat } = await getClient()
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!cat) return [];

  const { data } = await getClient()
    .from("articles")
    .select("id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)")
    .eq("category_id", cat.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((d) => ({ ...d, category: normalizeCategory(d.category) } as Article));
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const { data } = await getClient()
    .from("categories")
    .select("slug");

  return (data ?? []).map((c) => c.slug);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await getClient()
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  return data ?? null;
}

export async function getArticlesByTag(slug: string, limit = 50): Promise<Article[]> {
  const { data: tag } = await getClient()
    .from("tags")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!tag) return [];

  const { data: articleTags } = await getClient()
    .from("article_tags")
    .select("article_id")
    .eq("tag_id", tag.id);

  if (!articleTags || articleTags.length === 0) return [];

  const articleIds = articleTags.map((at) => at.article_id);

  const { data } = await getClient()
    .from("articles")
    .select("id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)")
    .in("id", articleIds)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((d) => ({ ...d, category: normalizeCategory(d.category) } as Article));
}

export async function getAllTagSlugs(): Promise<string[]> {
  const { data } = await getClient()
    .from("tags")
    .select("slug");

  return (data ?? []).map((t) => t.slug);
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const { data } = await getClient()
    .from("tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  return data ?? null;
}

export async function getRelatedArticles(articleId: string, categoryId: string | null, limit = 3): Promise<Article[]> {
  let query = getClient()
    .from("articles")
    .select("id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)")
    .eq("status", "published")
    .neq("id", articleId);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((d) => ({ ...d, category: normalizeCategory(d.category) } as Article));
}
