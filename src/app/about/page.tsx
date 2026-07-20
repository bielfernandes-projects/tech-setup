import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Tech Setup — practical guides for developers.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About</h1>
      <div className="mt-8 prose prose-zinc max-w-none">
        <p>
          Tech Setup is a curated resource of practical guides for developers.
          We cover troubleshooting, software setup, and tools — with a focus on
          real-world solutions you can use today.
        </p>
        <p>
          Every article is researched, written, and reviewed by our editorial
          team. We test each solution before publishing to ensure accuracy.
        </p>
        <h2>Editorial Policy</h2>
        <p>
          All content is reviewed by a human editor before publication. We
          strive for accuracy and update articles when new information becomes
          available.
        </p>
        <p>
          Tech Setup is an independent publication. We may use affiliate links
          and display advertisements to support our work.
        </p>
      </div>
    </main>
  );
}
