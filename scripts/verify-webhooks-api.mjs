#!/usr/bin/env node
/**
 * End-to-end smoke test for the webhooks subscriptions API (H5 step 3).
 *
 * Requires:
 *   - dev server running (npm run dev) with REGISTRY_SUPABASE_* env set
 *   - fixtures from scripts/seed-test-webhooks.sql applied
 *     (two test nodes: _test_h5_node, _test_h5_other)
 *
 * Apply fixtures:   psql $DATABASE_URL -f scripts/seed-test-webhooks.sql
 * Cleanup:          psql $DATABASE_URL -f scripts/cleanup-test-webhooks.sql
 *
 * Usage:
 *   node scripts/verify-webhooks-api.mjs [--base http://localhost:3000]
 */

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'http://localhost:3000').replace(/\/$/, '');
const SUBS = `${BASE}/api/webhooks/subscriptions`;

const PRIMARY = 'test_h5_token_primary_secret_for_verify';
const OTHER = 'test_h5_token_other_secret_for_verify';

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

async function req(method, url, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers['X-Servicialo-Node-Token'] = token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let parsed;
  try { parsed = await res.json(); } catch { parsed = null; }
  return { status: res.status, body: parsed };
}

(async () => {
  console.log(`Servicialo webhooks API verification`);
  console.log(`  base: ${BASE}\n`);

  // ── 1. Auth ──
  console.log('[1] auth');
  {
    const r = await req('GET', SUBS);
    if (r.status === 401) ok('rejects_missing_token');
    else ko('rejects_missing_token', `status=${r.status}`);
  }
  {
    const r = await req('GET', SUBS, { token: 'definitely_not_real' });
    if (r.status === 401) ok('rejects_invalid_token');
    else ko('rejects_invalid_token', `status=${r.status}`);
  }

  // ── 2. POST happy path ──
  console.log('\n[2] POST create');
  let createdId;
  let createdSecret;
  {
    const r = await req('POST', SUBS, {
      token: PRIMARY,
      body: { url: 'https://example.com/webhook-a', subscribed_events: ['webhook.test', 'benchmark.weekly_snapshot'] },
    });
    if (r.status === 201 && r.body?.id && r.body?.secret) {
      ok('creates_with_secret', `secret_len=${r.body.secret.length}`);
      createdId = r.body.id;
      createdSecret = r.body.secret;
    } else {
      ko('creates_with_secret', `status=${r.status} body=${JSON.stringify(r.body)}`);
    }
  }

  // ── 3. POST validation ──
  console.log('\n[3] POST validation');
  {
    const r = await req('POST', SUBS, {
      token: PRIMARY,
      body: { url: 'http://insecure.example.com', subscribed_events: ['webhook.test'] },
    });
    if (r.status === 400) ok('rejects_non_https_url');
    else ko('rejects_non_https_url', `status=${r.status}`);
  }
  {
    const r = await req('POST', SUBS, {
      token: PRIMARY,
      body: { url: 'https://example.com/x', subscribed_events: ['totally.made.up'] },
    });
    if (r.status === 400) ok('rejects_unknown_event');
    else ko('rejects_unknown_event', `status=${r.status}`);
  }
  {
    const r = await req('POST', SUBS, {
      token: PRIMARY,
      body: { url: 'https://example.com/x', subscribed_events: [] },
    });
    if (r.status === 400) ok('rejects_empty_events_array');
    else ko('rejects_empty_events_array', `status=${r.status}`);
  }

  // ── 4. POST idempotency / duplicate detection ──
  console.log('\n[4] POST duplicate detection');
  {
    const r = await req('POST', SUBS, {
      token: PRIMARY,
      body: { url: 'https://example.com/webhook-a', subscribed_events: ['webhook.test', 'benchmark.weekly_snapshot'] },
    });
    if (r.status === 409 && r.body?.error === 'duplicate' && r.body?.existing_id === createdId) {
      ok('rejects_duplicate_with_existing_id');
    } else {
      ko('rejects_duplicate_with_existing_id', `status=${r.status} body=${JSON.stringify(r.body)}`);
    }
  }

  // ── 5. GET list ──
  console.log('\n[5] GET list');
  {
    const r = await req('GET', SUBS, { token: PRIMARY });
    const subs = r.body?.subscriptions ?? [];
    if (r.status === 200 && subs.length >= 1) ok('lists_own_subscriptions', `n=${subs.length}`);
    else ko('lists_own_subscriptions', JSON.stringify(r.body));

    const hasSecret = subs.some((s) => 'secret' in s);
    if (!hasSecret) ok('list_omits_secret');
    else ko('list_omits_secret', 'a subscription leaked secret in GET');

    const sample = subs[0];
    const expected = ['consecutive_failures', 'last_successful_delivery_at', 'deactivated_at'];
    const present = expected.every((k) => k in sample);
    if (present) ok('list_includes_health_fields');
    else ko('list_includes_health_fields', JSON.stringify(Object.keys(sample)));
  }

  // ── 6. GET other node sees empty ──
  console.log('\n[6] tenant isolation');
  {
    const r = await req('GET', SUBS, { token: OTHER });
    if (r.status === 200 && (r.body?.subscriptions?.length ?? 0) === 0) {
      ok('other_node_sees_no_subscriptions');
    } else {
      ko('other_node_sees_no_subscriptions', JSON.stringify(r.body));
    }
  }

  // ── 7. PATCH ──
  console.log('\n[7] PATCH update events');
  if (!createdId) {
    ko('patch_skipped', 'no createdId');
  } else {
    const r = await req('PATCH', `${SUBS}/${createdId}`, {
      token: PRIMARY,
      body: { subscribed_events: ['webhook.test'] },
    });
    if (r.status === 200 && JSON.stringify(r.body?.subscribed_events) === JSON.stringify(['webhook.test'])) {
      ok('patch_updates_events');
    } else {
      ko('patch_updates_events', JSON.stringify(r.body));
    }
    if (!('secret' in (r.body ?? {}))) ok('patch_response_omits_secret');
    else ko('patch_response_omits_secret');

    // PATCH from other node → 404
    const r2 = await req('PATCH', `${SUBS}/${createdId}`, {
      token: OTHER,
      body: { subscribed_events: ['webhook.test'] },
    });
    if (r2.status === 404) ok('patch_other_owner_returns_404');
    else ko('patch_other_owner_returns_404', `status=${r2.status}`);
  }

  // ── 8. POST rotate-secret ──
  console.log('\n[8] rotate-secret');
  let rotatedSecret;
  if (createdId) {
    const r = await req('POST', `${SUBS}/${createdId}/rotate-secret`, { token: PRIMARY });
    if (r.status === 200 && r.body?.secret && r.body.secret !== createdSecret) {
      ok('rotate_returns_new_secret');
      rotatedSecret = r.body.secret;
    } else {
      ko('rotate_returns_new_secret', JSON.stringify(r.body));
    }

    // Immediate second rotation → 429
    const r2 = await req('POST', `${SUBS}/${createdId}/rotate-secret`, { token: PRIMARY });
    if (r2.status === 429) ok('rotate_rate_limited_second_call');
    else ko('rotate_rate_limited_second_call', `status=${r2.status}`);

    // Other owner → 404
    const r3 = await req('POST', `${SUBS}/${createdId}/rotate-secret`, { token: OTHER });
    if (r3.status === 404) ok('rotate_other_owner_returns_404');
    else ko('rotate_other_owner_returns_404', `status=${r3.status}`);
  }
  void rotatedSecret;

  // ── 9. /test scaffold returns 501 ──
  console.log('\n[9] /test scaffold');
  if (createdId) {
    const r = await req('POST', `${SUBS}/${createdId}/test`, { token: PRIMARY });
    if (r.status === 501 && r.body?.error === 'not_implemented') {
      ok('test_endpoint_returns_501');
    } else {
      ko('test_endpoint_returns_501', JSON.stringify(r.body));
    }
  }

  // ── 10. DELETE → reactivate ──
  console.log('\n[10] DELETE soft-deletes, reactivate revives');
  if (createdId) {
    const r = await req('DELETE', `${SUBS}/${createdId}`, { token: PRIMARY });
    if (r.status === 204) ok('delete_returns_204');
    else ko('delete_returns_204', `status=${r.status}`);

    const r2 = await req('GET', SUBS + '?active=false', { token: PRIMARY });
    const found = (r2.body?.subscriptions ?? []).find((s) => s.id === createdId);
    if (found && found.active === false && found.deactivated_reason === 'manual') {
      ok('soft_delete_visible_in_active_false_list');
    } else {
      ko('soft_delete_visible_in_active_false_list', JSON.stringify(found));
    }

    const r3 = await req('POST', `${SUBS}/${createdId}/reactivate`, { token: PRIMARY });
    if (r3.status === 200 && r3.body?.active === true) ok('reactivate_brings_back');
    else ko('reactivate_brings_back', JSON.stringify(r3.body));

    const r4 = await req('POST', `${SUBS}/${createdId}/reactivate`, { token: PRIMARY });
    if (r4.status === 409 && r4.body?.error === 'already_active') ok('reactivate_idempotent_guard');
    else ko('reactivate_idempotent_guard', JSON.stringify(r4.body));
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
