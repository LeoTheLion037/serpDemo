import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trend Pulse — Real-time Google Trends Dashboard",
  description:
    "Search any keyword and instantly see Google Trends interest over time, trending related queries, top news stories, and People Also Ask questions — all in one dashboard.",
  keywords: ["google trends", "news aggregator", "serpapi", "trending topics", "keyword research"],
  openGraph: {
    title: "Trend Pulse — Real-time Google Trends Dashboard",
    description: "Live keyword intelligence: trends, news, and related questions powered by SerpApi.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
