#!/usr/bin/env tsx
/**
 * scripts/consolidate-categories.ts
 *
 * Merges thin/single-topic categories into their umbrella category:
 *   windows      → windows-setup
 *   iot          → home-automation
 *   vibecoding   → ai-development
 *
 * For each mapping present in the DB, reassigns every article's category_id
 * to the target and deletes the source category.
 *
 * Usage:
 *   npx tsx scripts/consolidate-categories.ts            # dry run (report only)
 *   npx tsx scripts/consolidate-categories.ts --apply    # apply
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

const MAPPING: Record<string, string> = {
  windows: "windows-setup",
  iot: "home-automation",
  vibecoding: "ai-development",
};

async function main() {
  if (!APPLY) console.log("🔍 DRY RUN — no changes will be made\n");

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (catError) throw new Error(`Failed to fetch categories: ${catError.message}`);

  const bySlug = new Map((categories ?? []).map((c) => [c.slug, c]));
  console.log(`📁 Categories in DB: ${bySlug.size}`);

  let totalMoved = 0;
  const performed = [];

  for (const [source, target] of Object.entries(MAPPING)) {
    const src = bySlug.get(source);
    const tgt = bySlug.get(target);

    if (!src) {
      console.log(`\n⏭  Category "${source}" not found — skipping`);
      continue;
    }
    if (!tgt) {
      console.log(`\n⏭  Target "${target}" for "${source}" not found — skipping`);
      continue;
    }

    const { count, error: countError } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("category_id", src.id);

    if (countError) throw new Error(`Failed to count ${source}: ${countError.message}`);

    console.log(`\n── ${source} (${count} article(s)) → ${target}`);

    if (APPLY && (count ?? 0) > 0) {
      const { error: updateError } = await supabase
        .from("articles")
        .update({ category_id: tgt.id })
        .eq("category_id", src.id);

      if (updateError) {
        console.error(`   ❌ Failed to reassign articles: ${updateError.message}`);
        continue;
      }
    }

    totalMoved += count ?? 0;

    if (APPLY) {
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", src.id);

      if (deleteError) {
        console.error(`   ❌ Failed to delete "${source}": ${deleteError.message}`);
        continue;
      }
      console.log(`   ✅ Reassigned ${count} article(s) and deleted "${source}"`);
    } else {
      console.log(`   Would reassign ${count} article(s) and delete "${source}"`);
    }

    performed.push(source);
  }

  console.log(`\n📋 Total articles to move: ${totalMoved}`);

  if (!APPLY) {
    console.log("\n🔍 DRY RUN — re-run with --apply to consolidate these categories.");
    return;
  }

  console.log("\n─── Done ──────────────────────────────────────────────────");
  console.log(`Consolidated: ${performed.join(", ") || "nothing"}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
