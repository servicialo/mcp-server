#!/usr/bin/env node
/**
 * Smoke test for the benchmarks API. Assumes test fixtures already exist in
 * telemetry_events:
 *   - 10 rows of service_completed / vertical=_test_h3 / region=XX, with 5 distinct org_fingerprints
 *   - 2 rows of service_completed / vertical=_test_h3_low / region=XX, with 1 fingerprint
 *
 * The fixtures can be created via:
 *   psql <DATABASE_URL> -f scripts/seed-test-benchmarks.sql
 * or by re-running the SQL from the H3 implementation session.
 *
 * Usage:
 *   node scripts/verify-benchmarks.mjs [--base http://localhost:3000]
 */

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'http://localhost:3000').replace(/\/$/, '');
const SEGMENTS = `${BASE}/api/benchmarks/segments`;
const BENCHMARK = `${BASE}/api/benchmarks`;

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

async function get(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

(async () => {
  console.log(`Servicialo benchmarks verification`);
  console.log(`  base: ${BASE}\n`);

  // ── 1. Segments endpoint excludes low-k segments ──
  console.log('[1] /benchmarks/segments respects k-anon');
  {
    const r = await get(`${SEGMENTS}?vertical=_test_h3`);
    if (r.status !== 200) { ko('segments_http_200', `status=${r.status}`); return; }
    const list = r.body.segments ?? [];
    if (list.length === 1 && list[0].vertical === '_test_h3' && list[0].contributors >= 5) {
      ok('segments_includes_k_safe', `contributors=${list[0].contributors}`);
    } else {
      ko('segments_includes_k_safe', JSON.stringify(list));
    }
  }
  {
    const r = await get(`${SEGMENTS}?vertical=_test_h3_low`);
    const list = r.body.segments ?? [];
    if (list.length === 0) {
      ok('segments_excludes_low_k');
    } else {
      ko('segments_excludes_low_k', JSON.stringify(list));
    }
  }

  // ── 2. Benchmark with sufficient data returns distribution ──
  console.log('\n[2] /benchmarks returns distribution when k-anon passes');
  {
    const r = await get(`${BENCHMARK}?event_type=service_completed&vertical=_test_h3&region=XX`);
    if (r.status !== 200) { ko('benchmark_http_200', `status=${r.status}`); return; }
    if (r.body.ok !== true) {
      ko('benchmark_ok_true', JSON.stringify(r.body));
    } else {
      ok('benchmark_ok_true');
    }
    if (r.body.contributors === 5 && r.body.sample_size === 10) {
      ok('benchmark_counts_match', `contributors=5, sample_size=10`);
    } else {
      ko('benchmark_counts_match', `contributors=${r.body.contributors}, sample_size=${r.body.sample_size}`);
    }
    const completedShare = r.body.distribution?.outcome?.completed?.share;
    if (completedShare === 0.7) {
      ok('benchmark_distribution_correct', `outcome.completed.share=0.7`);
    } else {
      ko('benchmark_distribution_correct', `outcome.completed.share=${completedShare}`);
    }
    const durMode = r.body.distribution?.duration_bucket;
    const firstKey = durMode ? Object.keys(durMode)[0] : null;
    if (firstKey === '30-60min') {
      ok('benchmark_distribution_sorted_desc', `top duration_bucket=30-60min`);
    } else {
      ko('benchmark_distribution_sorted_desc', `firstKey=${firstKey}`);
    }
  }

  // ── 3. Benchmark with insufficient data returns insufficient_data ──
  console.log('\n[3] /benchmarks blocks segments below k-anon floor');
  {
    const r = await get(`${BENCHMARK}?event_type=service_completed&vertical=_test_h3_low&region=XX`);
    if (r.body.ok === false && r.body.reason === 'insufficient_data' && r.body.contributors === 1) {
      ok('benchmark_insufficient_data', `contributors=1, threshold=5`);
    } else {
      ko('benchmark_insufficient_data', JSON.stringify(r.body));
    }
  }

  // ── 4. Invalid params return 400 ──
  console.log('\n[4] /benchmarks validates params');
  {
    const r = await get(BENCHMARK);
    if (r.status === 400 && r.body.error === 'invalid_query') {
      ok('benchmark_rejects_missing_params');
    } else {
      ko('benchmark_rejects_missing_params', `status=${r.status} body=${JSON.stringify(r.body)}`);
    }
  }
  {
    const r = await get(`${BENCHMARK}?event_type=service_completed&vertical=health&region=chile`);
    if (r.status === 400 && r.body.error === 'invalid_query') {
      ok('benchmark_rejects_lowercase_region');
    } else {
      ko('benchmark_rejects_lowercase_region', `status=${r.status} body=${JSON.stringify(r.body)}`);
    }
  }
  {
    const r = await get(`${BENCHMARK}?event_type=does_not_exist&vertical=health&region=CL`);
    if (r.status === 400 && r.body.error === 'invalid_query') {
      ok('benchmark_rejects_unknown_event_type');
    } else {
      ko('benchmark_rejects_unknown_event_type', `status=${r.status} body=${JSON.stringify(r.body)}`);
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
