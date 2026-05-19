import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SERPAPI_KEY not configured" }, { status: 500 });
  }

  try {
    const data = await getJson({
      engine: "google_news",
      q,
      api_key: apiKey,
      gl: "us",
      hl: "en",
    });

    const articles = (data.news_results ?? []).slice(0, 9).map(
      (item: {
        title?: string;
        link?: string;
        source?: { name?: string; icon?: string };
        date?: string;
        snippet?: string;
        thumbnail?: string;
      }) => ({
        title: item.title ?? "",
        link: item.link ?? "#",
        source: item.source?.name ?? "Unknown",
        sourceIcon: item.source?.icon ?? null,
        date: item.date ?? "",
        snippet: item.snippet ?? "",
        thumbnail: item.thumbnail ?? null,
      })
    );

    return NextResponse.json({ articles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
