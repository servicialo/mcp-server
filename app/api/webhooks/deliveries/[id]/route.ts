/**
 * GET /api/webhooks/deliveries/{id}
 *
 * Returns the current state of a delivery so a subscriber can poll after
 * triggering a /test or wanting to debug a failed weekly snapshot.
 *
 * Ownership: the subscription pointed to by the delivery must belong to
 * the caller, otherwise 404 (per the same "don't reveal existence" rule
 * as the subscriptions endpoints).
 */

import { NextResponse } from 'next/server';
import { resolveNodeFromRequest, unauthorized } from '@/lib/auth/node-token';
import { findOwnedById } from '@/lib/webhooks/storage';
import { getDelivery } from '@/lib/webhooks/dispatch';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Token',
} as const;

function notFound() {
  return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_HEADERS });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await resolveNodeFromRequest(request);
  if (!auth) return unauthorized();

  const delivery = await getDelivery(params.id);
  if (!delivery) return notFound();

  const owningSub = await findOwnedById(auth.nodeId, delivery.subscription_id);
  if (!owningSub) return notFound();

  return NextResponse.json(
    {
      id: delivery.id,
      subscription_id: delivery.subscription_id,
      event_id: delivery.event_id,
      event_type: delivery.event_type,
      status: delivery.status,
      attempts: delivery.attempts,
      last_attempt_at: delivery.last_attempt_at,
      response_status: delivery.response_status,
      response_body: delivery.response_body,
      next_retry_at: delivery.next_retry_at,
      created_at: delivery.created_at,
      delivered_at: delivery.delivered_at,
    },
    { status: 200, headers: CORS_HEADERS },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
