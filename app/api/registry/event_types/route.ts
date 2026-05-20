/**
 * GET /api/registry/event_types
 *
 * Returns the catalog of operational-telemetry event types defined by the
 * protocol. Static (the catalog grows only through an RFC), but exposed
 * as an endpoint so callers don't have to read the JSON Schema to know
 * what they can query against.
 *
 * Public, anonymous, cached 1 hour (changes are RFC-rare).
 */

import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

const EVENT_TYPES = [
  {
    name: 'booking_created',
    description: 'A booking was created. Carries lead-time, slot-hour, weekday, and channel buckets.',
    payload_fields: ['lead_time_bucket', 'slot_hour_bucket', 'weekday', 'channel'],
  },
  {
    name: 'service_completed',
    description:
      'A service reached a terminal lifecycle state (completed, no_show_client, no_show_provider, partial, canceled_late). Carries duration and outcome.',
    payload_fields: ['duration_bucket', 'outcome', 'evidence_completeness'],
  },
  {
    name: 'dispute_opened',
    description: 'A dispute was opened on a service. Carries opener role and reason category.',
    payload_fields: ['opened_by', 'reason_category', 'time_to_resolve_bucket', 'resolved_in_favor_of'],
  },
  {
    name: 'payment_settled',
    description: 'A payment was settled. Carries price band, currency, payment method, and time-to-collect bucket.',
    payload_fields: ['price_band', 'currency', 'payment_method', 'time_to_collect_bucket'],
  },
] as const;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      schema_url: 'https://servicialo.com/schema/telemetry/operational-event.schema.json',
      event_types: EVENT_TYPES,
    },
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=3600' },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
