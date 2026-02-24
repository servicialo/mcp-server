import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoordinaloClient } from '../client.js';
import { registryTools } from '../tools/public/registry.js';
import { publicAvailabilityTools } from '../tools/public/availability.js';
import { publicServicesTools } from '../tools/public/services.js';
import { comprometerTools } from '../tools/authenticated/comprometer.js';
import { deliveryTools } from '../tools/authenticated/delivery.js';
import { cerrarTools } from '../tools/authenticated/cerrar.js';

// Helper: mock fetch to return JSON
function mockFetch(data: unknown = {}) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(data), { status: 200 }),
  );
}

function publicClient() {
  return new CoordinaloClient({ baseUrl: 'https://api.test.com' });
}

function authClient() {
  return new CoordinaloClient({
    baseUrl: 'https://api.test.com',
    apiKey: 'key_123',
    orgId: 'org_456',
  });
}

describe('Public tools', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('registry.search', () => {
    it('has correct schema', () => {
      const result = registryTools['registry.search'].schema.safeParse({
        vertical: 'kinesiologia',
      });
      expect(result.success).toBe(true);
    });

    it('calls /api/servicialo/registry', async () => {
      const spy = mockFetch({ organizations: [] });
      await registryTools['registry.search'].handler(publicClient(), {
        vertical: 'kinesiologia',
        location: 'Santiago',
        limit: 5,
      });

      const url = new URL(spy.mock.calls[0][0] as string);
      expect(url.pathname).toBe('/api/servicialo/registry');
      expect(url.searchParams.get('vertical')).toBe('kinesiologia');
    });
  });

  describe('registry.get_organization', () => {
    it('calls /api/servicialo/{slug}/services', async () => {
      const spy = mockFetch({ services: [] });
      await registryTools['registry.get_organization'].handler(publicClient(), {
        org_slug: 'clinica-vital',
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain('/api/servicialo/clinica-vital/services');
    });
  });

  describe('scheduling.check_availability', () => {
    it('validates required fields', () => {
      const schema = publicAvailabilityTools['scheduling.check_availability'].schema;
      expect(schema.safeParse({}).success).toBe(false);
      expect(schema.safeParse({
        org_slug: 'test',
        date_from: '2026-03-01',
        date_to: '2026-03-07',
      }).success).toBe(true);
    });

    it('calls correct endpoint with query params', async () => {
      const spy = mockFetch({ slots: [] });
      await publicAvailabilityTools['scheduling.check_availability'].handler(publicClient(), {
        org_slug: 'clinica-vital',
        service_id: 'srv_1',
        date_from: '2026-03-01',
        date_to: '2026-03-07',
      });

      const url = new URL(spy.mock.calls[0][0] as string);
      expect(url.pathname).toBe('/api/servicialo/clinica-vital/availability');
      expect(url.searchParams.get('from')).toBe('2026-03-01');
      expect(url.searchParams.get('to')).toBe('2026-03-07');
      expect(url.searchParams.get('serviceId')).toBe('srv_1');
    });
  });

  describe('services.list', () => {
    it('calls correct endpoint', async () => {
      const spy = mockFetch({ services: [] });
      await publicServicesTools['services.list'].handler(publicClient(), {
        org_slug: 'clinica-vital',
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain('/api/servicialo/clinica-vital/services');
    });
  });
});

describe('Authenticated tools', () => {
  beforeEach(() => vi.restoreAllMocks());

  describe('clients.get_or_create', () => {
    it('validates actor is required', () => {
      const schema = comprometerTools['clients.get_or_create'].schema;
      expect(schema.safeParse({ email: 'test@test.com' }).success).toBe(false);
      expect(schema.safeParse({
        email: 'test@test.com',
        actor: { type: 'agent', id: 'a1' },
      }).success).toBe(true);
    });

    it('POSTs to /relacionalo/clients/upsert with mapped fields', async () => {
      const spy = mockFetch({ id: 'cli_1' });
      await comprometerTools['clients.get_or_create'].handler(authClient(), {
        email: 'maria@test.com',
        name: 'María',
        last_name: 'González',
        actor: { type: 'agent', id: 'agent_1' },
      });

      const [url, options] = spy.mock.calls[0];
      expect(url).toContain('/relacionalo/clients/upsert');
      const body = JSON.parse(options?.body as string);
      expect(body.email).toBe('maria@test.com');
      expect(body.lastName).toBe('González');  // mapped from last_name
      expect(body.actor.type).toBe('agent');
    });
  });

  describe('scheduling.book', () => {
    it('POSTs to /coordinalo/sessions with mapped fields', async () => {
      const spy = mockFetch({ session_id: 'ses_1', state: 'requested' });
      await comprometerTools['scheduling.book'].handler(authClient(), {
        service_id: 'srv_1',
        provider_id: 'prov_1',
        client_id: 'cli_1',
        starts_at: '2026-03-01T10:00:00Z',
        actor: { type: 'agent', id: 'a1' },
      });

      const body = JSON.parse(spy.mock.calls[0][1]?.body as string);
      expect(body.serviceId).toBe('srv_1');      // mapped from service_id
      expect(body.providerId).toBe('prov_1');    // mapped from provider_id
      expect(body.clientId).toBe('cli_1');       // mapped from client_id
      expect(body.startTime).toBe('2026-03-01T10:00:00Z');  // mapped from starts_at
    });
  });

  describe('scheduling.confirm', () => {
    it('POSTs to /coordinalo/sessions/{id}/confirm', async () => {
      const spy = mockFetch({ state: 'confirmed' });
      await comprometerTools['scheduling.confirm'].handler(authClient(), {
        session_id: 'ses_123',
        actor: { type: 'client', id: 'cli_1' },
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain('/coordinalo/sessions/ses_123/confirm');
    });
  });

  describe('delivery.checkin', () => {
    it('POSTs with location and timestamp', async () => {
      const spy = mockFetch({ state: 'in_progress' });
      await deliveryTools['delivery.checkin'].handler(authClient(), {
        session_id: 'ses_1',
        actor: { type: 'provider', id: 'prov_1' },
        location: { lat: -33.42, lng: -70.61 },
        timestamp: '2026-03-01T10:00:00Z',
      });

      const body = JSON.parse(spy.mock.calls[0][1]?.body as string);
      expect(body.location).toEqual({ lat: -33.42, lng: -70.61 });
      expect(body.timestamp).toBe('2026-03-01T10:00:00Z');
    });
  });

  describe('delivery.checkout', () => {
    it('POSTs to /coordinalo/sessions/{id}/checkout', async () => {
      const spy = mockFetch({ state: 'delivered' });
      await deliveryTools['delivery.checkout'].handler(authClient(), {
        session_id: 'ses_1',
        actor: { type: 'provider', id: 'prov_1' },
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain('/coordinalo/sessions/ses_1/checkout');
    });
  });

  describe('delivery.record_evidence', () => {
    it('validates evidence_type enum', () => {
      const schema = deliveryTools['delivery.record_evidence'].schema;
      expect(schema.safeParse({
        session_id: 's1',
        evidence_type: 'photo',
        data: { url: 'https://img.test/1.jpg' },
        actor: { type: 'provider', id: 'p1' },
      }).success).toBe(true);

      expect(schema.safeParse({
        session_id: 's1',
        evidence_type: 'invalid_type',
        data: {},
        actor: { type: 'provider', id: 'p1' },
      }).success).toBe(false);
    });

    it('POSTs with mapped evidenceType', async () => {
      const spy = mockFetch({ evidence_id: 'evi_1' });
      await deliveryTools['delivery.record_evidence'].handler(authClient(), {
        session_id: 'ses_1',
        evidence_type: 'document',
        data: { type: 'clinical_record', signed: true },
        actor: { type: 'provider', id: 'prov_1' },
      });

      const body = JSON.parse(spy.mock.calls[0][1]?.body as string);
      expect(body.evidenceType).toBe('document');  // mapped from evidence_type
      expect(body.data.signed).toBe(true);
    });
  });

  describe('payments.create_sale', () => {
    it('POSTs to /planificalo/sales with mapped fields', async () => {
      const spy = mockFetch({ sale_id: 'sale_1' });
      await cerrarTools['payments.create_sale'].handler(authClient(), {
        client_id: 'cli_1',
        service_id: 'srv_1',
        provider_id: 'prov_1',
        unit_price: 35000,
      });

      const body = JSON.parse(spy.mock.calls[0][1]?.body as string);
      expect(body.clientId).toBe('cli_1');
      expect(body.unitPrice).toBe(35000);
    });
  });

  describe('payments.record_payment', () => {
    it('validates payment method enum', () => {
      const schema = cerrarTools['payments.record_payment'].schema;
      expect(schema.safeParse({
        venta_id: 'v1',
        amount: 35000,
        method: 'transferencia',
      }).success).toBe(true);

      expect(schema.safeParse({
        venta_id: 'v1',
        amount: 35000,
        method: 'bitcoin',
      }).success).toBe(false);
    });

    it('POSTs to /planificalo/payments with mapped fields', async () => {
      const spy = mockFetch({ payment_id: 'pay_1' });
      await cerrarTools['payments.record_payment'].handler(authClient(), {
        venta_id: 'sale_1',
        amount: 35000,
        method: 'transferencia',
        reference: 'TRX-123',
      });

      const body = JSON.parse(spy.mock.calls[0][1]?.body as string);
      expect(body.ventaId).toBe('sale_1');
      expect(body.paymentMethod).toBe('transferencia');
    });
  });
});
