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
 *   Batch:   npx tsx scripts/generate-article.ts --batch
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

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

// ─── Gemini ───────────────────────────────────────────────────────────────────

interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
}

async function generateWithGemini(topic: string): Promise<GeneratedArticle> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  // Step 1: Generate title + excerpt as small JSON (reliable to parse)
  const metaPrompt = `You are a technical writer for "Tech Setup", a faceless niche blog targeting Tier-1 developers (US/EU).

Generate a SEO-optimized title and meta description for an article about: "${topic}"

Rules:
- Write in English
- Title: 50-60 chars, includes primary keyword
- Excerpt: 150-160 chars, compelling for search results
- Return ONLY valid JSON, no markdown fences

Return exactly this JSON:
{
  "title": "Your SEO title here",
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
  const contentPrompt = `You are a technical writer for "Tech Setup", a faceless niche blog targeting Tier-1 developers (US/EU).

Write a complete article about: "${topic}"

Title: ${metaResult!.title}

Rules:
- Write in English, helpful and direct tone
- Structure with ## and ### headings
- Include practical steps, commands in \`\`\` code blocks, lists
- 1200-1800 words
- Return ONLY the Markdown article body — no title, no JSON, no wrapping`;

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

  // 3. Fetch hero image from Unsplash
  let heroUrl: string | null = null;
  try {
    const unsplashUrl = await searchUnsplashImage(topic);
    heroUrl = await downloadAndUpload(unsplashUrl, slug);
    console.log(`   🖼️  Hero uploaded`);
  } catch (err) {
    console.log(`   ⚠️  Hero image skipped: ${(err as Error).message}`);
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
    const topicsPath = path.resolve(__dirname, "topics.json");
    const data = JSON.parse(fs.readFileSync(topicsPath, "utf-8")) as {
      topics: { topic: string; category: string; tags: string[] }[];
    };

    const topics = data.topics.slice(0, limit);
    console.log(`🚀 Batch mode: ${topics.length} topics${limit < Infinity ? ` (limited)` : ""}`);

    // Pre-check: skip topics whose slugs already exist in DB
    const { data: existing } = await supabase.from("articles").select("slug");
    const existingSlugs = new Set(existing?.map((a) => a.slug) ?? []);

    const results: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      console.log(`\n[${i + 1}/${topics.length}]`);

      // Quick slug check before calling Gemini
      const testSlug = slugify(t.topic);
      if (existingSlugs.has(testSlug)) {
        console.log(`   ⏭️  Already exists: ${testSlug}`);
        skipped.push(t.topic);
        continue;
      }

      try {
        const slug = await createArticle(t.topic, t.category, t.tags);
        if (slug) {
          results.push(slug);
          existingSlugs.add(slug);
        } else {
          skipped.push(t.topic);
        }
      } catch (err) {
        console.error(`   ❌ Error: ${(err as Error).message}`);
        errors.push(t.topic);

        // If it's a quota error, stop early
        if ((err as Error).message.includes("429")) {
          console.log(`\n⚠️  Quota hit — stopando. Rode de novo amanhã ou reduza a quota.`);
          break;
        }
      }

      // Delay between articles: 30s to spread API calls
      if (i < topics.length - 1) {
        console.log(`   ⏳ Waiting 30s...`);
        await new Promise((r) => setTimeout(r, 30_000));
      }
    }

    console.log(`\n\n═══════════════════════════════════════════`);
    console.log(`✅ Created: ${results.length}`);
    console.log(`⏭️  Skipped: ${skipped.length}`);
    console.log(`❌ Errors:  ${errors.length}`);
    if (results.length) console.log(`\nSlugs:\n  ${results.join("\n  ")}`);
    return;
  }

  // Single mode
  if (args.length < 1) {
    console.log("Usage:");
    console.log('  Single:  npx tsx scripts/generate-article.ts "topic" --category X --tags a,b');
    console.log("  Batch:   npx tsx scripts/generate-article.ts --batch");
    console.log("  Limited: npx tsx scripts/generate-article.ts --batch --limit 5");
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
