/**
 * POST /api/webhooks/subscriptions/{id}/rotate-secret
 *
 * Generates a fresh secret and atomically replaces the old one. There is no
 * grace period — the previous secret is invalid immediately. Caller must
 * persist the new secret on their side before the next delivery arrives.
 *
 * Rate-limited to 1 rotation per minute per subscription (in-memory map —
 * fine for single-instance Vercel, TODO if we scale horizontally).
 */

import { NextResponse } from 'next/server';
import { resolveNodeFromRequest, unauthorized } from '@/lib/auth/node-token';
import { findOwnedById, rotateSecret } from '@/lib/webhooks/storage';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Servicialo-Node-Token',
} as const;

const ROTATE_COOLDOWN_MS = 60_000;
const lastRotation = new Map<string, number>();

function rateLimited(subscriptionId: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const last = lastRotation.get(subscriptionId) ?? 0;
  const remaining = last + ROTATE_COOLDOWN_MS - now;
  if (remaining > 0) return { allowed: false, retryAfterMs: remaining };
  lastRotation.set(subscriptionId, now);
  return { allowed: true, retryAfterMs: 0 };
}

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

  const limit = rateLimited(params.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retry_after_seconds: Math.ceil(limit.retryAfterMs / 1000) },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      },
    );
  }

  const rotated = await rotateSecret({ nodeId: auth.nodeId, id: params.id });
  if (!rotated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: CORS_HEADERS });
  }

  return NextResponse.json(rotated, { status: 200, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
