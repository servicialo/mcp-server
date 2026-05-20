#!/usr/bin/env node
/**
 * End-to-end verification of the contribute-to-access gating on /api/benchmarks.
 *
 * Assumes the fixtures from scripts/seed-test-gating.sql have been applied:
 *   - registry_entries slug=_test_h4_node      token=test_h4_token_secret_value_for_verify
 *   - registry_entries slug=_test_h4_node_idle token=test_h4_idle_token_secret_for_verify
 *   - telemetry_events vertical=_test_h4: 60 events from _test_h4_node's fingerprint
 *                                         + 4 other fingerprints (k-anon ≥ 5)
 *   - telemetry_events vertical=_test_h4_low: 1 event, 1 fingerprint
 *
 * Apply fixtures with:
 *   psql $DATABASE_URL -f scripts/seed-test-gating.sql
 * Cleanup with:
 *   psql $DATABASE_URL -f scripts/cleanup-test-gating.sql
 *
 * Usage:
 *   node scripts/verify-benchmarks-gating.mjs [--base http://localhost:3000]
 */

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'http://localhost:3000').replace(/\/$/, '');
const BENCHMARK = `${BASE}/api/benchmarks`;

const CONTRIBUTOR_TOKEN = 'test_h4_token_secret_value_for_verify';
const IDLE_TOKEN = 'test_h4_idle_token_secret_for_verify';

const SEGMENT_QS = '?event_type=service_completed&vertical=_test_h4&region=XX';

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

async function get(url, token) {
  const headers = { Accept: 'application/json' };
  if (token) headers['X-Servicialo-Node-Token'] = token;
  const res = await fetch(url, { headers });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
  console.log(`Servicialo benchmarks gating verification`);
  console.log(`  base: ${BASE}\n`);

  // ── 1. Anonymous (tier 0) — window clamped to [now-180d, now-90d] ──
  console.log('[1] anonymous → tier 0, window clamped');
  {
    const r = await get(BENCHMARK + SEGMENT_QS);
    const a = r.body.access;
    if (a?.tier === 0) ok('tier_is_0');
    else ko('tier_is_0', `tier=${a?.tier}`);
    if (r.body.segment?.window_clamped === true) ok('window_clamped_true');
    else ko('window_clamped_true', JSON.stringify(r.body.segment));
    // Fixtures are in the last 30 days, so the clamped window sees zero data
    if (r.body.ok === false && r.body.reason === 'insufficient_data') {
      ok('anonymous_sees_empty_clamped_window');
    } else {
      ko('anonymous_sees_empty_clamped_window', JSON.stringify(r.body));
    }
  }

  // ── 2. Invalid token → falls back to tier 0 ──
  console.log('\n[2] invalid token → tier 0 fallback');
  {
    const r = await get(BENCHMARK + SEGMENT_QS, 'definitely_not_a_real_token_xyz');
    const a = r.body.access;
    if (a?.tier === 0 && /invalid/i.test(a?.message ?? '')) {
      ok('invalid_token_falls_back_to_0_with_clear_message');
    } else {
      ko('invalid_token_falls_back_to_0_with_clear_message', JSON.stringify(a));
    }
  }

  // ── 3. Valid token, no contributions → tier 1 ──
  console.log('\n[3] idle node token → tier 1, still clamped');
  {
    const r = await get(BENCHMARK + SEGMENT_QS, IDLE_TOKEN);
    const a = r.body.access;
    if (a?.tier === 1) ok('tier_is_1');
    else ko('tier_is_1', `tier=${a?.tier}`);
    if (a?.contribution_score === 0) ok('contribution_score_zero');
    else ko('contribution_score_zero', `score=${a?.contribution_score}`);
    if (r.body.segment?.window_clamped === true) ok('tier1_window_still_clamped');
    else ko('tier1_window_still_clamped', JSON.stringify(r.body.segment));
  }

  // ── 4. Valid token with ≥50 contributions → tier 2 ──
  console.log('\n[4] contributor token → tier 2, real-time access');
  {
    const r = await get(BENCHMARK + SEGMENT_QS, CONTRIBUTOR_TOKEN);
    const a = r.body.access;
    if (a?.tier === 2) ok('tier_is_2');
    else ko('tier_is_2', `tier=${a?.tier} body=${JSON.stringify(r.body)}`);
    if ((a?.contribution_score ?? 0) >= 50) ok('contribution_score_above_threshold', `score=${a?.contribution_score}`);
    else ko('contribution_score_above_threshold', `score=${a?.contribution_score}`);
    if (r.body.segment?.window_clamped === false) ok('tier2_window_unclamped');
    else ko('tier2_window_unclamped', JSON.stringify(r.body.segment));
    if (r.body.ok === true && r.body.contributors >= 5) {
      ok('tier2_sees_real_distribution', `contributors=${r.body.contributors}, sample=${r.body.sample_size}`);
    } else {
      ko('tier2_sees_real_distribution', JSON.stringify(r.body));
    }
  }

  // ── 5. Access block is always present, regardless of outcome ──
  console.log('\n[5] access block is always present');
  {
    const r1 = await get(BENCHMARK + '?event_type=service_completed&vertical=_test_h4_low&region=XX', CONTRIBUTOR_TOKEN);
    if (r1.body.access && typeof r1.body.access.tier === 'number') {
      ok('access_block_on_insufficient_data');
    } else {
      ko('access_block_on_insufficient_data', JSON.stringify(r1.body));
    }
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
