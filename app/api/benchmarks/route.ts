/**
 * GET /api/benchmarks
 *
 * Returns the distribution of bucketed payload fields for a (event_type, vertical, region)
 * segment over a time window. All payload fields in the operational-event schema are
 * already bucketed (categorical), so the "benchmark" is the share of each bucket within
 * the segment — not a numeric percentile.
 *
 * Privacy floor: a segment is only returned if it has ≥5 distinct org_fingerprints.
 * Below that, the response is { ok: false, reason: "insufficient_data", contributors }.
 *
 * Query params:
 *   event_type   — one of booking_created | service_completed | dispute_opened | payment_settled
 *   vertical     — required (e.g. health, legal, home)
 *   region       — required, ISO 3166-1 alpha-2 (e.g. CL)
 *   from         — ISO date or datetime; default now() - 90d
 *   to           — ISO date or datetime; default now()
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  resolveAccessTier,
  clampWindowForTier,
  DELAY_DAYS_FOR_LOWER_TIERS,
} from '@/lib/servicialo/contribution';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Token',
} as const;

const K_ANONYMITY_FLOOR = 5;
const MAX_ROWS = 10000;

const QuerySchema = z.object({
  event_type: z.enum([
    'booking_created', 'service_completed', 'dispute_opened', 'payment_settled',
  ]),
  vertical: z.string().regex(/^[a-z][a-z0-9_-]{1,30}$/),
  region: z.string().regex(/^[A-Z]{2}$/),
  from: z.string().optional(),
  to: z.string().optional(),
});

function defaultWindow(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function normalizeBoundary(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  // Accept "YYYY-MM-DD" by padding to midnight UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00.000Z`;
  // Otherwise expect parseable ISO
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toISOString();
}

interface TelemetryRow {
  org_fingerprint: string | null;
  payload: Record<string, unknown>;
}

type Distribution = Record<string, Record<string, { count: number; share: number }>>;

function buildDistribution(rows: TelemetryRow[]): Distribution {
  const counters: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    if (!r.payload || typeof r.payload !== 'object') continue;
    for (const [field, value] of Object.entries(r.payload)) {
      const key = String(value);
      counters[field] ??= {};
      counters[field][key] = (counters[field][key] ?? 0) + 1;
    }
  }
  const total = rows.length || 1;
  const dist: Distribution = {};
  for (const [field, buckets] of Object.entries(counters)) {
    dist[field] = {};
    const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
    for (const [bucket, count] of entries) {
      dist[field][bucket] = {
        count,
        share: Math.round((count / total) * 10000) / 10000,
      };
    }
  }
  return dist;
}

export async function GET(request: Request) {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return NextResponse.json(
      { ok: false, error: 'registry_not_configured' },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_query', issues: parsed.error.issues },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const defaults = defaultWindow();
  const requestedFrom = normalizeBoundary(parsed.data.from, defaults.from);
  const requestedTo = normalizeBoundary(parsed.data.to, defaults.to);

  const access = await resolveAccessTier(request);
  const window = clampWindowForTier(access.tier, { from: requestedFrom, to: requestedTo });
  const fromIso = window.from;
  const toIso = window.to;

  const qs = new URLSearchParams({
    select: 'org_fingerprint,payload',
    event_type: `eq.${parsed.data.event_type}`,
    vertical: `eq.${parsed.data.vertical}`,
    region: `eq.${parsed.data.region}`,
    occurred_at: `gte.${fromIso}`,
    limit: String(MAX_ROWS),
  });
  qs.append('occurred_at', `lt.${toIso}`);

  let rows: TelemetryRow[];
  try {
    const res = await fetch(`${REGISTRY_URL}/rest/v1/telemetry_events?${qs.toString()}`, {
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: 'registry_unreachable', status: res.status },
        { status: 502, headers: CORS_HEADERS },
      );
    }
    rows = await res.json() as TelemetryRow[];
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'registry_unreachable', message: (err as Error).message },
      { status: 502, headers: CORS_HEADERS },
    );
  }

  const contributors = new Set<string>();
  for (const r of rows) {
    if (r.org_fingerprint) contributors.add(r.org_fingerprint);
  }
  const contributorCount = contributors.size;

  const segment = {
    event_type: parsed.data.event_type,
    vertical: parsed.data.vertical,
    region: parsed.data.region,
    from: fromIso,
    to: toIso,
    window_clamped: window.clamped,
  };

  const accessBlock = {
    tier: access.tier,
    contribution_score: access.contribution_score,
    contribution_window_days: access.contribution_window_days,
    delay_days_when_clamped: DELAY_DAYS_FOR_LOWER_TIERS,
    message: access.message,
  };

  if (contributorCount < K_ANONYMITY_FLOOR) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'insufficient_data',
        contributors: contributorCount,
        threshold: K_ANONYMITY_FLOOR,
        segment,
        sample_size: rows.length,
        access: accessBlock,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  }

  const distribution = buildDistribution(rows);

  return NextResponse.json(
    {
      ok: true,
      segment,
      sample_size: rows.length,
      contributors: contributorCount,
      distribution,
      privacy: { k_anonymity_threshold: K_ANONYMITY_FLOOR },
      access: accessBlock,
    },
    { status: 200, headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60' } },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
