/**
 * Telemetry stats queries.
 *
 * Reads from the telemetry_instances table in the registry Supabase
 * project via PostgREST. All queries are read-only and public-safe.
 *
 * Counting strategy:
 * - "Unique nodes" uses DISTINCT ip_hash (fingerprint) when available,
 *   falling back to DISTINCT node_id. This prevents ephemeral containers
 *   (each generating a new node_id) from inflating counts.
 */

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

function hdrs(): Record<string, string> {
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
  uniqueHosts: number;
  uniqueNodes24h: number;
  uniqueNodes7d: number;
  versionBreakdown: { version: string; count: number }[];
  dailyChart: { date: string; count: number }[];
  countryBreakdown: CountryEntry[];
  continentBreakdown: { continent: string; count: number }[];
}

// ─── Queries ───

/**
 * Count unique nodes by distinct ip_hash (preferred) or node_id (fallback).
 * ip_hash deduplicates ephemeral containers that generate new node_ids.
 */
async function uniqueNodes(interval: '24h' | '7d'): Promise<number> {
  const ago = interval === '24h'
    ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    select: 'node_id,ip_hash',
    created_at: `gte.${ago}`,
  });

  const res = await fetch(rest('telemetry_instances', params.toString()), {
    headers: hdrs(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return 0;
  const rows: { node_id: string | null; ip_hash: string | null }[] = await res.json();

  // Prefer ip_hash for uniqueness; fall back to node_id for old rows without ip_hash
  const unique = new Set<string>();
  for (const r of rows) {
    const key = r.ip_hash ?? r.node_id;
    if (key) unique.add(key);
  }
  return unique.size;
}

/**
 * Total unique instances (all time).
 * Returns both node_id count (raw) and ip_hash count (deduplicated hosts).
 */
async function totalUniqueInstances(): Promise<{ byNodeId: number; byIpHash: number }> {
  const params = new URLSearchParams({
    select: 'node_id,ip_hash',
  });

  const res = await fetch(rest('telemetry_instances', params.toString()), {
    headers: hdrs(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return { byNodeId: 0, byIpHash: 0 };
  const rows: { node_id: string | null; ip_hash: string | null }[] = await res.json();

  const nodeIds = new Set<string>();
  const ipHashes = new Set<string>();
  for (const r of rows) {
    if (r.node_id) nodeIds.add(r.node_id);
    const hostKey = r.ip_hash ?? r.node_id;
    if (hostKey) ipHashes.add(hostKey);
  }
  return { byNodeId: nodeIds.size, byIpHash: ipHashes.size };
}

async function versionBreakdown(): Promise<{ version: string; count: number }[]> {
  // Deduplicate by ip_hash per version to avoid bot inflation
  const res = await fetch(rest('telemetry_instances', 'select=version,ip_hash,node_id'), {
    headers: hdrs(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];
  const rows: { version: string; ip_hash: string | null; node_id: string | null }[] =
    await res.json();

  // Count unique fingerprints per version
  const versionSets = new Map<string, Set<string>>();
  for (const r of rows) {
    const v = r.version ?? 'unknown';
    const key = r.ip_hash ?? r.node_id ?? 'unknown';
    if (!versionSets.has(v)) versionSets.set(v, new Set());
    versionSets.get(v)!.add(key);
  }

  return Array.from(versionSets.entries())
    .map(([version, keys]) => ({ version, count: keys.size }))
    .sort((a, b) => b.count - a.count);
}

async function dailyChart(): Promise<{ date: string; count: number }[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: 'created_at,ip_hash,node_id',
    created_at: `gte.${since}`,
    order: 'created_at.asc',
  });

  const res = await fetch(rest('telemetry_instances', params.toString()), {
    headers: hdrs(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];
  const rows: { created_at: string; ip_hash: string | null; node_id: string | null }[] =
    await res.json();

  // Count unique fingerprints per day
  const daySets = new Map<string, Set<string>>();
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const key = r.ip_hash ?? r.node_id ?? 'unknown';
    if (!daySets.has(day)) daySets.set(day, new Set());
    daySets.get(day)!.add(key);
  }

  return Array.from(daySets.entries())
    .map(([date, keys]) => ({ date, count: keys.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function countryBreakdown(): Promise<{
  countries: CountryEntry[];
  continents: { continent: string; count: number }[];
}> {
  const params = new URLSearchParams({
    select: 'country_code,country_name,continent,ip_hash,node_id',
    'country_code': 'not.is.null',
  });

  const res = await fetch(rest('telemetry_instances', params.toString()), {
    headers: hdrs(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return { countries: [], continents: [] };

  const rows: {
    country_code: string;
    country_name: string;
    continent: string;
    ip_hash: string | null;
    node_id: string | null;
  }[] = await res.json();

  // Count unique fingerprints per country
  const countrySets = new Map<string, { country_name: string; continent: string; keys: Set<string> }>();
  const continentSets = new Map<string, Set<string>>();

  for (const r of rows) {
    const key = r.ip_hash ?? r.node_id ?? 'unknown';

    if (!countrySets.has(r.country_code)) {
      countrySets.set(r.country_code, {
        country_name: r.country_name,
        continent: r.continent,
        keys: new Set(),
      });
    }
    countrySets.get(r.country_code)!.keys.add(key);

    if (!continentSets.has(r.continent)) continentSets.set(r.continent, new Set());
    continentSets.get(r.continent)!.add(key);
  }

  const countries = Array.from(countrySets.entries())
    .map(([country_code, v]) => ({
      country_code,
      country_name: v.country_name,
      continent: v.continent,
      count: v.keys.size,
    }))
    .sort((a, b) => b.count - a.count);

  const continents = Array.from(continentSets.entries())
    .map(([continent, keys]) => ({ continent, count: keys.size }))
    .sort((a, b) => b.count - a.count);

  return { countries, continents };
}

// ─── Verified implementors ───

export interface VerifiedImplementor {
  impl_name: string;
  impl_url: string | null;
  country_code: string | null;
  country_name: string | null;
  node_count: number;
}

export async function getVerifiedImplementors(): Promise<VerifiedImplementor[]> {
  if (!REGISTRY_URL || !REGISTRY_KEY) return [];

  const params = new URLSearchParams({
    select: 'impl_name,impl_url,country_code,country_name,ip_hash,node_id',
    verification_status: 'eq.verified',
    'impl_name': 'not.is.null',
  });

  const res = await fetch(rest('telemetry_instances', params.toString()), {
    headers: hdrs(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];

  const rows: {
    impl_name: string;
    impl_url: string | null;
    country_code: string | null;
    country_name: string | null;
    ip_hash: string | null;
    node_id: string | null;
  }[] = await res.json();

  // Group by impl_name, count unique hosts per implementation
  const implMap = new Map<string, {
    impl_url: string | null;
    country_code: string | null;
    country_name: string | null;
    hosts: Set<string>;
  }>();

  for (const r of rows) {
    const key = r.ip_hash ?? r.node_id ?? 'unknown';
    if (!implMap.has(r.impl_name)) {
      implMap.set(r.impl_name, {
        impl_url: r.impl_url,
        country_code: r.country_code,
        country_name: r.country_name,
        hosts: new Set(),
      });
    }
    implMap.get(r.impl_name)!.hosts.add(key);
  }

  return Array.from(implMap.entries())
    .map(([impl_name, v]) => ({
      impl_name,
      impl_url: v.impl_url,
      country_code: v.country_code,
      country_name: v.country_name,
      node_count: v.hosts.size,
    }))
    .sort((a, b) => b.node_count - a.node_count);
}

// ─── Combined fetch ───

export async function getNetworkStats(): Promise<NetworkStats> {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    return {
      totalInstances: 0,
      uniqueHosts: 0,
      uniqueNodes24h: 0,
      uniqueNodes7d: 0,
      versionBreakdown: [],
      dailyChart: [],
      countryBreakdown: [],
      continentBreakdown: [],
    };
  }

  const [totals, uniqueNodes24h, uniqueNodes7d, versions, daily, geo] =
    await Promise.all([
      totalUniqueInstances(),
      uniqueNodes('24h'),
      uniqueNodes('7d'),
      versionBreakdown(),
      dailyChart(),
      countryBreakdown(),
    ]);

  return {
    totalInstances: totals.byNodeId,
    uniqueHosts: totals.byIpHash,
    uniqueNodes24h,
    uniqueNodes7d,
    versionBreakdown: versions,
    dailyChart: daily,
    countryBreakdown: geo.countries,
    continentBreakdown: geo.continents,
  };
}
