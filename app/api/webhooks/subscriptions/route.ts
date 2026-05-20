/**
 * /api/webhooks/subscriptions
 *
 * POST — create a webhook subscription. Returns the raw secret exactly once.
 * GET  — list this node's subscriptions (with health fields, no secrets).
 */

import { NextResponse } from 'next/server';
import { resolveNodeFromRequest, unauthorized } from '@/lib/auth/node-token';
import { CreateSubscriptionBody } from '@/lib/webhooks/schemas';
import {
  createSubscription,
  findActiveDuplicate,
  listForNode,
} from '@/lib/webhooks/storage';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Token',
} as const;

export async function POST(request: Request) {
  const auth = await resolveNodeFromRequest(request);
  if (!auth) return unauthorized();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const parsed = CreateSubscriptionBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.issues },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const existing = await findActiveDuplicate(
    auth.nodeId,
    parsed.data.url,
    parsed.data.subscribed_events,
  );
  if (existing) {
    return NextResponse.json(
      { error: 'duplicate', existing_id: existing.id },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  try {
    const created = await createSubscription({
      nodeId: auth.nodeId,
      url: parsed.data.url,
      subscribedEvents: parsed.data.subscribed_events,
    });
    return NextResponse.json(
      {
        id: created.id,
        url: created.url,
        subscribed_events: created.subscribed_events,
        secret: created.secret,
        created_at: created.created_at,
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'persist_failed', message: (err as Error).message },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export async function GET(request: Request) {
  const auth = await resolveNodeFromRequest(request);
  if (!auth) return unauthorized();

  const url = new URL(request.url);
  const activeParam = url.searchParams.get('active');
  const filter: { active?: boolean } = {};
  if (activeParam === 'true') filter.active = true;
  if (activeParam === 'false') filter.active = false;

  try {
    const subs = await listForNode(auth.nodeId, filter);
    return NextResponse.json(
      { subscriptions: subs },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'persist_failed', message: (err as Error).message },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
