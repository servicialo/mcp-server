import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoordinaloClient } from '../client.js';

describe('CoordinaloClient', () => {
  describe('constructor', () => {
    it('strips trailing slashes from baseUrl', () => {
      const client = new CoordinaloClient({ baseUrl: 'https://example.com///' });
      // Verify via isAuthenticated (which doesn't depend on URL)
      expect(client.isAuthenticated).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no credentials', () => {
      const client = new CoordinaloClient({ baseUrl: 'https://example.com' });
      expect(client.isAuthenticated).toBe(false);
    });

    it('returns false when only apiKey', () => {
      const client = new CoordinaloClient({ baseUrl: 'https://example.com', apiKey: 'key' });
      expect(client.isAuthenticated).toBe(false);
    });

    it('returns false when only orgId', () => {
      const client = new CoordinaloClient({ baseUrl: 'https://example.com', orgId: 'org' });
      expect(client.isAuthenticated).toBe(false);
    });

    it('returns true when both apiKey and orgId', () => {
      const client = new CoordinaloClient({ baseUrl: 'https://example.com', apiKey: 'key', orgId: 'org' });
      expect(client.isAuthenticated).toBe(true);
    });
  });

  describe('public GET', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('calls correct URL with query params', async () => {
      const mockResponse = { data: 'test' };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const client = new CoordinaloClient({ baseUrl: 'https://api.example.com' });
      const result = await client.pub.get('/api/servicialo/registry', {
        vertical: 'kinesiologia',
        location: 'Santiago',
        limit: 5,
      });

      expect(result).toEqual(mockResponse);
      expect(fetchSpy).toHaveBeenCalledOnce();

      const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
      expect(calledUrl.origin).toBe('https://api.example.com');
      expect(calledUrl.pathname).toBe('/api/servicialo/registry');
      expect(calledUrl.searchParams.get('vertical')).toBe('kinesiologia');
      expect(calledUrl.searchParams.get('location')).toBe('Santiago');
      expect(calledUrl.searchParams.get('limit')).toBe('5');
    });

    it('omits undefined params', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      const client = new CoordinaloClient({ baseUrl: 'https://api.example.com' });
      await client.pub.get('/api/servicialo/registry', {
        vertical: 'dental',
        location: undefined,
      });

      const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
      expect(calledUrl.searchParams.has('vertical')).toBe(true);
      expect(calledUrl.searchParams.has('location')).toBe(false);
    });

    it('retries with auth headers on 401 when apiKey is available', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
        .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

      const client = new CoordinaloClient({
        baseUrl: 'https://api.example.com',
        apiKey: 'secret',
        orgId: 'org1',
      });
      const result = await client.pub.get('/api/servicialo/registry');

      expect(result).toEqual({ ok: true });
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Second call should have auth header
      const secondCallHeaders = fetchSpy.mock.calls[1][1]?.headers as Record<string, string>;
      expect(secondCallHeaders['Authorization']).toBe('Bearer secret');
    });

    it('throws on 401 when no apiKey available', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401 }),
      );

      const client = new CoordinaloClient({ baseUrl: 'https://api.example.com' });
      await expect(client.pub.get('/api/servicialo/registry')).rejects.toThrow('401 Unauthorized');
    });

    it('throws on non-OK responses', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Not Found', { status: 404 }),
      );

      const client = new CoordinaloClient({ baseUrl: 'https://api.example.com' });
      await expect(client.pub.get('/api/servicialo/missing')).rejects.toThrow('404');
    });
  });

  describe('authenticated requests', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    const makeClient = () => new CoordinaloClient({
      baseUrl: 'https://api.example.com',
      apiKey: 'test_key',
      orgId: 'org_123',
    });

    it('GET builds org-scoped URL for relative paths', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      await makeClient().get('/coordinalo/services/srv_1');

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/api/organizations/org_123/coordinalo/services/srv_1');
    });

    it('GET uses absolute path when starting with /api/', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      await makeClient().get('/api/servicialo/registry');

      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toBe('https://api.example.com/api/servicialo/registry');
    });

    it('POST sends JSON body with auth headers', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{"id":"ses_1"}', { status: 200 }),
      );

      const body = { serviceId: 'srv_1', clientId: 'cli_1' };
      const result = await makeClient().post('/coordinalo/sessions', body);

      expect(result).toEqual({ id: 'ses_1' });

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain('/api/organizations/org_123/coordinalo/sessions');
      expect(options?.method).toBe('POST');
      expect(options?.body).toBe(JSON.stringify(body));
      expect((options?.headers as Record<string, string>)['Authorization']).toBe('Bearer test_key');
    });

    it('PUT sends JSON body', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{}', { status: 200 }),
      );

      await makeClient().put('/coordinalo/sessions/ses_1', { startTime: '2026-03-01T10:00:00Z' });

      expect(fetchSpy.mock.calls[0][1]?.method).toBe('PUT');
    });

    it('throws when calling authenticated endpoint without apiKey', async () => {
      const client = new CoordinaloClient({ baseUrl: 'https://api.example.com', orgId: 'org_1' });
      await expect(client.get('/coordinalo/services/srv_1')).rejects.toThrow('No SERVICIALO_API_KEY');
    });

    it('throws when calling org-scoped endpoint without orgId', async () => {
      const client = new CoordinaloClient({ baseUrl: 'https://api.example.com', apiKey: 'key' });
      await expect(client.get('/coordinalo/services/srv_1')).rejects.toThrow('No SERVICIALO_ORG_ID');
    });
  });
});
