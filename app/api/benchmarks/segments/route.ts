/**
 * GET /api/benchmarks/segments
 *
 * Lists every (event_type, vertical, region) segment that satisfies the
 * k-anonymity floor (≥5 distinct org_fingerprints) over the window granted
 * to the caller's tier.
 *
 * Tiers (see lib/servicialo/contribution.ts):
 *   0 — anonymous: window = [now-180d, now-90d]   (90-day delay)
 *   1 — identified, not contributing: same as tier 0
 *   2 — active contributor: window = [now-90d, now]   (real-time)
 *
 * Optional query params:
 *   event_type — filter to a single event type
 *   region     — filter to a single ISO-2 region
 *   vertical   — filter to a single vertical
 */

import { NextResponse } from 'next/server';
import {
  resolveAccessTier,
  clampWindowForTier,
  DEFAULT_WINDOW_DAYS,
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

interface SegmentRow {
  event_type: string;
  vertical: string;
  region: string;
  sample_size: number;
  contributors: number;
  first_event: string;
  last_event: string;
}

export async function GET(request: Request) {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return NextResponse.json(
      { ok: false, error: 'registry_not_configured' },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  const access = await resolveAccessTier(request);

  const now = Date.now();
  const requestedWindow = {
    from: new Date(now - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date(now).toISOString(),
  };
  const window = clampWindowForTier(access.tier, requestedWindow);

  // For lower tiers the upper bound is clamped to now-90d. We still need a
  // lower bound — give them a 90-day band ending at that clamped point.
  let fromTs = window.from;
  if (window.clamped) {
    fromTs = new Date(
      Date.parse(window.to) - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  try {
    const res = await fetch(`${REGISTRY_URL}/rest/v1/rpc/list_telemetry_segments`, {
      method: 'POST',
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from_ts: fromTs, to_ts: window.to }),
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: 'registry_unreachable', status: res.status },
        { status: 502, headers: CORS_HEADERS },
      );
    }
    let segments = (await res.json()) as SegmentRow[];

    // Apply optional client-side filters (the RPC always returns all matching segments).
    const url = new URL(request.url);
    for (const k of ['event_type', 'vertical', 'region'] as const) {
      const v = url.searchParams.get(k);
      if (v) segments = segments.filter((s) => s[k] === v);
    }

    return NextResponse.json(
      {
        ok: true,
        window: { from: fromTs, to: window.to, clamped: window.clamped },
        privacy: { k_anonymity_threshold: K_ANONYMITY_FLOOR },
        access: {
          tier: access.tier,
          contribution_score: access.contribution_score,
          contribution_window_days: access.contribution_window_days,
          delay_days_when_clamped: DELAY_DAYS_FOR_LOWER_TIERS,
          message: access.message,
        },
        segments,
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
