#!/usr/bin/env tsx
/**
 * scripts/generate-article.ts
 *
 * Generates Tech Setup articles using Google Gemini AI.
 * Uploads hero images to Supabase Storage.
 * Inserts articles as drafts in the database.
 *
 * Usage:
 *   Single:  npx tsx scripts/generate-article.ts "how to fix discord audio echo" --category troubleshooting --tags discord,audio
 *   Batch:   npx tsx scripts/generate-article.ts --batch [--limit N] [--refill N]
 *   Refill:  npx tsx scripts/generate-article.ts --refill N
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import {
  CONTENT_CLUSTERS,
  VALID_CATEGORIES,
  clusterPriority,
} from "./content-clusters";

config({ path: path.resolve(__dirname, "../.env.local") });

// ─── Env ──────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

for (const [name, val] of [
  ["SUPABASE_URL", SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_KEY],
  ["GEMINI_API_KEY", GEMINI_KEY],
  ["UNSPLASH_ACCESS_KEY", UNSPLASH_KEY],
]) {
  if (!val || val.startsWith("PASTE_YOUR")) {
    console.error(`❌ Missing or placeholder env var: ${name}`);
    process.exit(1);
  }
}

const supabase: SupabaseClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const genAI = new GoogleGenerativeAI(GEMINI_KEY!);

// ─── Config ────────────────────────────────────────────────────────────────────

const TOPICS_PATH = path.resolve(__dirname, "topics.json");

function buildRefillPrompt(count: number): string {
  const clusterLines = CONTENT_CLUSTERS.map(
    (c, i) => `${i + 1}. ${c.name} — ${c.focus} (topics in: ${c.categories.join(", ")})`,
  ).join("\n");

  return `Generate ${count} new article topic ideas for "Tech Setup", a niche blog for developers (US/EU).

PRODUCE TOPICS PROPORTIONALLY ACROSS THESE CLUSTERS, with more of the earlier ones:
${clusterLines}

Return ONLY a valid JSON array — no markdown fences, no explanation:
[
  {"topic": "How to...", "category": "Troubleshooting", "tags": ["keyword1", "keyword2"]}
]

Rules:
- Write in English; topics must be specific and answerable (a concrete problem or task), not generic ("The Complete Guide to X").
- Categories (exact): ${VALID_CATEGORIES.join(", ")}
- 3-5 tags per topic
- Do NOT repeat topics already present in the current topics.json file
- Avoid topics that would naturally produce a title ending in "A Developer's Guide" or "Ultimate Guide" — prefer question or outcome titles.`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

async function upsertCategory(name: string): Promise<string> {
  const slug = slugify(name);
  const { data, error } = await supabase
    .from("categories")
    .upsert({ name, slug }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to upsert category "${name}": ${error.message}`);
  return data.id;
}

async function upsertTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    const { data, error } = await supabase
      .from("tags")
      .upsert({ name, slug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (error) throw new Error(`Failed to upsert tag "${name}": ${error.message}`);
    ids.push(data.id);
  }
  return ids;
}

function loadTopics(): { topic: string; category: string; tags: string[] }[] {
  return (JSON.parse(fs.readFileSync(TOPICS_PATH, "utf-8")) as {
    topics: { topic: string; category: string; tags: string[] }[];
  }).topics;
}

function saveTopics(topics: { topic: string; category: string; tags: string[] }[]): void {
  fs.writeFileSync(TOPICS_PATH, JSON.stringify({ topics }, null, 2) + "\n");
}

function removeTopicFromFile(topic: string): void {
  const topics = loadTopics().filter((t) => t.topic !== topic);
  saveTopics(topics);
}

function cleanOrphanTopics(existingSlugs: Set<string>): number {
  const before = loadTopics();
  const after = before.filter((t) => !existingSlugs.has(slugify(t.topic)));
  if (after.length < before.length) {
    saveTopics(after);
  }
  return before.length - after.length;
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
}

async function generateWithGemini(topic: string): Promise<GeneratedArticle> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

  // Step 1: Generate title + excerpt as small JSON (reliable to parse)
  const metaPrompt = `You are a technical writer for "Tech Setup", a niche blog for developers (US/EU).

Generate an SEO title and meta description for an article about: "${topic}"

Rules:
- Write in English
- Title: 45-70 chars, includes the primary keyword, and AVOID clichéd suffixes
  such as ": A Developer's Guide", ": The Ultimate Guide", "Mastering X",
  "X in 2026", or "Step-by-Step". Prefer question titles ("Why is X...?",
  "X not working?"), outcome titles ("Fix X in Y minutes"), or concrete
  how-to titles with a specific result.
- Excerpt: 150-160 chars, states the concrete outcome the reader gets and
  the audience it is for — no marketing fluff.
- Return ONLY valid JSON, no markdown fences

Return exactly this JSON:
{
  "title": "Your title here",
  "excerpt": "Your meta description here"
}`;

  let metaResult: { title: string; excerpt: string } = { title: "", excerpt: "" };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(metaPrompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleaned) as { title: string; excerpt: string };
      if (!parsed.title) throw new Error("Missing title");
      metaResult = parsed;
      break;
    } catch (err) {
      lastError = err as Error;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 3000));
        continue;
      }
      throw lastError;
    }
  }

  // Step 2: Generate content as plain Markdown (no JSON wrapping)
  const contentPrompt = `You are a technical writer for "Tech Setup", a niche blog for developers (US/EU).

Write a complete article about: "${topic}"

Title: ${metaResult!.title}

Before writing, decide ONE concrete reader scenario: who the reader is, what
they are trying to do, and what usually blocks them. Every section of the
article should serve that scenario.

Rules:
- Write in English, direct and practical tone. Address the reader as "you".
  No "In this article, we will explore" openers — start with the problem or
  the outcome.
- Open with a short, heading-free intro (2-3 sentences): the problem, who it
  hits, and what the reader ends up with.
- Structure with ## and ### headings, but VARY the pattern per article.
  Do not always open with "Prerequisites". Useful building blocks to choose
  from: a quick TL;DR fix up front, exact commands in \`\`\` code blocks with
  expected output, a short "If this doesn't work" section with the 2-3 most
  common failure points, and a closing note on alternatives or prevention.
- Be concrete: exact commands, file names, package names, flags, and
  version-relevant caveats. Never hand-wave a step as "and then configure
  it" — say what to set and why.
- Avoid generic filler sentences and repeated transitional phrases.
- 1200-1800 words.
- Return ONLY the Markdown article body — no title, no JSON, no wrapping.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(contentPrompt);
      const content = result.response.text();
      if (!content || content.length < 200) throw new Error("Content too short");
      return { title: metaResult!.title, excerpt: metaResult!.excerpt, content };
    } catch (err) {
      lastError = err as Error;
      const isRetryable = lastError.message.includes("503") || lastError.message.includes("429");
      if (isRetryable && attempt < 3) {
        const delay = attempt * 5000;
        console.log(`   ⏳ Retry ${attempt}/3 in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError!;
}

async function generateTopics(count: number): Promise<number> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
  const prompt = buildRefillPrompt(count);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleaned) as { topic: string; category: string; tags: string[] }[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Empty or invalid topic list returned");
      }

      const existing = loadTopics();
      const newTopics = parsed.filter(
        (p) => !existing.some((e) => e.topic === p.topic),
      );

      if (newTopics.length === 0) {
        console.log("   ⚠️  All generated topics already exist in file");
        return 0;
      }

      saveTopics([...existing, ...newTopics]);
      return newTopics.length;
    } catch (err) {
      const lastError = err as Error;
      if (lastError.message.includes("503") || lastError.message.includes("429")) {
        if (attempt < 3) {
          const delay = attempt * 5000;
          console.log(`   ⏳ Refill retry ${attempt}/3 in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }
      if (attempt >= 3) throw lastError;
    }
  }

  throw new Error("Failed to generate topics after 3 attempts");
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────

async function searchUnsplashImage(query: string): Promise<string> {
  const params = new URLSearchParams({
    query,
    per_page: "5",
    orientation: "landscape",
    content_filter: "high",
  });

  const res = await fetch(
    `https://api.unsplash.com/search/photos?${params}`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
  );

  if (!res.ok) throw new Error(`Unsplash search failed: ${res.status}`);

  const data = (await res.json()) as { results: { urls: { raw: string } }[] };
  if (!data.results.length) throw new Error(`No Unsplash images found for "${query}"`);

  return data.results[0].urls.raw;
}

async function fetchHeroImage(
  topic: string,
  categoryName: string,
  slug: string,
): Promise<string> {
  const queries = [topic, categoryName, "developer workspace technology"];
  let lastError: Error | null = null;

  for (const query of queries) {
    try {
      const unsplashUrl = await searchUnsplashImage(query);
      return await downloadAndUpload(unsplashUrl, slug);
    } catch (err) {
      lastError = err as Error;
      console.log(`   ⚠️  Unsplash "${query}" failed: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error("Hero image fetch failed");
}

async function downloadAndUpload(
  url: string,
  slug: string,
): Promise<string> {
  const imgUrl = `${url}&w=1200&q=80&fm=avif`;
  const res = await fetch(imgUrl);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const storagePath = `heroes/${slug}.avif`;

  const { error } = await supabase.storage
    .from("hero-images")
    .upload(storagePath, buffer, {
      contentType: "image/avif",
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload image: ${error.message}`);

  const { data } = supabase.storage.from("hero-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

// ─── Article Creation ─────────────────────────────────────────────────────────

async function createArticle(
  topic: string,
  categoryName: string,
  tagNames: string[],
): Promise<string | null> {
  console.log(`\n📝 Generating: "${topic}"`);

  // 1. Generate content with Gemini
  const generated = await generateWithGemini(topic);
  const slug = slugify(generated.title);

  // 2. Check for duplicate slug
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    console.log(`   ⏭️  Skipped (slug already exists): ${slug}`);
    return null;
  }

  console.log(`   ✅ Generated: "${generated.title}"`);

  // 3. Fetch hero image from Unsplash — mandatory
  let heroUrl: string;
  try {
    heroUrl = await fetchHeroImage(topic, categoryName, slug);
    console.log(`   🖼️  Hero uploaded`);
  } catch (err) {
    console.log(`   ❌ Hero image required — article NOT created: ${(err as Error).message}`);
    throw new Error(`Hero image required: ${(err as Error).message}`);
  }

  // 4. Upsert category and tags
  const categoryId = await upsertCategory(categoryName);
  const tagIds = await upsertTags(tagNames);

  // 5. Insert article
  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      title: generated.title,
      slug,
      content: generated.content,
      excerpt: generated.excerpt,
      hero_image_url: heroUrl,
      category_id: categoryId,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert article: ${error.message}`);

  // 6. Link tags
  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from("article_tags")
      .insert(tagIds.map((tagId) => ({ article_id: article.id, tag_id: tagId })));

    if (tagError) throw new Error(`Failed to link tags: ${tagError.message}`);
  }

  console.log(`   📦 Saved as draft: ${slug}`);
  return slug;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Batch mode
  if (args.includes("--batch")) {
    const limitIdx = args.indexOf("--limit");
    const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

    const refillIdx = args.indexOf("--refill");
    const refillCount = refillIdx !== -1 ? parseInt(args[refillIdx + 1]) : 0;

    // Pre-check: skip topics whose slugs already exist in DB
    const { data: existing } = await supabase.from("articles").select("slug");
    const existingSlugs = new Set(existing?.map((a) => a.slug) ?? []);

    // Clean orphan topics from file
    const cleaned = cleanOrphanTopics(existingSlugs);
    if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} orphan topics from topics.json`);

    const allTopics = loadTopics();
    const topics = allTopics
      .map((t, i) => ({ ...t, _order: i }))
      .sort(
        (a, b) =>
          clusterPriority(a.category) - clusterPriority(b.category) ||
          a._order - b._order,
      )
      .slice(0, limit);
    console.log(`🚀 Batch mode: ${topics.length} topics${limit < Infinity ? ` (limited)` : ""}`);

    const results: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      console.log(`\n[${i + 1}/${topics.length}]`);

      const testSlug = slugify(t.topic);
      if (existingSlugs.has(testSlug)) {
        console.log(`   ⏭️  Already exists: ${testSlug}`);
        skipped.push(t.topic);
        removeTopicFromFile(t.topic);
        continue;
      }

      try {
        const slug = await createArticle(t.topic, t.category, t.tags);
        if (slug) {
          results.push(slug);
          existingSlugs.add(slug);
          removeTopicFromFile(t.topic);
          console.log(`   🗑️  Removed from topics.json`);
        } else {
          skipped.push(t.topic);
        }
      } catch (err) {
        console.error(`   ❌ Error: ${(err as Error).message}`);
        errors.push(t.topic);

        if ((err as Error).message.includes("429")) {
          console.log(`\n⚠️  Quota hit — stopping. Try again later.`);
          break;
        }
      }

      if (i < topics.length - 1) {
        console.log(`   ⏳ Waiting 30s...`);
        await new Promise((r) => setTimeout(r, 30_000));
      }
    }

    console.log(`\n\n═══════════════════════════════════════════`);
    console.log(`✅ Created: ${results.length}`);
    console.log(`⏭️  Skipped: ${skipped.length}`);
    console.log(`❌ Errors:  ${errors.length}`);
    console.log(`📋 ${loadTopics().length} topics remain in queue`);
    if (results.length) console.log(`\nSlugs:\n  ${results.join("\n  ")}`);

    // Auto-refill
    if (refillCount > 0) {
      console.log(`\n🔄 Generating ${refillCount} new topics...`);
      try {
        const added = await generateTopics(refillCount);
        console.log(`✅ Added ${added} new topics to topics.json`);
        console.log(`📋 ${loadTopics().length} topics now in queue`);
      } catch (err) {
        console.log(`⚠️  Refill failed: ${(err as Error).message}`);
      }
    }

    return;
  }

  // Standalone refill mode
  if (args.includes("--refill")) {
    const refillIdx = args.indexOf("--refill");
    const refillCount = parseInt(args[refillIdx + 1]);

    if (!refillCount || refillCount < 1) {
      console.error("❌ Invalid refill count. Usage: --refill N");
      process.exit(1);
    }

    console.log(`🔄 Generating ${refillCount} new topics...`);
    try {
      const added = await generateTopics(refillCount);
      console.log(`✅ Added ${added} new topics to topics.json`);
      console.log(`📋 ${loadTopics().length} topics now in queue`);
    } catch (err) {
      console.error(`❌ Refill failed: ${(err as Error).message}`);
      process.exit(1);
    }
    return;
  }

  // Single mode
  if (args.length < 1) {
    console.log("Usage:");
    console.log('  Single:  npx tsx scripts/generate-article.ts "topic" --category X --tags a,b');
    console.log("  Batch:   npx tsx scripts/generate-article.ts --batch [--limit N] [--refill N]");
    console.log("  Refill:  npx tsx scripts/generate-article.ts --refill N");
    process.exit(1);
  }

  const topic = args[0];
  const catIdx = args.indexOf("--category");
  const category = catIdx !== -1 ? args[catIdx + 1] : "General";

  const tagIdx = args.indexOf("--tags");
  const tags = tagIdx !== -1 ? args[tagIdx + 1].split(",") : [slugify(topic).split("-")[0]];

  const slug = await createArticle(topic, category, tags);
  console.log(`\n🎉 Done! Article "${slug}" created as draft.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
