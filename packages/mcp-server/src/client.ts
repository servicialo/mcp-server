/**
 * HTTP client for Coordinalo REST API.
 *
 * Supports two modes:
 * - Public: calls to /api/v1/public/* without Authorization header
 * - Authenticated: calls to /api/organizations/{orgSlug}/* with Bearer token
 */

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  orgId?: string;
}

export class CoordinaloClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  private orgId: string | undefined;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.orgId = config.orgId;
  }

  /** Whether the client has credentials for authenticated operations */
  get isAuthenticated(): boolean {
    return !!this.apiKey && !!this.orgId;
  }

  // --- Private helpers ---

  /** Base path for all org-scoped endpoints */
  private orgPath(): string {
    if (!this.orgId) {
      throw new Error('No SERVICIALO_ORG_ID configured — cannot call org-scoped endpoints.');
    }
    return `/api/organizations/${this.orgId}`;
  }

  private authHeaders(): Record<string, string> {
    if (!this.apiKey) {
      throw new Error('No SERVICIALO_API_KEY configured — cannot call authenticated endpoints.');
    }
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private publicHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build full URL for authenticated (org-scoped) requests.
   * If path starts with `/api/` it's used as-is (absolute).
   * Otherwise it's appended to the org-scoped base path.
   */
  private buildUrl(path: string): string {
    if (path.startsWith('/api/')) {
      return `${this.baseUrl}${path}`;
    }
    return `${this.baseUrl}${this.orgPath()}${path}`;
  }

  /**
   * Build full URL for public requests.
   * Path must be absolute (e.g., /api/v1/public/registry).
   */
  private buildPublicUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // --- Public API (no auth required) ---

  readonly pub = {
    get: async (path: string, params?: Record<string, string | number | undefined>): Promise<unknown> => {
      const url = new URL(this.buildPublicUrl(path));
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) {
            url.searchParams.set(key, String(value));
          }
        }
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.publicHeaders(),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`GET ${path} failed (${res.status}): ${body}`);
      }

      return res.json();
    },
  };

  // --- Authenticated API ---

  async get(path: string, params?: Record<string, string | number | undefined>): Promise<unknown> {
    const url = new URL(this.buildUrl(path));
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this.authHeaders(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GET ${path} failed (${res.status}): ${body}`);
    }

    return res.json();
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    const res = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: this.authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`POST ${path} failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  async put(path: string, body?: unknown): Promise<unknown> {
    const res = await fetch(this.buildUrl(path), {
      method: 'PUT',
      headers: this.authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PUT ${path} failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  async patch(path: string, body?: unknown): Promise<unknown> {
    const res = await fetch(this.buildUrl(path), {
      method: 'PATCH',
      headers: this.authHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PATCH ${path} failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  async delete(path: string): Promise<unknown> {
    const res = await fetch(this.buildUrl(path), {
      method: 'DELETE',
      headers: this.authHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DELETE ${path} failed (${res.status}): ${text}`);
    }

    return res.json();
  }
}
