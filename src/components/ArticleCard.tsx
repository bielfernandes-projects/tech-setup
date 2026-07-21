import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";

function formatDate(dateStr: string | null, fallback?: string): string {
  const d = new Date(dateStr ?? fallback ?? "");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ArticleCardProps {
  article: Article;
  showExcerpt?: boolean;
}

export default function ArticleCard({
  article,
  showExcerpt = true,
}: ArticleCardProps) {
  return (
    <article className="group">
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
            {formatDate(
              article.published_at,
              article.created_at,
            )}
          </time>
          {article.category && (
            <>
              <span aria-hidden="true">·</span>
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
        {showExcerpt && article.excerpt && (
          <p className="text-muted leading-relaxed">{article.excerpt}</p>
        )}
      </div>
    </article>
  );
}
