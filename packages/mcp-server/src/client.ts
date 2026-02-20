/**
 * HTTP client for Coordinalo REST API.
 * Wraps native fetch with auth headers and base URL.
 * All paths are prefixed with /api/organizations/{orgSlug}.
 */

export interface ClientConfig {
  baseUrl: string;
  apiKey: string;
  orgId: string;
}

export class CoordinaloClient {
  private baseUrl: string;
  private apiKey: string;
  private orgId: string;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.orgId = config.orgId;
  }

  /** Base path for all org-scoped endpoints */
  private orgPath(): string {
    return `/api/organizations/${this.orgId}`;
  }

  private headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build full URL. If path starts with `/api/` it's used as-is (absolute).
   * Otherwise it's appended to the org-scoped base path.
   */
  private buildUrl(path: string): string {
    if (path.startsWith('/api/')) {
      return `${this.baseUrl}${path}`;
    }
    return `${this.baseUrl}${this.orgPath()}${path}`;
  }

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
      headers: this.headers(),
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
      headers: this.headers(),
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
      headers: this.headers(),
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
      headers: this.headers(),
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
      headers: this.headers(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DELETE ${path} failed (${res.status}): ${text}`);
    }

    return res.json();
  }
}
