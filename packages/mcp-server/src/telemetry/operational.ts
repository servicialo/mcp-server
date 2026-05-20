/**
 * Operational telemetry — emits anonymized, bucketed events to the
 * Servicialo registry so the network can aggregate market-level benchmarks
 * without exposing raw prices, durations, or identities.
 *
 * Schema reference:
 * https://servicialo.com/schema/telemetry/operational-event.schema.json
 */

import { createHash } from 'node:crypto';

// MUST match lib/servicialo/contribution.ts FINGERPRINT_SALT (the backend
// tier resolver). If these diverge, the backend computes a different
// fingerprint than what nodes emit, and every contributor silently falls
// to tier 0. Guardrail: `node scripts/verify-salt-parity.mjs`.
const FINGERPRINT_SALT = 'servicialo-op-v0.9';
const TELEMETRY_TIMEOUT_MS = 3000;

// ─── Bucketing helpers ───

export type LeadTimeBucket =
  | 'same_day' | '1-2_days' | '3-7_days' | '1-2_weeks' | '2-4_weeks' | '1+_months';

export type SlotHourBucket =
  | '00-06' | '06-09' | '09-12' | '12-15' | '15-18' | '18-21' | '21-24';

export type DurationBucket =
  | 'under_15min' | '15-30min' | '30-60min' | '60-90min' | '90-120min' | 'over_120min';

export type PriceBand =
  | '0-10k' | '10-25k' | '25-50k' | '50-100k'
  | '100-250k' | '250-500k' | '500k-1M' | '1M+';

export type TimeToCollectBucket =
  | 'immediate' | 'within_24h' | '1-7_days' | '1-4_weeks' | 'over_1_month' | 'uncollected';

export type TimeToResolveBucket =
  | 'under_24h' | '1-3_days' | '3-7_days' | '1-2_weeks' | 'over_2_weeks' | 'unresolved';

export function bucketLeadTime(bookedAt: Date, startsAt: Date): LeadTimeBucket {
  const hours = (startsAt.getTime() - bookedAt.getTime()) / 3.6e6;
  if (hours < 24) return 'same_day';
  if (hours < 48) return '1-2_days';
  if (hours < 168) return '3-7_days';
  if (hours < 336) return '1-2_weeks';
  if (hours < 672) return '2-4_weeks';
  return '1+_months';
}

export function bucketSlotHour(startsAt: Date): SlotHourBucket {
  const h = startsAt.getHours();
  if (h < 6) return '00-06';
  if (h < 9) return '06-09';
  if (h < 12) return '09-12';
  if (h < 15) return '12-15';
  if (h < 18) return '15-18';
  if (h < 21) return '18-21';
  return '21-24';
}

export function bucketDurationMinutes(minutes: number): DurationBucket {
  if (minutes < 15) return 'under_15min';
  if (minutes < 30) return '15-30min';
  if (minutes < 60) return '30-60min';
  if (minutes < 90) return '60-90min';
  if (minutes < 120) return '90-120min';
  return 'over_120min';
}

/**
 * Bucket price assuming CLP-equivalent. Emitters convert via daily FX before bucketing.
 */
export function bucketPriceCLP(amount: number): PriceBand {
  if (amount < 10_000) return '0-10k';
  if (amount < 25_000) return '10-25k';
  if (amount < 50_000) return '25-50k';
  if (amount < 100_000) return '50-100k';
  if (amount < 250_000) return '100-250k';
  if (amount < 500_000) return '250-500k';
  if (amount < 1_000_000) return '500k-1M';
  return '1M+';
}

export function bucketTimeToCollect(completedAt: Date, settledAt: Date): TimeToCollectBucket {
  const hours = (settledAt.getTime() - completedAt.getTime()) / 3.6e6;
  if (hours < 1) return 'immediate';
  if (hours < 24) return 'within_24h';
  if (hours < 168) return '1-7_days';
  if (hours < 672) return '1-4_weeks';
  return 'over_1_month';
}

export function bucketTimeToResolve(openedAt: Date, resolvedAt: Date | null): TimeToResolveBucket {
  if (!resolvedAt) return 'unresolved';
  const hours = (resolvedAt.getTime() - openedAt.getTime()) / 3.6e6;
  if (hours < 24) return 'under_24h';
  if (hours < 72) return '1-3_days';
  if (hours < 168) return '3-7_days';
  if (hours < 336) return '1-2_weeks';
  return 'over_2_weeks';
}

/**
 * ISO weekday: Monday=1 … Sunday=7. JS Date.getDay() returns Sunday=0,
 * which is incompatible with ISO 8601.
 */
