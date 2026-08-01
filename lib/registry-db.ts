/**
 * Registry database client.
 *
 * Connects to the separate servicialo-registry Supabase project
 * via its PostgREST API. No extra dependencies needed — just fetch.
 */

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

function getHeaders(options?: { prefer?: string }) {
  if (!REGISTRY_URL || !REGISTRY_KEY) {
    throw new Error('Missing REGISTRY_SUPABASE_URL or REGISTRY_SUPABASE_SERVICE_KEY');
  }
  const headers: Record<string, string> = {
    apikey: REGISTRY_KEY,
    Authorization: `Bearer ${REGISTRY_KEY}`,
    'Content-Type': 'application/json',
  };
  if (options?.prefer) {
    headers['Prefer'] = options.prefer;
  }
  return headers;
}

function restUrl(path: string) {
  return `${REGISTRY_URL}/rest/v1/${path}`;
}

// ─── Types ───

/**
 * Capability profile ids (protocol/manifest.yaml `profiles`). Closed
 * vocabulary — `supported_profiles` values must come from this list.
 */
export const PROFILE_IDS = [
  'discovery',
  'ordering',
  'coordination',
  'delivery',
  'evidence',
  'settlement',
  'network',
] as const;

export type ProfileId = (typeof PROFILE_IDS)[number];

