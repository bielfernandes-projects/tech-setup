import Link from "next/link";
import { notFound } from "next/navigation";
import { articleRepository } from "@/lib/articles";
import { siteUrl } from "@/lib/site";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await articleRepository.listTagSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await articleRepository.findTagBySlug(slug);
  if (!tag) return { title: "Not Found" };

  return {
    title: `#${tag.name} — Developer Articles`,
    description: `Browse articles tagged with ${tag.name} — practical developer guides and tutorials.`,
    alternates: {
      canonical: siteUrl(`/blog/tag/${slug}`),
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await articleRepository.findTagBySlug(slug);
  if (!tag) notFound();

  const articles = await articleRepository.findByTag(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `#${tag.name} Articles`,
    description: `Articles tagged with ${tag.name}`,
    url: siteUrl(`/blog/tag/${slug}`),
    ...(articles.length > 0 && {
      mainEntity: {
        "@type": "ItemList",
        name: `#${tag.name} Articles`,
        numberOfItems: articles.length,
        itemListElement: articles.map((article, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: siteUrl(`/blog/${article.slug}`),
          name: article.title,
        })),
      },
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Blog", item: siteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: `#${tag.name}`, item: siteUrl(`/blog/tag/${slug}`) },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <nav className="text-sm text-muted mb-8" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="hover:text-ink transition-colors">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">#{tag.name}</li>
          </ol>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            #{tag.name}
          </h1>
          <p className="mt-2 text-muted">
            {articles.length} {articles.length === 1 ? "article" : "articles"} tagged with {tag.name}
          </p>
        </header>

        {articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted text-lg">No articles with this tag yet.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
