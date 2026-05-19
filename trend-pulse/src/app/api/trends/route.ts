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
    // Fetch interest over time + related queries
    const trendsData = await getJson({
      engine: "google_trends",
      q,
      api_key: apiKey,
      date: "today 12-m",
      data_type: "TIMESERIES",
    });

    const relatedData = await getJson({
      engine: "google_trends",
      q,
      api_key: apiKey,
      data_type: "RELATED_QUERIES",
    });

    return NextResponse.json({
      interestOverTime: trendsData.interest_over_time?.timeline_data ?? [],
      relatedQueries: {
        rising: relatedData.related_queries?.rising ?? [],
        top: relatedData.related_queries?.top ?? [],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
