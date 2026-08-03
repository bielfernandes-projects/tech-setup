import Link from "next/link";
import { notFound } from "next/navigation";
import { articleRepository } from "@/lib/articles";
import { site, siteUrl } from "@/lib/site";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await articleRepository.listCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await articleRepository.findCategoryBySlug(slug);
  if (!category) return { title: "Not Found" };

  return {
    title: `${category.name} — Developer Guides & Tutorials`,
    description: `Browse our latest ${category.name} articles — practical guides, tutorials, and troubleshooting tips for developers.`,
    alternates: {
      canonical: siteUrl(`/blog/category/${slug}`),
    },
  };
}

const categoryDescriptions: Record<string, string> = {
  troubleshooting: "Step-by-step guides to diagnose and fix common developer issues with software, hardware, and network configurations.",
  "discord-bots": "Tutorials for building, deploying, and managing Discord bots with Node.js, discord.js, and slash commands.",
  "windows-setup": "Guides for configuring Windows development environments, from WSL to terminal setup and driver management.",
  "ai-development": "Practical guides for building with AI — RAG pipelines, prompt engineering, LLM integration, and vibe coding.",
  linux: "Linux server administration, Docker setup, and command-line workflows for developers.",
  devops: "CI/CD pipelines, container orchestration, deployment automation, and infrastructure best practices.",
  "home-automation": "Smart home dashboards, Home Assistant setup, IoT integrations, and home automation workflows.",
  automation: "Workflow automation with n8n, Make.com, Power Automate, and API integration guides for developers.",
  web3: "Smart contracts, Ethereum tooling, and decentralized application development for web developers.",
  programming: "Programming language guides, tooling, and code quality practices for everyday development.",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await articleRepository.findCategoryBySlug(slug);
  if (!category) notFound();

  const articles = await articleRepository.findByCategory(slug);
  const description = categoryDescriptions[slug] ?? `Explore our ${category.name} articles for developers.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} — Developer Guides`,
    description,
    url: siteUrl(`/blog/category/${slug}`),
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: siteUrl(),
    },
    ...(articles.length > 0 && {
      mainEntity: {
        "@type": "ItemList",
        name: `${category.name} Articles`,
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
      { "@type": "ListItem", position: 3, name: category.name, item: siteUrl(`/blog/category/${slug}`) },
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
            <li aria-current="page" className="text-ink">{category.name}</li>
          </ol>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {category.name}
          </h1>
          <p className="mt-3 text-muted leading-relaxed max-w-xl">
            {description}
          </p>
          <p className="mt-2 text-sm text-muted">
            {articles.length} {articles.length === 1 ? "article" : "articles"}
          </p>
        </header>

        {articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted text-lg">No articles in this category yet.</p>
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
