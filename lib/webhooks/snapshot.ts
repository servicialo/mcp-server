/**
 * Weekly benchmark snapshot computation.
 *
 * Builds two flavors of snapshot for the cron to fan out:
 *   - "realtime"  → last 7 days, sent to tier-2 subscribers
 *   - "delayed"   → 7-day band ending 90 days ago, sent to tier 0/1 subscribers
 *
 * Each snapshot is a list of segments, each segment carries its distribution
 * exactly the way /api/benchmarks would return it for the same window —
 * including the k-anonymity ≥5 filter.
 */

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

const K_ANONYMITY_FLOOR = 5;
const MAX_ROWS = 50_000;
const WINDOW_DAYS = 7;
const DELAY_DAYS = 90;

interface Row {
  event_type: string;
  vertical: string;
  region: string;
  org_fingerprint: string | null;
  payload: Record<string, unknown>;
}

export type SnapshotFlavor = 'realtime' | 'delayed';

export interface SnapshotSegment {
  event_type: string;
  vertical: string;
  region: string;
  sample_size: number;
  contributors: number;
  distribution: Record<string, Record<string, { count: number; share: number }>>;
}

export interface WeeklySnapshot {
  flavor: SnapshotFlavor;
  week_start: string;
  week_end: string;
  segments: SnapshotSegment[];
  privacy: { k_anonymity_threshold: number };
}

function windowForFlavor(flavor: SnapshotFlavor): { from: string; to: string } {
  const now = Date.now();
  if (flavor === 'realtime') {
    return {
      from: new Date(now - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date(now).toISOString(),
    };
  }
  // delayed: 7-day band ending 90 days ago
  const to = new Date(now - DELAY_DAYS * 24 * 60 * 60 * 1000);
  const from = new Date(to.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function pgrestHeaders(): Record<string, string> {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    throw new Error('REGISTRY_SUPABASE_URL or REGISTRY_SUPABASE_SERVICE_KEY not configured');
  }
  return {
    apikey: REGISTRY_KEY,
    Authorization: `Bearer ${REGISTRY_KEY}`,
    Accept: 'application/json',
  };
}

async function fetchRowsInWindow(from: string, to: string): Promise<Row[]> {
  const qs = new URLSearchParams({
    select: 'event_type,vertical,region,org_fingerprint,payload',
    occurred_at: `gte.${from}`,
    limit: String(MAX_ROWS),
  });
  qs.append('occurred_at', `lt.${to}`);

  const res = await fetch(`${REGISTRY_URL}/rest/v1/telemetry_events?${qs.toString()}`, {
    headers: pgrestHeaders(),
  });
  if (!res.ok) {
    throw new Error(`fetchRowsInWindow failed: ${res.status}`);
  }
  return (await res.json()) as Row[];
}

function rollup(rows: Row[]): SnapshotSegment[] {
  const groups = new Map<string, {
    event_type: string;
    vertical: string;
    region: string;
    contributors: Set<string>;
    count: number;
    counters: Record<string, Record<string, number>>;
  }>();

  for (const r of rows) {
    const key = `${r.event_type}|${r.vertical}|${r.region}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        event_type: r.event_type,
        vertical: r.vertical,
        region: r.region,
        contributors: new Set<string>(),
        count: 0,
        counters: {},
      };
      groups.set(key, g);
    }
    g.count++;
    if (r.org_fingerprint) g.contributors.add(r.org_fingerprint);
    if (r.payload && typeof r.payload === 'object') {
      for (const [field, value] of Object.entries(r.payload)) {
        const v = String(value);
        g.counters[field] ??= {};
        g.counters[field][v] = (g.counters[field][v] ?? 0) + 1;
      }
    }
  }

  const segments: SnapshotSegment[] = [];
  Array.from(groups.values()).forEach((g) => {
    if (g.contributors.size < K_ANONYMITY_FLOOR) return;
    const distribution: SnapshotSegment['distribution'] = {};
    Object.keys(g.counters).forEach((field) => {
      const buckets: Record<string, number> = g.counters[field];
      distribution[field] = {};
      const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
      entries.forEach(([bucket, count]) => {
        distribution[field][bucket] = {
          count,
          share: Math.round((count / g.count) * 10000) / 10000,
        };
      });
    });
    segments.push({
      event_type: g.event_type,
      vertical: g.vertical,
      region: g.region,
      sample_size: g.count,
      contributors: g.contributors.size,
      distribution,
    });
  });

  segments.sort((a, b) => b.contributors - a.contributors);
  return segments;
}

export async function computeWeeklySnapshot(flavor: SnapshotFlavor): Promise<WeeklySnapshot> {
  const window = windowForFlavor(flavor);
  const rows = await fetchRowsInWindow(window.from, window.to);
  const segments = rollup(rows);
  return {
    flavor,
    week_start: window.from,
    week_end: window.to,
    segments,
    privacy: { k_anonymity_threshold: K_ANONYMITY_FLOOR },
  };
}
