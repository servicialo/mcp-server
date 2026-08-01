#!/usr/bin/env node
/**
 * Interoperability test between two independent Servicialo implementations.
 *
 * The multi-implementation promise is not "both pass the HTTP compatibility
 * suite" — it is "ONE agent codepath works against BOTH backends and an
 * agent starting from the shared registry can discover both". This script
 * tests exactly that, and reports wire-level divergences that a per-node
 * suite cannot see.
 *
 * Usage (run the moment the second backend exists):
 *   node scripts/verify-interop.mjs \
 *     --node-a https://coordinalo.com/api/servicialo --org-a coordinalo [--key-a KEY] \
 *     --node-b https://second-backend.com/v1-root    --org-b their-org  [--key-b KEY] \
 *     [--registry https://servicialo.com]
 *
 * Dry-run of the harness today (self-interop, A == B):
 *   node scripts/verify-interop.mjs \
 *     --node-a <url> --org-a coordinalo --node-b <url> --org-b coordinalo
 *
 * Checks:
 *   [1] Manifest parity      — /v1/manifest on both; protocol_version compatible
 *   [2] Registry co-discovery — both orgs findable from the shared registry
 *   [3] Services parity      — same wire shape from services.list on both
 *   [4] Availability parity  — same query works on both; slot field aliasing compared
 *   [5] Lifecycle vocabulary — states returned by each node vs the spec enum,
 *                              including the documented reference divergence
 *                              (delivered/charged vs completed/invoiced+collected)
 *   [6] Agent cards          — /.well-known/agent.json fetchable on both
 *
 * Authenticated flow (client → book → confirm → transition) runs per node
 * only when that node's --key is provided; it uses the SAME canonical
 * request bodies against both, which is the actual interop assertion.
 *
 * Verdict:
 *   INTEROPERABLE                  — all checks pass, no divergences
 *   INTEROPERABLE-WITH-DIVERGENCES — flows work, but wire divergences were
 *                                    recorded (field aliases, state names)
 *   NOT-INTEROPERABLE              — a required check failed on either node
 */

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const REGISTRY = arg('--registry', 'https://servicialo.com').replace(/\/$/, '');
const NODES = {
  A: {
    base: (arg('--node-a', process.env.INTEROP_NODE_A || '') || '').replace(/\/$/, ''),
    org: arg('--org-a', process.env.INTEROP_ORG_A || ''),
    key: arg('--key-a', process.env.INTEROP_KEY_A || ''),
  },
  B: {
    base: (arg('--node-b', process.env.INTEROP_NODE_B || '') || '').replace(/\/$/, ''),
    org: arg('--org-b', process.env.INTEROP_ORG_B || ''),
    key: arg('--key-b', process.env.INTEROP_KEY_B || ''),
  },
};

if (!NODES.A.base || !NODES.B.base || !NODES.A.org || !NODES.B.org) {
  console.error('Usage: verify-interop.mjs --node-a <url> --org-a <slug> --node-b <url> --org-b <slug> [--key-a K] [--key-b K] [--registry <url>]');
  console.error('Both nodes are required — this is an interop test, not a single-node suite.');
  process.exit(2);
}

let pass = 0;
let fail = 0;
const divergences = [];
const failures = [];
function ok(label, detail = '') { pass++; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`); }
function ko(label, detail = '') { fail++; failures.push({ label, detail }); console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }
function diverge(label, detail) { divergences.push({ label, detail }); console.log(`  WARN  ${label} — ${detail}`); }

async function req(node, method, path, body) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (node.key) headers['Authorization'] = `Bearer ${node.key}`;
  if (node.org) headers['X-Servicialo-Org'] = node.org;
  const res = await fetch(`${node.base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch((e) => ({ status: 0, _err: e.message }));
  if (res.status === 0) return { status: 0, body: { error: res._err } };
  const isJson = res.headers?.get?.('content-type')?.includes('json');
  return { status: res.status, body: isJson ? await res.json().catch(() => ({})) : await res.text() };
}

function toArray(body, key) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object' && Array.isArray(body[key])) return body[key];
  return [];
}

// Spec lifecycle vocabulary (PROTOCOL.md §6) and the documented reference
// divergence (protocol/manifest.yaml → reference_implementation_divergence).
const SPEC_STATES = new Set([
  'requested', 'scheduled', 'confirmed', 'in_progress', 'completed', 'documented',
  'invoiced', 'collected', 'verified', 'cancelled', 'disputed', 'reassigning',
  'rescheduling', 'partial',
]);
const KNOWN_DIVERGENT_STATES = new Set(['delivered', 'charged', 'solicitado', 'confirmado', 'cancelado']);

