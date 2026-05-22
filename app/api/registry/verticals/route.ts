/**
 * GET /api/registry/verticals
 *
 * Lists every vertical present in the network — combining what registry
 * nodes declare (registry_entries.verticals[]) with what telemetry has
 * actually observed (telemetry_events.vertical over the last 30 days).
 *
 * Designed for callers who arrive without prior knowledge of the protocol
 * taxonomy — e.g. an AI agent that needs to ask "what's even available?"
 * before issuing a market.get_benchmark with a specific vertical.
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
  verticals: string[] | null;
}

interface TelemetryRow {
  vertical: string;
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
      fetch(`${REGISTRY_URL}/rest/v1/registry_entries?select=slug,verticals&discoverable=eq.true`, {
        headers: pgrestHeaders(),
        next: { revalidate: 60 },
      }),
      fetch(
        `${REGISTRY_URL}/rest/v1/telemetry_events?select=vertical&occurred_at=gte.${since30d}&limit=50000`,
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

    // Org count per vertical (from registry declarations)
    const orgsByVertical = new Map<string, Set<string>>();
    for (const row of regRows) {
      if (!Array.isArray(row.verticals)) continue;
      for (const v of row.verticals) {
        if (!v) continue;
        const lower = String(v).toLowerCase();
        if (!orgsByVertical.has(lower)) orgsByVertical.set(lower, new Set());
        orgsByVertical.get(lower)!.add(row.slug);
      }
    }

    // Event count per vertical (last 30 days)
    const eventsByVertical = new Map<string, number>();
    for (const row of telRows) {
      if (!row.vertical) continue;
      const lower = String(row.vertical).toLowerCase();
      eventsByVertical.set(lower, (eventsByVertical.get(lower) ?? 0) + 1);
    }

    // Union of all observed verticals
    const allVerticals = new Set<string>([
      ...Array.from(orgsByVertical.keys()),
      ...Array.from(eventsByVertical.keys()),
    ]);

    const verticals = Array.from(allVerticals)
      .map((v) => ({
        name: v,
        org_count: orgsByVertical.get(v)?.size ?? 0,
        event_count_30d: eventsByVertical.get(v) ?? 0,
      }))
      // Hide test fixtures from public discovery
      .filter((v) => !v.name.startsWith('_'))
      .sort(
        (a, b) =>
          b.org_count - a.org_count ||
          b.event_count_30d - a.event_count_30d ||
          a.name.localeCompare(b.name),
      );

    return NextResponse.json(
      {
        ok: true,
        as_of: new Date().toISOString(),
        window_days: 30,
        verticals,
      },
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
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