export function isoWeekday(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

/**
 * Stable, irreversible per-contributor fingerprint. Same org_slug → same
 * fingerprint across all events, so the registry can apply k-anonymity
 * (≥5 distinct fingerprints per segment) without learning the slug.
 */
export function computeOrgFingerprint(orgSlug: string): string {
  return createHash('sha256').update(`${orgSlug}::${FINGERPRINT_SALT}`).digest('hex');
}

// ─── Event envelope ───

export interface OperationalEvent {
  protocol_version: string;
  node_version?: string;
  event_type: 'booking_created' | 'service_completed' | 'dispute_opened' | 'payment_settled';
  vertical: string;
  region: string;
  occurred_at: string;
  org_fingerprint?: string;
  payload: Record<string, unknown>;
}

interface EmitterContext {
  protocolVersion: string;
  nodeVersion: string;
  vertical: string;
  region: string;
  orgSlug?: string;
}

/**
 * Read emitter context from env vars. Called once at MCP server startup.
 */
export function loadEmitterContext(nodeVersion: string): EmitterContext {
  return {
    protocolVersion: process.env.SERVICIALO_PROTOCOL_VERSION || '0.9',
    nodeVersion,
    vertical: process.env.SERVICIALO_VERTICAL || 'unspecified',
    region: (process.env.SERVICIALO_REGION || 'CL').toUpperCase(),
    orgSlug: process.env.SERVICIALO_ORG_ID,
  };
}

// ─── Event builders ───

export function buildBookingCreatedEvent(
  ctx: EmitterContext,
  args: { startsAt: string; bookedAt?: string; channel?: 'agent' | 'human' },
): OperationalEvent {
  const bookedAt = args.bookedAt ? new Date(args.bookedAt) : new Date();
  const startsAt = new Date(args.startsAt);
  return {
    protocol_version: ctx.protocolVersion,
    node_version: ctx.nodeVersion,
    event_type: 'booking_created',
    vertical: ctx.vertical,
    region: ctx.region,
    occurred_at: bookedAt.toISOString(),
    org_fingerprint: ctx.orgSlug ? computeOrgFingerprint(ctx.orgSlug) : undefined,
    payload: {
      lead_time_bucket: bucketLeadTime(bookedAt, startsAt),
      slot_hour_bucket: bucketSlotHour(startsAt),
      weekday: isoWeekday(startsAt),
      channel: args.channel ?? 'agent',
    },
  };
}

export function buildServiceCompletedEvent(
  ctx: EmitterContext,
  args: {
    completedAt?: string;
    durationMinutes: number;
    outcome: 'completed' | 'no_show_client' | 'no_show_provider' | 'partial' | 'canceled_late';
    evidenceCompleteness?: 'complete' | 'partial' | 'missing';
  },
): OperationalEvent {
  return {
    protocol_version: ctx.protocolVersion,
    node_version: ctx.nodeVersion,
    event_type: 'service_completed',
    vertical: ctx.vertical,
    region: ctx.region,
    occurred_at: args.completedAt ?? new Date().toISOString(),
    org_fingerprint: ctx.orgSlug ? computeOrgFingerprint(ctx.orgSlug) : undefined,
    payload: {
      duration_bucket: bucketDurationMinutes(args.durationMinutes),
      outcome: args.outcome,
      ...(args.evidenceCompleteness ? { evidence_completeness: args.evidenceCompleteness } : {}),
    },
  };
}

export function buildDisputeOpenedEvent(
  ctx: EmitterContext,
  args: {
    openedAt?: string;
    openedBy: 'client' | 'provider' | 'organization';
    reasonCategory: 'quality' | 'no_show' | 'billing' | 'scope' | 'evidence_missing' | 'other';
  },
): OperationalEvent {
  return {
    protocol_version: ctx.protocolVersion,
    node_version: ctx.nodeVersion,
    event_type: 'dispute_opened',
    vertical: ctx.vertical,
    region: ctx.region,
    occurred_at: args.openedAt ?? new Date().toISOString(),
    org_fingerprint: ctx.orgSlug ? computeOrgFingerprint(ctx.orgSlug) : undefined,
    payload: {
      opened_by: args.openedBy,
      reason_category: args.reasonCategory,
    },
  };
}

export function buildPaymentSettledEvent(
  ctx: EmitterContext,
  args: {
    settledAt?: string;
    completedAt: string;
    amountCLP: number;
    currency: string;
    paymentMethod:
      | 'cash' | 'transfer' | 'card_credit' | 'card_debit'
      | 'insurance' | 'voucher' | 'subscription' | 'other';
  },
): OperationalEvent {
  const settledAt = args.settledAt ? new Date(args.settledAt) : new Date();
  return {
    protocol_version: ctx.protocolVersion,
    node_version: ctx.nodeVersion,
    event_type: 'payment_settled',
    vertical: ctx.vertical,
    region: ctx.region,
    occurred_at: settledAt.toISOString(),
    org_fingerprint: ctx.orgSlug ? computeOrgFingerprint(ctx.orgSlug) : undefined,
    payload: {
      price_band: bucketPriceCLP(args.amountCLP),
      currency: args.currency.toUpperCase(),
      payment_method: args.paymentMethod,
      time_to_collect_bucket: bucketTimeToCollect(new Date(args.completedAt), settledAt),
    },
  };
}

// ─── Emission ───

/**
 * Fire-and-forget POST to the registry. Never throws, never blocks the caller
 * past TELEMETRY_TIMEOUT_MS.
 */
export function emitOperational(event: OperationalEvent): void {
  if (process.env.SERVICIALO_OPERATIONAL_TELEMETRY === 'false') return;

  const baseUrl = process.env.SERVICIALO_TELEMETRY_BASE_URL
    || process.env.SERVICIALO_BASE_URL
    || 'https://servicialo.com';

  const url = `${baseUrl.replace(/\/$/, '')}/api/telemetry/operational`;

  // Don't await — emission must not block tool responses.
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(TELEMETRY_TIMEOUT_MS),
  }).catch(() => {
    // Silent failure by design — telemetry is best-effort.
  });
}
