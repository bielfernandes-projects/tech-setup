import type { Metadata } from "next";
import { site, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Tech Setup — an independent publication with practical, step-by-step guides for developers, from troubleshooting to AI development and DevOps.",
  alternates: {
    canonical: siteUrl("/about"),
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${site.name}`,
    url: siteUrl("/about"),
    mainEntity: {
      "@type": "Organization",
      name: site.name,
      url: siteUrl(),
      description:
        "Tech Setup is an independent publication providing practical, step-by-step guides for developers. It covers troubleshooting, software setup, AI development, Linux, DevOps, and home automation.",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About Tech Setup</h1>
        <div className="mt-8 prose prose-zinc max-w-none">
          <p>
            Tech Setup is an independent publication with practical, step-by-step
            guides for developers. It focuses on real-world solutions you can use
            today — from troubleshooting and Windows configuration to AI development,
            DevOps, and home automation.
          </p>

          <h2>What This Site Is</h2>
          <p>
            Tech Setup is a solo project maintained by one person. It is not a
            corporate publication. The goal is simple: clear, structured how-to
            content that developers can follow quickly and trust enough to run
            on their own machines.
          </p>

          <h2>What We Cover</h2>
          <ul>
            <li><strong>Troubleshooting</strong> — step-by-step fixes for common developer issues</li>
            <li><strong>Windows Setup</strong> — configuring Windows for development workflows</li>
            <li><strong>AI &amp; Development</strong> — AI coding tools, prompt engineering, and LLM integration</li>
            <li><strong>Programming &amp; Automation</strong> — language guides, npm tooling, and workflow automation with n8n and Make</li>
            <li><strong>DevOps</strong> — CI/CD pipelines, deployment automation, and infrastructure</li>
            <li><strong>Home Automation</strong> — smart home dashboards, Home Assistant, and IoT</li>
          </ul>

          <h2>How Guides Are Made</h2>
          <p>
            Guides are written with reference to official documentation and
            reputable community sources, then reviewed before publication. When a
            tool changes or a guide is no longer accurate, it is updated and the
            change is reflected in the article&apos;s date.
          </p>
          <p>
            Our editorial process is described in full on the{" "}
            <a href="/editorial-policy">editorial policy</a> page.
          </p>

          <h2>Corrections</h2>
          <p>
            Found an error or a guide that no longer works on your machine? Tell
            us about it on the <a href="/contact">contact page</a>. Corrections
            are reviewed and the guide is updated.
          </p>
        </div>
      </main>
    </>
  );
}
