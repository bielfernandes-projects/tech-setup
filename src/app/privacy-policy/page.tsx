import type { Metadata } from "next";

const siteUrl = "https://tech-setup.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Tech Setup privacy policy — how we collect, use, and protect your data.",
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <div className="mt-8 prose prose-zinc max-w-none text-sm">
        <p>Last updated: July 20, 2026</p>
        <h2>Information We Collect</h2>
        <p>
          We collect minimal information when you visit Tech Setup. This may
          include anonymized analytics data (page views, referring site) and any
          information you voluntarily provide via our contact form.
        </p>
        <h2>Cookies</h2>
        <p>
          We use cookies to improve your browsing experience and for analytics
          purposes. Third-party services (such as Google AdSense) may also set
          cookies for ad personalization.
        </p>
        <h2>Third-Party Services</h2>
        <p>
          We use Vercel for hosting and analytics. We may use Google AdSense for
          advertising, which sets cookies for ad targeting. These services have
          their own privacy policies.
        </p>
        <h2>Your Rights</h2>
        <p>
          You may request access to or deletion of any personal data we hold
          about you. Contact us at{" "}
          <a href="mailto:contact@techsetup.com">contact@techsetup.com</a>.
        </p>
      </div>
    </main>
  );
}
