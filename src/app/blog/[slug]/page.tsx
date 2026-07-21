import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { articleRepository } from "@/lib/articles";
import MarkdownContent from "@/lib/markdown-content";
import { site, siteUrl } from "@/lib/site";

export async function generateStaticParams() {
  const slugs = await articleRepository.listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await articleRepository.findBySlug(slug);

  if (!article) return { title: "Not Found" };

  const url = siteUrl(`/blog/${article.slug}`);
  const image = article.hero_image_url ?? siteUrl(site.ogImage);

  return {
    title: article.title,
    description: article.excerpt ?? article.title,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt ?? article.title,
      url,
      siteName: "Tech Setup",
      type: "article",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at ?? undefined,
      authors: ["Tech Setup"],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt ?? article.title,
      images: [image],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await articleRepository.findBySlug(slug);

  if (!article) notFound();

  const related = await articleRepository.findRelated(article.id, article.category?.slug ?? null, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.hero_image_url ?? `${siteUrl}/opengraph-image`,
    url: siteUrl(`/blog/${article.slug}`),
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at ?? article.published_at ?? article.created_at,
    author: {
      "@type": "Organization",
      name: site.name,
      url: siteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: siteUrl(),
      logo: {
        "@type": "ImageObject",
        url: siteUrl(site.icon),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${article.slug}`,
    },
    ...(article.category && {
      about: {
        "@type": "Thing",
        name: article.category.name,
      },
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Blog", item: siteUrl("/blog") },
      ...(article.category
        ? [{ "@type": "ListItem", position: 3, name: article.category.name, item: siteUrl(`/blog/category/${article.category.slug}`) }]
        : []),
      {
        "@type": "ListItem",
        position: article.category ? 4 : 3,
        name: article.title,
        item: siteUrl(`/blog/${article.slug}`),
      },
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

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="text-sm text-muted mb-8" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            {article.category && (
              <>
                <li>
                  <Link
                    href={`/blog/category/${article.category.slug}`}
                    className="hover:text-ink transition-colors"
                  >
                    {article.category.name}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
              </>
            )}
            <li className="text-ink truncate max-w-[200px]">{article.title}</li>
          </ol>
        </nav>

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
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span>Tech Setup</span>
            <span aria-hidden="true">·</span>
            <time
              dateTime={article.published_at ?? undefined}
            >
              {new Date(article.published_at ?? article.created_at ?? Date.now()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
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
                    <time dateTime={rel.published_at ?? undefined}>
                      {new Date(rel.published_at ?? rel.created_at ?? Date.now()).toLocaleDateString("en-US", {
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
    </>
  );
}
