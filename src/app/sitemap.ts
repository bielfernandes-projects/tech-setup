import type { MetadataRoute } from "next";
import {
  getAllPublishedSlugs,
  getAllCategorySlugs,
  getAllTagSlugs,
} from "@/lib/mdx";

export const revalidate = 3600;

const baseUrl = "https://tech-setup.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = [];
  let categorySlugs: string[] = [];
  let tagSlugs: string[] = [];

  try {
    slugs = await getAllPublishedSlugs();
  } catch (e) {
    console.error("[sitemap] Failed to fetch article slugs:", e);
  }

  try {
    categorySlugs = await getAllCategorySlugs();
  } catch (e) {
    console.error("[sitemap] Failed to fetch category slugs:", e);
  }

  try {
    tagSlugs = await getAllTagSlugs();
  } catch (e) {
    console.error("[sitemap] Failed to fetch tag slugs:", e);
  }

  const articles = slugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categories = categorySlugs.map((slug) => ({
    url: `${baseUrl}/blog/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const tags = tagSlugs.map((slug) => ({
    url: `${baseUrl}/blog/tag/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/cookie-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/dmca`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    ...categories,
    ...tags,
    ...articles,
  ];
}
