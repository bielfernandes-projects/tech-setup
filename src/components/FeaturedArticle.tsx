import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";
import { readingTime } from "@/lib/reading-time";

function formatDate(dateStr: string | null, fallback?: string): string {
  const d = new Date(dateStr ?? fallback ?? "");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface FeaturedArticleProps {
  article: Article;
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  const readTime = article.content ? readingTime(article.content) : null;

  return (
    <article className="group relative rounded-xl border border-border bg-surface overflow-hidden">
      {article.hero_image_url && (
        <Link href={`/blog/${article.slug}`} className="block">
          <div className="relative aspect-[16/9] sm:aspect-[2/1] overflow-hidden">
            <Image
              src={article.hero_image_url}
              alt={article.title}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 900px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/20 to-transparent" />
          </div>
        </Link>
      )}
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2 text-sm text-muted mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Featured
          </span>
          {article.category && (
            <Link
              href={`/blog/category/${article.category.slug}`}
              className="hover:text-primary transition-colors"
            >
              {article.category.name}
            </Link>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={article.published_at ?? undefined}>
            {formatDate(article.published_at, article.created_at)}
          </time>
          {readTime && (
            <>
              <span aria-hidden="true">·</span>
              <span>{readTime} min read</span>
            </>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug mb-3 text-balance">
          <Link
            href={`/blog/${article.slug}`}
            className="hover:text-primary transition-colors"
          >
            {article.title}
          </Link>
        </h2>
        {article.excerpt && (
          <p className="text-muted leading-relaxed max-w-2xl">
            {article.excerpt}
          </p>
        )}
        <Link
          href={`/blog/${article.slug}`}
          className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          Read article
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
