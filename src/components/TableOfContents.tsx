"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractHeadings(): TocItem[] {
  const article = document.querySelector("article");
  if (!article) return [];
  const headings = article.querySelectorAll("h2, h3");
  return Array.from(headings).map((el) => ({
    id: el.id || slugify(el.textContent ?? ""),
    text: el.textContent ?? "",
    level: Number(el.tagName.charAt(1)),
  }));
}

export default function TableOfContents() {
  const [activeId, setActiveId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [headings, setHeadings] = useState<TocItem[]>([]);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    function init() {
      const items = extractHeadings();
      if (items.length === 0) return;
      setHeadings(items);

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          }
        },
        { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
      );

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      }
    }

    requestAnimationFrame(init);

    return () => observer?.disconnect();
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="hidden xl:block">
      <button
        onClick={() => setOpen(!open)}
        className="xl:hidden text-sm font-medium text-muted hover:text-ink transition-colors mb-2"
      >
        {open ? "Hide" : "Show"} table of contents
      </button>
      <div className={`${open ? "block" : "hidden"} xl:block`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted/60 mb-3">
          On this page
        </p>
        <ul className="space-y-1.5 border-l border-border">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block text-sm leading-snug transition-colors border-l -ml-px ${
                  h.level === 3 ? "pl-6" : "pl-4"
                } ${
                  activeId === h.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
