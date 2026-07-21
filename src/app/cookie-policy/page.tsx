import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Tech Setup cookie policy — how we use cookies for analytics and advertising.",
  alternates: {
    canonical: siteUrl("/cookie-policy"),
  },
};

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Cookie Policy
      </h1>
      <div className="mt-8 prose prose-zinc max-w-none text-sm">
        <p>Last updated: July 20, 2026</p>
        <h2>What Are Cookies</h2>
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help us improve your experience.
        </p>
        <h2>Cookies We Use</h2>
        <ul>
          <li>
            <strong>Analytics cookies:</strong> Used to understand how visitors
            interact with our site.
          </li>
          <li>
            <strong>Advertising cookies:</strong> Used to deliver relevant
            advertisements via Google AdSense.
          </li>
        </ul>
        <h2>Managing Cookies</h2>
        <p>
          You can control cookies through your browser settings. Disabling
          cookies may affect your experience on our site.
        </p>
      </div>
    </main>
  );
}
