import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-analytics.com https://*.vercel-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://adservice.google.com.br",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://mrkumsgzvsjtlbptrqgl.supabase.co https://images.unsplash.com https://lh3.googleusercontent.com https://pbs.twimg.com https://i.imgur.com https://upload.wikimedia.org https://avatars.githubusercontent.com https://raw.githubusercontent.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://www.google.com.br",
  "connect-src 'self' https://mrkumsgzvsjtlbptrqgl.supabase.co https://*.supabase.co https://va.vercel-analytics.com https://*.vercel-analytics.com https://pagead2.googlesyndication.com https://adservice.google.com https://adservice.google.com.br",
  "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
  "font-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
].join("; ");

// Duplicados despublicados pelo dedupe -> artigo canônico publicado.
// 301 preserva a autoridade que o Google já atribuiu às URLs antigas.
const dedupedToCanonical: Record<string, string> = {
  "how-to-build-a-discord-bot-with-slash-commands-in-nodejs": "build-a-discord-bot-with-nodejs-and-slash-commands",
  "how-to-build-a-discord-bot-with-nodejs-and-discordjs": "how-to-set-up-a-discord-bot-with-nodejs-discordjs",
  "react-development-environment-on-windows-11-setup-guide": "react-development-environment-setup-on-windows-11",
  "docker-desktop-windows-11-wsl2-setup-guide-for-devs": "docker-desktop-windows-11-wsl2-setup-guide",
  "how-to-configure-git-on-windows-for-pro-developers": "configuring-git-on-windows-for-pro-developers",
  "debugging-nodejs-with-chrome-devtools-a-guide": "debug-nodejs-apps-with-chrome-devtools-like-a-pro",
  "mastering-npm-and-npx-in-2026-modern-dev-guide": "mastering-npm-and-npx-in-2026-modern-workflow-guide",
  "windows-terminal-ultimate-power-user-guide": "windows-terminal-power-user-configuration-guide",
  "discord-not-opening-on-windows-11-here-is-the-complete-fix": "fixing-discord-not-opening-on-windows-11-developers-guide",
  "how-to-update-gpu-drivers-on-windows-11-a-step-by-step-guide": "how-to-update-gpu-drivers-on-windows-11-a-developers-guide",
  "postgresql-on-windows-11-local-dev-setup-guide": "postgresql-windows-11-setup-guide-for-local-dev",
  "postgresql-windows-11-setup-local-dev-guide": "postgresql-windows-11-setup-guide-for-local-dev",
  "discord-screen-share-not-working-quick-developer-fixes": "discord-screen-share-not-working-fast-fixes-for-devs",
  "discord-screen-share-not-working-quick-fixes-for-devs": "discord-screen-share-not-working-fast-fixes-for-devs",
  "setting-up-wsl2-with-ubuntu-on-windows-11-developer-guide": "setting-up-wsl2-with-ubuntu-on-windows-11-dev-guide",
  "wsl2-ubuntu-setup-on-windows-11-developer-guide": "setting-up-wsl2-with-ubuntu-on-windows-11-dev-guide",
  "how-to-set-up-a-minecraft-server-on-windows-2024": "how-to-set-up-a-minecraft-server-on-windows-a-guide",
  "how-to-set-up-a-minecraft-server-on-windows-a-dev-guide": "how-to-set-up-a-minecraft-server-on-windows-a-guide",
  "build-your-first-cicd-pipeline-with-github-actions": "automating-cicd-pipeline-github-actions",
  "automate-nextjs-deployments-with-github-actions-cicd": "automating-cicd-pipeline-github-actions",
  "how-to-fix-discord-audio-echo-2026-troubleshooting-guide": "how-to-fix-discord-audio-echo-2026-technical-guide",
  "how-to-fix-discord-audio-echo-developers-diagnostic-guide": "how-to-fix-discord-audio-echo-2026-technical-guide",
  "how-to-fix-discord-audio-echo-developers-guide-2026": "how-to-fix-discord-audio-echo-2026-technical-guide",
};

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Domínio *.vercel.app duplica o site inteiro; consolida tudo no domínio próprio.
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "tech-setup.vercel.app" }],
        destination: "https://techsetup.site/:path*",
        permanent: true,
      },
      ...Object.entries(dedupedToCanonical).map(([from, to]) => ({
        source: `/blog/${from}`,
        destination: `/blog/${to}`,
        permanent: true,
      })),
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mrkumsgzvsjtlbptrqgl.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
