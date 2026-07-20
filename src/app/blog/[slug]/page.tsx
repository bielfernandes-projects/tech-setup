import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPublishedSlugs, getArticleBySlug } from "@/lib/mdx";

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

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        &larr; Back to articles
      </Link>

      <header className="mt-8 mb-12">
        {article.category && (
          <Link
            href={`/blog/category/${(article.category as { name: string; slug: string }).slug}`}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {(article.category as { name: string; slug: string }).name}
          </Link>
        )}
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <time
          dateTime={article.published_at}
          className="mt-4 block text-sm text-zinc-500"
        >
          {new Date(article.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </header>

      {/* Ad placeholder (in-content, between H2s) */}
      <div className="my-8 flex items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-8 text-sm text-zinc-400">
        Ad placeholder
      </div>

      <div className="prose prose-zinc prose-code:before:content-none prose-code:after:content-none max-w-none">
        {article.content}
      </div>

      {/* Ad placeholder (footer) */}
      <div className="my-12 flex items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-8 text-sm text-zinc-400">
        Ad placeholder
      </div>

      <div className="border-t border-zinc-200 pt-8">
        <h2 className="text-lg font-semibold mb-4">Related articles</h2>
        <p className="text-sm text-zinc-500">Coming soon.</p>
      </div>
    </article>
  );
}
