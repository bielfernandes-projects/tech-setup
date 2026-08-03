#!/usr/bin/env tsx
/**
 * scripts/prune-tags.ts
 *
 * Removes thin tag pages. A tag is kept only if it is attached to at least
 * MIN_PUBLISHED published articles; otherwise the tag row and all its
 * article_tags links are deleted (dead weight / factory-signal tag pages).
 *
 * Usage:
 *   npx tsx scripts/prune-tags.ts            # dry run (report only)
 *   npx tsx scripts/prune-tags.ts --apply    # apply
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
const MIN_PUBLISHED = 3;

interface TagRow {
  id: string;
  slug: string;
  pub: number;
  total: number;
}

async function main() {
  if (!APPLY) console.log("🔍 DRY RUN — no changes will be made\n");

  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .select("id, slug");

  if (tagError) throw new Error(`Failed to fetch tags: ${tagError.message}`);

  const rows: TagRow[] = [];
  for (const t of tags ?? []) {
    const { data: links } = await supabase
      .from("article_tags")
      .select("articles!inner(status)")
      .eq("tag_id", t.id);

    const total = links?.length ?? 0;
    const pub = (links ?? []).filter((l) => l.articles.status === "published").length;
    rows.push({ id: t.id, slug: t.slug, pub, total });
  }

  const pruned = rows.filter((r) => r.pub < MIN_PUBLISHED);
  const kept = rows.filter((r) => r.pub >= MIN_PUBLISHED).sort((a, b) => b.pub - a.pub);

  console.log(`🏷️  Tags total: ${rows.length}`);
  console.log(`   Keep (≥${MIN_PUBLISHED} published): ${kept.length}`);
  console.log(`   Prune: ${pruned.length}\n`);

  console.log(`── KEEP ─────────────────────────────────────────────────`);
  for (const r of kept) {
    console.log(`   ${r.slug.padEnd(28)} ${String(r.pub).padStart(2)} published / ${r.total} total`);
  }

  console.log(`\n── PRUNE (${pruned.length}) ──────────────────────────────`);
  for (const r of [...pruned].sort((a, b) => b.pub - a.pub || b.total - a.total)) {
    console.log(`   ${r.slug.padEnd(28)} ${String(r.pub).padStart(2)} published / ${r.total} total`);
  }

  if (!APPLY) {
    console.log("\n🔍 DRY RUN — re-run with --apply to delete these tags.");
    return;
  }

  const ids = pruned.map((r) => r.id);
  const { error: linkError } = await supabase
    .from("article_tags")
    .delete()
    .in("tag_id", ids);
  if (linkError) throw new Error(`Failed to delete article_tags: ${linkError.message}`);

  const { error: deleteError } = await supabase.from("tags").delete().in("id", ids);
  if (deleteError) throw new Error(`Failed to delete tags: ${deleteError.message}`);

  console.log("\n─── Done ──────────────────────────────────────────────────");
  console.log(`Deleted ${pruned.length} tag(s) and their article links.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
