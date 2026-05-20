#!/usr/bin/env node
/**
 * Smoke test for POST /api/telemetry/operational.
 *
 * Sends one event of each of the 4 event types and verifies:
 *  - 202 Accepted on valid payload
 *  - 400 on malformed payload (missing field / wrong enum value)
 *  - Schema enforcement is real, not just a doc
 *
 * Usage:
 *   node scripts/verify-operational-telemetry.mjs [--base http://localhost:3000]
 *
 * Exit code 0 if all checks pass, 1 otherwise.
 */

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'http://localhost:3000').replace(/\/$/, '');
const URL = `${BASE}/api/telemetry/operational`;

let pass = 0;
let fail = 0;
const failures = [];

function ok(label, detail = '') {
  pass++;
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
}

function ko(label, detail = '') {
  fail++;
  failures.push({ label, detail });
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
}

async function send(body) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const NOW = new Date().toISOString();
const FINGERPRINT = 'sha256-test-' + Math.random().toString(16).slice(2, 10).padEnd(16, '0');

const VALID = {
  booking_created: {
    protocol_version: '0.9',
    event_type: 'booking_created',
    vertical: 'health',
    region: 'CL',
    occurred_at: NOW,
    org_fingerprint: FINGERPRINT,
    payload: {
      lead_time_bucket: '3-7_days',
      slot_hour_bucket: '09-12',
      weekday: 2,
      channel: 'agent',
    },
  },
  service_completed: {
    protocol_version: '0.9',
    event_type: 'service_completed',
    vertical: 'health',
    region: 'CL',
    occurred_at: NOW,
    org_fingerprint: FINGERPRINT,
    payload: {
      duration_bucket: '30-60min',
      outcome: 'completed',
      evidence_completeness: 'complete',
    },
  },
  dispute_opened: {
    protocol_version: '0.9',
    event_type: 'dispute_opened',
    vertical: 'health',
    region: 'CL',
    occurred_at: NOW,
    org_fingerprint: FINGERPRINT,
    payload: {
      opened_by: 'client',
      reason_category: 'quality',
    },
  },
  payment_settled: {
    protocol_version: '0.9',
    event_type: 'payment_settled',
    vertical: 'health',
    region: 'CL',
    occurred_at: NOW,
    org_fingerprint: FINGERPRINT,
    payload: {
      price_band: '25-50k',
      currency: 'CLP',
      payment_method: 'transfer',
      time_to_collect_bucket: 'immediate',
    },
  },
};

(async () => {
  console.log(`Servicialo operational-telemetry verification`);
  console.log(`  endpoint: ${URL}`);
  console.log(`  fingerprint: ${FINGERPRINT}\n`);

  // ── 1. Valid events ──
  for (const [type, body] of Object.entries(VALID)) {
    console.log(`[+] ${type} — valid payload`);
    const r = await send(body);
    if (r.status === 202 && r.body?.ok === true) {
      ok(`${type}_accepted`, `202`);
    } else {
      ko(`${type}_accepted`, `status=${r.status} body=${JSON.stringify(r.body)}`);
    }
  }

  // ── 2. Schema enforcement ──
  console.log(`\n[+] schema enforcement`);

  const missingField = { ...VALID.booking_created, payload: { weekday: 3 } };
  const r1 = await send(missingField);
  if (r1.status === 400 && r1.body?.error === 'invalid_payload') {
    ok('rejects_incomplete_payload');
  } else {
    ko('rejects_incomplete_payload', `status=${r1.status} body=${JSON.stringify(r1.body)}`);
  }

  const badRegion = { ...VALID.booking_created, region: 'chile' };
  const r2 = await send(badRegion);
  if (r2.status === 400 && r2.body?.error === 'invalid_envelope') {
    ok('rejects_invalid_region_format');
  } else {
    ko('rejects_invalid_region_format', `status=${r2.status} body=${JSON.stringify(r2.body)}`);
  }

  const badEnum = {
    ...VALID.service_completed,
    payload: { ...VALID.service_completed.payload, outcome: 'totally_made_up' },
  };
  const r3 = await send(badEnum);
  if (r3.status === 400 && r3.body?.error === 'invalid_payload') {
    ok('rejects_unknown_enum_value');
  } else {
    ko('rejects_unknown_enum_value', `status=${r3.status} body=${JSON.stringify(r3.body)}`);
  }

  const badJson = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ not json',
  });
  if (badJson.status === 400) {
    ok('rejects_malformed_json');
  } else {
    ko('rejects_malformed_json', `status=${badJson.status}`);
  }

  // ── Summary ──
  console.log(`\n────────────────`);
  console.log(`PASS: ${pass}    FAIL: ${fail}`);
  if (fail > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  - ${f.label}${f.detail ? `: ${f.detail}` : ''}`);
    process.exit(1);
  } else {
    console.log(`\nNext: query Supabase to confirm rows landed:`);
    console.log(`  SELECT event_type, vertical, region, payload FROM telemetry_events`);
    console.log(`  WHERE org_fingerprint = '${FINGERPRINT}';`);
    process.exit(0);
  }
})().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(2);
});
