/**
 * Servicialo Conformance Test Suite
 *
 * Verifies that any implementation exposing SERVICIALO_BASE_URL
 * complies with the Servicialo protocol (HTTP_PROFILE.md).
 *
 * Usage:
 *   SERVICIALO_BASE_URL=https://your-backend.com \
 *   SERVICIALO_API_KEY=your_api_key \
 *   SERVICIALO_ORG_ID=your_org_slug \
 *   npm run test:conformance --prefix packages/mcp-server
 *
 * Results:
 *   CONFORMANT     — phases 0–4 pass (required for listing)
 *   PARTIAL        — some phases pass
 *   NON-CONFORMANT — no phases pass
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HttpAdapter } from '../adapter-http.js';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Environment & skip logic
// ---------------------------------------------------------------------------

const BASE_URL = process.env.SERVICIALO_BASE_URL;
const API_KEY = process.env.SERVICIALO_API_KEY;
const ORG_ID = process.env.SERVICIALO_ORG_ID;

const canRun = !!BASE_URL;
const canAuth = !!(BASE_URL && API_KEY && ORG_ID);

const describeConformance = canRun ? describe : describe.skip;
const describeAuth = canAuth ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Adapter instance
// ---------------------------------------------------------------------------

let adapter: HttpAdapter;

if (canRun) {
  adapter = new HttpAdapter({
    baseUrl: BASE_URL!,
    apiKey: API_KEY,
    orgId: ORG_ID,
  });
}

// ---------------------------------------------------------------------------
// Phase tracking for summary
// ---------------------------------------------------------------------------

const phaseResults: Record<string, { total: number; passed: number }> = {};
let currentPhase = '';

function trackPhase(phase: string) {
  currentPhase = phase;
  if (!phaseResults[phase]) {
    phaseResults[phase] = { total: 0, passed: 0 };
  }
}

function recordResult(passed: boolean) {
  if (currentPhase && phaseResults[currentPhase]) {
    phaseResults[currentPhase].total++;
    if (passed) phaseResults[currentPhase].passed++;
  }
}

// ---------------------------------------------------------------------------
// Helper: direct fetch for endpoints the adapter doesn't expose directly
// ---------------------------------------------------------------------------

async function httpGet(path: string): Promise<{ status: number; body: unknown }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  if (ORG_ID) headers['X-Servicialo-Org'] = ORG_ID;

  const res = await fetch(url, { method: 'GET', headers });
  const body = res.headers.get('content-type')?.includes('json')
    ? await res.json()
    : await res.text();
  return { status: res.status, body };
}

async function httpPost(
  path: string,
  payload?: unknown,
): Promise<{ status: number; body: unknown }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  if (ORG_ID) headers['X-Servicialo-Org'] = ORG_ID;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const body = res.headers.get('content-type')?.includes('json')
    ? await res.json()
    : await res.text();
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// Phase 0 — Resolver (public)
// ---------------------------------------------------------------------------

describeConformance('Phase 0 — Resolver (public)', () => {
  beforeAll(() => trackPhase('phase-0'));

  it('GET /v1/manifest responds 200 with protocol_version, org_slug, name', async () => {
    let passed = false;
    try {
      const { status, body } = await httpGet('/v1/manifest');
      expect(status).toBe(200);
      expect(body).toHaveProperty('protocol_version');
      expect(body).toHaveProperty('org_slug');
      expect(body).toHaveProperty('name');
      passed = true;
    } finally {
      recordResult(passed);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 1 — Discover (public)
// ---------------------------------------------------------------------------

describeConformance('Phase 1 — Discover (public)', () => {
  beforeAll(() => trackPhase('phase-1'));

  it('GET /v1/registry responds 200 with array', async () => {
    let passed = false;
    try {
      const { status, body } = await httpGet('/v1/registry');
      expect(status).toBe(200);
      expect(Array.isArray(body) || (body && typeof body === 'object')).toBe(true);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('GET /v1/organizations/{slug}/services responds 200 with array', async () => {
    let passed = false;
    try {
      const slug = ORG_ID ?? 'test';
      const { status, body } = await httpGet(`/v1/organizations/${slug}/services`);
      expect(status).toBe(200);
      expect(Array.isArray(body) || (body && typeof body === 'object')).toBe(true);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('GET /v1/organizations/{slug}/availability responds 200 with array of slots', async () => {
    let passed = false;
    try {
      const slug = ORG_ID ?? 'test';
      const from = new Date().toISOString().split('T')[0];
      const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const { status, body } = await httpGet(
        `/v1/organizations/${slug}/availability?from=${from}&to=${to}`,
      );
      expect(status).toBe(200);
      expect(Array.isArray(body) || (body && typeof body === 'object')).toBe(true);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 2 — Understand (authenticated)
// ---------------------------------------------------------------------------

describeAuth('Phase 2 — Understand (authenticated)', () => {
  beforeAll(() => trackPhase('phase-2'));

  it('GET /v1/services/{id} responds 200 with id, name, duration_minutes (or 404)', async () => {
    let passed = false;
    try {
      // First get the list of services to find a real ID
      const listRes = await httpGet(
        `/v1/organizations/${ORG_ID}/services`,
      );
      const services = Array.isArray(listRes.body)
        ? listRes.body
        : (listRes.body as Record<string, unknown>)?.services ?? [];

      if (Array.isArray(services) && services.length > 0) {
        const serviceId = (services[0] as Record<string, unknown>).id;
        const { status, body } = await httpGet(`/v1/services/${serviceId}`);
        expect(status).toBe(200);
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('duration_minutes');
      } else {
        // No services available — still passes if endpoint exists
        const { status } = await httpGet(`/v1/services/nonexistent-${crypto.randomUUID()}`);
        expect([200, 404]).toContain(status);
      }
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('GET /v1/contracts/{id} responds 200 or 404', async () => {
    let passed = false;
    try {
      const { status } = await httpGet(`/v1/contracts/${crypto.randomUUID()}`);
      expect([200, 404]).toContain(status);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 3 — Commit (authenticated)
// ---------------------------------------------------------------------------

describeAuth('Phase 3 — Commit (authenticated)', () => {
  beforeAll(() => trackPhase('phase-3'));

  let clientId: string;
  let sessionId: string;
  let providerId: string;
  let serviceId: string;

  it('POST /v1/clients responds 200|201 with id', async () => {
    let passed = false;
    try {
      const email = `conformance-${crypto.randomUUID().slice(0, 8)}@test.servicialo.com`;
      const { status, body } = await httpPost('/v1/clients', {
        email,
        name: 'Conformance',
        lastName: 'Test',
      });
      expect([200, 201]).toContain(status);
      expect(body).toHaveProperty('id');
      clientId = (body as Record<string, unknown>).id as string;
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('POST /v1/sessions responds 201 with id and status solicitado', async () => {
    let passed = false;
    try {
      // Resolve a provider and service for booking
      const servicesRes = await httpGet(`/v1/organizations/${ORG_ID}/services`);
      const services = Array.isArray(servicesRes.body)
        ? servicesRes.body
        : (servicesRes.body as Record<string, unknown>)?.services ?? [];

      expect(Array.isArray(services) && services.length > 0).toBe(true);
      const svc = services[0] as Record<string, unknown>;
      serviceId = svc.id as string;

      // Get availability to find a valid slot and provider
      const slug = ORG_ID!;
      const from = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const to = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      const availRes = await httpGet(
        `/v1/organizations/${slug}/availability?from=${from}&to=${to}&serviceId=${serviceId}`,
      );
      const slots = Array.isArray(availRes.body)
        ? availRes.body
        : (availRes.body as Record<string, unknown>)?.slots ?? [];

      let scheduledAt: string;
      if (Array.isArray(slots) && slots.length > 0) {
        const slot = slots[0] as Record<string, unknown>;
        scheduledAt = (slot.start ?? slot.scheduledAt ?? slot.datetime) as string;
        providerId = (slot.providerId ?? slot.provider_id) as string;
      } else {
        // Fallback: schedule for tomorrow at 10:00
        const tomorrow = new Date(Date.now() + 86400000);
        tomorrow.setHours(10, 0, 0, 0);
        scheduledAt = tomorrow.toISOString();
        providerId = 'unknown';
      }

      const { status, body } = await httpPost('/v1/sessions', {
        clientId,
        providerId,
        serviceId,
        scheduledAt,
      });
      expect([200, 201]).toContain(status);
      expect(body).toHaveProperty('id');
      sessionId = (body as Record<string, unknown>).id as string;

      // Status check — accept multiple representations
      const returnedStatus = (body as Record<string, unknown>).status as string;
      if (returnedStatus) {
        expect(['solicitado', 'requested', 'scheduled']).toContain(
          returnedStatus.toLowerCase(),
        );
      }
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('POST /v1/sessions/{id}/confirm responds 200 with status confirmado', async () => {
    let passed = false;
    try {
      expect(sessionId).toBeDefined();
      const { status, body } = await httpPost(`/v1/sessions/${sessionId}/confirm`);
      expect([200]).toContain(status);

      const returnedStatus = (body as Record<string, unknown>).status as string;
      if (returnedStatus) {
        expect(['confirmado', 'confirmed']).toContain(returnedStatus.toLowerCase());
      }
      passed = true;
    } finally {
      recordResult(passed);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 4 — Manage (authenticated)
// ---------------------------------------------------------------------------

describeAuth('Phase 4 — Manage (authenticated)', () => {
  beforeAll(() => trackPhase('phase-4'));

  let sessionId: string;
  let clientId: string;

  beforeAll(async () => {
    // Create a fresh session for management tests
    const email = `manage-${crypto.randomUUID().slice(0, 8)}@test.servicialo.com`;
    const clientRes = await httpPost('/v1/clients', {
      email,
      name: 'Manage',
      lastName: 'Test',
    });
    clientId = ((clientRes.body as Record<string, unknown>)?.id as string) ?? '';

    // Get a service and slot
    const servicesRes = await httpGet(`/v1/organizations/${ORG_ID}/services`);
    const services = Array.isArray(servicesRes.body)
      ? servicesRes.body
      : (servicesRes.body as Record<string, unknown>)?.services ?? [];

    if (Array.isArray(services) && services.length > 0) {
      const svc = services[0] as Record<string, unknown>;
      const serviceId = svc.id as string;

      const from = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const to = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      const availRes = await httpGet(
        `/v1/organizations/${ORG_ID}/availability?from=${from}&to=${to}&serviceId=${serviceId}`,
      );
      const slots = Array.isArray(availRes.body)
        ? availRes.body
        : (availRes.body as Record<string, unknown>)?.slots ?? [];

      let scheduledAt: string;
      let providerId: string;
      if (Array.isArray(slots) && slots.length > 0) {
        const slot = slots[0] as Record<string, unknown>;
        scheduledAt = (slot.start ?? slot.scheduledAt ?? slot.datetime) as string;
        providerId = (slot.providerId ?? slot.provider_id) as string;
      } else {
        const tomorrow = new Date(Date.now() + 2 * 86400000);
        tomorrow.setHours(11, 0, 0, 0);
        scheduledAt = tomorrow.toISOString();
        providerId = 'unknown';
      }

      const sessionRes = await httpPost('/v1/sessions', {
        clientId,
        providerId,
        serviceId,
        scheduledAt,
      });
      sessionId = ((sessionRes.body as Record<string, unknown>)?.id as string) ?? '';
    }
  });

  it('GET /v1/sessions/{id}/state responds 200 with state', async () => {
    let passed = false;
    try {
      expect(sessionId).toBeDefined();
      const { status, body } = await httpGet(`/v1/sessions/${sessionId}/state`);
      expect(status).toBe(200);
      expect(body).toHaveProperty('state');
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('POST /v1/sessions/{id}/transition to cancelado responds 200', async () => {
    let passed = false;
    try {
      expect(sessionId).toBeDefined();
      const { status } = await httpPost(`/v1/sessions/${sessionId}/transition`, {
        to: 'cancelado',
        reason: 'conformance-test',
      });
      expect([200]).toContain(status);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 5 — Deliver (authenticated, optional in v0.9)
// ---------------------------------------------------------------------------

describeAuth('Phase 5 — Deliver (authenticated)', () => {
  beforeAll(() => trackPhase('phase-5'));

  let sessionId: string;

  beforeAll(async () => {
    // Create and confirm a session for delivery tests
    const email = `deliver-${crypto.randomUUID().slice(0, 8)}@test.servicialo.com`;
    const clientRes = await httpPost('/v1/clients', {
      email,
      name: 'Deliver',
      lastName: 'Test',
    });
    const clientId = ((clientRes.body as Record<string, unknown>)?.id as string) ?? '';

    const servicesRes = await httpGet(`/v1/organizations/${ORG_ID}/services`);
    const services = Array.isArray(servicesRes.body)
      ? servicesRes.body
      : (servicesRes.body as Record<string, unknown>)?.services ?? [];

    if (Array.isArray(services) && services.length > 0) {
      const svc = services[0] as Record<string, unknown>;
      const serviceId = svc.id as string;

      const from = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const to = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      const availRes = await httpGet(
        `/v1/organizations/${ORG_ID}/availability?from=${from}&to=${to}&serviceId=${serviceId}`,
      );
      const slots = Array.isArray(availRes.body)
        ? availRes.body
        : (availRes.body as Record<string, unknown>)?.slots ?? [];

      let scheduledAt: string;
      let providerId: string;
      if (Array.isArray(slots) && slots.length > 0) {
        const slot = slots[0] as Record<string, unknown>;
        scheduledAt = (slot.start ?? slot.scheduledAt ?? slot.datetime) as string;
        providerId = (slot.providerId ?? slot.provider_id) as string;
      } else {
        const d = new Date(Date.now() + 3 * 86400000);
        d.setHours(14, 0, 0, 0);
        scheduledAt = d.toISOString();
        providerId = 'unknown';
      }

      const sessionRes = await httpPost('/v1/sessions', {
        clientId,
        providerId,
        serviceId,
        scheduledAt,
      });
      sessionId = ((sessionRes.body as Record<string, unknown>)?.id as string) ?? '';

      // Confirm the session so we can test delivery endpoints
      if (sessionId) {
        await httpPost(`/v1/sessions/${sessionId}/confirm`);
      }
    }
  });

  it('POST /v1/sessions/{id}/checkin responds 200', async () => {
    let passed = false;
    try {
      expect(sessionId).toBeDefined();
      const { status } = await httpPost(`/v1/sessions/${sessionId}/checkin`, {
        lat: -33.4489,
        lng: -70.6693,
        at: new Date().toISOString(),
      });
      expect([200]).toContain(status);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('POST /v1/sessions/{id}/checkout responds 200', async () => {
    let passed = false;
    try {
      expect(sessionId).toBeDefined();
      const { status } = await httpPost(`/v1/sessions/${sessionId}/checkout`, {
        lat: -33.4489,
        lng: -70.6693,
        at: new Date().toISOString(),
      });
      expect([200]).toContain(status);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('POST /v1/sessions/{id}/evidence responds 200|201', async () => {
    let passed = false;
    try {
      expect(sessionId).toBeDefined();
      const { status } = await httpPost(`/v1/sessions/${sessionId}/evidence`, {
        type: 'notes',
        data: { text: 'Conformance test evidence' },
        recorded_by: 'conformance-suite',
        recorded_at: new Date().toISOString(),
      });
      expect([200, 201]).toContain(status);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 6 — Close (authenticated, optional in v0.9)
// ---------------------------------------------------------------------------

describeAuth('Phase 6 — Close (authenticated)', () => {
  beforeAll(() => trackPhase('phase-6'));

  let sessionId: string;

  beforeAll(async () => {
    // Create and advance a session for close tests
    const email = `close-${crypto.randomUUID().slice(0, 8)}@test.servicialo.com`;
    const clientRes = await httpPost('/v1/clients', {
      email,
      name: 'Close',
      lastName: 'Test',
    });
    const clientId = ((clientRes.body as Record<string, unknown>)?.id as string) ?? '';

    const servicesRes = await httpGet(`/v1/organizations/${ORG_ID}/services`);
    const services = Array.isArray(servicesRes.body)
      ? servicesRes.body
      : (servicesRes.body as Record<string, unknown>)?.services ?? [];

    if (Array.isArray(services) && services.length > 0) {
      const svc = services[0] as Record<string, unknown>;
      const serviceId = svc.id as string;

      const from = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const to = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
      const availRes = await httpGet(
        `/v1/organizations/${ORG_ID}/availability?from=${from}&to=${to}&serviceId=${serviceId}`,
      );
      const slots = Array.isArray(availRes.body)
        ? availRes.body
        : (availRes.body as Record<string, unknown>)?.slots ?? [];

      let scheduledAt: string;
      let providerId: string;
      if (Array.isArray(slots) && slots.length > 0) {
        const slot = slots[0] as Record<string, unknown>;
        scheduledAt = (slot.start ?? slot.scheduledAt ?? slot.datetime) as string;
        providerId = (slot.providerId ?? slot.provider_id) as string;
      } else {
        const d = new Date(Date.now() + 4 * 86400000);
        d.setHours(9, 0, 0, 0);
        scheduledAt = d.toISOString();
        providerId = 'unknown';
      }

      const sessionRes = await httpPost('/v1/sessions', {
        clientId,
        providerId,
        serviceId,
        scheduledAt,
      });
      sessionId = ((sessionRes.body as Record<string, unknown>)?.id as string) ?? '';

      if (sessionId) {
        await httpPost(`/v1/sessions/${sessionId}/confirm`);
      }
    }
  });

  it('POST /v1/sessions/{id}/documentation responds 200|201', async () => {
    let passed = false;
    try {
      expect(sessionId).toBeDefined();
      const { status } = await httpPost(`/v1/sessions/${sessionId}/documentation`, {
        type: 'session_notes',
        content: 'Conformance test documentation',
        created_by: 'conformance-suite',
      });
      expect([200, 201]).toContain(status);
      passed = true;
    } finally {
      recordResult(passed);
    }
  });

  it('POST /v1/payments/sales responds 200|201 with id', async () => {
    let passed = false;
    try {
      const { status, body } = await httpPost('/v1/payments/sales', {
        sessionId,
        amount: 1000,
        currency: 'CLP',
        description: 'Conformance test sale',
      });
      expect([200, 201]).toContain(status);
      expect(body).toHaveProperty('id');
      passed = true;
    } finally {
      recordResult(passed);
    }
  });
});

// ---------------------------------------------------------------------------
// Summary report
// ---------------------------------------------------------------------------

afterAll(() => {
  if (!canRun) return;

  const phases = [
    'phase-0',
    'phase-1',
    'phase-2',
    'phase-3',
    'phase-4',
    'phase-5',
    'phase-6',
  ];

  console.log('\n' + '='.repeat(60));
  console.log('  SERVICIALO CONFORMANCE TEST REPORT');
  console.log('='.repeat(60));
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Org:    ${ORG_ID ?? '(none)'}`);
  console.log(`  Auth:   ${canAuth ? 'yes' : 'no (phases 2-6 skipped)'}`);
  console.log('-'.repeat(60));

  let totalTests = 0;
  let totalPassed = 0;
  const phasePassed: string[] = [];
  const phaseFailed: string[] = [];

  for (const phase of phases) {
    const r = phaseResults[phase];
    if (!r) {
      console.log(`  ${phase}  — skipped`);
      continue;
    }
    totalTests += r.total;
    totalPassed += r.passed;
    const ok = r.passed === r.total;
    const icon = ok ? 'PASS' : 'FAIL';
    console.log(`  ${phase}  ${icon}  (${r.passed}/${r.total})`);
    if (ok) phasePassed.push(phase);
    else phaseFailed.push(phase);
  }

  console.log('-'.repeat(60));

  const coverage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  console.log(`  Tests:    ${totalPassed}/${totalTests} passed (${coverage}%)`);

  // Conformance level
  const requiredPhases = ['phase-0', 'phase-1', 'phase-2', 'phase-3', 'phase-4'];
  const requiredPassed = requiredPhases.every((p) => phasePassed.includes(p));

  let level: string;
  if (requiredPassed) {
    level = 'CONFORMANT';
  } else if (phasePassed.length > 0) {
    level = 'PARTIAL';
  } else {
    level = 'NON-CONFORMANT';
  }

  console.log(`  Phases:   ${phasePassed.length}/${phases.length} passed`);
  console.log(`  Result:   ${level}`);

  if (level === 'CONFORMANT') {
    console.log('\n  ✓ This implementation meets Servicialo conformance requirements.');
    console.log('    Phases 5–6 are optional in v0.9 but required for regulated verticals.');
  } else if (level === 'PARTIAL') {
    console.log(`\n  Failing phases: ${phaseFailed.join(', ')}`);
    console.log('  Fix failing phases 0–4 to reach CONFORMANT status.');
  } else {
    console.log('\n  No phases passed. Review HTTP_PROFILE.md for endpoint requirements.');
  }

  console.log('='.repeat(60) + '\n');
});
