export const site = {
  name: "Tech Setup",
  description:
    "Practical guides for developers — troubleshooting, setup, and tools.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://tech-setup.vercel.app",
  locale: "en_US",
  ogImage: "/opengraph-image",
  icon: "/icon.svg",
  author: {
    type: "Organization" as const,
    name: "Tech Setup",
  },
} as const;

export function siteUrl(path: string = ""): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${normalized}`;
}
