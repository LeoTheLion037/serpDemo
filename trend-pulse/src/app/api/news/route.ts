import { NextRequest, NextResponse } from "next/server";
import { getJson } from "serpapi";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${rl.resetInSeconds}s.` },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(rl.resetInSeconds),
        },
      }
    );
  }

  // ── Validate query ───────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey || apiKey === "your_serpapi_key_here") {
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

    const articles = (data.news_results ?? [])
      .map(
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
          source: item.source?.name ?? "",
          sourceIcon: item.source?.icon ?? null,
          date: item.date ?? "",
          snippet: item.snippet ?? "",
          thumbnail: item.thumbnail ?? null,
        })
      )
      // Filter out articles with no title, no real link, or no named source
      .filter(
        (a: { title: string; link: string; source: string }) =>
          a.title &&
          a.link !== "#" &&
          a.source &&
          a.source.toLowerCase() !== "unknown"
      )
      .slice(0, 9);

    return NextResponse.json(
      { articles },
      { headers: { "X-RateLimit-Remaining": String(rl.remaining) } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
