import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdmin() {
  if (!supabaseAdmin) throw new Error("Supabase admin not configured");
  return supabaseAdmin;
}

export async function GET() {
  const { data: articles, error } = await getAdmin()
    .from("articles")
    .select("slug")
    .eq("status", "scheduled")
    .lte("published_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!articles || articles.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  const slugs = articles.map((a) => a.slug);
  const now = new Date().toISOString();

  const { error: updateError } = await getAdmin()
    .from("articles")
    .update({ status: "published", published_at: now })
    .in("slug", slugs);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Revalidate each published article
  const revalidateSecret = process.env.REVALIDATE_SECRET;
  for (const slug of slugs) {
    try {
      await fetch(
        `https://${process.env.VERCEL_URL ?? "localhost:3000"}/api/revalidate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-secret": revalidateSecret ?? "",
          },
          body: JSON.stringify({ slug }),
        },
      );
    } catch {
      // Log error but continue
    }
  }

  return NextResponse.json({ published: slugs.length, slugs });
}
