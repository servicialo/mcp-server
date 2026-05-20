/**
 * Node-token authentication for protocol-level endpoints.
 *
 * Reads `X-Servicialo-Node-Token` from a request, matches it against
 * `registry_entries.ownership_token`, and returns the resolved
 * `{ nodeId, slug }`. Used by the webhooks API and any other endpoint
 * that needs to know "which registered node is calling".
 *
 * Returns `null` (caller should respond 401) if:
 *   - header is absent or empty
 *   - registry env vars are missing
 *   - no row in `registry_entries` matches the token
 */

const REGISTRY_URL = process.env.REGISTRY_SUPABASE_URL;
const REGISTRY_KEY = process.env.REGISTRY_SUPABASE_SERVICE_KEY;

export interface AuthenticatedNode {
  nodeId: string;
  slug: string;
}

export async function resolveNodeFromRequest(request: Request): Promise<AuthenticatedNode | null> {
  const token = request.headers.get('x-servicialo-node-token');
  if (!token) return null;
  if (!REGISTRY_URL || !REGISTRY_KEY) return null;

  const qs = new URLSearchParams({
    select: 'id,slug',
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
    const rows = (await res.json()) as Array<{ id: string; slug: string }>;
    const row = rows[0];
    if (!row) return null;
    return { nodeId: row.id, slug: row.slug };
  } catch {
    return null;
  }
}

/**
 * Wraps a Next.js handler so that the first thing it does is resolve the node.
 * If auth fails, the handler short-circuits with 401.
 */
export function unauthorized() {
  return Response.json(
    { error: 'unauthorized', message: 'Missing or invalid X-Servicialo-Node-Token header' },
    { status: 401 },
  );
}
