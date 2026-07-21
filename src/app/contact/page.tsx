import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Tech Setup — questions, corrections, and topic suggestions welcome.",
  alternates: {
    canonical: siteUrl("/contact"),
  },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
      <div className="mt-8 prose prose-zinc max-w-none">
        <p>
          Have a question, found an error, or want to suggest a topic? Reach out
          to us:
        </p>
        <ul>
          <li>
            <strong>Errors & corrections: </strong> Let us know and we&apos;ll
            fix it promptly.
          </li>
          <li>
            <strong>Topic suggestions: </strong> We&apos;re always looking for
            new troubleshooting guides.
          </li>
        </ul>
        <p>
          Email:{" "}
          <a href="mailto:gabriel.fernandeshw@gmail.com">gabriel.fernandeshw@gmail.com</a>
        </p>
      </div>
    </main>
  );
}
