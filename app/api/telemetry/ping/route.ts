import { NextResponse } from 'next/server';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

/**
 * POST /api/telemetry/ping
 *
 * Anonymous telemetry endpoint. Accepts { event, version, node_id, ts }
 * and inserts into the telemetry_pings table. Fire-and-forget from clients.
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

    await fetch(`${REGISTRY_URL}/rest/v1/telemetry_pings`, {
      method: 'POST',
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ event, version, node_id: node_id ?? null, ts }),
    });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
