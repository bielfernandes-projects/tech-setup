#!/usr/bin/env tsx
/**
 * scripts/dedupe-articles.ts
 *
 * Finds near-duplicate articles (published + scheduled) by token similarity
 * and proposes a single canonical per group. Non-canonicals are unpublished
 * (status → 'draft').
 *
 * Usage:
 *   npx tsx scripts/dedupe-articles.ts            # dry run (report only)
 *   npx tsx scripts/dedupe-articles.ts --apply    # apply (unpublish non-canonicals)
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as path from "path";

config({ path: path.resolve(__dirname, "../.env.local") });

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const APPLY = process.argv.includes("--apply");

// ─── Tokenization ─────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "how", "to", "a", "an", "the", "and", "for", "with", "using", "use",
  "in", "on", "of", "your", "guide", "guides", "setup", "set", "setting",
  "settings", "sett", "up", "developer", "developers", "dev", "devs",
  "complete", "comprehensive", "quick", "fast", "ultimate", "simple",
  "easy", "tutorial", "pro", "professional", "from", "scratch", "step",
  "by", "begin", "beginner", "friendly", "local", "master", "mastering",
  "get", "started", "fix", "fixing", "fixes", "build", "building", "vs",
  "like", "modern", "workflow", "minute", "minutes", "window", "windows",
  "11", "10", "not", "working", "works", "issue", "issues", "problem",
  "problems", "js", "code", "codes", "automation", "choose", "choosing",
  "right", "here", "is", "complete",
]);

// Light stemming for comparison only ("configuring" ≈ "configure").
function stem(token: string): string {
  return token.replace(/(ing|ers|es|ed|s)$/, "");
}

function significantTokens(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[?!]/g, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

// Levenshtein distance — used to absorb stemmer inconsistencies
// ("configure"/"configuring", "debug"/"debugging", "apps"/"app").
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1).fill(0);
  const curr = new Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return curr[n];
}

function fuzzyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.max(a.length, b.length) < 4) return false;
  return levenshtein(a, b) <= 1;
}

function isDuplicatePair(a: string[], b: string[]): boolean {
  // Greedy 1-to-1 fuzzy matching between the token lists.
  const used = new Set<number>();
  let shared = 0;
  for (const ta of a) {
    for (let i = 0; i < b.length; i++) {
      if (!used.has(i) && fuzzyEqual(ta, b[i])) {
        used.add(i);
        shared++;
        break;
      }
    }
  }

  // Identical topic tokens = same article, even if it's a single noun.
  if (shared === a.length && a.length === b.length) return true;
  // Otherwise require a substantial overlap penalizing extra tokens.
  return shared / (a.length + b.length - shared) >= 0.6;
}

// ─── Union-Find ───────────────────────────────────────────────────────────────

class UnionFind {
  parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: number, b: number) {
    this.parent[this.find(a)] = this.find(b);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  content?: string | null;
}

// Prefer a published canonical; among the same status pick the longest content.
function pickCanonical(group: ArticleRow[]): ArticleRow {
  return [...group].sort((a, b) => {
    const aPub = a.status === "published" ? 1 : 0;
    const bPub = b.status === "published" ? 1 : 0;
    if (aPub !== bPub) return bPub - aPub;
    return (b.content?.length ?? 0) - (a.content?.length ?? 0);
  })[0];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!APPLY) console.log("🔍 DRY RUN — no changes will be made\n");

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, status, published_at, content")
    .in("status", ["published", "scheduled"]);

  if (error) throw new Error(`Failed to fetch articles: ${error.message}`);

  const articles = (data ?? []) as ArticleRow[];
  console.log(`📄 Articles fetched (published + scheduled): ${articles.length}\n`);

  const tokens = articles.map((a) => significantTokens(a.title));

  const uf = new UnionFind(articles.length);
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      if (tokens[i].length < 2 || tokens[j].length < 2) {
        // Only treat as duplicate when both titles collapse to the SAME
        // single token ("PostgreSQL Setup Guide" ~ "PostgreSQL on Windows 11").
        const single =
          tokens[i].length === 1 && tokens[j].length === 1 && tokens[i][0] === tokens[j][0];
        if (!single) continue;
      }
      if (isDuplicatePair(tokens[i], tokens[j])) {
        uf.union(i, j);
        if (process.argv.includes("--debug")) {
          console.log(`  🔗 ${articles[i].title}  ~  ${articles[j].title}`);
        }
      }
    }
  }

  // Group indices by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < articles.length; i++) {
    const root = uf.find(i);
    const arr = groups.get(root) ?? [];
    arr.push(i);
    groups.set(root, arr);
  }

  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  if (dupGroups.length === 0) {
    console.log("✅ No near-duplicate groups found.");
    return;
  }

  console.log(`⚠️  Found ${dupGroups.length} near-duplicate group(s)\n`);

  const toUnpublish: { id: string; title: string }[] = [];

  for (const groupIdx of dupGroups.sort((a, b) => b.length - a.length)) {
    const group = groupIdx.map((i) => articles[i]);
    const canonical = pickCanonical(group);
    const others = group.filter((a) => a.id !== canonical.id);

    console.log(`── Group (${group.length}) ───────────────────────────────────`);
    console.log(`   ✓ CANONICAL: [${canonical.status}] ${canonical.title}`);
    for (const o of others) {
      console.log(`   ✗ UNPUBLISH: [${o.status}] ${o.title}`);
      toUnpublish.push({ id: o.id, title: o.title });
    }
    console.log("");
  }

  console.log(`📋 Total to unpublish: ${toUnpublish.length}`);

  if (!APPLY) {
    console.log("\n🔍 DRY RUN — re-run with --apply to unpublish these articles.");
    return;
  }

  for (const item of toUnpublish) {
    const { error: updateErr } = await supabase
      .from("articles")
      .update({ status: "draft" })
      .eq("id", item.id);

    if (updateErr) {
      console.error(`   ❌ Failed to unpublish "${item.title}": ${updateErr.message}`);
    } else {
      console.log(`   ✅ Unpublished: "${item.title}"`);
    }
  }

  console.log("\n─── Done ──────────────────────────────────────────────────");
  console.log(`${toUnpublish.length} article(s) set to draft.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
