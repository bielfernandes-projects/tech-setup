import type { Article, Category, Tag } from "@/lib/types";

export interface ArticleRepository {
  /**
   * Fetch the most recently published articles, ordered by `published_at` desc.
   */
  findPublished(limit?: number): Promise<Article[]>;

  /**
   * Fetch a single published article by its slug.
   * Returns `null` if not found or not published.
   */
  findBySlug(slug: string): Promise<Article | null>;

  /**
   * Fetch published articles within a category.
   */
  findByCategory(slug: string, limit?: number): Promise<Article[]>;

  /**
   * Fetch published articles tagged with a specific tag.
   */
  findByTag(slug: string, limit?: number): Promise<Article[]>;

  /**
   * Fetch related published articles for an article page.
   * `categorySlug` is the public category slug; the implementation resolves the
   * internal id so callers do not need to know the category schema.
   */
  findRelated(
    articleId: string,
    categorySlug: string | null,
    limit?: number,
  ): Promise<Article[]>;

  /**
   * List all slugs of currently published articles.
   */
  listPublishedSlugs(): Promise<string[]>;

  /**
   * List all categories with article counts.
   */
  listCategories(): Promise<(Category & { count: number })[]>;

  /**
   * List all category slugs.
   */
  listCategorySlugs(): Promise<string[]>;

  /**
   * List all tag slugs.
   */
  listTagSlugs(): Promise<string[]>;

  /**
   * Resolve a category by slug.
   */
  findCategoryBySlug(slug: string): Promise<Category | null>;

  /**
   * Resolve a tag by slug.
   */
  findTagBySlug(slug: string): Promise<Tag | null>;
}

export interface RepositoryError {
  message: string;
  code?: string;
}

export class ArticleRepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ArticleRepositoryError";
  }
}
