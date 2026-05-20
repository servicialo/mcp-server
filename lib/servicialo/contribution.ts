/**
 * Contribute-to-access tier resolver for the benchmarks API.
 *
 * Implements Principle #7 of the protocol: collective intelligence is a
 * common good. Nodes that contribute operational telemetry see real-time
 * data; nodes that don't see only delayed aggregates. There is no
 * "pay to access" — only "contribute to access".
 *
 * Tier semantics:
 *   0 — anonymous or invalid token. Sees data with a 90-day delay.
 *   1 — identified but not contributing. Same as tier 0, but the response
 *       message explains how to upgrade.
 *   2 — active contributor (≥ TIER_2_THRESHOLD events in the last 30 days).
 *       Sees the default 90-day window in real time.
 *
 * The same FINGERPRINT_SALT lives in @servicialo/mcp-server's operational.ts —
 * keeping both in lockstep is what makes the join work. If the salt ever
 * rotates, both sides must update simultaneously.
 */

import { createHash } from 'node:crypto';

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

// MUST match packages/mcp-server/src/telemetry/operational.ts FINGERPRINT_SALT.
// Guardrail: `node scripts/verify-salt-parity.mjs` (also wired into CI).
const FINGERPRINT_SALT = 'servicialo-op-v0.9';

export const CONTRIBUTION_WINDOW_DAYS = 30;
export const TIER_2_THRESHOLD = 50;
export const DELAY_DAYS_FOR_LOWER_TIERS = 90;
export const DEFAULT_WINDOW_DAYS = 90;

export type AccessTier = 0 | 1 | 2;

export interface AccessDecision {
  tier: AccessTier;
  org_slug?: string;
  contribution_score: number;
  contribution_window_days: number;
  message: string;
}

export function computeOrgFingerprint(orgSlug: string): string {
  return createHash('sha256').update(`${orgSlug}::${FINGERPRINT_SALT}`).digest('hex');
}

/**
 * Compute the tier for a known slug (skips the token-lookup step that
 * resolveAccessTier does). Used by the weekly snapshot cron, which already
 * has the subscriber's slug from the registry join.
 */
export async function resolveAccessTierForSlug(orgSlug: string | null): Promise<AccessDecision> {
  if (!orgSlug) {
    return {
      tier: 0,
      contribution_score: 0,
      contribution_window_days: CONTRIBUTION_WINDOW_DAYS,
      message: MESSAGES[0],
    };
  }
  const fingerprint = computeOrgFingerprint(orgSlug);
  const score = await countContributionScore(fingerprint);
  const tier: AccessTier = score >= TIER_2_THRESHOLD ? 2 : 1;
  return {
    tier,
    org_slug: orgSlug,
    contribution_score: score,
    contribution_window_days: CONTRIBUTION_WINDOW_DAYS,
    message: MESSAGES[tier],
  };
}

async function lookupSlugByToken(token: string): Promise<string | null> {
  if (!REGISTRY_URL || !REGISTRY_KEY) return null;
  const qs = new URLSearchParams({
    select: 'slug',
    ownership_token: `eq.${token}`,
    limit: '1',
  });
  try {
    const res = await fetch(`${REGISTRY_URL}/rest/v1/registry_entries?${qs.toString()}`, {
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ slug: string }>;
    return rows[0]?.slug ?? null;
  } catch {
    return null;
  }
}

async function countContributionScore(fingerprint: string): Promise<number> {
  if (!REGISTRY_URL || !REGISTRY_KEY) return 0;
  const since = new Date(Date.now() - CONTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const qs = new URLSearchParams({
    select: 'id',
    org_fingerprint: `eq.${fingerprint}`,
    occurred_at: `gte.${since}`,
  });
  try {
    const res = await fetch(`${REGISTRY_URL}/rest/v1/telemetry_events?${qs.toString()}`, {
      headers: {
        apikey: REGISTRY_KEY,
        Authorization: `Bearer ${REGISTRY_KEY}`,
        Accept: 'application/json',
        Prefer: 'count=exact',
      },
    });
    if (!res.ok) return 0;
    const range = res.headers.get('content-range');
    if (range) {
      const total = parseInt(range.split('/').pop() ?? '0', 10);
      if (!Number.isNaN(total)) return total;
    }
    // Fallback: parse the array and count locally
    const rows = (await res.json()) as unknown[];
    return rows.length;
  } catch {
    return 0;
  }
}

const MESSAGES: Record<AccessTier, string> = {
  0: `Anonymous access. Benchmark data is delayed by ${DELAY_DAYS_FOR_LOWER_TIERS} days. To see real-time data, register your node and emit operational telemetry — see docs/telemetry-operational.md.`,
  1: `Your node is identified but has not emitted operational telemetry in the last ${CONTRIBUTION_WINDOW_DAYS} days. Data is delayed by ${DELAY_DAYS_FOR_LOWER_TIERS} days. Emit ≥${TIER_2_THRESHOLD} events to unlock real-time access.`,
  2: 'Active contributor — real-time access.',
};

export async function resolveAccessTier(request: Request): Promise<AccessDecision> {
  const token = request.headers.get('x-servicialo-node-token');
  if (!token) {
    return {
      tier: 0,
      contribution_score: 0,
      contribution_window_days: CONTRIBUTION_WINDOW_DAYS,
      message: MESSAGES[0],
    };
  }

  const orgSlug = await lookupSlugByToken(token);
  if (!orgSlug) {
    return {
      tier: 0,
      contribution_score: 0,
      contribution_window_days: CONTRIBUTION_WINDOW_DAYS,
      message: 'Invalid X-Servicialo-Node-Token. Falling back to anonymous tier. ' + MESSAGES[0],
    };
  }

  const fingerprint = computeOrgFingerprint(orgSlug);
  const score = await countContributionScore(fingerprint);

  const tier: AccessTier = score >= TIER_2_THRESHOLD ? 2 : 1;
  return {
    tier,
    org_slug: orgSlug,
    contribution_score: score,
    contribution_window_days: CONTRIBUTION_WINDOW_DAYS,
    message: MESSAGES[tier],
  };
}

/**
 * Clamp a requested [from, to] window to what the caller's tier is allowed
 * to see. Tier 0 and 1 see only data older than DELAY_DAYS_FOR_LOWER_TIERS.
 * Tier 2 sees whatever was requested.
 *
 * Returns the (possibly adjusted) window plus a flag noting whether it was
 * clamped, so the response can be honest about what's missing.
 */
export function clampWindowForTier(
  tier: AccessTier,
  requested: { from: string; to: string },
): { from: string; to: string; clamped: boolean } {
  if (tier === 2) return { ...requested, clamped: false };

  const delayMs = DELAY_DAYS_FOR_LOWER_TIERS * 24 * 60 * 60 * 1000;
  const maxTo = new Date(Date.now() - delayMs).toISOString();

  const reqTo = new Date(requested.to);
  const cappedTo = reqTo.getTime() > Date.parse(maxTo) ? maxTo : requested.to;
  const clamped = cappedTo !== requested.to;

  return { from: requested.from, to: cappedTo, clamped };
}