export interface RegistryEntry {
  id: string;
  country: string;
  slug: string;
  display_name: string;
  endpoint_url: string;
  implementer: string;
  verticals: string[];
  locale: string;
  /**
   * DEPRECATED: equals review_status === 'reviewed'. Kept for wire
   * compatibility. Do not use for capability gating — use
   * supported_profiles (+ review_status) instead.
   */
  is_verified: boolean;
  /** Manual listing review by the Servicialo team. */
  review_status: 'unreviewed' | 'reviewed';
  /** Conformance level per public/spec/certification.md. Assigned by review. */
  conformance_level: 'unverified' | 'core' | 'full';
  /** Self-declared capability profiles (PROFILE_IDS). */
  supported_profiles: string[];
  discoverable: boolean;
  ownership_token: string;
  last_heartbeat: string | null;
  trust_score: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HealthCheck {
  id: string;
  entry_id: string;
  checked_at: string;
  status: number;
  latency_ms: number;
}

// ─── Search ───

export async function searchEntries(filters: {
  country?: string;
  vertical?: string;
  q?: string;
  locale?: string;
  limit?: number;
}): Promise<RegistryEntry[]> {
  const params = new URLSearchParams();
  params.set('select', '*');
  params.set('order', 'trust_score.desc,display_name.asc');

  // Only return orgs that explicitly opted in
  params.append('discoverable', 'eq.true');

  if (filters.country) {
    params.append('country', `eq.${filters.country}`);
  }
  if (filters.vertical) {
    params.append('verticals', `cs.{${filters.vertical}}`);
  }
  if (filters.q) {
    params.append('or', `(display_name.ilike.*${filters.q}*,slug.ilike.*${filters.q}*)`);
  }
  if (filters.locale) {
    params.append('locale', `eq.${filters.locale}`);
  }

  const limit = Math.min(filters.limit ?? 20, 50);
  params.set('limit', String(limit));

  const res = await fetch(restUrl(`registry_entries?${params}`), {
    headers: getHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registry search failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ─── Lookup ───

export async function getEntry(country: string, slug: string): Promise<RegistryEntry | null> {
  const params = new URLSearchParams({
    country: `eq.${country}`,
    slug: `eq.${slug}`,
    limit: '1',
  });

  const res = await fetch(restUrl(`registry_entries?${params}`), {
    headers: getHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registry lookup failed: ${res.status} ${text}`);
  }

  const rows: RegistryEntry[] = await res.json();
  return rows[0] ?? null;
}

// ─── Register ───

export async function createEntry(data: {
  country: string;
  slug: string;
  display_name: string;
  endpoint_url: string;
  implementer: string;
  verticals?: string[];
  locale?: string;
  supported_profiles?: string[];
  metadata?: Record<string, unknown>;
}): Promise<RegistryEntry> {
  const res = await fetch(restUrl('registry_entries'), {
    method: 'POST',
    headers: getHeaders({ prefer: 'return=representation' }),
    body: JSON.stringify({
      country: data.country,
      slug: data.slug,
      display_name: data.display_name,
      endpoint_url: data.endpoint_url,
      implementer: data.implementer,
      verticals: data.verticals ?? [],
      locale: data.locale ?? 'es',
      discoverable: false, // Orgs must explicitly opt in
      // Self-declared; review_status/conformance_level stay at their
      // defaults ('unreviewed'/'unverified') until the team reviews.
      supported_profiles: data.supported_profiles ?? [],
      metadata: data.metadata ?? {},
    }),
  });

  if (res.status === 409 || (res.status === 400 && (await res.clone().text()).includes('duplicate'))) {
    throw new ConflictError(`Entry ${data.country}/${data.slug} already exists`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registry create failed: ${res.status} ${text}`);
  }

  const rows: RegistryEntry[] = await res.json();
  return rows[0];
}

// ─── Update ───

export async function updateEntry(
  country: string,
  slug: string,
  ownershipToken: string,
  // supported_profiles is self-declared and owner-updatable; review_status
  // and conformance_level are NOT — they are assigned by the review process.
  data: Partial<Pick<RegistryEntry, 'endpoint_url' | 'display_name' | 'verticals' | 'metadata' | 'discoverable' | 'supported_profiles'>>,
): Promise<RegistryEntry | null> {
  // First verify ownership
  const entry = await getEntry(country, slug);
  if (!entry) return null;
  if (entry.ownership_token !== ownershipToken) {
    throw new AuthError('Invalid ownership token');
  }

  const params = new URLSearchParams({
    country: `eq.${country}`,
    slug: `eq.${slug}`,
  });

  const res = await fetch(restUrl(`registry_entries?${params}`), {
    method: 'PATCH',
    headers: getHeaders({ prefer: 'return=representation' }),
    body: JSON.stringify({
      ...data,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registry update failed: ${res.status} ${text}`);
  }

  const rows: RegistryEntry[] = await res.json();
  return rows[0] ?? null;
}

// ─── Heartbeat ───

export async function heartbeat(
  country: string,
  slug: string,
  ownershipToken: string,
): Promise<RegistryEntry | null> {
  const entry = await getEntry(country, slug);
  if (!entry) return null;
  if (entry.ownership_token !== ownershipToken) {
    throw new AuthError('Invalid ownership token');
  }

  const params = new URLSearchParams({
    country: `eq.${country}`,
    slug: `eq.${slug}`,
  });

  const res = await fetch(restUrl(`registry_entries?${params}`), {
    method: 'PATCH',
    headers: getHeaders({ prefer: 'return=representation' }),
    body: JSON.stringify({
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Heartbeat failed: ${res.status} ${text}`);
  }

  const rows: RegistryEntry[] = await res.json();
  return rows[0] ?? null;
}

// ─── List all (for agents.json) ───

export async function listAllEntries(): Promise<RegistryEntry[]> {
  const res = await fetch(restUrl('registry_entries?select=*&discoverable=eq.true&order=trust_score.desc'), {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registry list failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ─── Health check insert ───

export async function insertHealthCheck(data: {
  entry_id: string;
  status: number;
  latency_ms: number;
}): Promise<void> {
  const res = await fetch(restUrl('health_checks'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.error(`Health check insert failed: ${res.status}`);
  }
}

// ─── Set discoverable ───

export async function setDiscoverable(
  country: string,
  slug: string,
  ownershipToken: string,
  value: boolean,
): Promise<RegistryEntry | null> {
  return updateEntry(country, slug, ownershipToken, { discoverable: value });
}

// ─── Errors ───

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
