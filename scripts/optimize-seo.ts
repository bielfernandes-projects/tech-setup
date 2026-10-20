/**
 * Otimização de SEO sobre artigos já publicados.
 *  1. Reescreve title/excerpt dos artigos com impressões no GSC (alinhado às queries reais).
 *  2. Adiciona seção "Related guides" com links internos entre artigos do mesmo cluster.
 *
 * Uso: npx tsx scripts/optimize-seo.ts [--apply]   (dry-run por padrão; idempotente)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Baseline GSC 2026-10-20: posição 7–17 sem cliques, ou muitas impressões e posição ~38.
const META: Record<string, { title: string; excerpt: string }> = {
  "how-to-fix-cors-errors-in-nodejs-and-express-step-by-step": {
    title: "Fix 'Blocked by CORS Policy' in Node.js and Express",
    excerpt:
      "Fix the 'blocked by CORS policy' error in Express: set up the cors middleware, handle preflight OPTIONS requests, credentials and localhost origins.",
  },
  "opencode-cli-guide-ai-powered-coding-for-developers": {
    title: "OpenCode CLI: Install, Configure and Use the AI Coding Agent",
    excerpt:
      "Install the OpenCode CLI, connect an AI provider and use it for coding from your terminal. A practical setup and workflow guide for developers.",
  },
  "openai-codex-cli-getting-started-with-autonomous-coding": {
    title: "OpenAI Codex CLI: Install, Setup and First Run (2026)",
    excerpt:
      "Install the OpenAI Codex CLI with npm, run it non-interactively with codex -p, and understand sandboxing. A hands-on getting-started guide.",
  },
  "claude-code-tips-advanced-ai-workflows-for-developers": {
    title: "Claude Code Workflow: Tips for Using It Effectively",
    excerpt:
      "A practical Claude Code workflow: plan before coding, keep a CLAUDE.md for context and iterate in small steps. Tips for using it effectively.",
  },
  "getting-started-with-lovable-ai-full-stack-apps-2026": {
    title: "Lovable Tutorial: Build a Full-Stack App with AI (2026)",
    excerpt:
      "Build a full-stack app with Lovable: write your first prompts, connect Supabase and GitHub, and deploy. A beginner-friendly 2026 walkthrough.",
  },
  "advanced-lovable-prompts-build-complex-app-features": {
    title: "Advanced Lovable Prompts for Complex App Features",
    excerpt:
      "Advanced Lovable prompts for auth, Supabase, edge functions and debugging. Learn how to structure requests so the AI builds complex features correctly.",
  },
  "build-an-esp32-smart-home-dashboard-with-nodejs": {
    title: "ESP32 Smart Home Dashboard with Node.js and WebSockets",
    excerpt:
      "Build a real-time ESP32 smart home dashboard on Windows using Node.js, Express and WebSockets, with DHT sensor readings. Step-by-step guide.",
  },
};

// Clusters de links internos (cada artigo recebe até 4 irmãos do mesmo grupo).
const CLUSTERS: string[][] = [
  [
    "opencode-cli-guide-ai-powered-coding-for-developers",
    "openai-codex-cli-getting-started-with-autonomous-coding",
    "claude-code-tips-advanced-ai-workflows-for-developers",
    "getting-started-with-lovable-ai-full-stack-apps-2026",
    "advanced-lovable-prompts-build-complex-app-features",
    "deploying-lovable-apps-to-vercel-with-custom-domains",
    "connect-free-lovable-with-github-version-control-guide",
  ],
  [
    "how-to-fix-discord-audio-echo-2026-technical-guide",
    "discord-microphone-not-working-how-to-fix-voice-issues-fast",
    "fix-discord-microphone-issues-developers-diagnostic-guide",
    "why-is-my-discord-mic-so-quiet-quick-fixes-for-developers",
    "fix-discord-push-to-talk-not-working-in-games",
    "discord-screen-share-not-working-fast-fixes-for-devs",
    "fix-discord-voice-chat-lag-on-windows-11",
    "why-discord-keeps-changing-your-audio-device-on-windows",
    "fix-discord-not-capturing-game-audio-on-windows-11",
  ],
  [
    "how-to-set-up-a-discord-bot-with-nodejs-discordjs",
    "build-a-discord-bot-with-nodejs-and-slash-commands",
    "fix-discord-bot-startup-crash-missing-intents-explained",
    "fix-discord-gateway-intents-errors-in-nodejs",
    "why-your-discord-bot-keeps-disconnecting-and-how-to-fix-it",
    "fix-discord-bot-not-reading-messages-due-to-permissions",
    "prevent-discord-bot-token-leaks-using-environment-variables",
  ],
  [
    "setting-up-wsl2-with-ubuntu-on-windows-11-dev-guide",
    "fix-wsl2-dns-resolution-failures-behind-corporate-vpns",
    "speed-up-wsl2-nodejs-monorepos-fix-io-bottlenecks-fast",
    "docker-desktop-windows-11-wsl2-setup-guide",
    "windows-terminal-power-user-configuration-guide",
    "configure-windows-terminal-and-powershell-for-unix-workflows",
    "how-to-install-nodejs-on-windows-the-right-way-2024-guide",
  ],
  [
    "how-to-fix-cors-errors-in-nodejs-and-express-step-by-step",
    "debug-nodejs-apps-with-chrome-devtools-like-a-pro",
    "configure-windows-firewall-for-nodejs-servers",
    "how-to-install-nodejs-on-windows-the-right-way-2024-guide",
  ],
  [
    "build-an-esp32-smart-home-dashboard-with-nodejs",
    "mqtt-broker-setup-on-windows-11-with-docker-for-iot",
    "building-smart-home-dashboard-home-assistant",
    "configure-home-assistant-notifications-via-webhook-server",
  ],
];

const MARKER = "## Related guides";
const MAX_LINKS = 4;

async function main() {
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, content")
    .eq("status", "published");
  if (error) throw error;
  const bySlug = new Map(data!.map((a) => [a.slug, a]));

  let metaCount = 0;
  let linkCount = 0;

  for (const [slug, article] of bySlug) {
    const update: { title?: string; excerpt?: string; content?: string } = {};

    const meta = META[slug];
    if (meta && (article.title !== meta.title || article.excerpt !== meta.excerpt)) {
      update.title = meta.title;
      update.excerpt = meta.excerpt;
      metaCount++;
    }

    const peers = CLUSTERS.filter((c) => c.includes(slug))
      .flat()
      .filter((s, i, arr) => s !== slug && arr.indexOf(s) === i && bySlug.has(s))
      .filter((s) => !article.content.includes(`/blog/${s}`))
      .slice(0, MAX_LINKS);

    if (peers.length && !article.content.includes(MARKER)) {
      const list = peers
        .map((s) => `- [${META[s]?.title ?? bySlug.get(s)!.title}](/blog/${s})`)
        .join("\n");
      update.content = `${article.content.trimEnd()}\n\n${MARKER}\n\n${list}\n`;
      linkCount++;
    }

    if (!Object.keys(update).length) continue;
    console.log(`${APPLY ? "✏️ " : "🔍"} ${slug}${update.title ? " [meta]" : ""}${update.content ? " [links]" : ""}`);
    if (APPLY) {
      const { error: upErr } = await supabase.from("articles").update(update).eq("id", article.id);
      if (upErr) throw upErr;
    }
  }

  console.log(`\n${APPLY ? "Aplicado" : "Dry-run"}: ${metaCount} meta, ${linkCount} com links internos`);
  if (APPLY) {
    console.log("Rodar revalidate (ISR 60s) ou aguardar a expiração para ver no ar.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
