import Link from "next/link";
import { categoryMeta } from "@/lib/article-data";
import type { Category } from "@/lib/types";

interface CategoryGridProps {
  categories: Category[];
  counts?: Record<string, number>;
}

export default function CategoryGrid({
  categories,
  counts,
}: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {categories.map((cat) => {
        const meta = categoryMeta[cat.slug];
        const count = counts?.[cat.slug] ?? 0;
        return (
          <Link
            key={cat.slug}
            href={`/blog/category/${cat.slug}`}
            className="group rounded-lg border border-border bg-surface p-4 hover:border-primary/50 transition-colors"
          >
            {meta?.Icon && (
              <div className="h-9 w-9 rounded-md bg-primary/15 flex items-center justify-center text-primary mb-2.5">
                <meta.Icon className="h-[18px] w-[18px]" />
              </div>
            )}
            <h3 className="font-semibold text-sm text-ink">
              {cat.name}
            </h3>
            {meta?.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                {meta.description}
              </p>
            )}
            <p className="text-xs text-muted/60 mt-2">
              {count} {count === 1 ? "article" : "articles"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
