import Link from "next/link";

const MOCK_ARTICLES = [
  {
    slug: "how-to-fix-discord-audio-echo",
    title: "How to Fix Discord Audio Echo in 3 Steps",
    category: "Troubleshooting",
    excerpt:
      "Echo in Discord voice channels is almost always a device conflict. Here's how to isolate and fix it fast.",
    publishedAt: "2026-07-18",
  },
  {
    slug: "setup-nextjs-supabase-blog",
    title: "Setting Up a Next.js Blog with Supabase",
    category: "Setup",
    excerpt:
      "A step-by-step walkthrough to connect Next.js App Router to Supabase PostgreSQL, ISR, and deploy on Vercel.",
    publishedAt: "2026-07-15",
  },
  {
    slug: "discord-bot-nodejs-guide",
    title: "Building Your First Discord Bot with Node.js",
    category: "Discord Bots",
    excerpt:
      "From app registration to slash commands — everything you need to ship a Discord bot today.",
    publishedAt: "2026-07-12",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header className="mb-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tech Setup
        </h1>
        <p className="mt-2 text-lg text-zinc-600">
          Practical guides for developers — troubleshooting, setup, and tools.
        </p>
      </header>

      <section>
        <div className="space-y-12">
          {MOCK_ARTICLES.map((article) => (
            <article key={article.slug}>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                  <span className="text-zinc-300">/</span>
                  <Link
                    href={`/blog/category/${article.category.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-zinc-900 transition-colors"
                  >
                    {article.category}
                  </Link>
                </div>
                <h2 className="text-xl font-semibold leading-snug">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="hover:text-zinc-600 transition-colors"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
