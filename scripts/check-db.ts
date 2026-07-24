#!/usr/bin/env tsx
/**
 * scripts/check-db.ts
 * Quick database state check — articles, categories, tags counts.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Articles by status
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false });

  const byStatus: Record<string, number> = {};
  for (const a of articles ?? []) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  }

  console.log(`\n📊 Articles total: ${articles?.length ?? 0}`);
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`   ${status}: ${count}`);
  }

  // Recent published
  const published = articles?.filter((a) => a.status === "published") ?? [];
  console.log(`\n📰 Published (${published.length}):`);
  for (const a of published.slice(0, 10)) {
    console.log(`   - ${a.title} (${a.published_at?.slice(0, 10)})`);
  }
  if (published.length > 10) console.log(`   ... and ${published.length - 10} more`);

  // Scheduled
  const scheduled = articles?.filter((a) => a.status === "scheduled") ?? [];
  console.log(`\n📅 Scheduled (${scheduled.length}):`);
  for (const a of scheduled) {
    console.log(`   - ${a.title} → ${a.published_at?.slice(0, 10)}`);
  }

  // Categories
  const { data: categories } = await supabase.from("categories").select("id, name, slug");
  console.log(`\n📁 Categories (${categories?.length ?? 0}):`);
  for (const c of categories ?? []) {
    console.log(`   - ${c.name} (${c.slug})`);
  }

  // Tags
  const { count: tagCount } = await supabase.from("tags").select("id", { count: "exact", head: true });
  console.log(`\n🏷️  Tags: ${tagCount ?? 0}`);
}

main().catch(console.error);
