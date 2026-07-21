import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticlesByTag, getTagBySlug, getAllTagSlugs } from "@/lib/mdx";

export async function generateStaticParams() {
  const slugs = await getAllTagSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Not Found" };

  return {
    title: `#${tag.name}`,
    description: `Articles tagged with ${tag.name}.`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const articles = await getArticlesByTag(slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="text-sm text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-8"
      >
        &larr; All articles
      </Link>

      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          #{tag.name}
        </h1>
        <p className="mt-2 text-muted">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted text-lg">No articles with this tag yet.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {articles.map((article) => (
            <article key={article.slug} className="group">
              {article.hero_image_url && (
                <Link href={`/blog/${article.slug}`} className="block mb-4">
                  <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-surface">
                    <Image
                      src={article.hero_image_url}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 720px"
                    />
                  </div>
                </Link>
              )}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted mb-2">
                  <time dateTime={article.published_at}>
                    {new Date(article.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  {article.category && (
                    <>
                      <span className="text-zinc-300">·</span>
                      <Link
                        href={`/blog/category/${article.category.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        {article.category.name}
                      </Link>
                    </>
                  )}
                </div>
                <h2 className="text-xl font-semibold leading-snug mb-1.5">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {article.title}
                  </Link>
                </h2>
                {article.excerpt && (
                  <p className="text-muted leading-relaxed">
                    {article.excerpt}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
