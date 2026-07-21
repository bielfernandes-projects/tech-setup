import type { Article, Category, Tag } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  ArticleRepository,
  ArticleRepositoryError,
} from "./repository";

function getClient() {
  if (!supabase) {
    throw new ArticleRepositoryError("Supabase client is not configured");
  }
  return supabase;
}

function normalizeCategory(cat: unknown): Article["category"] {
  if (Array.isArray(cat)) return cat.length > 0 ? cat[0] : null;
  return cat as Article["category"];
}

function normalizeTags(tags: unknown): Tag[] {
  if (!Array.isArray(tags)) return [];
  const flat = tags
    .map((t: unknown) => {
      if (typeof t === "object" && t !== null && "tags" in t) {
        return (t as { tags: Tag }).tags;
      }
      return t as Tag;
    })
    .flat();
  const seen = new Set<string>();
  return flat.filter((tag) => {
    if (!tag?.slug || seen.has(tag.slug)) return false;
    seen.add(tag.slug);
    return true;
  });
}

export class SupabaseArticleRepository implements ArticleRepository {
  async findPublished(limit = 10): Promise<Article[]> {
    const { data, error } = await getClient()
      .from("articles")
      .select(
        "id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new ArticleRepositoryError("Failed to fetch published articles", error);
    }

    return (data ?? []).map(
      (d) => ({ ...d, category: normalizeCategory(d.category) } as Article),
    );
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await getClient()
      .from("articles")
      .select(
        "id, title, slug, content, excerpt, hero_image_url, published_at, created_at, updated_at, category:categories(name, slug), article_tags(tag:tags(name, slug))",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) return null;

    const tags = normalizeTags(data.article_tags);
    return { ...data, category: normalizeCategory(data.category), tags } as Article;
  }

  async findByCategory(slug: string, limit = 50): Promise<Article[]> {
    const { data: cat, error: catError } = await getClient()
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .single();

    if (catError || !cat) return [];

    const { data, error } = await getClient()
      .from("articles")
      .select(
        "id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)",
      )
      .eq("category_id", cat.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new ArticleRepositoryError(
        `Failed to fetch articles by category "${slug}"`,
        error,
      );
    }

    return (data ?? []).map(
      (d) => ({ ...d, category: normalizeCategory(d.category) } as Article),
    );
  }

  async findByTag(slug: string, limit = 50): Promise<Article[]> {
    const { data: tag, error: tagError } = await getClient()
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .single();

    if (tagError || !tag) return [];

    const { data: articleTags, error: articleTagsError } = await getClient()
      .from("article_tags")
      .select("article_id")
      .eq("tag_id", tag.id);

    if (articleTagsError) {
      throw new ArticleRepositoryError(
        `Failed to fetch articles by tag "${slug}"`,
        articleTagsError,
      );
    }

    if (!articleTags || articleTags.length === 0) return [];

    const articleIds = articleTags.map((at) => at.article_id);

    const { data, error } = await getClient()
      .from("articles")
      .select(
        "id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)",
      )
      .in("id", articleIds)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new ArticleRepositoryError(
        `Failed to fetch articles by tag "${slug}"`,
        error,
      );
    }

    return (data ?? []).map(
      (d) => ({ ...d, category: normalizeCategory(d.category) } as Article),
    );
  }

  async findRelated(
    articleId: string,
    categorySlug: string | null,
    limit = 3,
  ): Promise<Article[]> {
    let categoryId: string | null = null;

    if (categorySlug) {
      const { data: cat, error: catError } = await getClient()
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (catError) {
        throw new ArticleRepositoryError(
          `Failed to resolve category "${categorySlug}"`,
          catError,
        );
      }

      categoryId = cat?.id ?? null;
    }

    let query = getClient()
      .from("articles")
      .select(
        "id, title, slug, excerpt, hero_image_url, published_at, category:categories(name, slug)",
      )
      .eq("status", "published")
      .neq("id", articleId);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new ArticleRepositoryError("Failed to fetch related articles", error);
    }

    return (data ?? []).map(
      (d) => ({ ...d, category: normalizeCategory(d.category) } as Article),
    );
  }

  async listPublishedSlugs(): Promise<string[]> {
    const { data, error } = await getClient()
      .from("articles")
      .select("slug")
      .eq("status", "published");

    if (error) {
      throw new ArticleRepositoryError("Failed to list published slugs", error);
    }

    return (data ?? []).map((a) => a.slug);
  }

  async listCategories(): Promise<(Category & { count: number })[]> {
    const { data: categories, error: catError } = await getClient()
      .from("categories")
      .select("id, name, slug");

    if (catError || !categories) return [];

    const results: (Category & { count: number })[] = [];

    for (const cat of categories) {
      const { count } = await getClient()
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .eq("status", "published");

      results.push({ ...cat, count: count ?? 0 });
    }

    return results;
  }

  async listCategorySlugs(): Promise<string[]> {
    const { data, error } = await getClient().from("categories").select("slug");

    if (error) {
      throw new ArticleRepositoryError("Failed to list category slugs", error);
    }

    return (data ?? []).map((c) => c.slug);
  }

  async listTagSlugs(): Promise<string[]> {
    const { data, error } = await getClient().from("tags").select("slug");

    if (error) {
      throw new ArticleRepositoryError("Failed to list tag slugs", error);
    }

    return (data ?? []).map((t) => t.slug);
  }

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await getClient()
      .from("categories")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return data as Category;
  }

  async findTagBySlug(slug: string): Promise<Tag | null> {
    const { data, error } = await getClient()
      .from("tags")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return data as Tag;
  }
}

export const articleRepository: ArticleRepository =
  new SupabaseArticleRepository();
