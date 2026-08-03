#!/usr/bin/env tsx
/**
 * scripts/split-software-config.ts
 *
 * Splits the generic "software-config" bucket into topical categories:
 *
 *   ai-development ← Cursor, Lovable, OpenClaw, TypeScript AI Coding
 *   automation     ← n8n, Make.com, Power Automate, Excel Power Query
 *   web3           ← Solidity, Ethereum, Hardhat, Ethers.js
 *   programming    ← Go, Rust, Python, CSS, TypeScript, Node/npm
 *   devops         ← Git Advanced
 *
 * Creates missing target categories, reassigns every article, and deletes
 * the now-empty software-config category.
 *
 * Usage:
 *   npx tsx scripts/split-software-config.ts            # dry run (report only)
 *   npx tsx scripts/split-software-config.ts --apply    # apply
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
const SOURCE_SLUG = "software-config";

// exact title → target category slug
const MAPPING: Record<string, string> = {
  // → ai-development
  "Cursor IDE: AI-Powered Development Setup Guide": "ai-development",
  "Advanced Lovable Prompts: Build Complex App Features": "ai-development",
  "Lovable vs Bolt.new vs v0: Best AI App Builder for Devs": "ai-development",
  "Getting Started with Lovable: AI Full-Stack Apps 2026": "ai-development",
  "Connect Lovable to Supabase: Backend & Auth Guide": "ai-development",
  "Deploying Lovable Apps to Vercel with Custom Domains": "ai-development",
  "Connect Free Lovable with GitHub: Version Control Guide": "ai-development",
  "Install OpenClaw on Windows 11: Developer Setup Guide": "ai-development",
  "OpenClaw Setup Guide: Telegram & Discord Integration": "ai-development",
  "Building Custom OpenClaw Skills for Developer Workflows": "ai-development",
  "TypeScript AI Coding: Accelerate Development & Productivity": "ai-development",

  // → automation
  "Excel Power Query: Automate Data Cleaning Like a Pro": "automation",
  "Automating API Integrations with n8n and Node.js": "automation",
  "n8n Workflow Automation on Windows with Docker: Guide": "automation",
  "Power Automate: Build Your First Workflow in 15 Minutes": "automation",
  "Automate Tasks with Make: Advanced Developer Guide": "automation",
  "n8n vs Make: Choosing the Right Automation Platform": "automation",
  "Building API Integrations with Make.com: A Guide": "automation",
  "Automate Developer Workflows with n8n: A Guide": "automation",

  // → web3
  "Solidity for Web Developers: Build Your First Smart Contract": "web3",
  "Build a DApp with Ethers.js & MetaMask: Developer Guide": "web3",
  "Local Ethereum Development: Setting Up Hardhat Guide": "web3",
  "Ethereum Testnet Deployment: Build & Deploy Smart Contracts": "web3",

  // → devops
  "Git Advanced: Rebase, Cherry-Pick, and Interactive History": "devops",

  // → programming
  "Python Virtual Environments: Complete Guide for 2026": "programming",
  "Building REST APIs with Go and Chi Router": "programming",
  "Rust for JavaScript Developers: Getting Started Guide": "programming",
  "CSS Container Queries: Component-Level Responsive Design": "programming",
  "Mastering npm and npx in 2026: Modern Workflow Guide": "programming",
  "Mastering npm and npx in 2026: Modern Dev Guide": "programming",
  "Fix VS Code Not Detecting TypeScript Errors (Quick Guide)": "programming",
  "Debug Node.js Apps with Chrome DevTools Like a Pro": "programming",
  "Node.js ESLint & Prettier Setup Guide for 2026": "programming",
  "npm and npx Guide 2026: Master Node Package Execution": "programming",
  "Debugging Node.js with Chrome DevTools: A Guide": "programming",
  "Matt Pocock TypeScript Workflow: Level Up Your Code": "programming",
  "Frontend Design for Developers: Build Beautiful UIs": "programming",
  "How to Speed Up npm Install on Windows: 5 Proven Fixes": "programming",
};

const NEW_CATEGORIES: Record<string, string> = {
  automation: "Automation",
  web3: "Web3",
  programming: "Programming",
};

async function main() {
  if (!APPLY) console.log("🔍 DRY RUN — no changes will be made\n");

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (catError) throw new Error(`Failed to fetch categories: ${catError.message}`);

  const bySlug = new Map((categories ?? []).map((c) => [c.slug, c]));
  const source = bySlug.get(SOURCE_SLUG);
  if (!source) {
    console.log(`⏭  Source category "${SOURCE_SLUG}" not found — nothing to do.`);
    return;
  }

  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("id, title, status")
    .eq("category_id", source.id);

  if (articleError) throw new Error(`Failed to fetch articles: ${articleError.message}`);

  const rows = (articles ?? []) as { id: string; title: string; status: string }[];
  console.log(`📄 Articles in "${SOURCE_SLUG}": ${rows.length}\n`);

  const unmapped = rows.filter((a) => !MAPPING[a.title]);
  if (unmapped.length > 0) {
    console.error(`❌ ${unmapped.length} article(s) have no mapping:`);
    for (const a of unmapped) console.error(`   - [${a.status}] ${a.title}`);
    process.exit(1);
  }

  // Group by target
  const byTarget = new Map<string, typeof rows>();
  for (const a of rows) {
    const arr = byTarget.get(MAPPING[a.title]) ?? [];
    arr.push(a);
    byTarget.set(MAPPING[a.title], arr);
  }

  let totalMoved = 0;
  for (const [targetSlug, items] of [...byTarget.entries()].sort((a, b) => b[1].length - a[1].length)) {
    let tgt = bySlug.get(targetSlug);

    if (!tgt) {
      const name = NEW_CATEGORIES[targetSlug];
      if (APPLY) {
        const { data: created, error: createError } = await supabase
          .from("categories")
          .insert({ slug: targetSlug, name })
          .select()
          .single();
        if (createError) throw new Error(`Failed to create "${targetSlug}": ${createError.message}`);
        tgt = created;
        bySlug.set(targetSlug, tgt);
      }
    }

    console.log(`── → ${targetSlug} (${items.length} article(s))`);
    for (const a of items) console.log(`   [${a.status}] ${a.title}`);

    if (tgt && APPLY) {
      const ids = items.map((a) => a.id);
      const { error: updateError } = await supabase
        .from("articles")
        .update({ category_id: tgt.id })
        .in("id", ids);
      if (updateError) throw new Error(`Failed to move to ${targetSlug}: ${updateError.message}`);
    } else if (!tgt && !APPLY) {
      console.log(`   (target category "${targetSlug}" will be created)`);
    }
    totalMoved += items.length;
    console.log("");
  }

  console.log(`📋 Total articles to move: ${totalMoved}`);

  if (!APPLY) {
    console.log("🔍 DRY RUN — re-run with --apply to reassign articles and delete software-config.");
    return;
  }

  const { error: deleteError } = await supabase.from("categories").delete().eq("id", source.id);
  if (deleteError) throw new Error(`Failed to delete "${SOURCE_SLUG}": ${deleteError.message}`);

  console.log(`✅ Deleted category "${SOURCE_SLUG}"`);
  console.log("\n─── Done ──────────────────────────────────────────────────");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
