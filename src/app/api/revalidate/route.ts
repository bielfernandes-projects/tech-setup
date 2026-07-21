import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const SLUG_PATTERN = /^[a-z0-9-]{1,200}$/;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected) {
    console.error("[revalidate] REVALIDATE_SECRET is not configured");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const slug = (body as { slug?: unknown })?.slug;

  if (slug !== undefined) {
    if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug: must be a URL-safe slug string" },
        { status: 400 },
      );
    }
    revalidatePath(`/blog/${slug}`);
  }

  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true });
}
