#!/usr/bin/env tsx
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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
    (t: any) => !existingSlugs.has(slugify(t.topic))
  );
  const removed = before - remaining.length;

  // Add new diverse topics
  const newTopics = [
    { topic: "Kubernetes for Beginners: Deploy Your First App", category: "DevOps", tags: ["kubernetes", "containers", "devops", "deployment"] },
    { topic: "TypeScript Generics: A Practical Guide", category: "Software Config", tags: ["typescript", "generics", "javascript", "programming"] },
    { topic: "PostgreSQL Performance Tuning for Developers", category: "Software Config", tags: ["postgresql", "database", "performance", "sql"] },
    { topic: "GitHub Actions: Build a CI/CD Pipeline from Scratch", category: "DevOps", tags: ["github-actions", "ci-cd", "automation", "deployment"] },
    { topic: "Linux Command Line: 50 Essential Commands", category: "Linux", tags: ["linux", "command-line", "terminal", "productivity"] },
    { topic: "React Server Components: Complete Guide for 2026", category: "Software Config", tags: ["react", "server-components", "nextjs", "frontend"] },
    { topic: "Nginx Reverse Proxy: Setup and Configuration Guide", category: "DevOps", tags: ["nginx", "reverse-proxy", "web-server", "linux"] },
    { topic: "Wireshark Network Analysis: Beginner to Intermediate", category: "Software Config", tags: ["wireshark", "networking", "debugging", "security"] },
    { topic: "Terraform Basics: Infrastructure as Code for Beginners", category: "DevOps", tags: ["terraform", "infrastructure", "cloud", "devops"] },
    { topic: "WebSocket vs Server-Sent Events: When to Use Each", category: "Software Config", tags: ["websockets", "sse", "real-time", "api"] },
  ];

  const uniqueNew = newTopics.filter(
    (t) => !existingSlugs.has(slugify(t.topic)) && !remaining.some((r: any) => r.topic === t.topic)
  );

  const final = [...remaining, ...uniqueNew];

  fs.writeFileSync(topicsPath, JSON.stringify({ topics: final }, null, 2) + "\n");

  console.log(`Before: ${before} topics`);
  console.log(`Removed (already in DB): ${removed}`);
  console.log(`Added: ${uniqueNew.length} new topics`);
  console.log(`After: ${final.length} topics`);
}

main().catch(console.error);
