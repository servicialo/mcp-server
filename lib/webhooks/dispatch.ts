/**
 * Webhook delivery dispatch.
 *
 *   enqueueForSubscription   — create a single delivery row, optionally process now
 *   enqueueForEvent          — fan out a payload to every active subscriber of an event
 *   processDelivery          — execute the HTTP POST, update the row, handle auto-deactivation
 *   processPending           — drain rows whose next_retry_at has come (cron entry point)
 *
 * HTTP outcome semantics:
 *   2xx                                  → delivered, reset consecutive_failures
 *   410 Gone                             → abandoned + auto-deactivate (subscriber wants out)
 *   other 4xx                            → failed, no retry (subscriber's bug)
 *   5xx | timeout | network              → retry with exponential backoff
 *
 * Retry schedule: 1m → 5m → 30m. Max 3 attempts. After that → abandoned.
 * After 3 consecutive abandoned deliveries for a subscription → active=false.
 */

import { buildEnvelope, buildHeaders, type WebhookEnvelope } from './signing';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const FETCH_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000];
const AUTO_DEACTIVATE_AT_FAILURES = 3;

function pgrest(): Record<string, string> {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    throw new Error('REGISTRY_SUPABASE_URL or REGISTRY_SUPABASE_SERVICE_KEY not configured');
  }
  return {
    apikey: REGISTRY_KEY,
    Authorization: `Bearer ${REGISTRY_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

// ─── Types ───

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'abandoned';

export interface DeliveryRow {
  id: string;
  subscription_id: string;
  event_id: string;
  event_type: string;
  payload: WebhookEnvelope;
  status: DeliveryStatus;
  attempts: number;
  last_attempt_at: string | null;
  response_status: number | null;
  response_body: string | null;
  next_retry_at: string | null;
  created_at: string;
  delivered_at: string | null;
}

interface SubscriptionForDelivery {
  id: string;
  url: string;
  secret: string;
  active: boolean;
  consecutive_failures: number;
}

// ─── Reads ───

async function findActiveSubscriptionsForEvent(event: string): Promise<SubscriptionForDelivery[]> {
  const qs = new URLSearchParams({
    select: 'id,url,secret,active,consecutive_failures',
    active: 'eq.true',
    subscribed_events: `cs.{${event}}`,
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    headers: pgrest(),
  });
  if (!res.ok) {
    throw new Error(`findActiveSubscriptionsForEvent failed: ${res.status}`);
  }
  return (await res.json()) as SubscriptionForDelivery[];
}

async function getSubscriptionWithSecret(id: string): Promise<SubscriptionForDelivery | null> {
  const qs = new URLSearchParams({
    select: 'id,url,secret,active,consecutive_failures',
    id: `eq.${id}`,
    limit: '1',
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    headers: pgrest(),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as SubscriptionForDelivery[];
  return rows[0] ?? null;
}

export async function getDelivery(id: string): Promise<DeliveryRow | null> {
  const qs = new URLSearchParams({
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_deliveries?${qs.toString()}`, {
    headers: pgrest(),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as DeliveryRow[];
  return rows[0] ?? null;
}

// ─── Enqueue ───

async function insertDelivery(params: {
  subscriptionId: string;
  envelope: WebhookEnvelope;
}): Promise<DeliveryRow> {
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_deliveries`, {
    method: 'POST',
    headers: { ...pgrest(), Prefer: 'return=representation' },
    body: JSON.stringify({
      subscription_id: params.subscriptionId,
      event_id: params.envelope.event_id,
      event_type: params.envelope.event,
      payload: params.envelope,
      status: 'pending',
      next_retry_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    throw new Error(`insertDelivery failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as DeliveryRow[];
  return rows[0];
}

export async function enqueueForSubscription(params: {
  subscriptionId: string;
  event: string;
  data: Record<string, unknown>;
  processNow?: boolean;
}): Promise<DeliveryRow> {
  const envelope = buildEnvelope(params.event, params.data);
  const row = await insertDelivery({ subscriptionId: params.subscriptionId, envelope });
  if (params.processNow) {
    return (await processDelivery(row.id)) ?? row;
  }
  return row;
}

export async function enqueueForEvent(params: {
  event: string;
  data: Record<string, unknown>;
  processNow?: boolean;
}): Promise<{ deliveryIds: string[] }> {
  const subs = await findActiveSubscriptionsForEvent(params.event);
  const deliveryIds: string[] = [];
  for (const s of subs) {
    const row = await enqueueForSubscription({
      subscriptionId: s.id,
      event: params.event,
      data: params.data,
      processNow: params.processNow,
    });
    deliveryIds.push(row.id);
  }
  return { deliveryIds };
}

// ─── Process ───

interface AttemptOutcome {
  ok: boolean;
  responseStatus: number | null;
  responseBody: string | null;
  /** Whether to keep retrying or stop forever */
  retryable: boolean;
  /** Whether the subscriber explicitly asked to be unsubscribed (HTTP 410) */
  goneSignal: boolean;
}

async function attemptDelivery(
  subscription: SubscriptionForDelivery,
  delivery: DeliveryRow,
): Promise<AttemptOutcome> {
  const rawBody = JSON.stringify(delivery.payload);
  const headers = buildHeaders({
    envelope: delivery.payload,
    rawBody,
    secret: subscription.secret,
    deliveryId: delivery.id,
  });

  try {
    const res = await fetch(subscription.url, {
      method: 'POST',
      headers,
      body: rawBody,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const status = res.status;
    const bodyText = await res.text().catch(() => '');
    const trimmed = bodyText.slice(0, 2000); // cap stored body to avoid bloat

    if (status >= 200 && status < 300) {
      return { ok: true, responseStatus: status, responseBody: trimmed, retryable: false, goneSignal: false };
    }
    if (status === 410) {
      return { ok: false, responseStatus: status, responseBody: trimmed, retryable: false, goneSignal: true };
    }
    if (status >= 400 && status < 500) {
      return { ok: false, responseStatus: status, responseBody: trimmed, retryable: false, goneSignal: false };
    }
    return { ok: false, responseStatus: status, responseBody: trimmed, retryable: true, goneSignal: false };
  } catch (err) {
    const msg = (err as Error).message || String(err);
    return {
      ok: false,
      responseStatus: null,
      responseBody: msg.slice(0, 500),
      retryable: true,
      goneSignal: false,
    };
  }
}

async function bumpConsecutiveFailures(subscriptionId: string, delta: number): Promise<number> {
  // Two-step fetch+patch — ok for the volume we expect at MVP
  const sub = await getSubscriptionWithSecret(subscriptionId);
  if (!sub) return 0;
  const next = delta > 0 ? sub.consecutive_failures + delta : 0;
  const qs = new URLSearchParams({ id: `eq.${subscriptionId}` });
  await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    method: 'PATCH',
    headers: pgrest(),
    body: JSON.stringify({ consecutive_failures: next }),
  });
  return next;
}

async function autoDeactivate(subscriptionId: string, reason: string): Promise<void> {
  const qs = new URLSearchParams({ id: `eq.${subscriptionId}`, active: 'eq.true' });
  await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    method: 'PATCH',
    headers: pgrest(),
    body: JSON.stringify({
      active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_reason: reason,
    }),
  });
}

