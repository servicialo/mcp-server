import { describe, it, expect } from 'vitest';
import {
  bucketLeadTime,
  bucketSlotHour,
  bucketDurationMinutes,
  bucketPriceCLP,
  bucketTimeToCollect,
  bucketTimeToResolve,
  isoWeekday,
  computeOrgFingerprint,
  buildBookingCreatedEvent,
  buildPaymentSettledEvent,
} from '../telemetry/operational.js';

describe('bucketLeadTime', () => {
  const now = new Date('2026-05-19T10:00:00Z');
  const cases: Array<[string, ReturnType<typeof bucketLeadTime>]> = [
    ['2026-05-19T20:00:00Z', 'same_day'],     // 10h
    ['2026-05-20T18:00:00Z', '1-2_days'],     // 32h
    ['2026-05-23T10:00:00Z', '3-7_days'],     // 96h
    ['2026-05-30T10:00:00Z', '1-2_weeks'],    // 264h
    ['2026-06-10T10:00:00Z', '2-4_weeks'],    // 528h
    ['2026-07-20T10:00:00Z', '1+_months'],    // 62 days
  ];
  for (const [start, expected] of cases) {
    it(`${start} → ${expected}`, () => {
      expect(bucketLeadTime(now, new Date(start))).toBe(expected);
    });
  }
});

describe('bucketSlotHour', () => {
  it('buckets midnight to 00-06', () => {
    const d = new Date(); d.setHours(3, 0, 0, 0);
    expect(bucketSlotHour(d)).toBe('00-06');
  });
  it('buckets 09:30 to 09-12', () => {
    const d = new Date(); d.setHours(9, 30, 0, 0);
    expect(bucketSlotHour(d)).toBe('09-12');
  });
  it('buckets 23:00 to 21-24', () => {
    const d = new Date(); d.setHours(23, 0, 0, 0);
    expect(bucketSlotHour(d)).toBe('21-24');
  });
});

describe('bucketDurationMinutes', () => {
  it.each([
    [10, 'under_15min'],
    [15, '15-30min'],
    [29, '15-30min'],
    [30, '30-60min'],
    [59, '30-60min'],
    [60, '60-90min'],
    [89, '60-90min'],
    [90, '90-120min'],
    [119, '90-120min'],
    [120, 'over_120min'],
    [240, 'over_120min'],
  ])('%i min → %s', (mins, expected) => {
    expect(bucketDurationMinutes(mins)).toBe(expected);
  });
});

describe('bucketPriceCLP', () => {
  it.each([
    [0, '0-10k'],
    [9_999, '0-10k'],
    [10_000, '10-25k'],
    [24_999, '10-25k'],
    [25_000, '25-50k'],
    [49_999, '25-50k'],
    [50_000, '50-100k'],
    [99_999, '50-100k'],
    [100_000, '100-250k'],
    [249_999, '100-250k'],
    [250_000, '250-500k'],
    [499_999, '250-500k'],
    [500_000, '500k-1M'],
    [999_999, '500k-1M'],
    [1_000_000, '1M+'],
    [5_000_000, '1M+'],
  ])('%i CLP → %s', (amount, expected) => {
    expect(bucketPriceCLP(amount)).toBe(expected);
  });
});

describe('bucketTimeToCollect', () => {
  const completed = new Date('2026-05-19T10:00:00Z');
  it.each([
    ['2026-05-19T10:30:00Z', 'immediate'],     // 30min
    ['2026-05-19T15:00:00Z', 'within_24h'],   // 5h
    ['2026-05-22T10:00:00Z', '1-7_days'],     // 72h
    ['2026-06-01T10:00:00Z', '1-4_weeks'],    // ~13 days
    ['2026-06-20T10:00:00Z', 'over_1_month'], // 32 days
  ])('completed→%s = %s', (settled, expected) => {
    expect(bucketTimeToCollect(completed, new Date(settled))).toBe(expected);
  });
});

describe('bucketTimeToResolve', () => {
  const opened = new Date('2026-05-19T10:00:00Z');
  it('null resolvedAt → unresolved', () => {
    expect(bucketTimeToResolve(opened, null)).toBe('unresolved');
  });
  it('5h → under_24h', () => {
    expect(bucketTimeToResolve(opened, new Date('2026-05-19T15:00:00Z'))).toBe('under_24h');
  });
  it('2 days → 1-3_days', () => {
    expect(bucketTimeToResolve(opened, new Date('2026-05-21T10:00:00Z'))).toBe('1-3_days');
  });
  it('20 days → over_2_weeks', () => {
    expect(bucketTimeToResolve(opened, new Date('2026-06-08T10:00:00Z'))).toBe('over_2_weeks');
  });
});

describe('isoWeekday', () => {
  it('Sunday → 7 (not 0)', () => {
    // 2026-05-17 is Sunday
    expect(isoWeekday(new Date(2026, 4, 17))).toBe(7);
  });
  it('Monday → 1', () => {
    expect(isoWeekday(new Date(2026, 4, 18))).toBe(1);
  });
  it('Friday → 5', () => {
    expect(isoWeekday(new Date(2026, 4, 22))).toBe(5);
  });
});

describe('computeOrgFingerprint', () => {
  it('is deterministic for the same slug', () => {
    expect(computeOrgFingerprint('coordinalo')).toBe(computeOrgFingerprint('coordinalo'));
  });
  it('differs across slugs', () => {
    expect(computeOrgFingerprint('coordinalo')).not.toBe(computeOrgFingerprint('coordinalo2'));
  });
  it('is 64 hex chars (SHA-256)', () => {
    const fp = computeOrgFingerprint('any-slug');
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('event builders', () => {
  const ctx = {
    protocolVersion: '0.9',
    nodeVersion: '0.9.10',
    vertical: 'health',
    region: 'CL',
    orgSlug: 'coordinalo',
  };

  it('buildBookingCreatedEvent produces a valid envelope', () => {
    const event = buildBookingCreatedEvent(ctx, {
      startsAt: '2026-05-22T15:00:00Z',
      bookedAt: '2026-05-19T10:00:00Z',
      channel: 'agent',
    });
    expect(event.event_type).toBe('booking_created');
    expect(event.vertical).toBe('health');
    expect(event.region).toBe('CL');
    expect(event.org_fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(event.payload).toMatchObject({
      lead_time_bucket: '3-7_days',
      channel: 'agent',
    });
  });

  it('buildPaymentSettledEvent buckets price and time-to-collect', () => {
    const event = buildPaymentSettledEvent(ctx, {
      completedAt: '2026-05-19T10:00:00Z',
      settledAt: '2026-05-19T10:30:00Z',
      amountCLP: 45_000,
      currency: 'clp',
      paymentMethod: 'transfer',
    });
    expect(event.payload).toMatchObject({
      price_band: '25-50k',
      currency: 'CLP',
      payment_method: 'transfer',
      time_to_collect_bucket: 'immediate',
    });
  });

  it('omits org_fingerprint when no orgSlug', () => {
    const event = buildBookingCreatedEvent(
      { ...ctx, orgSlug: undefined },
      { startsAt: '2026-05-22T15:00:00Z' },
    );
    expect(event.org_fingerprint).toBeUndefined();
  });
});
