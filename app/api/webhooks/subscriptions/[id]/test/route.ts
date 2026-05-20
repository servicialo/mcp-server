/**
 * POST /api/webhooks/subscriptions/{id}/test
 *
 * Enqueues a `webhook.test` delivery for the caller's subscription and
 * processes it inline so the developer sees the outcome in the same
 * response (status + response code from their endpoint).
 *
 * Body (optional): { payload?: Record<string, unknown> } — the consumer can
 * inject custom data inside `data.payload` for end-to-end verification.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveNodeFromRequest, unauthorized } from '@/lib/auth/node-token';
import { findOwnedById } from '@/lib/webhooks/storage';
import { enqueueForSubscription } from '@/lib/webhooks/dispatch';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Token',
} as const;

const TestBody = z
  .object({ payload: z.record(z.string(), z.unknown()).optional() })
  .strict()
  .or(z.undefined());

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await resolveNodeFromRequest(request);
  if (!auth) return unauthorized();

  const existing = await findOwnedById(auth.nodeId, params.id);
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_HEADERS });
  }
  if (!existing.active) {
    return NextResponse.json(
      { error: 'inactive_subscription', message: 'Reactivate the subscription before testing.' },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  let body: { payload?: Record<string, unknown> } | undefined;
  try {
    const text = await request.text();
    if (text) {
      const parsed = TestBody.safeParse(JSON.parse(text));
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'validation_failed', issues: parsed.error.issues },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      body = parsed.data;
    }
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const data: Record<string, unknown> = {
    test: true,
    note: 'This is a test delivery initiated from /api/webhooks/subscriptions/{id}/test.',
    ...(body?.payload ? { payload: body.payload } : {}),
  };

  try {
    const delivery = await enqueueForSubscription({
      subscriptionId: params.id,
      event: 'webhook.test',
      data,
      processNow: true,
    });
    return NextResponse.json(
      {
        delivery_id: delivery.id,
        event_id: delivery.event_id,
        status: delivery.status,
        attempts: delivery.attempts,
        response_status: delivery.response_status,
      },
      { status: 202, headers: CORS_HEADERS },
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
