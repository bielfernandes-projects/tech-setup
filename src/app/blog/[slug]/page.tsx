import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { articleRepository } from "@/lib/articles";
import MarkdownContent from "@/lib/markdown-content";
import { site, siteUrl } from "@/lib/site";
import { readingTime } from "@/lib/reading-time";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import AuthorByline from "@/components/AuthorByline";

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

  const related = await articleRepository.findRelated(
    article.id,
    article.category?.slug ?? null,
    3,
  );

  const readTime = article.content ? readingTime(article.content) : null;

  const showUpdated =
    article.updated_at &&
    article.published_at &&
    new Date(article.updated_at).getTime() -
      new Date(article.published_at).getTime() >
      7 * 24 * 60 * 60 * 1000;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.hero_image_url ?? siteUrl("/opengraph-image"),
    url: siteUrl(`/blog/${article.slug}`),
    inLanguage: "en-US",
    datePublished: article.published_at ?? article.created_at,
    dateModified:
      article.updated_at ?? article.published_at ?? article.created_at,
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
      "@id": siteUrl(`/blog/${article.slug}`),
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
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: siteUrl("/blog"),
      },
      ...(article.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: article.category.name,
              item: siteUrl(`/blog/category/${article.category.slug}`),
            },
          ]
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
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex gap-12">
          {/* Main content */}
          <article className="max-w-3xl min-w-0 flex-1">
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
                <li aria-current="page" className="text-ink truncate max-w-[200px]">
                  {article.title}
                </li>
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
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                <Link href="/about" className="hover:text-primary transition-colors">
                  Tech Setup
                </Link>
                <span aria-hidden="true">·</span>
                <time dateTime={article.published_at ?? undefined}>
                  {new Date(
                    article.published_at ?? article.created_at ?? "",
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {readTime && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{readTime} min read</span>
                  </>
                )}
                {showUpdated && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-primary/80">
                      Updated{" "}
                      {new Date(article.updated_at!).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-4">
                <AuthorByline
                  publishedAt={article.published_at}
                  createdAt={article.created_at}
                />
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

            {article.content && <MarkdownContent content={article.content} />}

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
                    <article key={rel.slug} className="group flex gap-4">
                      {rel.hero_image_url && (
                        <Link
                          href={`/blog/${rel.slug}`}
                          className="shrink-0"
                        >
                          <div className="relative h-20 w-28 rounded-md overflow-hidden bg-surface">
                            <Image
                              src={rel.hero_image_url}
                              alt={rel.title}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </div>
                        </Link>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted mb-1">
                          <time dateTime={rel.published_at ?? undefined}>
                            {new Date(
                              rel.published_at ?? rel.created_at ?? "",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                          {rel.category && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{rel.category.name}</span>
                            </>
                          )}
                        </div>
                        <h3 className="font-medium text-sm leading-snug">
                          <Link
                            href={`/blog/${rel.slug}`}
                            className="hover:text-primary transition-colors"
                          >
                            {rel.title}
                          </Link>
                        </h3>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* TOC sidebar */}
          <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-20">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
