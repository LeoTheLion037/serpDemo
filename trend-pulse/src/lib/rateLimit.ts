/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Each full "Analyze" search fires 3 parallel API calls (trends + news + search),
 * each consuming 1 SerpApi credit.  With 250 free credits we limit aggressively:
 *   - MAX_REQUESTS = 10 per IP per WINDOW_MS (1 hour)
 *   → ~3 full searches per IP per hour, ~83 full searches total before quota runs out.
 *
 * NOTE: In-memory state resets between Vercel cold starts / serverless invocations.
 * For a short raffle demo this is fine.  For longer-running apps, swap this out
 * for Upstash Redis (@upstash/ratelimit).
 */

const WINDOW_MS = 60 * 60 * 1_000; // 1 hour
const MAX_REQUESTS = 10;            // per IP per window

// Map<ip, timestamp[]>
const store = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Prune old entries
  const timestamps = (store.get(ip) ?? []).filter((t) => t > windowStart);

  const remaining = Math.max(0, MAX_REQUESTS - timestamps.length);
  const resetInSeconds = timestamps.length
    ? Math.ceil((timestamps[0] + WINDOW_MS - now) / 1_000)
    : 0;

  if (timestamps.length >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  timestamps.push(now);
  store.set(ip, timestamps);

  return { allowed: true, remaining: remaining - 1, resetInSeconds };
}

/** Extract a best-effort IP from a Next.js request */
export function getClientIp(req: Request): string {
  const headers = new Headers((req as Request).headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
