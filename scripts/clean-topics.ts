#!/usr/bin/env tsx
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { VALID_CATEGORIES } from "./content-clusters";

type Topic = { topic: string; category: string; tags: string[] };

config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function main() {
  const { data: articles } = await supabase.from("articles").select("slug");
  const existingSlugs = new Set(articles?.map((a) => a.slug) ?? []);

  const topicsPath = path.resolve(__dirname, "topics.json");
  const { topics } = JSON.parse(fs.readFileSync(topicsPath, "utf-8"));

  const before = topics.length;
  const remaining = topics.filter(
    (t: Topic) => !existingSlugs.has(slugify(t.topic))
  );
  const removed = before - remaining.length;

  // Add new topics focused on the winning clusters (analytics baseline 2026-08-10)
  const newTopics: Topic[] = [
    { topic: "Discord voice chat lag on Windows 11: causes and fixes", category: "Troubleshooting", tags: ["discord", "audio", "troubleshooting", "windows-11"] },
    { topic: "Discord bot can't read messages in a channel: fix permissions", category: "Discord Bots", tags: ["discord", "discordjs", "bots", "troubleshooting"] },
    { topic: "Use OpenCode to refactor a legacy TypeScript codebase", category: "AI & Development", tags: ["ai", "ai-tools", "cli", "typescript"] },
    { topic: "Claude Code not reading your repo context? Configure CLAUDE.md", category: "AI & Development", tags: ["ai", "ai-tools", "cli"] },
    { topic: "Fix WSL2 networking when DNS stops resolving in Ubuntu", category: "Linux", tags: ["wsl2", "ubuntu", "networking", "linux"] },
    { topic: "Move Docker Desktop data to another drive on Windows 11", category: "Windows Setup", tags: ["docker", "windows-11", "setup"] },
    { topic: "Run a local LLM with Ollama for private code completion", category: "AI & Development", tags: ["ai", "ollama", "coding", "ai-tools"] },
    { topic: "Fix 'connection refused' between WSL2 and Windows apps", category: "Linux", tags: ["wsl2", "networking", "linux", "troubleshooting"] },
    { topic: "Prompt an AI coding agent to write tests that actually pass", category: "AI & Development", tags: ["ai", "ai-tools", "coding"] },
    { topic: "Automate repetitive Git tasks with shell aliases and hooks", category: "Automation", tags: ["git", "automation", "terminal"] },
  ];

  const uniqueNew = newTopics.filter(
    (t) =>
      VALID_CATEGORIES.includes(t.category) &&
      !existingSlugs.has(slugify(t.topic)) &&
      !remaining.some((r: Topic) => r.topic === t.topic)
  );

  const final = [...remaining, ...uniqueNew];

  fs.writeFileSync(topicsPath, JSON.stringify({ topics: final }, null, 2) + "\n");

  console.log(`Before: ${before} topics`);
  console.log(`Removed (already in DB): ${removed}`);
  console.log(`Added: ${uniqueNew.length} new topics`);
  console.log(`After: ${final.length} topics`);
}

main().catch(console.error);
