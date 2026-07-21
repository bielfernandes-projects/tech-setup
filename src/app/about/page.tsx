import type { Metadata } from "next";

const siteUrl = "https://tech-setup.vercel.app";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Tech Setup — a curated resource of practical guides for developers, covering troubleshooting, software setup, AI tools, and DevOps.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Tech Setup",
    url: `${siteUrl}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "Tech Setup",
      url: siteUrl,
      description:
        "Tech Setup is an independent publication providing practical guides for developers. We cover troubleshooting, software setup, AI development, Linux, DevOps, and home automation.",
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
            Tech Setup is a curated resource of practical guides for developers.
            We cover troubleshooting, software setup, AI development, Linux, DevOps,
            and home automation — with a focus on real-world solutions you can use today.
          </p>

          <h2>Who We Are</h2>
          <p>
            We are a team of developers and technical writers who believe that
            great documentation should be free, accurate, and easy to find.
            Every guide we publish is researched, tested, and reviewed before it
            goes live.
          </p>

          <h2>What We Cover</h2>
          <ul>
            <li><strong>Troubleshooting</strong> — step-by-step fixes for common developer issues</li>
            <li><strong>Windows Setup</strong> — configuring Windows for development workflows</li>
            <li><strong>AI &amp; Development</strong> — RAG pipelines, prompt engineering, vibe coding, and LLM integration</li>
            <li><strong>Linux</strong> — server administration, Docker, and command-line workflows</li>
            <li><strong>DevOps</strong> — CI/CD pipelines, deployment automation, and infrastructure</li>
            <li><strong>Home Automation</strong> — smart home dashboards, Home Assistant, and IoT</li>
          </ul>

          <h2>Editorial Policy</h2>
          <p>
            All content is reviewed by a human editor before publication. We
            test each solution on real hardware and real software to ensure
            accuracy. When we find errors, we update articles promptly.
          </p>
          <p>
            We may use affiliate links and display advertisements to support
            our work. Our editorial content is never influenced by advertising
            relationships.
          </p>

          <h2>Get in Touch</h2>
          <p>
            Found an error? Have a suggestion? Visit our{" "}
            <a href="/contact">contact page</a> to get in touch. We respond
            to every message.
          </p>
        </div>
      </main>
    </>
  );
}
