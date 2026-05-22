/**
 * Aggregated search-miss logger.
 *
 * Best-effort upsert into search_miss_daily via the record_search_miss RPC.
 * NEVER blocks or throws into the request path — caller wraps in waitUntil.
 * A lost log is acceptable; a delayed/broken search is not.
 *
 * Free-text q is intentionally NOT captured — only structured signal
 * (country, vertical). The query_term column stays for future opt-in.
 */

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

export async function recordSearchMiss(bucket: {
  country: string;
  vertical: string;
}): Promise<void> {
  if (!REGISTRY_URL || !REGISTRY_KEY) return;

  try {
    const res = await fetch(`${REGISTRY_URL}/rest/v1/rpc/record_search_miss`, {
      method: 'POST',
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        p_country: bucket.country,
        p_vertical: bucket.vertical,
        p_query_term: '',
      }),
    });

    if (!res.ok) {
      console.warn(`[registry/search-miss] rpc ${res.status}`);
    }
  } catch (err) {
    console.warn('[registry/search-miss] failed:', (err as Error).message);
  }
}
