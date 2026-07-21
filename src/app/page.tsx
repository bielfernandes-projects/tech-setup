import Link from "next/link";
import Image from "next/image";
import { getRecentArticles } from "@/lib/mdx";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await getRecentArticles(20);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-balance">
          Tech Setup
        </h1>
        <p className="mt-3 text-lg text-muted max-w-xl">
          Practical guides for developers — troubleshooting, setup, and tools.
        </p>
      </header>

      <section>
        {articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted text-lg">No articles published yet.</p>
            <p className="text-muted/60 text-sm mt-2">Check back soon.</p>
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
      </section>
    </div>
  );
}
