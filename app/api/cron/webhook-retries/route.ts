/**
 * GET /api/cron/webhook-retries
 *
 * Vercel Cron entry point. Drains the webhook_deliveries table for any
 * rows in (pending, failed) whose next_retry_at has passed, and attempts
 * delivery for each.
 *
 * Auth:
 *   - Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
 *     when CRON_SECRET is set in the project env.
 *   - If CRON_SECRET is unset, the endpoint accepts unauthenticated calls
 *     and logs a warning — useful for first-time local testing but should
 *     be set before going live.
 */

import { NextResponse } from 'next/server';
import { processPending } from '@/lib/webhooks/dispatch';

const CRON_SECRET = process.env.CRON_SECRET;
const DEFAULT_BATCH = 50;

function authorize(request: Request): { ok: true } | { ok: false; status: number; reason: string } {
  if (!CRON_SECRET) {
    console.warn('[cron.webhook-retries] CRON_SECRET not configured — endpoint is unauthenticated');
    return { ok: true };
  }
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${CRON_SECRET}`) return { ok: true };
  return { ok: false, status: 401, reason: 'invalid_cron_secret' };
}

export async function GET(request: Request) {
  const check = authorize(request);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: check.status });
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw ? Math.max(1, Math.min(500, parseInt(limitRaw, 10) || DEFAULT_BATCH)) : DEFAULT_BATCH;

  try {
    const result = await processPending(limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron.webhook-retries] failed:', err);
    return NextResponse.json(
      { ok: false, error: 'process_failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic';
