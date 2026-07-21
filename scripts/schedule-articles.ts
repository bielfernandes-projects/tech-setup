#!/usr/bin/env tsx
/**
 * scripts/schedule-articles.ts
 *
 * Schedules up to N articles (default 3) per day.
 * Prioritizes articles with hero images.
 * Fills existing days before moving to the next.
 *
 * Usage:
 *   npx tsx scripts/schedule-articles.ts              # schedule up to 3
 *   npx tsx scripts/schedule-articles.ts --count 5    # schedule up to 5
 *   npx tsx scripts/schedule-articles.ts --dry-run    # simulate only
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";

config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const countIdx = args.indexOf("--count");
const maxArticles = countIdx !== -1 ? parseInt(args[countIdx + 1]) || 3 : 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStartOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00+00:00`;
}

function formatDateShort(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (dryRun) console.log("🔍 DRY RUN — no changes will be made\n");

  // 1. Find candidate articles (draft/in_review, with hero image)
  const { data: candidates, error: candErr } = await supabase
    .from("articles")
    .select("id, title, slug, hero_image_url, created_at, status")
    .in("status", ["draft", "in_review"])
    .not("hero_image_url", "is", null)
    .neq("hero_image_url", "")
    .order("created_at", { ascending: true });

  if (candErr) throw new Error(`Failed to fetch candidates: ${candErr.message}`);

  const available = candidates ?? [];
  console.log(`📋 Candidates with hero image: ${available.length}`);

  if (available.length === 0) {
    console.log("✅ Nothing to schedule.");
    return;
  }

  const toSchedule = available.slice(0, maxArticles);
  console.log(`🎯 Selecting: ${toSchedule.length} article(s)\n`);

  // 2. Get existing scheduled/published articles grouped by date
  const { data: existing, error: existErr } = await supabase
    .from("articles")
    .select("published_at")
    .in("status", ["scheduled", "published"])
    .not("published_at", "is", null);

  if (existErr) throw new Error(`Failed to fetch existing schedule: ${existErr.message}`);

  const dayCounts = new Map<string, number>();
  for (const row of existing ?? []) {
    if (!row.published_at) continue;
    const day = row.published_at.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  // 3. Find available slots
  const today = toStartOfDayUTC(new Date());
  const tomorrow = addDays(today, 1);

  const slots: { date: Date; iso: string }[] = [];
  let candidateDay = tomorrow;

  // Walk days forward until we have enough slots for all articles
  // Each day can hold up to 3 articles total
  while (slots.length < toSchedule.length) {
    const dayStr = formatDateShort(candidateDay);
    const count = dayCounts.get(dayStr) ?? 0;
    const availableSlots = Math.max(0, 3 - count);

    for (let i = 0; i < availableSlots && slots.length < toSchedule.length; i++) {
      slots.push({ date: new Date(candidateDay), iso: formatDateUTC(candidateDay) });
    }

    candidateDay = addDays(candidateDay, 1);

    // Safety: don't loop forever
    if (slots.length === 0 && candidateDay > addDays(tomorrow, 365)) {
      console.log("⚠️  No available slots in the next year.");
      return;
    }
  }

  // 4. Assign and update
  console.log("─── Schedule ───────────────────────────────────────────────");
  let lastDay = "";

  for (let i = 0; i < toSchedule.length; i++) {
    const article = toSchedule[i];
    const slot = slots[i];
    const dayStr = formatDateShort(slot.date);

    if (dayStr !== lastDay) {
      console.log(`\n📅 ${dayStr}`);
      lastDay = dayStr;
    }

    if (dryRun) {
      console.log(`   ✏️  "${article.slug}" → ${slot.iso}`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("articles")
      .update({
        status: "scheduled",
        published_at: slot.iso,
      })
      .eq("id", article.id);

    if (updateErr) {
      console.error(`   ❌ Failed to schedule "${article.slug}": ${updateErr.message}`);
    } else {
      console.log(`   ✅ "${article.slug}"`);
    }
  }

  console.log(`\n─── Done ──────────────────────────────────────────────────`);
  console.log(`${dryRun ? "🔍 Would schedule" : "✅ Scheduled"}: ${toSchedule.length} article(s)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