async function persistAttemptResult(
  delivery: DeliveryRow,
  outcome: AttemptOutcome,
): Promise<DeliveryRow | null> {
  const nextAttempts = delivery.attempts + 1;
  const now = new Date().toISOString();

  let status: DeliveryStatus;
  let nextRetryAt: string | null = null;
  let deliveredAt: string | null = null;

  if (outcome.ok) {
    status = 'delivered';
    deliveredAt = now;
  } else if (outcome.goneSignal) {
    status = 'abandoned';
  } else if (!outcome.retryable) {
    status = 'failed';
  } else if (nextAttempts >= MAX_ATTEMPTS) {
    status = 'abandoned';
  } else {
    status = 'failed';
    const delayMs = RETRY_DELAYS_MS[Math.min(nextAttempts - 1, RETRY_DELAYS_MS.length - 1)];
    nextRetryAt = new Date(Date.now() + delayMs).toISOString();
  }

  const qs = new URLSearchParams({ id: `eq.${delivery.id}` });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_deliveries?${qs.toString()}`, {
    method: 'PATCH',
    headers: { ...pgrest(), Prefer: 'return=representation' },
    body: JSON.stringify({
      status,
      attempts: nextAttempts,
      last_attempt_at: now,
      response_status: outcome.responseStatus,
      response_body: outcome.responseBody,
      next_retry_at: nextRetryAt,
      delivered_at: deliveredAt,
    }),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as DeliveryRow[];
  return rows[0] ?? null;
}

export async function processDelivery(deliveryId: string): Promise<DeliveryRow | null> {
  const delivery = await getDelivery(deliveryId);
  if (!delivery) return null;
  if (delivery.status === 'delivered' || delivery.status === 'abandoned') {
    return delivery; // terminal; nothing to do
  }
  const sub = await getSubscriptionWithSecret(delivery.subscription_id);
  if (!sub || !sub.active) {
    // Subscription gone or already deactivated → mark abandoned and exit
    return persistAttemptResult(delivery, {
      ok: false,
      responseStatus: null,
      responseBody: 'subscription_inactive',
      retryable: false,
      goneSignal: true,
    });
  }

  const outcome = await attemptDelivery(sub, delivery);
  const updated = await persistAttemptResult(delivery, outcome);

  if (outcome.ok) {
    await bumpConsecutiveFailures(sub.id, -1); // reset to 0
    await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?id=eq.${sub.id}`, {
      method: 'PATCH',
      headers: pgrest(),
      body: JSON.stringify({ last_delivery_at: new Date().toISOString() }),
    });
  } else if (outcome.goneSignal) {
    await autoDeactivate(sub.id, 'subscriber_gone_410');
  } else if (updated?.status === 'abandoned') {
    const fails = await bumpConsecutiveFailures(sub.id, 1);
    if (fails >= AUTO_DEACTIVATE_AT_FAILURES) {
      await autoDeactivate(sub.id, 'delivery_failures');
    }
  }
  return updated;
}

// ─── Cron entry ───

export async function processPending(limit = 50): Promise<{ processed: number; results: Array<{ id: string; status: DeliveryStatus }> }> {
  const nowIso = new Date().toISOString();
  const qs = new URLSearchParams({
    select: 'id',
    status: 'in.(pending,failed)',
    next_retry_at: `lte.${nowIso}`,
    order: 'next_retry_at.asc',
    limit: String(limit),
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_deliveries?${qs.toString()}`, {
    headers: pgrest(),
  });
  if (!res.ok) {
    throw new Error(`processPending list failed: ${res.status}`);
  }
  const rows = (await res.json()) as Array<{ id: string }>;
  const results: Array<{ id: string; status: DeliveryStatus }> = [];
  for (const r of rows) {
    const updated = await processDelivery(r.id);
    if (updated) results.push({ id: updated.id, status: updated.status });
  }
  return { processed: results.length, results };
}
