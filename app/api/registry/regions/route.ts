/**
 * GET /api/registry/regions
 *
 * Lists every country/region present in the network — combining where
 * registered nodes operate (registry_entries.country) with where
 * telemetry events have originated (telemetry_events.region) over the
 * last 30 days.
 *
 * Designed so an agent can ask "where is this protocol active?" before
 * issuing a benchmark query with a specific region.
 *
 * Public, anonymous, cached 60s.
 */

import { NextResponse } from 'next/server';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

interface RegistryRow {
  slug: string;
  country: string | null;
}

interface TelemetryRow {
  region: string;
}

function pgrestHeaders(): Record<string, string> {
  return {
    apikey: REGISTRY_KEY!,
    Authorization: `Bearer ${REGISTRY_KEY!}`,
    Accept: 'application/json',
  };
}

export async function GET() {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return NextResponse.json(
      { ok: false, error: 'registry_not_configured' },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  try {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [regRes, telRes] = await Promise.all([
      fetch(`${REGISTRY_URL}/rest/v1/registry_entries?select=slug,country&discoverable=eq.true`, {
        headers: pgrestHeaders(),
        next: { revalidate: 60 },
      }),
      fetch(
        `${REGISTRY_URL}/rest/v1/telemetry_events?select=region&occurred_at=gte.${since30d}&limit=50000`,
        { headers: pgrestHeaders(), next: { revalidate: 60 } },
      ),
    ]);

    if (!regRes.ok || !telRes.ok) {
      return NextResponse.json(
        { ok: false, error: 'registry_unreachable' },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    const regRows = (await regRes.json()) as RegistryRow[];
    const telRows = (await telRes.json()) as TelemetryRow[];

    const orgsByRegion = new Map<string, Set<string>>();
    for (const row of regRows) {
      if (!row.country) continue;
      const code = row.country.toUpperCase();
      if (code.length !== 2) continue; // skip non-ISO-2 like 'XX' fixtures
      if (!orgsByRegion.has(code)) orgsByRegion.set(code, new Set());
      orgsByRegion.get(code)!.add(row.slug);
    }

    const eventsByRegion = new Map<string, number>();
    for (const row of telRows) {
      if (!row.region) continue;
      const code = row.region.toUpperCase();
      if (code.length !== 2) continue;
      eventsByRegion.set(code, (eventsByRegion.get(code) ?? 0) + 1);
    }

    const allRegions = new Set<string>([
      ...Array.from(orgsByRegion.keys()),
      ...Array.from(eventsByRegion.keys()),
    ]);

    const regions = Array.from(allRegions)
      .map((code) => ({
        code,
        org_count: orgsByRegion.get(code)?.size ?? 0,
        event_count_30d: eventsByRegion.get(code) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.org_count - a.org_count ||
          b.event_count_30d - a.event_count_30d ||
          a.code.localeCompare(b.code),
      );

    return NextResponse.json(
      {
        ok: true,
        as_of: new Date().toISOString(),
        window_days: 30,
        regions,
      },
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60' },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'registry_unreachable', message: (err as Error).message },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
