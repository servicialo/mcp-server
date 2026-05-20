/**
 * Storage layer for webhook subscriptions. Wraps Supabase PostgREST so the
 * route handlers stay declarative.
 *
 * Secret discipline:
 *   - `secret` is stored plaintext (the worker needs it to HMAC payloads)
 *   - It is returned to the caller ONLY by createSubscription and rotateSecret
 *   - All "fetch for response" helpers exclude it from SELECT
 */

import { randomBytes } from 'node:crypto';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

function pgrestHeaders(): Record<string, string> {
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

// Fields safe to return in API responses (no secret).
const PUBLIC_FIELDS =
  'id,node_id,url,subscribed_events,filters,active,consecutive_failures,created_at,updated_at,last_delivery_at,deactivated_at,deactivated_reason';

export interface SubscriptionPublic {
  id: string;
  node_id: string;
  url: string;
  subscribed_events: string[];
  filters: Record<string, unknown>;
  active: boolean;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
  last_delivery_at: string | null;
  deactivated_at: string | null;
  deactivated_reason: string | null;
}

export interface SubscriptionWithSecret extends SubscriptionPublic {
  secret: string;
}

export interface SubscriptionWithHealth extends SubscriptionPublic {
  last_successful_delivery_at: string | null;
}

function generateSecret(): string {
  return randomBytes(32).toString('hex');
}

// ─── Reads ───

export async function findActiveDuplicate(
  nodeId: string,
  url: string,
  events: string[],
): Promise<{ id: string } | null> {
  const qs = new URLSearchParams({
    select: 'id,subscribed_events',
    node_id: `eq.${nodeId}`,
    url: `eq.${url}`,
    active: 'eq.true',
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    headers: pgrestHeaders(),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string; subscribed_events: string[] }>;
  const wanted = [...events].sort().join(',');
  const match = rows.find((r) => [...r.subscribed_events].sort().join(',') === wanted);
  return match ? { id: match.id } : null;
}

export async function listForNode(
  nodeId: string,
  filter: { active?: boolean },
): Promise<SubscriptionWithHealth[]> {
  const qs = new URLSearchParams({
    select: PUBLIC_FIELDS,
    node_id: `eq.${nodeId}`,
    order: 'created_at.desc',
  });
  if (filter.active !== undefined) qs.set('active', `eq.${filter.active}`);

  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    headers: pgrestHeaders(),
  });
  if (!res.ok) {
    throw new Error(`listForNode failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as SubscriptionPublic[];

  // Fetch last_successful_delivery_at per subscription
  const withHealth = await Promise.all(
    rows.map(async (sub) => {
      const lastQs = new URLSearchParams({
        select: 'delivered_at',
        subscription_id: `eq.${sub.id}`,
        status: 'eq.delivered',
        order: 'delivered_at.desc',
        limit: '1',
      });
      const r2 = await fetch(`${REGISTRY_URL}/rest/v1/webhook_deliveries?${lastQs.toString()}`, {
        headers: pgrestHeaders(),
      });
      if (!r2.ok) return { ...sub, last_successful_delivery_at: null };
      const r2rows = (await r2.json()) as Array<{ delivered_at: string | null }>;
      return { ...sub, last_successful_delivery_at: r2rows[0]?.delivered_at ?? null };
    }),
  );
  return withHealth;
}

export async function findOwnedById(
  nodeId: string,
  id: string,
): Promise<SubscriptionPublic | null> {
  const qs = new URLSearchParams({
    select: PUBLIC_FIELDS,
    id: `eq.${id}`,
    node_id: `eq.${nodeId}`,
    limit: '1',
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    headers: pgrestHeaders(),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as SubscriptionPublic[];
  return rows[0] ?? null;
}

// ─── Writes ───

export async function createSubscription(params: {
  nodeId: string;
  url: string;
  subscribedEvents: string[];
}): Promise<SubscriptionWithSecret> {
  const secret = generateSecret();
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions`, {
    method: 'POST',
    headers: { ...pgrestHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({
      node_id: params.nodeId,
      url: params.url,
      subscribed_events: params.subscribedEvents,
      secret,
    }),
  });
  if (!res.ok) {
    throw new Error(`createSubscription failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Array<SubscriptionPublic & { secret: string }>;
  return rows[0];
}

export async function updateSubscribedEvents(params: {
  nodeId: string;
  id: string;
  subscribedEvents: string[];
}): Promise<SubscriptionPublic | null> {
  const qs = new URLSearchParams({
    id: `eq.${params.id}`,
    node_id: `eq.${params.nodeId}`,
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    method: 'PATCH',
    headers: { ...pgrestHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({ subscribed_events: params.subscribedEvents }),
  });
  if (!res.ok) {
    throw new Error(`updateSubscribedEvents failed: ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as Array<SubscriptionPublic & { secret?: string }>;
  if (!rows[0]) return null;
  return omitSecret(rows[0]) as SubscriptionPublic;
}

export async function softDelete(params: {
  nodeId: string;
  id: string;
  reason: string;
}): Promise<boolean> {
  const qs = new URLSearchParams({
    id: `eq.${params.id}`,
    node_id: `eq.${params.nodeId}`,
    active: 'eq.true',
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    method: 'PATCH',
    headers: { ...pgrestHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({
      active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_reason: params.reason,
    }),
  });
  if (!res.ok) return false;
  const rows = (await res.json()) as unknown[];
  return rows.length > 0;
}

export async function rotateSecret(params: {
  nodeId: string;
  id: string;
}): Promise<{ id: string; secret: string } | null> {
  const newSecret = generateSecret();
  const qs = new URLSearchParams({
    id: `eq.${params.id}`,
    node_id: `eq.${params.nodeId}`,
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    method: 'PATCH',
    headers: { ...pgrestHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({ secret: newSecret }),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string }>;
  if (rows.length === 0) return null;
  return { id: rows[0].id, secret: newSecret };
}

export async function reactivate(params: {
  nodeId: string;
  id: string;
}): Promise<SubscriptionPublic | null> {
  // Only reactivate if currently inactive
  const qs = new URLSearchParams({
    id: `eq.${params.id}`,
    node_id: `eq.${params.nodeId}`,
    active: 'eq.false',
  });
  const res = await fetch(`${REGISTRY_URL}/rest/v1/webhook_subscriptions?${qs.toString()}`, {
    method: 'PATCH',
    headers: { ...pgrestHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({
      active: true,
      consecutive_failures: 0,
      deactivated_at: null,
      deactivated_reason: null,
    }),
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<SubscriptionPublic & { secret?: string }>;
  if (!rows[0]) return null;
  return omitSecret(rows[0]) as SubscriptionPublic;
}

// ─── Helpers ───

export function omitSecret<T extends { secret?: string }>(row: T): Omit<T, 'secret'> {
  const copy = { ...row };
  delete copy.secret;
  return copy;
}
