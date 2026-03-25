/**
 * Telemetry stats queries.
 *
 * Reads from the telemetry_pings table in the registry Supabase
 * project via PostgREST. All queries are read-only and public-safe.
 */

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

function headers(): Record<string, string> {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    throw new Error('Missing REGISTRY_SUPABASE_URL or REGISTRY_SUPABASE_SERVICE_KEY');
  }
  return {
    apikey: REGISTRY_KEY,
    Authorization: `Bearer ${REGISTRY_KEY}`,
    'Content-Type': 'application/json',
  };
}

function rest(table: string, params: string) {
  return `${REGISTRY_URL}/rest/v1/${table}?${params}`;
}

// ─── Types ───

export interface NetworkStats {
  totalPings: number;
  uniqueNodes24h: number;
  uniqueNodes7d: number;
  versionBreakdown: { version: string; count: number }[];
  dailyChart: { date: string; count: number }[];
}

// ─── Queries ───

async function uniqueNodes(interval: '24h' | '7d'): Promise<number> {
  const ago = interval === '24h'
    ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Use PostgREST to select distinct node_ids after the cutoff
  const params = new URLSearchParams({
    select: 'node_id',
    created_at: `gte.${ago}`,
    'node_id': 'not.is.null',
  });

  const res = await fetch(rest('telemetry_pings', params.toString()), {
    headers: headers(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return 0;
  const rows: { node_id: string }[] = await res.json();
  const unique = new Set(rows.map((r) => r.node_id));
  return unique.size;
}

async function versionBreakdown(): Promise<{ version: string; count: number }[]> {
  // Fetch all version values and aggregate client-side
  // (PostgREST doesn't support GROUP BY natively without an RPC/view)
  const res = await fetch(rest('telemetry_pings', 'select=version'), {
    headers: headers(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];
  const rows: { version: string }[] = await res.json();
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = r.version ?? 'unknown';
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([version, count]) => ({ version, count }))
    .sort((a, b) => b.count - a.count);
}

async function dailyChart(): Promise<{ date: string; count: number }[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: 'created_at',
    created_at: `gte.${since}`,
    order: 'created_at.asc',
  });

  const res = await fetch(rest('telemetry_pings', params.toString()), {
    headers: headers(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];
  const rows: { created_at: string }[] = await res.json();
  const counts = new Map<string, number>();
  for (const r of rows) {
    const day = r.created_at.slice(0, 10); // YYYY-MM-DD
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Combined fetch ───

export async function getNetworkStats(): Promise<NetworkStats> {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return {
      totalPings: 0,
      uniqueNodes24h: 0,
      uniqueNodes7d: 0,
      versionBreakdown: [],
      dailyChart: [],
    };
  }

  const [uniqueNodes24h, uniqueNodes7d, versions, daily] =
    await Promise.all([
      uniqueNodes('24h'),
      uniqueNodes('7d'),
      versionBreakdown(),
      dailyChart(),
    ]);

  const totalPings = versions.reduce((sum, v) => sum + v.count, 0);

  return {
    totalPings,
    uniqueNodes24h,
    uniqueNodes7d,
    versionBreakdown: versions,
    dailyChart: daily,
  };
}
