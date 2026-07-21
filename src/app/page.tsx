import { articleRepository } from "@/lib/articles";
import { site, siteUrl } from "@/lib/site";
import FeaturedArticle from "@/components/FeaturedArticle";
import ArticleCard from "@/components/ArticleCard";
import CategoryChips from "@/components/CategoryChips";
import CategoryGrid from "@/components/CategoryGrid";

export const revalidate = 60;

export default async function Home() {
  const [articles, categories] = await Promise.all([
    articleRepository.findPublished(20),
    articleRepository.listCategories(),
  ]);

  const featured = articles[0] ?? null;
  const rest = featured ? articles.slice(1) : articles;
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: siteUrl(),
    description: site.description,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: siteUrl(),
      logo: {
        "@type": "ImageObject",
        url: siteUrl(site.icon),
      },
    },
    ...(articles.length > 0 && {
      mainEntity: {
        "@type": "ItemList",
        name: "Latest Articles",
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
            {site.name}
          </h1>
          <p className="mt-3 text-lg text-muted max-w-xl leading-relaxed">
            {site.description}
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted/70">
            <span>{totalCount} guides published</span>
            <span aria-hidden="true">·</span>
            <span>{categories.length} topics covered</span>
          </div>
        </header>

        {/* Category chips */}
        {categories.length > 0 && (
          <section className="mb-10" aria-label="Browse by topic">
            <CategoryChips categories={categories} counts={Object.fromEntries(categories.map((c) => [c.slug, c.count]))} />
          </section>
        )}

        {/* Featured article */}
        {featured && (
          <section className="mb-14" aria-label="Featured article">
            <FeaturedArticle article={featured} />
          </section>
        )}

        {/* Category grid */}
        {categories.length > 0 && (
          <section className="mb-14" aria-label="Browse categories">
            <h2 className="text-lg font-semibold mb-4">Browse by category</h2>
            <CategoryGrid categories={categories} counts={Object.fromEntries(categories.map((c) => [c.slug, c.count]))} />
          </section>
        )}

        {/* Article list */}
        <section aria-label="All articles">
          <h2 className="text-lg font-semibold mb-6">Latest articles</h2>
          {rest.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted text-lg">No articles published yet.</p>
              <p className="text-muted/60 text-sm mt-2">Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-14">
              {rest.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
