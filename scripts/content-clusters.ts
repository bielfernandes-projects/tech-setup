#!/usr/bin/env tsx
/**
 * scripts/content-clusters.ts
 *
 * Content cluster strategy — single source of truth for what gets created
 * and published first.
 *
 * Based on the Vercel Analytics baseline of 2026-08-10: the only pages
 * receiving organic Google clicks are Discord troubleshooting, AI dev tools,
 * and Windows setup/troubleshooting. Priority clusters should dominate the
 * topic pool (generate-article.ts) and get scheduled first (schedule-articles.ts).
 */

export interface ContentCluster {
  name: string;
  /** Weight in % of the topic-generation budget (higher = more topics). */
  weight: number;
  /** Canonical categories that belong to this cluster. */
  categories: string[];
  /** One-line guidance for the refill prompt. */
  focus: string;
}

export const CONTENT_CLUSTERS: ContentCluster[] = [
  {
    name: "Discord troubleshooting & bots",
    weight: 40,
    categories: ["Discord Bots", "Troubleshooting"],
    focus:
      "real problems developers hit with Discord audio, voice, screen share and bots on Windows — concrete symptoms and fixes",
  },
  {
    name: "AI development tools",
    weight: 30,
    categories: ["AI & Development"],
    focus:
      "hands-on workflows with AI coding CLIs and app builders (OpenCode, Claude Code, Cursor, Lovable, Codex, Copilot)",
  },
  {
    name: "Windows setup & troubleshooting",
    weight: 20,
    categories: ["Windows Setup", "Troubleshooting", "Linux"],
    focus:
      "concrete Windows 11 development setup and fix guides, including WSL2 and the terminal",
  },
  {
    name: "Core development (fill)",
    weight: 10,
    categories: ["Programming", "Automation", "DevOps", "Web3", "Home Automation"],
    focus:
      "only after the priority clusters — specific, answerable developer tasks",
  },
];

/** Canonical categories (exact names, as upserted in the DB). */
export const VALID_CATEGORIES = [
  "AI & Development",
  "Automation",
  "DevOps",
  "Discord Bots",
  "Home Automation",
  "Linux",
  "Programming",
  "Troubleshooting",
  "Web3",
  "Windows Setup",
];

/**
 * Cluster priority for a category NAME (as used in topics.json).
 * Lower number = generated first in batch / scheduled first.
 */
export function clusterPriority(category: string): number {
  const idx = CONTENT_CLUSTERS.findIndex((c) => c.categories.includes(category));
  return idx === -1 ? CONTENT_CLUSTERS.length : idx;
}

/** Cluster priority for a category SLUG (as used in the DB). */
export const CATEGORY_SLUG_PRIORITY: Record<string, number> = {
  "discord-bots": 0,
  troubleshooting: 1,
  "ai-development": 2,
  "windows-setup": 3,
  linux: 4,
  programming: 5,
  automation: 6,
  devops: 7,
  web3: 8,
  "home-automation": 9,
};

type CategoryEmbed =
  | { slug?: string }
  | { slug?: string }[]
  | null
  | undefined;

/**
 * Extracts the category slug from a Supabase embedded relation.
 * The embed can come back as an object (many-to-one) or an array,
 * depending on the API version / relation cardinality.
 */
export function embeddedCategorySlug(cat: CategoryEmbed): string {
  if (Array.isArray(cat)) return cat[0]?.slug ?? "";
  return cat?.slug ?? "";
}

/** Cluster priority of an article row carrying a `categories` embed. */
export function clusterPriorityOf(cat: CategoryEmbed): number {
  return CATEGORY_SLUG_PRIORITY[embeddedCategorySlug(cat)] ?? 99;
}
