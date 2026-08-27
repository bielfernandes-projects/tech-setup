#!/usr/bin/env tsx
/**
 * scripts/reschedule-scheduled.ts
 *
 * One-off: re-flows every currently scheduled article onto one per calendar
 * day starting tomorrow, each at a randomized time of day (06:00–22:59 UTC).
 * Order is re-ranked by cluster priority (what gets clicks publishes first),
 * then by original scheduled date within the same cluster.
 *
 * Usage:
 *   npx tsx scripts/reschedule-scheduled.ts          # dry run (report only)
 *   npx tsx scripts/reschedule-scheduled.ts --apply  # apply
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import { clusterPriorityOf } from "./content-clusters";

config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const APPLY = process.argv.includes("--apply");

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function randomTimeISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hour = 6 + Math.floor(Math.random() * 17);
  const minute = Math.floor(Math.random() * 60);
  return `${y}-${m}-${d}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+00:00`;
}

async function main() {
  if (!APPLY) console.log("🔍 DRY RUN — no changes will be made\n");

  const { data: scheduled, error } = await supabase
    .from("articles")
    .select("id, title, slug, published_at, categories(slug)")
    .eq("status", "scheduled")
    .not("published_at", "is", null)
    .order("published_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch scheduled articles: ${error.message}`);

  const rows = (scheduled ?? []).sort((a, b) => {
    const pa = clusterPriorityOf(a.categories);
    const pb = clusterPriorityOf(b.categories);
    if (pa !== pb) return pa - pb;
    return new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
  });
  console.log(`📅 Scheduled articles: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log("✅ Nothing to reschedule.");
    return;
  }

  const start = addDaysUTC(toStartOfDayUTC(new Date()), 1);

  for (let i = 0; i < rows.length; i++) {
    const date = addDaysUTC(start, i);
    const iso = randomTimeISO(date);
    console.log(`   [${rows[i].published_at?.slice(0, 10)} → ${iso}] ${rows[i].title}`);

    if (APPLY) {
      const { error: updateError } = await supabase
        .from("articles")
        .update({ published_at: iso })
        .eq("id", rows[i].id);
      if (updateError) {
        console.error(`   ❌ Failed: ${updateError.message}`);
      }
    }
  }

  console.log(`\n📋 New range: ${addDaysUTC(start, 0).toISOString().slice(0, 10)} → ${addDaysUTC(start, rows.length - 1).toISOString().slice(0, 10)}`);

  if (!APPLY) {
    console.log("\n🔍 DRY RUN — re-run with --apply to reschedule these articles.");
    return;
  }

  console.log("\n─── Done ──────────────────────────────────────────────────");
  console.log(`Rescheduled ${rows.length} article(s), one per day.`);
}

function toStartOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
