/**
 * POST /api/telemetry/operational
 *
 * Receives anonymized, bucketed operational events from Servicialo-compatible
 * nodes and persists them in the registry's telemetry_events table. The
 * full event contract lives in schema/telemetry/operational-event.schema.json
 * and is validated here at the boundary.
 *
 * Fire-and-forget from the emitter's perspective — always returns 202 unless
 * the payload is structurally malformed.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Version',
} as const;

// Anti-abuse: max events per org_fingerprint per minute. Generous — a busy
// node may emit tens of events per minute legitimately. Anonymous nodes
// (no fingerprint) share a single bucket.
const RATE_LIMIT_PER_MIN = 120;

// ─── Schemas (mirror operational-event.schema.json with Zod) ───

const VerticalRe = /^[a-z][a-z0-9_-]{1,30}$/;
const RegionRe = /^[A-Z]{2}$/;

const BookingCreatedPayload = z.object({
  lead_time_bucket: z.enum([
    'same_day', '1-2_days', '3-7_days', '1-2_weeks', '2-4_weeks', '1+_months',
  ]),
  slot_hour_bucket: z.enum([
    '00-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24',
  ]),
  weekday: z.number().int().min(1).max(7),
  channel: z.enum(['agent', 'human']).optional(),
}).strict();

const ServiceCompletedPayload = z.object({
  duration_bucket: z.enum([
    'under_15min', '15-30min', '30-60min', '60-90min', '90-120min', 'over_120min',
  ]),
  outcome: z.enum([
    'completed', 'no_show_client', 'no_show_provider', 'partial', 'canceled_late',
  ]),
  evidence_completeness: z.enum(['complete', 'partial', 'missing']).optional(),
}).strict();

const DisputeOpenedPayload = z.object({
  opened_by: z.enum(['client', 'provider', 'organization']),
  reason_category: z.enum([
    'quality', 'no_show', 'billing', 'scope', 'evidence_missing', 'other',
  ]),
  time_to_resolve_bucket: z.enum([
    'under_24h', '1-3_days', '3-7_days', '1-2_weeks', 'over_2_weeks', 'unresolved',
  ]).optional(),
  resolved_in_favor_of: z.enum(['client', 'provider', 'split', 'unresolved']).optional(),
}).strict();

const PaymentSettledPayload = z.object({
  price_band: z.enum([
    '0-10k', '10-25k', '25-50k', '50-100k',
    '100-250k', '250-500k', '500k-1M', '1M+',
  ]),
  currency: z.string().regex(/^[A-Z]{3}$/),
  payment_method: z.enum([
    'cash', 'transfer', 'card_credit', 'card_debit',
    'insurance', 'voucher', 'subscription', 'other',
  ]),
  time_to_collect_bucket: z.enum([
    'immediate', 'within_24h', '1-7_days', '1-4_weeks', 'over_1_month', 'uncollected',
  ]),
}).strict();

const Envelope = z.object({
  protocol_version: z.string().min(1).max(16),
  node_version: z.string().min(1).max(32).optional(),
  event_type: z.enum(['booking_created', 'service_completed', 'dispute_opened', 'payment_settled']),
  vertical: z.string().regex(VerticalRe),
  region: z.string().regex(RegionRe),
  occurred_at: z.string().datetime(),
  org_fingerprint: z.string().min(8).max(128).optional(),
  payload: z.unknown(),
});

function validatePayload(eventType: z.infer<typeof Envelope>['event_type'], payload: unknown) {
  switch (eventType) {
    case 'booking_created':    return BookingCreatedPayload.safeParse(payload);
    case 'service_completed':  return ServiceCompletedPayload.safeParse(payload);
    case 'dispute_opened':     return DisputeOpenedPayload.safeParse(payload);
    case 'payment_settled':    return PaymentSettledPayload.safeParse(payload);
  }
}

// ─── Rate limit (in-memory, per-instance) ───

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function rateLimit(fingerprint: string): boolean {
  const key = fingerprint || 'anonymous';
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = rateLimitMap.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_PER_MIN) return false;
  bucket.count++;
  return true;
}

// ─── Route handlers ───

export async function POST(request: Request) {
  // If the registry isn't configured, accept silently to keep emitters happy.
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return NextResponse.json({ ok: true }, { status: 202, headers: CORS_HEADERS });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const envelope = Envelope.safeParse(raw);
  if (!envelope.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_envelope', issues: envelope.error.issues },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const payloadCheck = validatePayload(envelope.data.event_type, envelope.data.payload);
  if (!payloadCheck.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_payload', issues: payloadCheck.error.issues },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!rateLimit(envelope.data.org_fingerprint ?? '')) {
    // Silent accept — looks normal but doesn't store. Avoids leaking limits to emitters.
    return NextResponse.json({ ok: true }, { status: 202, headers: CORS_HEADERS });
  }

  // Persist via PostgREST
  try {
    const res = await fetch(`${REGISTRY_URL}/rest/v1/telemetry_events`, {
      method: 'POST',
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        protocol_version: envelope.data.protocol_version,
        node_version: envelope.data.node_version ?? null,
        event_type: envelope.data.event_type,
        vertical: envelope.data.vertical,
        region: envelope.data.region,
        occurred_at: envelope.data.occurred_at,
        org_fingerprint: envelope.data.org_fingerprint ?? null,
        payload: payloadCheck.data,
      }),
    });

    if (!res.ok) {
      // Don't echo Supabase internals to caller
      console.error('[telemetry.operational] persist failed:', res.status, await res.text());
      return NextResponse.json({ ok: false, error: 'persist_failed' }, { status: 502, headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: true }, { status: 202, headers: CORS_HEADERS });
  } catch (err) {
    console.error('[telemetry.operational] upstream error:', err);
    return NextResponse.json({ ok: false, error: 'upstream_error' }, { status: 502, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
