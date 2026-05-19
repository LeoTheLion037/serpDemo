# Trend Pulse 📡

> Real-time keyword intelligence dashboard powered by [SerpApi](https://serpapi.com)

Search any keyword and instantly see:
- 📈 **Google Trends** — interest over time (12-month area chart) + rising & top related queries
- 📰 **Top News Stories** — latest articles from Google News with thumbnails, source, and snippets
- 💬 **People Also Ask** — expandable accordion of related questions from Google Search

![Trend Pulse Screenshot](./screenshot.png)

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/trend-pulse.git
cd trend-pulse
npm install
```

### 2. Set up your SerpApi key

Create a free account at [serpapi.com](https://serpapi.com/) (250 free searches/month).

```bash
cp .env.local.example .env.local
```

Open `.env.local` and replace `your_serpapi_key_here` with your actual key from [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key).

```env
SERPAPI_KEY=your_actual_key_here
```

> ⚠️ **Never commit your `.env.local` file.** It is already in `.gitignore`.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Charting | [Recharts](https://recharts.org/) |
| Data | [SerpApi Node SDK](https://serpapi.com/integrations/node) (`serpapi` npm package) |
| Styling | Vanilla CSS — dark mode, glassmorphism, animations |
| Deployment | [Vercel](https://vercel.com/) |

---

## 📡 SerpApi Endpoints Used

| Feature | SerpApi Engine |
|---------|---------------|
| Interest Over Time | `google_trends` + `data_type: TIMESERIES` |
| Related Queries | `google_trends` + `data_type: RELATED_QUERIES` |
| Top News | `google_news` |
| People Also Ask | `google` (organic `related_questions`) |

---

## 📂 Project Structure

```
trend-pulse/
├── src/
│   └── app/
│       ├── page.tsx              # Main dashboard (client component)
│       ├── layout.tsx            # Root layout + SEO metadata
│       ├── globals.css           # Full design system
│       └── api/
│           ├── trends/route.ts   # Google Trends API route
│           ├── news/route.ts     # Google News API route
│           └── search/route.ts   # Google Search (PAA) API route
├── .env.local.example
└── README.md
```

---

Built for the SerpApi raffle challenge at Tech Ex 2026 🎯
