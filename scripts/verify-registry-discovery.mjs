#!/usr/bin/env node
/**
 * Smoke test for the discovery endpoints that let a cold caller learn
 * the protocol taxonomy without prior knowledge.
 *
 * Usage:
 *   node scripts/verify-registry-discovery.mjs [--base http://localhost:3000]
 */

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'http://localhost:3000').replace(/\/$/, '');

let pass = 0;
let fail = 0;
const failures = [];
function ok(label, detail = '') { pass++; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`); }
function ko(label, detail = '') { fail++; failures.push({ label, detail }); console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
  console.log(`Servicialo registry discovery verification`);
  console.log(`  base: ${BASE}\n`);

  // ── 1. /verticals ──
  console.log('[1] /api/registry/verticals');
  {
    const r = await get('/api/registry/verticals');
    if (r.status === 200 && r.body?.ok === true) ok('verticals_http_200');
    else ko('verticals_http_200', `status=${r.status}`);

    if (Array.isArray(r.body?.verticals)) ok('verticals_is_array', `n=${r.body.verticals.length}`);
    else ko('verticals_is_array');

    if (typeof r.body?.window_days === 'number') ok('verticals_window_days');
    else ko('verticals_window_days');

    const sample = r.body?.verticals?.[0];
    if (sample && typeof sample.name === 'string' && typeof sample.org_count === 'number' && typeof sample.event_count_30d === 'number') {
      ok('verticals_row_shape');
    } else if (r.body?.verticals?.length === 0) {
      ok('verticals_empty_ok', 'no orgs declared verticals yet');
    } else {
      ko('verticals_row_shape', JSON.stringify(sample));
    }

    const leakedTest = (r.body?.verticals ?? []).some((v) => v.name?.startsWith('_'));
    if (!leakedTest) ok('verticals_excludes_test_fixtures');
    else ko('verticals_excludes_test_fixtures', 'leaked _test_*');
  }

  // ── 2. /regions ──
  console.log('\n[2] /api/registry/regions');
  {
    const r = await get('/api/registry/regions');
    if (r.status === 200 && r.body?.ok === true) ok('regions_http_200');
    else ko('regions_http_200', `status=${r.status}`);

    if (Array.isArray(r.body?.regions)) ok('regions_is_array', `n=${r.body.regions.length}`);
    else ko('regions_is_array');

    const sample = r.body?.regions?.[0];
    if (sample && /^[A-Z]{2}$/.test(sample.code) && typeof sample.org_count === 'number') {
      ok('regions_row_shape_iso2');
    } else if (r.body?.regions?.length === 0) {
      ok('regions_empty_ok');
    } else {
      ko('regions_row_shape_iso2', JSON.stringify(sample));
    }
  }

  // ── 3. /event_types ──
  console.log('\n[3] /api/registry/event_types');
  {
    const r = await get('/api/registry/event_types');
    if (r.status === 200 && r.body?.ok === true) ok('event_types_http_200');
    else ko('event_types_http_200', `status=${r.status}`);

    const expectedNames = ['booking_created', 'service_completed', 'dispute_opened', 'payment_settled'];
    const names = (r.body?.event_types ?? []).map((e) => e.name);
    const allPresent = expectedNames.every((n) => names.includes(n));
    if (allPresent) ok('event_types_catalog_complete');
    else ko('event_types_catalog_complete', `got=${JSON.stringify(names)}`);

    const sample = r.body?.event_types?.find((e) => e.name === 'payment_settled');
    if (sample && Array.isArray(sample.payload_fields) && sample.payload_fields.includes('price_band')) {
      ok('event_types_payload_fields_present');
    } else {
      ko('event_types_payload_fields_present', JSON.stringify(sample));
    }

    if (typeof r.body?.schema_url === 'string') ok('event_types_schema_url_present');
    else ko('event_types_schema_url_present');
  }

  // ── Summary ──
  console.log(`\n────────────────`);
  console.log(`PASS: ${pass}    FAIL: ${fail}`);
  if (fail > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  - ${f.label}${f.detail ? `: ${f.detail}` : ''}`);
    process.exit(1);
  } else {
    process.exit(0);
  }
})().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(2);
});
