import type { Article } from "./types";
import { supabase } from "./supabase";

function getClient() {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function normalizeCategory(cat: unknown): Article["category"] {
  if (Array.isArray(cat)) return cat.length > 0 ? cat[0] : null;
  return cat as Article["category"];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data } = await getClient()
    .from("articles")
    .select("id, title, slug, content, hero_image_url, published_at, created_at, updated_at, category:categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return null;
  return { ...data, category: normalizeCategory(data.category) } as Article;
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
