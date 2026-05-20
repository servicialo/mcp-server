/**
 * /api/webhooks/subscriptions/{id}
 *
 * PATCH  — update subscribed_events (only this field is editable)
 * DELETE — soft delete (active=false, deactivated_reason='manual')
 *
 * Ownership: a subscription that doesn't belong to the caller returns 404,
 * not 403 — by spec, we don't reveal existence to other tenants.
 */

import { NextResponse } from 'next/server';
import { resolveNodeFromRequest, unauthorized } from '@/lib/auth/node-token';
import { UpdateSubscriptionBody } from '@/lib/webhooks/schemas';
import {
  findOwnedById,
  updateSubscribedEvents,
  softDelete,
} from '@/lib/webhooks/storage';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Token',
} as const;

function notFound() {
  return NextResponse.json(
    { error: 'not_found' },
    { status: 404, headers: CORS_HEADERS },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await resolveNodeFromRequest(request);
  if (!auth) return unauthorized();

  const existing = await findOwnedById(auth.nodeId, params.id);
  if (!existing) return notFound();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const parsed = UpdateSubscriptionBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.issues },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    const updated = await updateSubscribedEvents({
      nodeId: auth.nodeId,
      id: params.id,
      subscribedEvents: parsed.data.subscribed_events,
    });
    if (!updated) return notFound();
    return NextResponse.json(updated, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: 'persist_failed', message: (err as Error).message },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await resolveNodeFromRequest(request);
  if (!auth) return unauthorized();

  const existing = await findOwnedById(auth.nodeId, params.id);
  if (!existing) return notFound();

  // Already inactive — idempotent no-op
  if (!existing.active) {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const ok = await softDelete({ nodeId: auth.nodeId, id: params.id, reason: 'manual' });
  if (!ok) return notFound();
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
