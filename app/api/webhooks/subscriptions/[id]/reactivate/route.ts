/**
 * POST /api/webhooks/subscriptions/{id}/reactivate
 *
 * Re-enables a previously deactivated subscription. Resets
 * consecutive_failures and clears deactivated_at/_reason.
 *
 * Idempotent guard: if the subscription is already active, returns 409.
 */

import { NextResponse } from 'next/server';
import { resolveNodeFromRequest, unauthorized } from '@/lib/auth/node-token';
import { findOwnedById, reactivate } from '@/lib/webhooks/storage';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Token',
} as const;

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

  if (existing.active) {
    return NextResponse.json(
      { error: 'already_active' },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  const updated = await reactivate({ nodeId: auth.nodeId, id: params.id });
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_HEADERS });
  }

  return NextResponse.json(updated, { status: 200, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
