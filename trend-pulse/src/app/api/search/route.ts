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
      engine: "google",
      q,
      api_key: apiKey,
      gl: "us",
      hl: "en",
      num: 5,
    });

    const paa = (data.related_questions ?? []).slice(0, 8).map(
      (item: {
        question?: string;
        snippet?: string;
        link?: string;
        displayed_link?: string;
      }) => ({
        question: item.question ?? "",
        snippet: item.snippet ?? "",
        link: item.link ?? "#",
        source: item.displayed_link ?? "",
      })
    );

    return NextResponse.json(
      { peopleAlsoAsk: paa },
      { headers: { "X-RateLimit-Remaining": String(rl.remaining) } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
