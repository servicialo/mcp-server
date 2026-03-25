/**
 * Telemetry stats queries.
 *
 * Reads from the telemetry_instances table in the registry Supabase
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

export interface CountryEntry {
  country_code: string;
  country_name: string;
  continent: string;
  count: number;
}

export interface NetworkStats {
  totalInstances: number;
  uniqueNodes24h: number;
  uniqueNodes7d: number;
  versionBreakdown: { version: string; count: number }[];
  dailyChart: { date: string; count: number }[];
  countryBreakdown: CountryEntry[];
  continentBreakdown: { continent: string; count: number }[];
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

  const res = await fetch(rest('telemetry_instances', params.toString()), {
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
  const res = await fetch(rest('telemetry_instances', 'select=version'), {
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

  const res = await fetch(rest('telemetry_instances', params.toString()), {
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

async function countryBreakdown(): Promise<{
  countries: CountryEntry[];
  continents: { continent: string; count: number }[];
}> {
  const params = new URLSearchParams({
    select: 'country_code,country_name,continent',
    'country_code': 'not.is.null',
  });

  const res = await fetch(rest('telemetry_instances', params.toString()), {
    headers: headers(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return { countries: [], continents: [] };

  const rows: { country_code: string; country_name: string; continent: string }[] =
    await res.json();

  // Aggregate by country
  const countryMap = new Map<string, { country_name: string; continent: string; count: number }>();
  const continentMap = new Map<string, number>();

  for (const r of rows) {
    const key = r.country_code;
    const existing = countryMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      countryMap.set(key, {
        country_name: r.country_name,
        continent: r.continent,
        count: 1,
      });
    }
    continentMap.set(r.continent, (continentMap.get(r.continent) ?? 0) + 1);
  }

  const countries = Array.from(countryMap.entries())
    .map(([country_code, v]) => ({ country_code, ...v }))
    .sort((a, b) => b.count - a.count);

  const continents = Array.from(continentMap.entries())
    .map(([continent, count]) => ({ continent, count }))
    .sort((a, b) => b.count - a.count);

  return { countries, continents };
}

// ─── Combined fetch ───

export async function getNetworkStats(): Promise<NetworkStats> {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return {
      totalInstances: 0,
      uniqueNodes24h: 0,
      uniqueNodes7d: 0,
      versionBreakdown: [],
      dailyChart: [],
      countryBreakdown: [],
      continentBreakdown: [],
    };
  }

  const [uniqueNodes24h, uniqueNodes7d, versions, daily, geo] =
    await Promise.all([
      uniqueNodes('24h'),
      uniqueNodes('7d'),
      versionBreakdown(),
      dailyChart(),
      countryBreakdown(),
    ]);

  const totalInstances = versions.reduce((sum, v) => sum + v.count, 0);

  return {
    totalInstances,
    uniqueNodes24h,
    uniqueNodes7d,
    versionBreakdown: versions,
    dailyChart: daily,
    countryBreakdown: geo.countries,
    continentBreakdown: geo.continents,
  };
}
