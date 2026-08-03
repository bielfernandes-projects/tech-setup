import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "How Tech Setup creates, reviews, and updates its guides — our standards for accuracy, corrections, and disclosures.",
  alternates: {
    canonical: siteUrl("/editorial-policy"),
  },
};

export default function EditorialPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Editorial Policy
      </h1>
      <div className="mt-8 prose prose-zinc max-w-none text-sm">
        <p>Last updated: August 3, 2026</p>

        <h2>Mission</h2>
        <p>
          Tech Setup publishes practical, step-by-step guides for developers.
          The goal is to help readers solve real problems — a broken terminal,
          a misconfigured environment, an automation that needs building —
          with instructions they can follow on their own machines.
        </p>

        <h2>How Content Is Produced</h2>
        <p>
          Content on Tech Setup is created with the assistance of AI tools and
          then reviewed before publication. Every guide is checked against
          official documentation and reputable community sources for the tools
          it covers. This is an honest disclosure: the site is a small, solo
          project, not a newsroom with a team of editors.
        </p>

        <h2>Accuracy and Updates</h2>
        <p>
          Developer tools change quickly. When a guide is found to be outdated
          or incorrect, it is updated and the article date reflects the update.
          If a guide can no longer be kept accurate, it is unpublished rather
          than left to mislead readers.
        </p>

        <h2>Corrections</h2>
        <p>
          Errors are inevitable in technical content. If you spot a mistake or a
          guide that does not work for you, please report it via the{" "}
          <a href="/contact">contact page</a>. Reported issues are reviewed and
          applied as quickly as possible.
        </p>

        <h2>Advertising and Affiliate Links</h2>
        <p>
          Tech Setup may display advertisements and use affiliate links to
          support its hosting and running costs. Advertising relationships
          never determine what we publish, how guides are written, or how tools
          are ranked within an article.
        </p>

        <h2>Originality</h2>
        <p>
          We do not copy content from other sites. Guides are written from
          documentation and experience, and we do not republish other
          publications&apos; articles.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent through the{" "}
          <a href="/contact">contact page</a>.
        </p>
      </div>
    </main>
  );
}
