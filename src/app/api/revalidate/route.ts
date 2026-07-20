import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!secret || secret !== expected) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const { slug } = await request.json();

  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }

  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true });
}
