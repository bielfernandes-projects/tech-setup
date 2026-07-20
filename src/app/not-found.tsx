import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
      <h1 className="text-6xl font-bold text-zinc-200">404</h1>
      <p className="mt-4 text-lg text-zinc-600">
        Page not found.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}
