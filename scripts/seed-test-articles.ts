#!/usr/bin/env tsx

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as path from "path";

config({ path: path.resolve(__dirname, "../.env.local") });

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DRY_RUN = process.argv.includes("--dry-run");

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
  if (error) throw new Error(`Category upsert failed: ${error.message}`);
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
    if (error) throw new Error(`Tag upsert failed: ${error.message}`);
    ids.push(data.id);
  }
  return ids;
}

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const articles = [
  {
    title: "Test 1",
    category: "Software Config",
    tags: ["test"],
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    content: `## Test 1\n\n${LOREM}\n\n## Section 2\n\n${LOREM}\n\n### Subsection\n\n${LOREM}\n\n## Section 3\n\n${LOREM}`,
  },
  {
    title: "Test 2",
    category: "Software Config",
    tags: ["test"],
    excerpt: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    content: `## Test 2\n\n${LOREM}\n\n## Overview\n\n${LOREM}\n\n### Details\n\n${LOREM}\n\n## Conclusion\n\n${LOREM}`,
  },
  {
    title: "Test 3",
    category: "Software Config",
    tags: ["test"],
    excerpt: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    content: `## Test 3\n\n${LOREM}\n\n## Getting Started\n\n${LOREM}\n\n### Implementation\n\n${LOREM}\n\n## Summary\n\n${LOREM}`,
  },
];

async function main() {
  console.log("🚀 Seeding 3 test articles (lorem ipsum)...\n");

  const { data: existing } = await supabase.from("articles").select("slug");
  const existingSlugs = new Set(existing?.map((a) => a.slug) ?? []);

  const results: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const slug = slugify(article.title);

    console.log(`[${i + 1}/3] ${article.title}`);

    if (existingSlugs.has(slug)) {
      console.log(`  ⏭️  Skipped (slug exists): ${slug}`);
      skipped.push(article.title);
      continue;
    }

    try {
      const categoryId = await upsertCategory(article.category);
      const tagIds = await upsertTags(article.tags);

      if (!DRY_RUN) {
        const { data: art, error: artError } = await supabase
          .from("articles")
          .insert({
            title: article.title,
            slug,
            content: article.content,
            excerpt: article.excerpt,
            hero_image_url: null,
            category_id: categoryId,
            status: "draft",
            published_at: null,
          })
          .select("id")
          .single();

        if (artError) throw new Error(`Insert failed: ${artError.message}`);

        if (tagIds.length > 0) {
          const { error: tagError } = await supabase
            .from("article_tags")
            .insert(tagIds.map((tagId) => ({ article_id: art.id, tag_id: tagId })));
          if (tagError) throw new Error(`Tag link failed: ${tagError.message}`);
        }

        console.log(`  ✅ Created: ${slug}`);
        results.push(slug);
      } else {
        console.log(`  🔍 Dry run — would create: ${slug}`);
        results.push(slug);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${(err as Error).message}`);
      errors.push(article.title);
    }
  }

  console.log("\n═══════════════════════════════");
  console.log(`✅ Created: ${results.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);
  console.log(`❌ Errors:  ${errors.length}`);
  if (DRY_RUN) console.log("\n🔍 DRY RUN — no changes made");
  if (results.length) console.log(`\nSlugs:\n  ${results.join("\n  ")}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
