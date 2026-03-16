/**
 * In-memory sliding-window rate limiter.
 * Shared by all Servicialo protocol endpoints.
 *
 * NOTE: In-memory — resets on every deploy/restart. This is acceptable for
 * single-instance Vercel deployments but will not work across multiple instances.
 * TODO: Migrate to Upstash Redis or Vercel KV for production multi-instance support.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;

// Prune stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((t: number) => now - t < WINDOW_MS);
      if (entry.timestamps.length === 0) store.delete(key);
    });
  }, 5 * 60_000);
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Drop timestamps outside window
  entry.timestamps = entry.timestamps.filter((t: number) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldest = entry.timestamps[0];
    return { allowed: false, remaining: 0, resetMs: oldest + WINDOW_MS - now };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: MAX_REQUESTS - entry.timestamps.length, resetMs: WINDOW_MS };
}
