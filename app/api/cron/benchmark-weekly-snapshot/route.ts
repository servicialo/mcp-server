/**
 * GET /api/cron/benchmark-weekly-snapshot
 *
 * Weekly cron entry point. Computes the two snapshot flavors (realtime for
 * tier 2, delayed for tier 0/1) and enqueues one delivery per active
 * subscription to the `benchmark.weekly_snapshot` event. The webhook-retries
 * cron handles the actual HTTP delivery on its next tick (≤5 min later).
 *
 * Scheduled by vercel.json: `0 0 * * 1` (Monday 00:00 UTC).
 */

import { NextResponse } from 'next/server';
import { enqueueForSubscription } from '@/lib/webhooks/dispatch';
import { computeWeeklySnapshot } from '@/lib/webhooks/snapshot';
import { resolveAccessTierForSlug } from '@/lib/servicialo/contribution';

const CRON_SECRET = process.env.CRON_SECRET;
const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

function authorize(request: Request): { ok: true } | { ok: false; reason: string } {
  if (!CRON_SECRET) {
    console.warn('[cron.weekly-snapshot] CRON_SECRET not configured — endpoint is unauthenticated');
    return { ok: true };
  }
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${CRON_SECRET}`) return { ok: true };
  return { ok: false, reason: 'invalid_cron_secret' };
}

interface SubscriberRow {
  id: string;
  node_id: string;
  slug: string | null;
}

async function listActiveSubscribers(): Promise<SubscriberRow[]> {
  // Embedded relation: registry_entries!inner(slug) joins on node_id → registry_entries.id
  const qs = new URLSearchParams({
    select: 'id,node_id,registry_entries!inner(slug)',
    active: 'eq.true',
    subscribed_events: 'cs.{benchmark.weekly_snapshot}',
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    headers: {
      apikey: REGISTRY_KEY!,
      Authorization: `Bearer ${REGISTRY_KEY!}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`listActiveSubscribers failed: ${res.status}`);
  }
  const rows = (await res.json()) as Array<{
    id: string;
    node_id: string;
    registry_entries: { slug: string } | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    node_id: r.node_id,
    slug: r.registry_entries?.slug ?? null,
  }));
}

export async function GET(request: Request) {
  const check = authorize(request);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 401 });
  }

  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return NextResponse.json({ error: 'registry_not_configured' }, { status: 503 });
  }

  try {
    const [realtime, delayed] = await Promise.all([
      computeWeeklySnapshot('realtime'),
      computeWeeklySnapshot('delayed'),
    ]);

    const subscribers = await listActiveSubscribers();
    const results: Array<{ subscription_id: string; tier: 0 | 1 | 2; delivery_id: string }> = [];

    for (const sub of subscribers) {
      const access = await resolveAccessTierForSlug(sub.slug);
      const snapshot = access.tier === 2 ? realtime : delayed;
      const data: Record<string, unknown> = {
        week_start: snapshot.week_start,
        week_end: snapshot.week_end,
        flavor: snapshot.flavor,
        privacy: snapshot.privacy,
        segments: snapshot.segments,
        access: {
          tier: access.tier,
          contribution_score: access.contribution_score,
          message: access.message,
        },
      };
      const delivery = await enqueueForSubscription({
        subscriptionId: sub.id,
        event: 'benchmark.weekly_snapshot',
        data,
        processNow: false,
      });
      results.push({ subscription_id: sub.id, tier: access.tier, delivery_id: delivery.id });
    }

    return NextResponse.json({
      ok: true,
      realtime_segments: realtime.segments.length,
      delayed_segments: delayed.segments.length,
      enqueued: results.length,
      results,
    });
  } catch (err) {
    console.error('[cron.weekly-snapshot] failed:', err);
    return NextResponse.json(
      { ok: false, error: 'snapshot_failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic';