(async () => {
  console.log('Servicialo interoperability verification');
  console.log(`  node A: ${NODES.A.base} (org ${NODES.A.org}${NODES.A.key ? ', authenticated' : ''})`);
  console.log(`  node B: ${NODES.B.base} (org ${NODES.B.org}${NODES.B.key ? ', authenticated' : ''})`);
  console.log(`  registry: ${REGISTRY}`);
  if (NODES.A.base === NODES.B.base && NODES.A.org === NODES.B.org) {
    console.log('  NOTE: A == B — harness dry-run, not a real interop result.');
  }
  console.log('');

  // ── [1] Manifest parity ──
  console.log('[1] Manifest parity');
  const manifests = {};
  for (const id of ['A', 'B']) {
    const r = await req(NODES[id], 'GET', '/v1/manifest');
    if (r.status === 200 && r.body?.protocol_version) {
      ok(`manifest_${id}`, `protocol ${r.body.protocol_version}`);
      manifests[id] = r.body;
    } else {
      ko(`manifest_${id}`, `status=${r.status}`);
    }
  }
  if (manifests.A && manifests.B) {
    if (manifests.A.protocol_version === manifests.B.protocol_version) {
      ok('manifest_versions_match', manifests.A.protocol_version);
    } else {
      diverge('manifest_versions_differ', `A=${manifests.A.protocol_version} B=${manifests.B.protocol_version}`);
    }
  }

  // ── [2] Registry co-discovery ──
  console.log('\n[2] Registry co-discovery (the DNS promise)');
  {
    const r = await fetch(`${REGISTRY}/api/registry/.well-known/agents.json`, {
      headers: { Accept: 'application/json' },
    }).then(async (res) => ({ status: res.status, body: await res.json().catch(() => ({})) }))
      .catch((e) => ({ status: 0, body: { error: e.message } }));
    if (r.status !== 200 || !Array.isArray(r.body?.agents)) {
      ko('registry_agents_json', `status=${r.status}`);
    } else {
      ok('registry_agents_json', `${r.body.agents.length} agents listed`);
      for (const id of ['A', 'B']) {
        const hit = r.body.agents.find((a) => a.url?.includes(`/${NODES[id].org}/`));
        if (hit) {
          ok(`registry_lists_${id}`, `${hit.name} (review=${hit.review_status ?? 'n/a'}, conformance=${hit.conformance_level ?? 'n/a'})`);
        } else {
          ko(`registry_lists_${id}`, `org ${NODES[id].org} not discoverable from shared registry`);
        }
      }
    }
  }

  // ── [3] Services parity ──
  console.log('\n[3] Services parity (one agent codepath, two backends)');
  const serviceFields = {};
  const firstService = {};
  for (const id of ['A', 'B']) {
    const r = await req(NODES[id], 'GET', `/v1/organizations/${NODES[id].org}/services`);
    const services = toArray(r.body, 'services');
    if (r.status === 200 && services.length > 0) {
      ok(`services_${id}`, `n=${services.length}`);
      serviceFields[id] = new Set(Object.keys(services[0]));
      firstService[id] = services[0];
    } else if (r.status === 200) {
      diverge(`services_${id}_empty`, 'endpoint works but org has no services — parity not comparable');
    } else {
      ko(`services_${id}`, `status=${r.status}`);
    }
  }
  if (serviceFields.A && serviceFields.B) {
    const required = ['id', 'name', 'duration_minutes'];
    const missing = [];
    for (const id of ['A', 'B']) {
      for (const f of required) if (!serviceFields[id].has(f)) missing.push(`${id}:${f}`);
    }
    if (missing.length === 0) ok('services_required_fields', required.join(', '));
    else ko('services_required_fields', `missing ${missing.join(', ')}`);

    const onlyA = [...serviceFields.A].filter((f) => !serviceFields.B.has(f));
    const onlyB = [...serviceFields.B].filter((f) => !serviceFields.A.has(f));
    if (onlyA.length === 0 && onlyB.length === 0) ok('services_field_sets_identical');
    else diverge('services_field_sets_differ', `only A: [${onlyA.join(', ')}] only B: [${onlyB.join(', ')}]`);
  }

  // ── [4] Availability parity ──
  console.log('\n[4] Availability parity');
  const slotAlias = {};
  for (const id of ['A', 'B']) {
    const from = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const to = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const svcId = firstService[id]?.id;
    const q = `/v1/organizations/${NODES[id].org}/availability?from=${from}&to=${to}${svcId ? `&serviceId=${svcId}` : ''}`;
    const r = await req(NODES[id], 'GET', q);
    const slots = toArray(r.body, 'slots');
    if (r.status !== 200) {
      ko(`availability_${id}`, `status=${r.status}`);
      continue;
    }
    ok(`availability_${id}`, `n=${slots.length}`);
    if (slots.length > 0) {
      const s = slots[0];
      slotAlias[id] = ['start', 'scheduledAt', 'datetime'].find((k) => s[k] !== undefined) ?? 'NONE';
      if (slotAlias[id] === 'NONE') ko(`availability_${id}_slot_shape`, `no start field: ${JSON.stringify(Object.keys(s))}`);
    }
  }
  if (slotAlias.A && slotAlias.B && slotAlias.A !== 'NONE' && slotAlias.B !== 'NONE') {
    if (slotAlias.A === slotAlias.B) ok('availability_slot_alias_match', slotAlias.A);
    else diverge('availability_slot_alias_differ', `A uses "${slotAlias.A}", B uses "${slotAlias.B}" — agents must handle both`);
  }

  // ── [5] Lifecycle vocabulary (authenticated, per node with key) ──
  console.log('\n[5] Lifecycle vocabulary');
  for (const id of ['A', 'B']) {
    const node = NODES[id];
    if (!node.key) {
      console.log(`  SKIP  lifecycle_${id} — no --key-${id.toLowerCase()} provided`);
      continue;
    }
    // Same canonical bodies against both nodes — this is the interop assertion.
    const email = `interop-${id.toLowerCase()}-${Math.random().toString(36).slice(2, 10)}@test.servicialo.com`;
    const client = await req(node, 'POST', '/v1/clients', { email, name: 'Interop', lastName: `Node${id}` });
    if (![200, 201].includes(client.status) || !client.body?.id) {
      ko(`lifecycle_${id}_client`, `status=${client.status}`);
      continue;
    }
    const svcId = firstService[id]?.id;
    if (!svcId) {
      ko(`lifecycle_${id}_service`, 'no service available to book');
      continue;
    }
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setHours(10, 0, 0, 0);
    const booking = await req(node, 'POST', '/v1/sessions', {
      clientId: client.body.id,
      providerId: 'unknown',
      serviceId: svcId,
      scheduledAt: tomorrow.toISOString(),
    });
    if (![200, 201].includes(booking.status) || !booking.body?.id) {
      ko(`lifecycle_${id}_book`, `status=${booking.status}`);
      continue;
    }
    ok(`lifecycle_${id}_book`, `id=${booking.body.id}`);
    const state = String(booking.body.status ?? '').toLowerCase();
    if (SPEC_STATES.has(state)) {
      ok(`lifecycle_${id}_state_vocabulary`, `"${state}" is spec-canonical`);
    } else if (KNOWN_DIVERGENT_STATES.has(state)) {
      diverge(`lifecycle_${id}_state_vocabulary`, `"${state}" is a documented reference divergence, not the spec enum`);
    } else if (state) {
      ko(`lifecycle_${id}_state_vocabulary`, `"${state}" is neither spec nor documented divergence`);
    }
    // Cleanup: cancel using the spec-canonical name first, divergent fallback second.
    const cancel = await req(node, 'POST', `/v1/sessions/${booking.body.id}/transition`, { to: 'cancelled', reason: 'interop-test' });
    if (cancel.status === 200) {
      ok(`lifecycle_${id}_cancel_canonical`, 'accepts spec enum "cancelled"');
    } else {
      const fallback = await req(node, 'POST', `/v1/sessions/${booking.body.id}/transition`, { to: 'cancelado', reason: 'interop-test' });
      if (fallback.status === 200) diverge(`lifecycle_${id}_cancel_vocabulary`, 'rejects "cancelled", accepts "cancelado" — agents need per-node vocabulary');
      else ko(`lifecycle_${id}_cancel`, `canonical=${cancel.status} fallback=${fallback.status}`);
    }
  }

  // ── [6] Agent cards ──
  console.log('\n[6] Agent cards');
  for (const id of ['A', 'B']) {
    const r = await req(NODES[id], 'GET', `/${NODES[id].org}/.well-known/agent.json`);
    if (r.status === 200 && r.body?.name && Array.isArray(r.body?.skills)) {
      ok(`agent_card_${id}`, `${r.body.skills.length} skills`);
    } else {
      ko(`agent_card_${id}`, `status=${r.status}`);
    }
  }

  // ── Verdict ──
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Tests: ${pass} passed, ${fail} failed, ${divergences.length} divergence(s)`);
  let verdict;
  if (fail > 0) verdict = 'NOT-INTEROPERABLE';
  else if (divergences.length > 0) verdict = 'INTEROPERABLE-WITH-DIVERGENCES';
  else verdict = 'INTEROPERABLE';
  console.log(`  Verdict: ${verdict}`);
  if (divergences.length > 0) {
    console.log('  Divergences (each one is agent-side complexity):');
    for (const d of divergences) console.log(`    - ${d.label}: ${d.detail}`);
  }
  if (failures.length > 0) {
    console.log('  Failures:');
    for (const f of failures) console.log(`    - ${f.label}: ${f.detail}`);
  }
  console.log('='.repeat(60));
  process.exit(fail > 0 ? 1 : 0);
})();
