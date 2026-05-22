/**
 * Vertical normalization for the registry.
 *
 * Functionally identical to Coordinalo's
 * apps/web/src/lib/servicialo/verticals.ts — NFD + strip combining
 * diacriticals (U+0300..U+036F) + lower + trim. No interior whitespace
 * collapse: multi-word verticals like "salud mental" keep their shape.
 *
 * Kept verbatim across repos — if one moves, the other must move with
 * it or read/write diverge and matches break silently.
 */
export function normalizeVertical(v: string | null | undefined): string {
  if (!v) return '';
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Bot/crawler detection for the search-miss logger.
 *
 * Drops noise from the demand signal without dropping legitimate agent
 * traffic. Agents that identify honestly via UA (e.g. "ServicialoBot/1.0")
 * are still counted — that's the actual data. List and ignored-IP set are
 * env-driven so they can be tuned without redeploy.
 */
export function isNoiseUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  const extra = (process.env.REGISTRY_MISS_BOT_UA_EXTRA ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const builtins = [
    'googlebot',
    'bingbot',
    'duckduckbot',
    'yandex',
    'baiduspider',
    'ahrefsbot',
    'semrushbot',
    'mj12bot',
    'dotbot',
    'petalbot',
    'applebot',
    'facebookexternalhit',
    'gptbot',
    'ccbot',
    'claudebot',
  ];
  return [...builtins, ...extra].some((token) => lower.includes(token));
}

export function isIgnoredIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const list = (process.env.REGISTRY_MISS_IGNORED_IPS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(ip);
}
