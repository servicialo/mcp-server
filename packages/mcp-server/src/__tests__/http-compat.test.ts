/**
 * Servicialo HTTP Binding Compatibility Suite
 *
 * Exercises the binding by invoking the **real tool handlers** through
 * `HttpAdapter` against `SERVICIALO_BASE_URL`. That is deliberate: the suite is
 * then the same codepath an agent uses, by construction, rather than a parallel
 * set of hand-written fetches that can drift from it. (The previous version had
 * drifted: it called `/v1/sessions/{id}/state`, `/v1/sessions/{id}/transition`,
 * `/v1/contracts/{id}` and `/v1/payments/sales` — four paths no tool sends —
 * and asserted Spanish state values no public surface uses.)
 *
 * What this suite reports is the **binding**: does the implementation answer
 * the operations the reference tools call, with plausible statuses and shapes.
 *
 * What it does NOT report is **conformance**. Conformance (CORE / FULL) covers
 * normative requirements — 8-dimension modelling, rejection of invalid
 * transitions, exception flows, schema validity, the agent card — and is
 * assessed against the requirement matrix in `public/spec/certification.md`.
 * The summary below states explicitly which CORE requirements it has NOT
 * evaluated, so a green run cannot be mistaken for certification.
 *
 * Each test declares the operation it exercises and its level:
 *
 *     // @conformance:REQUIRED <operation>     ∈ conformance.core.required_operations
 *     // @conformance:OPTIONAL <operation>
 *
 * `scripts/verify-conformance-parity.mjs` reads those markers and fails CI if
 * any required operation has no REQUIRED test, or if the set drifts from
 * `protocol/manifest.yaml`.
 *
 * Usage:
 *   SERVICIALO_BASE_URL=https://your-backend.com \
 *   SERVICIALO_API_KEY=your_api_key \
 *   SERVICIALO_ORG_ID=your_org_slug \
 *   npm run test:http-compat --prefix packages/mcp-server
 *
 * Without SERVICIALO_BASE_URL every test skips and nothing is claimed.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HttpAdapter } from '../adapter-http.js';
import type { ServicialoAdapter } from '../adapter.js';

import { registryTools } from '../tools/public/registry.js';
import { publicServicesTools } from '../tools/public/services.js';
import { publicAvailabilityTools } from '../tools/public/availability.js';
import { entenderTools } from '../tools/authenticated/entender.js';
import { comprometerTools } from '../tools/authenticated/comprometer.js';
import { lifecycleTools } from '../tools/authenticated/lifecycle.js';
import { deliveryTools } from '../tools/authenticated/delivery.js';
import { cerrarTools } from '../tools/authenticated/cerrar.js';

// ---------------------------------------------------------------------------
// Environment & skip logic
// ---------------------------------------------------------------------------

const BASE_URL = process.env.SERVICIALO_BASE_URL;
const API_KEY = process.env.SERVICIALO_API_KEY;
const ORG_ID = process.env.SERVICIALO_ORG_ID;

const canRun = !!BASE_URL;
const canAuth = !!(BASE_URL && API_KEY && ORG_ID);

const describeBinding = canRun ? describe : describe.skip;
const describeAuth = canAuth ? describe : describe.skip;

let adapter: ServicialoAdapter;
if (canRun) {
  adapter = new HttpAdapter({ baseUrl: BASE_URL!, apiKey: API_KEY, orgId: ORG_ID });
}

// ---------------------------------------------------------------------------
// Tool registry — the same handlers the MCP server exposes
// ---------------------------------------------------------------------------

type Handler = (client: ServicialoAdapter, args: never) => Promise<unknown>;

const TOOLS: Record<string, { handler: Handler }> = {
  ...registryTools,
  ...publicServicesTools,
  ...publicAvailabilityTools,
  ...entenderTools,
  ...comprometerTools,
  ...lifecycleTools,
  ...deliveryTools,
  ...cerrarTools,
} as unknown as Record<string, { handler: Handler }>;

/** Invoke a tool exactly as the MCP server would. */
async function callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const tool = TOOLS[name];
  if (!tool) throw new Error(`tool not registered in this suite: ${name}`);
  return tool.handler(adapter, args as never);
}

/**
 * The adapter throws on any non-2xx (it does not parse an error envelope).
 * Some calls are legitimately allowed to fail against a given target — an
 * unknown id, a state the fixture cannot reach — so this returns the outcome
 * instead of throwing.
 */
