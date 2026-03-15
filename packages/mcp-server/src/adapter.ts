/**
 * ServicialoAdapter — pluggable backend interface for the MCP server.
 *
 * Any Servicialo-compatible implementation can be connected by providing
 * an adapter that implements this interface. The MCP server delegates all
 * backend calls through this abstraction.
 *
 * Built-in adapters:
 *   - CoordinaloClient  (SERVICIALO_ADAPTER=coordinalo, default)
 *   - HttpAdapter        (SERVICIALO_ADAPTER=http)
 */

export interface ServicialoAdapter {
  /** Whether the adapter has credentials for authenticated operations. */
  readonly isAuthenticated: boolean;

  /** Public API — no authentication required. */
  readonly pub: {
    get(path: string, params?: Record<string, string | number | undefined>): Promise<unknown>;
  };

  /** Authenticated GET with optional query parameters. */
  get(path: string, params?: Record<string, string | number | undefined>): Promise<unknown>;

  /** Authenticated POST with optional JSON body. */
  post(path: string, body?: unknown): Promise<unknown>;

  /** Authenticated PUT with optional JSON body. */
  put(path: string, body?: unknown): Promise<unknown>;

  /** Authenticated PATCH with optional JSON body. */
  patch(path: string, body?: unknown): Promise<unknown>;

  /** Authenticated DELETE. */
  delete(path: string): Promise<unknown>;
}

export type AdapterType = 'coordinalo' | 'http';

/**
 * Factory: create the appropriate adapter based on SERVICIALO_ADAPTER env var.
 *
 * - "coordinalo" (default): connects to a Coordinalo-compatible backend.
 *   Paths are org-scoped under /api/organizations/{orgId}.
 *
 * - "http": connects to any implementation that exposes the canonical
 *   HTTP_PROFILE.md REST endpoints under /v1/*.
 *   Requires SERVICIALO_BASE_URL to point to the implementation's root.
 */
export async function createAdapter(): Promise<ServicialoAdapter> {
  const adapterType = (process.env.SERVICIALO_ADAPTER || 'coordinalo') as AdapterType;
  const baseUrl = process.env.SERVICIALO_BASE_URL || 'http://localhost:3000';

  const config = {
    baseUrl,
    apiKey: process.env.SERVICIALO_API_KEY,
    orgId: process.env.SERVICIALO_ORG_ID,
  };

  switch (adapterType) {
    case 'http': {
      const { HttpAdapter } = await import('./adapter-http.js');
      return new HttpAdapter(config);
    }
    case 'coordinalo':
    default: {
      const { CoordinaloClient } = await import('./client.js');
      return new CoordinaloClient(config);
    }
  }
}
