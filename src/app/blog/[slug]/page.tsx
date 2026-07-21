import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllPublishedSlugs, getArticleBySlug, getRelatedArticles } from "@/lib/mdx";
import MarkdownContent from "@/lib/markdown-content";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) return { title: "Not Found" };

  return {
    title: article.title,
    description: article.excerpt ?? article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? article.title,
      type: "article",
      publishedTime: article.published_at,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const related = await getRelatedArticles(article.id, article.category?.slug ?? null, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-8"
      >
        &larr; All articles
      </Link>

      <header className="mb-10">
        {article.category && (
          <Link
            href={`/blog/category/${article.category.slug}`}
            className="text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            {article.category.name}
          </Link>
        )}
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
          {article.title}
        </h1>
        <time
          dateTime={article.published_at}
          className="mt-3 block text-sm text-muted"
        >
          {new Date(article.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </header>

      {article.hero_image_url && (
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-10 bg-surface">
          <Image
            src={article.hero_image_url}
            alt={article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      )}

      {/* Ad placeholder (in-content) */}
      <div className="my-8 flex items-center justify-center rounded-lg border border-dashed border-border bg-surface py-6 text-xs text-muted">
        Advertisement
      </div>

      {article.content && <MarkdownContent content={article.content} />}

      {/* Ad placeholder (footer) */}
      <div className="my-12 flex items-center justify-center rounded-lg border border-dashed border-border bg-surface py-6 text-xs text-muted">
        Advertisement
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {article.tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/blog/tag/${tag.slug}`}
              className="px-3 py-1 text-xs font-medium bg-surface text-muted rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Related articles */}
      {related.length > 0 && (
        <div className="border-t border-border mt-12 pt-10">
          <h2 className="text-lg font-semibold mb-6">Related articles</h2>
          <div className="space-y-6">
            {related.map((rel) => (
              <article key={rel.slug}>
                <div className="flex items-center gap-2 text-sm text-muted mb-1">
                  <time dateTime={rel.published_at}>
                    {new Date(rel.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  {rel.category && (
                    <>
                      <span className="text-muted">·</span>
                      <span>{rel.category.name}</span>
                    </>
                  )}
                </div>
                <h3 className="font-medium">
                  <Link href={`/blog/${rel.slug}`} className="hover:text-primary transition-colors">
                    {rel.title}
                  </Link>
                </h3>
              </article>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