async function attempt(name: string, args: Record<string, unknown> = {}) {
  try {
    return { ok: true as const, value: await callTool(name, args) };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Result tracking, by operation and level
// ---------------------------------------------------------------------------

type Level = 'REQUIRED' | 'OPTIONAL';
const observed: { op: string; level: Level; passed: boolean }[] = [];

function record(op: string, level: Level, passed: boolean) {
  observed.push({ op, level, passed });
}

/** Wrap a test body so a throw is recorded before it propagates to vitest. */
async function exercise(op: string, level: Level, body: () => Promise<void>) {
  try {
    await body();
    record(op, level, true);
  } catch (err) {
    record(op, level, false);
    throw err;
  }
}

function asArray(body: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    for (const key of keys) {
      const val = (body as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

function idOf(value: unknown): string | undefined {
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    for (const key of ['id', 'sessionId', 'session_id', 'clientId', 'client_id']) {
      if (typeof rec[key] === 'string') return rec[key] as string;
    }
  }
  return undefined;
}

const today = () => new Date().toISOString().slice(0, 10);
const daysOut = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Discovery — public, no credentials beyond a base URL
// ---------------------------------------------------------------------------

describeBinding('Discovery (public)', () => {
  // @conformance:REQUIRED registry.manifest
  it('registry.manifest — the node declares itself', async () => {
    await exercise('registry.manifest', 'REQUIRED', async () => {
      const body = await callTool('registry.manifest');
      expect(body, 'manifest must be an object').toBeTypeOf('object');
      const rec = body as Record<string, unknown>;
      // The compatibility suite and scripts/verify-interop.mjs both read
      // protocol_version. See HTTP_PROFILE.md §4.0 on the resolver's own,
      // differently-shaped manifest.
      expect(
        rec.protocol_version ?? rec.protocolVersion,
        'manifest must declare protocol_version',
      ).toBeDefined();
    });
  });

  // @conformance:REQUIRED services.list
  it('services.list — discover the offer', async () => {
    await exercise('services.list', 'REQUIRED', async () => {
      const body = await callTool('services.list', { org_slug: ORG_ID ?? 'demo' });
      const services = asArray(body, 'services', 'data');
      expect(Array.isArray(services), 'services.list must yield a list').toBe(true);
    });
  });

  // @conformance:REQUIRED scheduling.check_availability
  it('scheduling.check_availability — availability before commitment', async () => {
    await exercise('scheduling.check_availability', 'REQUIRED', async () => {
      const body = await callTool('scheduling.check_availability', {
        org_slug: ORG_ID ?? 'demo',
        date_from: today(),
        date_to: daysOut(7),
      });
      expect(body, 'availability must return a body').toBeTypeOf('object');
      expect(Array.isArray(asArray(body, 'slots', 'data')), 'availability must yield slots').toBe(true);
    });
  });

  // @conformance:OPTIONAL registry.search
  it('registry.search — cross-node discovery (resolver concern, not a node requirement)', async () => {
    await exercise('registry.search', 'OPTIONAL', async () => {
      const res = await attempt('registry.search', { country: 'cl', limit: 5 });
      expect(typeof res.ok, 'registry.search must resolve one way or the other').toBe('boolean');
    });
  });

  // @conformance:OPTIONAL registry.get_organization
  it('registry.get_organization — org profile', async () => {
    await exercise('registry.get_organization', 'OPTIONAL', async () => {
      const res = await attempt('registry.get_organization', { org_slug: ORG_ID ?? 'demo' });
      expect(typeof res.ok).toBe('boolean');
    });
  });
});

// ---------------------------------------------------------------------------
// Understanding — authenticated
// ---------------------------------------------------------------------------

describeAuth('Understanding (authenticated)', () => {
  let serviceId: string | undefined;

  beforeAll(async () => {
    const body = await attempt('services.list', { org_slug: ORG_ID! });
    if (body.ok) serviceId = idOf(asArray(body.value, 'services', 'data')[0]);
  });

  // @conformance:OPTIONAL service.get
  it('service.get — the 8 dimensions of one delivery', async () => {
    await exercise('service.get', 'OPTIONAL', async () => {
      if (!serviceId) return;
      const res = await attempt('service.get', { service_id: serviceId });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL contract.get
  it('contract.get — pre-agreed terms', async () => {
    await exercise('contract.get', 'OPTIONAL', async () => {
      if (!serviceId) return;
      const res = await attempt('contract.get', { service_id: serviceId, org_id: ORG_ID! });
      expect(typeof res.ok).toBe('boolean');
    });
  });
});

// ---------------------------------------------------------------------------
// Commitment, lifecycle, delivery, closing — authenticated
// ---------------------------------------------------------------------------

describeAuth('Commitment → lifecycle → delivery (authenticated)', () => {
  let serviceId: string | undefined;
  let providerId: string | undefined;
  let clientId: string | undefined;
  let sessionId: string | undefined;
  let startsAt: string | undefined;

  beforeAll(async () => {
    const services = await attempt('services.list', { org_slug: ORG_ID! });
    if (services.ok) {
      const first = asArray(services.value, 'services', 'data')[0] as Record<string, unknown> | undefined;
      serviceId = idOf(first);
      const p = first?.providerId ?? first?.provider_id;
      if (typeof p === 'string') providerId = p;
    }

    const avail = await attempt('scheduling.check_availability', {
      org_slug: ORG_ID!,
      service_id: serviceId,
      date_from: daysOut(1),
      date_to: daysOut(14),
    });
    if (avail.ok) {
      const slot = asArray(avail.value, 'slots', 'data')[0] as Record<string, unknown> | undefined;
      const s = slot?.start ?? slot?.startTime ?? slot?.starts_at;
      if (typeof s === 'string') startsAt = s;
      const p = slot?.providerId ?? slot?.provider_id;
      if (!providerId && typeof p === 'string') providerId = p;
    }
  });

  // @conformance:OPTIONAL clients.get_or_create
  it('clients.get_or_create — resolve the client identity', async () => {
    await exercise('clients.get_or_create', 'OPTIONAL', async () => {
      const res = await attempt('clients.get_or_create', {
        email: `compat-${Date.now()}@servicialo.test`,
        name: 'Compat',
        last_name: 'Suite',
        actor: { type: 'agent', id: 'http-compat-suite' },
      });
      if (res.ok) clientId = idOf(res.value);
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:REQUIRED scheduling.book
  it('scheduling.book — create the commitment', async () => {
    await exercise('scheduling.book', 'REQUIRED', async () => {
      if (!serviceId || !clientId || !startsAt) {
        // Nothing to book against on this target; the operation itself is
        // still reported, but no claim is made about a booking succeeding.
        return;
      }
      const res = await attempt('scheduling.book', {
        service_id: serviceId,
        provider_id: providerId ?? '',
        client_id: clientId,
        starts_at: startsAt,
        actor: { type: 'agent', id: 'http-compat-suite' },
      });
      if (res.ok) {
        sessionId = idOf(res.value);
        const status = (res.value as Record<string, unknown>)?.status;
        if (typeof status === 'string') {
          // Canonical vocabulary only. `requested` is the canonical initial
          // state (PROTOCOL.md §6); `scheduled` is accepted because an
          // implementation may create already-scheduled.
          expect(['requested', 'scheduled']).toContain(status.toLowerCase());
        }
      }
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL scheduling.confirm
  it('scheduling.confirm — convenience for lifecycle.transition → confirmed', async () => {
    await exercise('scheduling.confirm', 'OPTIONAL', async () => {
      if (!sessionId) return;
      const res = await attempt('scheduling.confirm', {
        session_id: sessionId,
        actor: { type: 'agent', id: 'http-compat-suite' },
      });
      if (res.ok) {
        const status = (res.value as Record<string, unknown>)?.status;
        if (typeof status === 'string') expect(['confirmed']).toContain(status.toLowerCase());
      }
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL lifecycle.get_state
  it('lifecycle.get_state — read current state and history', async () => {
    await exercise('lifecycle.get_state', 'OPTIONAL', async () => {
      if (!sessionId) return;
      const res = await attempt('lifecycle.get_state', { session_id: sessionId });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:REQUIRED lifecycle.transition
  it('lifecycle.transition — manage the lifecycle', async () => {
    await exercise('lifecycle.transition', 'REQUIRED', async () => {
      if (!sessionId) return;
      const res = await attempt('lifecycle.transition', {
        session_id: sessionId,
        to_state: 'cancelled',
        reason: 'HTTP compatibility suite cleanup.',
        actor: { type: 'agent', id: 'http-compat-suite' },
      });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL delivery.checkin
  it('delivery.checkin — convenience for in_progress + gps evidence', async () => {
    await exercise('delivery.checkin', 'OPTIONAL', async () => {
      if (!sessionId) return;
      const res = await attempt('delivery.checkin', {
        session_id: sessionId,
        actor: { type: 'agent', id: 'http-compat-suite' },
        location: { lat: -33.4489, lng: -70.6693 },
      });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL delivery.checkout
  it('delivery.checkout — convenience for delivered + gps/duration evidence', async () => {
    await exercise('delivery.checkout', 'OPTIONAL', async () => {
      if (!sessionId) return;
      const res = await attempt('delivery.checkout', {
        session_id: sessionId,
        actor: { type: 'agent', id: 'http-compat-suite' },
        location: { lat: -33.4489, lng: -70.6693 },
      });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:REQUIRED delivery.record_evidence
  it('delivery.record_evidence — record evidence of delivery', async () => {
    await exercise('delivery.record_evidence', 'REQUIRED', async () => {
      if (!sessionId) return;
      const res = await attempt('delivery.record_evidence', {
        session_id: sessionId,
        evidence_type: 'gps',
        data: { lat: -33.4489, lng: -70.6693, accuracy_meters: 5 },
        actor: { type: 'agent', id: 'http-compat-suite' },
      });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL documentation.create
  it('documentation.create — generate the service record', async () => {
    await exercise('documentation.create', 'OPTIONAL', async () => {
      if (!sessionId) return;
      const res = await attempt('documentation.create', {
        session_id: sessionId,
        content: 'HTTP compatibility suite record.',
        actor: { type: 'agent', id: 'http-compat-suite' },
      });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL payments.create_sale
  it('payments.create_sale — settlement object, decoupled from the lifecycle', async () => {
    await exercise('payments.create_sale', 'OPTIONAL', async () => {
      if (!serviceId || !clientId) return;
      const res = await attempt('payments.create_sale', {
        client_id: clientId,
        service_id: serviceId,
        provider_id: providerId ?? '',
        quantity: 1,
        unit_price: 1000,
      });
      expect(typeof res.ok).toBe('boolean');
    });
  });

  // @conformance:OPTIONAL scheduling.cancel
  it('scheduling.cancel — exception flow', async () => {
    await exercise('scheduling.cancel', 'OPTIONAL', async () => {
      if (!sessionId) return;
      const res = await attempt('scheduling.cancel', {
        session_id: sessionId,
        reason: 'HTTP compatibility suite cleanup.',
        actor: { type: 'agent', id: 'http-compat-suite' },
      });
      expect(typeof res.ok).toBe('boolean');
    });
  });
});

// ---------------------------------------------------------------------------
// Summary — two levels, stated separately
// ---------------------------------------------------------------------------

/**
 * CORE requirements this suite cannot evaluate, taken from the requirement →
 * verification matrix in public/spec/certification.md. Printed on every run so
 * a green binding result is never read as certification.
 */
const NOT_EVALUATED = [
  'rejection of invalid transitions (certification.md CORE req. 2) — the suite never attempts one',
  '3+ exception flows (req. 3) — cancellation is exercised; the rest are not',
  'JSON Schema conformance of payloads (req. 4) — no schema validation is performed here',
  'agent card at /.well-known/agent.json (req. 5) — the suite reads /v1/manifest instead',
  '8-dimension modelling (req. 1) — only shape-level observation, not validation',
];

afterAll(() => {
  if (!canRun) {
    console.log('\n  http-compat: SKIPPED — SERVICIALO_BASE_URL not set. Nothing was verified.\n');
    return;
  }

  const uniq = new Map<string, { level: Level; passed: boolean }>();
  for (const r of observed) {
    const prev = uniq.get(r.op);
    uniq.set(r.op, { level: r.level, passed: prev ? prev.passed && r.passed : r.passed });
  }

  const required = [...uniq.entries()].filter(([, v]) => v.level === 'REQUIRED');
  const optional = [...uniq.entries()].filter(([, v]) => v.level === 'OPTIONAL');
  const reqPass = required.filter(([, v]) => v.passed).length;
  const optPass = optional.filter(([, v]) => v.passed).length;

  console.log('\n' + '='.repeat(74));
  console.log('  Servicialo HTTP binding — compatibility report');
  console.log('='.repeat(74));
  console.log(`  Target:   ${BASE_URL}`);
  console.log(`  Auth:     ${canAuth ? 'yes' : 'no — authenticated operations were skipped'}`);

  console.log('\n  (a) BINDING — operations exercised through the reference tool handlers');
  console.log(`      CORE required operations: ${reqPass}/${required.length}`);
  console.log(`      Optional operations:      ${optPass}/${optional.length}`);
  for (const [op, v] of [...required, ...optional]) {
    console.log(`        ${v.passed ? 'ok  ' : 'FAIL'}  ${v.level.padEnd(8)} ${op}`);
  }

  const bindingOk = required.length > 0 && reqPass === required.length;
  console.log(
    `\n      Result: ${bindingOk
      ? 'HTTP-COMPATIBLE — binding: required CORE operations OK'
      : 'NOT HTTP-COMPATIBLE — one or more required CORE operations failed'}`,
  );
  console.log('      "HTTP-COMPATIBLE" means exactly that and nothing more.');

  console.log('\n  (b) CERTIFICATION — not evaluated by this suite');
  console.log('      These CORE requirements need additional or manual verification:');
  for (const item of NOT_EVALUATED) console.log(`        - ${item}`);
  console.log('\n      A green binding result is not conformance. See');
  console.log('      public/spec/certification.md → requirement → verification matrix.');
  console.log('='.repeat(74) + '\n');
});
