import { NextResponse } from 'next/server';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

// Max registrations per IP-fingerprint per hour (rate limit)
const RATE_LIMIT_PER_HOUR = 3;

// ─── IP geolocation (country-level only, no city/region) ───

interface GeoResult {
  country_code: string | null;
  country_name: string | null;
  continent: string | null;
}

const CONTINENT_MAP: Record<string, string> = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
};

async function resolveGeo(ip: string): Promise<GeoResult> {
  const empty: GeoResult = { country_code: null, country_name: null, continent: null };
  if (!ip || ip === '127.0.0.1' || ip === '::1') return empty;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,country,continentCode`,
      { signal: AbortSignal.timeout(2000) },
    );
    if (!res.ok) return empty;

    const data = await res.json() as {
      status: string;
      countryCode?: string;
      country?: string;
      continentCode?: string;
    };

    if (data.status !== 'success') return empty;

    return {
      country_code: data.countryCode ?? null,
      country_name: data.country ?? null,
      continent: CONTINENT_MAP[data.continentCode ?? ''] ?? null,
    };
  } catch {
    return empty;
  }
}

function extractIp(request: Request): string {
  const h = request.headers;
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') ?? '';
}

// ─── Fingerprinting (privacy-preserving) ───

/**
 * SHA-256 hash of IP + User-Agent. Never stores the raw IP or UA.
 * Used for: (1) rate limiting, (2) dedup across ephemeral node_ids.
 */
async function computeIpHash(ip: string, ua: string): Promise<string> {
  const raw = `${ip}::${ua}`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check how many telemetry rows this ip_hash has created in the last hour.
 * Returns true if under the limit.
 */
async function checkRateLimit(ipHash: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: 'id',
    ip_hash: `eq.${ipHash}`,
    created_at: `gte.${oneHourAgo}`,
  });

  const res = await fetch(
    `${REGISTRY_URL}/rest/v1/telemetry_instances?${params.toString()}`,
    {
      headers: {
        apikey: REGISTRY_KEY!,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    },
  );

  if (!res.ok) return true; // fail open — don't block legitimate users on DB errors

  const contentRange = res.headers.get('content-range');
  // content-range format: "0-N/total" or "*/total"
  const total = contentRange ? parseInt(contentRange.split('/').pop() ?? '0', 10) : 0;

  return total < RATE_LIMIT_PER_HOUR;
}

// ─── Route handlers ───

/**
 * POST /api/telemetry/instance
 *
 * Anonymous telemetry endpoint. Accepts { event, version, node_id, ts }
 * and upserts into the telemetry_instances table. Fire-and-forget from clients.
 *
 * Anti-bot protections:
 * 1. Rate limit: max 3 registrations per IP-fingerprint per hour.
 * 2. Fingerprint dedup: SHA-256(IP+UA) stored as ip_hash.
 *    The unique index (ip_hash, event, day) ensures one row per
 *    real origin per day, even if node_ids change (ephemeral containers).
 * 3. node_id dedup still works for legitimate long-lived nodes.
 *
 * Server-side: resolves the request IP to country-level geolocation.
 * Never stores city, region, or the IP itself.
 */
export async function POST(request: Request) {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  }

  try {
    const body = await request.json();

    const { event, version, node_id, ts } = body as {
      event?: string;
      version?: string;
      node_id?: string;
      ts?: number;
    };

    if (!event || !version || !ts) {
      return NextResponse.json(
        { error: 'Missing required fields: event, version, ts' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Compute fingerprint: SHA-256(IP + User-Agent)
    const ip = extractIp(request);
    const ua = request.headers.get('user-agent') ?? '';
    const ipHash = await computeIpHash(ip, ua);

    // Rate limit: max N registrations per ip_hash per hour
    const allowed = await checkRateLimit(ipHash);
    if (!allowed) {
      // Silently accept but don't store — looks normal to the caller
      return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
    }

    // Resolve IP → country
    const geo = await resolveGeo(ip);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Upsert with dual dedup:
    // - idx_telemetry_ip_dedup: (ip_hash, event, day) — catches ephemeral node_ids
    // - idx_telemetry_instances_dedup: (node_id, event, day) — catches same node restarting
    // PostgREST merge-duplicates uses the UNIQUE constraint to decide conflict.
    await fetch(`${REGISTRY_URL}/rest/v1/telemetry_instances`, {
      method: 'POST',
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal,resolution=merge-duplicates',
      },
      body: JSON.stringify({
        event,
        version,
        node_id: node_id ?? null,
        ts,
        ip_hash: ipHash,
        day: today,
        country_code: geo.country_code,
        country_name: geo.country_name,
        continent: geo.continent,
      }),
    });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
