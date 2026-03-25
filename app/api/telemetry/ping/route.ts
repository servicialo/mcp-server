import { NextResponse } from 'next/server';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

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
    // ip-api.com — free, no key, 45 req/min. Fields: countryCode, country, continent.
    // We only request country-level fields for privacy.
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
  // x-forwarded-for can be a comma-separated list; take the first (client) IP
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') ?? '';
}

// ─── Route handlers ───

/**
 * POST /api/telemetry/ping
 *
 * Anonymous telemetry endpoint. Accepts { event, version, node_id, ts }
 * and inserts into the telemetry_pings table. Fire-and-forget from clients.
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

    // Resolve IP → country (fire-and-forget style: never blocks response on failure)
    const ip = extractIp(request);
    const geo = await resolveGeo(ip);

    await fetch(`${REGISTRY_URL}/rest/v1/telemetry_pings`, {
      method: 'POST',
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event,
        version,
        node_id: node_id ?? null,
        ts,
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
