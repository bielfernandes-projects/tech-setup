import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Terms of Service
      </h1>
      <div className="mt-8 prose prose-zinc max-w-none text-sm">
        <p>Last updated: July 20, 2026</p>
        <h2>Use of Content</h2>
        <p>
          All content on Tech Setup is provided for informational purposes only.
          While we strive for accuracy, we make no guarantees regarding the
          completeness or reliability of the information.
        </p>
        <h2>Intellectual Property</h2>
        <p>
          All content, trademarks, and data on this website are property of Tech
          Setup unless otherwise attributed.
        </p>
        <h2>Limitation of Liability</h2>
        <p>
          Tech Setup shall not be liable for any damages arising from the use of
          this website or its content.
        </p>
        <h2>Changes</h2>
        <p>
          We reserve the right to update these terms at any time. Changes will
          be posted on this page.
        </p>
      </div>
    </main>
  );
}
