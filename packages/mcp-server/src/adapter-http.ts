/**
 * HttpAdapter — generic adapter for any Servicialo-compatible implementation
 * that exposes the canonical HTTP_PROFILE.md REST endpoints.
 *
 * Path translation:
 *   Coordinalo internal paths (used by tool handlers) are translated to
 *   canonical /v1/* paths defined in HTTP_PROFILE.md.
 *
 *   Public endpoints:
 *     /api/servicialo/manifest             → /v1/manifest
 *     /api/servicialo/registry             → /v1/registry
 *     /api/servicialo/{slug}/services      → /v1/organizations/{slug}/services
 *     /api/servicialo/{slug}/availability  → /v1/organizations/{slug}/availability
 *
 *   Authenticated endpoints:
 *     /coordinalo/*                        → /v1/*
 *     /relacionalo/clients/upsert          → /v1/clients
 *     /planificalo/*                       → /v1/*
 *
 * Unlike CoordinaloClient, this adapter does NOT prefix paths with
 * /api/organizations/{orgId}. The org context is communicated via
 * the X-Servicialo-Org header (or the implementation's own mechanism).
 */

import type { ServicialoAdapter } from './adapter.js';

export interface HttpAdapterConfig {
  baseUrl: string;
  apiKey?: string;
  orgId?: string;
}

export class HttpAdapter implements ServicialoAdapter {
  private baseUrl: string;
  private apiKey: string | undefined;
  private orgId: string | undefined;

  constructor(config: HttpAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.orgId = config.orgId;
  }

  get isAuthenticated(): boolean {
    return !!this.apiKey;
  }

  // --- Path translation ---

  /**
   * Translate a Coordinalo-internal path to a canonical HTTP_PROFILE.md path.
   */
  private translatePath(path: string): string {
    // Public: /api/servicialo/manifest → /v1/manifest
    if (path === '/api/servicialo/manifest') {
      return '/v1/manifest';
    }

    // Public: /api/servicialo/registry → /v1/registry
    if (path === '/api/servicialo/registry') {
      return '/v1/registry';
    }

    // Public: /api/servicialo/{slug}/* → /v1/organizations/{slug}/*
    const pubMatch = path.match(/^\/api\/servicialo\/([^/]+)\/(.+)$/);
    if (pubMatch) {
      return `/v1/organizations/${pubMatch[1]}/${pubMatch[2]}`;
    }

    // Authenticated: /relacionalo/clients/upsert → /v1/clients
    if (path === '/relacionalo/clients/upsert') {
      return '/v1/clients';
    }

    // Authenticated: /coordinalo/* → /v1/*
    if (path.startsWith('/coordinalo/')) {
      return '/v1/' + path.slice('/coordinalo/'.length);
    }

    // Authenticated: /planificalo/* → /v1/*
    if (path.startsWith('/planificalo/')) {
      return '/v1/' + path.slice('/planificalo/'.length);
    }

    // Absolute /api/* paths: pass through
    if (path.startsWith('/api/')) {
      return path;
    }

    // Fallback: prefix with /v1
    return '/v1' + path;
  }

  // --- Headers ---

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    if (this.orgId) {
      headers['X-Servicialo-Org'] = this.orgId;
    }
    return headers;
  }

  private publicHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.orgId) {
      headers['X-Servicialo-Org'] = this.orgId;
    }
    return headers;
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${this.translatePath(path)}`;
  }

  // --- Public API ---

  readonly pub = {
    get: async (path: string, params?: Record<string, string | number | undefined>): Promise<unknown> => {
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
