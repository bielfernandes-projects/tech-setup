import Link from "next/link";
import { categoryMeta } from "@/lib/article-data";
import type { Category } from "@/lib/types";

interface CategoryChipsProps {
  categories: Category[];
  counts?: Record<string, number>;
}

export default function CategoryChips({
  categories,
  counts,
}: CategoryChipsProps) {
  const top = categories.slice(0, 8);
  if (top.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {top.map((cat) => {
        const meta = categoryMeta[cat.slug];
        const count = counts?.[cat.slug];
        return (
          <Link
            key={cat.slug}
            href={`/blog/category/${cat.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-sm text-muted hover:border-primary transition-colors"
          >
            {meta?.Icon && <meta.Icon className="h-3.5 w-3.5" />}
            <span>{cat.name}</span>
            {count !== undefined && (
              <span className="text-xs text-muted/60">{count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
