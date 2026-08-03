import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdmin() {
  if (!supabaseAdmin) throw new Error("Supabase admin not configured");
  return supabaseAdmin;
}

export async function GET(request: NextRequest) {
  // Only Vercel Cron should be able to trigger this endpoint.
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.error("[cron/publish] CRON_SECRET is not configured");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: articles, error } = await getAdmin()
      .from("articles")
      .select("slug")
      .eq("status", "scheduled")
      .lte("published_at", new Date().toISOString());

    if (error) {
      console.error("[cron/publish] Failed to fetch scheduled articles:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({ published: 0 });
    }

    const slugs = articles.map((a) => a.slug);

    // Preserve the scheduled published_at (randomized time of day) — do not
    // stamp the cron run time on top of it.
    const { error: updateError } = await getAdmin()
      .from("articles")
      .update({ status: "published" })
      .in("slug", slugs);

    if (updateError) {
      console.error("[cron/publish] Failed to publish articles:", updateError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    // Revalidate public caches directly. No HTTP round-trip, no secret sharing.
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    for (const slug of slugs) {
      revalidatePath(`/blog/${slug}`);
    }

    return NextResponse.json({ published: slugs.length, slugs });
  } catch (err) {
    console.error("[cron/publish] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
