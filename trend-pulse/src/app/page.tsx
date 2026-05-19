"use client";

import { useState, useCallback, FormEvent } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface TimelinePoint {
  date: string;
  timestamp: string;
  values: { query: string; value: string; extracted_value: number }[];
}

interface RelatedQuery {
  query: string;
  value: string;
  extracted_value: number;
  link: string;
}

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  sourceIcon: string | null;
  date: string;
  snippet: string;
  thumbnail: string | null;
}

interface PAA {
  question: string;
  snippet: string;
  link: string;
  source: string;
}

interface DashboardData {
  trends: {
    interestOverTime: TimelinePoint[];
    relatedQueries: { rising: RelatedQuery[]; top: RelatedQuery[] };
  } | null;
  news: NewsArticle[];
  paa: PAA[];
}

/* ─── Custom Tooltip ─────────────────────────────────────────────────────────── */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-value">{payload[0].value}</div>
    </div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="skeleton-wrap">
      <div className="skeleton-section">
        <div className="skeleton-bar" style={{ width: "30%", height: 20 }} />
        <div className="skeleton-card" />
      </div>
      <div className="skeleton-section">
        <div className="skeleton-bar" style={{ width: "22%", height: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-bar" style={{ width: "26%", height: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card" style={{ height: 80 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PAA Item ───────────────────────────────────────────────────────────────── */
function PAAItem({ item }: { item: PAA }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="paa-item">
      <button
        className="paa-question-btn"
        onClick={() => setOpen((o) => !o)}
        id={`paa-${encodeURIComponent(item.question.slice(0, 30))}`}
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <span className={`paa-chevron${open ? " open" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="paa-answer">
          <p>{item.snippet}</p>
          {item.source && (
            <p className="paa-source">
              Source:{" "}
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.source}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── News Card ──────────────────────────────────────────────────────────────── */
function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card"
      id={`news-${encodeURIComponent(article.title.slice(0, 30))}`}
    >
      {article.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.thumbnail}
          alt={article.title}
          className="news-thumbnail"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="news-thumb-placeholder">📰</div>
      )}
      <div className="news-body">
        <div className="news-meta">
          {article.sourceIcon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.sourceIcon} alt="" className="news-source-icon" />
          )}
          <span className="news-source">{article.source}</span>
          <span className="news-date">{article.date}</span>
        </div>
        <h3 className="news-title">{article.title}</h3>
        {article.snippet && <p className="news-snippet">{article.snippet}</p>}
        <div className="news-read-more">Read more ↗</div>
      </div>
    </a>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
const HOT_SEARCHES = ["AI agents", "climate change", "SpaceX", "NFL 2025", "quantum computing"];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [relTab, setRelTab] = useState<"rising" | "top">("rising");

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setActiveQuery(q.trim());

    try {
      const [trendsRes, newsRes, searchRes] = await Promise.all([
        fetch(`/api/trends?q=${encodeURIComponent(q)}`),
        fetch(`/api/news?q=${encodeURIComponent(q)}`),
        fetch(`/api/search?q=${encodeURIComponent(q)}`),
      ]);

      const [trendsJson, newsJson, searchJson] = await Promise.all([
        trendsRes.json(),
        newsRes.json(),
        searchRes.json(),
      ]);

      if (trendsJson.error || newsJson.error || searchJson.error) {
        setError(trendsJson.error ?? newsJson.error ?? searchJson.error);
        setData(null);
      } else {
        setData({
          trends: trendsJson,
          news: newsJson.articles ?? [],
          paa: searchJson.peopleAlsoAsk ?? [],
        });
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  /* Chart data */
  const chartData =
    data?.trends?.interestOverTime.map((pt) => ({
      date: pt.date.replace(/\s\d{4}$/, ""),
      value: pt.values[0]?.extracted_value ?? 0,
    })) ?? [];

  /* Related queries for current tab */
  const relQueries =
    (relTab === "rising"
      ? data?.trends?.relatedQueries.rising
      : data?.trends?.relatedQueries.top) ?? [];

  const maxRel = Math.max(1, ...relQueries.map((r) => r.extracted_value));

  /* Stats */
  const avgInterest =
    chartData.length
      ? Math.round(chartData.reduce((s, d) => s + d.value, 0) / chartData.length)
      : 0;
  const peakInterest = chartData.length ? Math.max(...chartData.map((d) => d.value)) : 0;

  return (
    <div className="app-wrapper">
      {/* ── Header ── */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-icon">📡</div>
              <div>
                <div className="logo-text">Trend Pulse</div>
                <div className="logo-sub">Real-time trend intelligence</div>
              </div>
            </div>
            <div className="powered-badge">
              ⚡ Powered by{" "}
              <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer">
                SerpApi
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="container">
            <h1 className="hero-title">
              What&apos;s{" "}
              <span className="gradient-word">trending</span>
              <br />
              right now?
            </h1>
            <p className="hero-sub">
              Search any keyword to see live Google Trends, top news stories, and
              questions people are asking — all in one place.
            </p>

            <form className="search-form" onSubmit={handleSubmit} role="search">
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  id="main-search-input"
                  className="search-input"
                  type="search"
                  placeholder="e.g. artificial intelligence, Bitcoin, climate..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <button
                id="search-submit-btn"
                className="search-btn"
                type="submit"
                disabled={loading || !query.trim()}
              >
                {loading ? "Searching…" : "Analyze →"}
              </button>
            </form>

            <div className="hot-searches" role="navigation" aria-label="Quick search examples">
              <span className="hot-label">🔥 Try:</span>
              {HOT_SEARCHES.map((term) => (
                <button
                  key={term}
                  className="hot-tag"
                  id={`hot-tag-${term.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => {
                    setQuery(term);
                    runSearch(term);
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Dashboard ── */}
        <div className="dashboard">
          <div className="container">
            {error && (
              <div className="error-box" role="alert">
                ⚠️ {error}
              </div>
            )}

            {loading && <LoadingSkeleton />}

            {!loading && data && (
              <>
                {/* Stats bar */}
                <div className="stats-bar" role="region" aria-label="Search statistics">
                  <div className="stat-item">
                    <div className="stat-value">{data.news.length}</div>
                    <div className="stat-label">News Stories</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{relQueries.length}</div>
                    <div className="stat-label">Related Queries</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{data.paa.length}</div>
                    <div className="stat-label">People Ask</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{avgInterest}</div>
                    <div className="stat-label">Avg Interest</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{peakInterest}</div>
                    <div className="stat-label">Peak Interest</div>
                  </div>
                </div>

                {/* ── Trends section ── */}
                {data.trends && (
                  <section aria-label="Google Trends" style={{ marginBottom: 32 }}>
                    <div className="section-header">
                      <div className="section-icon blue">📈</div>
                      <h2 className="section-title">Interest Over Time</h2>
                      <span className="section-badge badge-blue">Google Trends</span>
                    </div>

                    <div className="trends-grid">
                      {/* Chart */}
                      <div className="card chart-card">
                        <div className="chart-title">
                          &ldquo;{activeQuery}&rdquo; — last 12 months
                        </div>
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={220}>
                            <AreaChart
                              data={chartData}
                              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#639dff" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#639dff" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,157,255,0.07)" />
                              <XAxis
                                dataKey="date"
                                tick={{ fill: "#7a8fa8", fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                              />
                              <YAxis
                                tick={{ fill: "#7a8fa8", fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#639dff"
                                strokeWidth={2}
                                fill="url(#colorValue)"
                                dot={false}
                                activeDot={{ r: 5, fill: "#639dff", stroke: "#0f1623", strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="state-box" style={{ padding: "40px 0" }}>
                            <div className="state-sub">No trend data available for this query.</div>
                          </div>
                        )}
                      </div>

                      {/* Related Queries */}
                      <div className="card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Related Queries
                          </span>
                          <div className="related-tabs">
                            <button
                              id="tab-rising"
                              className={`rel-tab${relTab === "rising" ? " active" : ""}`}
                              onClick={() => setRelTab("rising")}
                            >
                              Rising
                            </button>
                            <button
                              id="tab-top"
                              className={`rel-tab${relTab === "top" ? " active" : ""}`}
                              onClick={() => setRelTab("top")}
                            >
                              Top
                            </button>
                          </div>
                        </div>

                        {relQueries.length > 0 ? (
                          <div className="related-list">
                            {relQueries.slice(0, 8).map((item, i) => (
                              <div key={item.query} className="related-item">
                                <span className="rel-rank">{i + 1}</span>
                                <div style={{ flex: 1, overflow: "hidden" }}>
                                  <div className="rel-query">{item.query}</div>
                                  <div className="rel-bar-wrap">
                                    <div
                                      className="rel-bar"
                                      style={{
                                        width: `${Math.round((item.extracted_value / maxRel) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                                <span className="rel-value">
                                  {item.value === "Breakout" ? "🔥" : item.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                            No related queries found.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* ── News section ── */}
                {data.news.length > 0 && (
                  <section aria-label="Top news" style={{ marginBottom: 32 }}>
                    <div className="section-header">
                      <div className="section-icon purple">📰</div>
                      <h2 className="section-title">Top News Stories</h2>
                      <span className="section-badge badge-purple">Google News</span>
                    </div>
                    <div className="news-grid">
                      {data.news.map((article, i) => (
                        <NewsCard key={`${i}-${article.link}`} article={article} />
                      ))}
                    </div>
                  </section>
                )}

                {/* ── People Also Ask ── */}
                {data.paa.length > 0 && (
                  <section aria-label="People also ask">
                    <div className="section-header">
                      <div className="section-icon cyan">💬</div>
                      <h2 className="section-title">People Also Ask</h2>
                      <span className="section-badge badge-cyan">Google Search</span>
                    </div>
                    <div className="paa-grid">
                      {data.paa.map((item, i) => (
                        <PAAItem key={`${i}-${item.question}`} item={item} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Empty state */}
            {!loading && !data && !error && (
              <div className="state-box">
                <div className="state-icon">🌐</div>
                <h2 className="state-title">Ready to pulse</h2>
                <p className="state-sub">
                  Type any keyword above and hit <strong>Analyze</strong> to see live trends,
                  top news, and what people are asking about it right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          Built with{" "}
          <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer">
            SerpApi
          </a>{" "}
          · Google Trends · Google News · Google Search ·{" "}
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
            Next.js
          </a>
        </div>
      </footer>
    </div>
  );
}
