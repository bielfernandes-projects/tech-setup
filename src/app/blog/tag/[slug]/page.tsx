import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticlesByTag, getTagBySlug, getAllTagSlugs } from "@/lib/mdx";

const siteUrl = "https://tech-setup.vercel.app";

export const revalidate = 60;

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
    title: `#${tag.name} — Developer Articles`,
    description: `Browse articles tagged with ${tag.name} — practical developer guides and tutorials.`,
    alternates: {
      canonical: `${siteUrl}/blog/tag/${slug}`,
    },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `#${tag.name} Articles`,
    description: `Articles tagged with ${tag.name}`,
    url: `${siteUrl}/blog/tag/${slug}`,
    ...(articles.length > 0 && {
      mainEntity: {
        "@type": "ItemList",
        name: `#${tag.name} Articles`,
        numberOfItems: articles.length,
        itemListElement: articles.map((article, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteUrl}/blog/${article.slug}`,
          name: article.title,
        })),
      },
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: `#${tag.name}`, item: `${siteUrl}/blog/tag/${slug}` },
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
        {/* Breadcrumbs */}
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
            <li className="text-ink">#{tag.name}</li>
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
                    <time dateTime={article.published_at ?? undefined}>
                      {new Date(
                        article.published_at ?? article.created_at ?? Date.now(),
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    {article.category && (
                      <>
                        <span className="text-muted">·</span>
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
    </>
  );
}
