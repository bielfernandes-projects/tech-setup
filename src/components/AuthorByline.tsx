import Link from "next/link";
import { site } from "@/lib/site";

interface AuthorBylineProps {
  publishedAt: string | null;
  createdAt?: string;
}

export default function AuthorByline({
  publishedAt,
  createdAt,
}: AuthorBylineProps) {
  const date = new Date(publishedAt ?? createdAt ?? "");
  const formatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
        TS
      </div>
      <div>
        <p className="text-sm font-medium text-ink">
          <Link href="/about" className="hover:text-primary transition-colors">
            {site.author.name}
          </Link>
        </p>
        <p className="text-xs text-muted">
          Published {formatted} ·{" "}
          <Link
            href="/editorial-policy"
            className="hover:text-primary transition-colors"
          >
            Editorial policy
          </Link>
        </p>
      </div>
    </div>
  );
}
