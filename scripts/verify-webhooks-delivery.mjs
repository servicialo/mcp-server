#!/usr/bin/env node
/**
 * End-to-end verification of the webhook delivery worker (H5 step 4).
 *
 * What it tests:
 *   1. /test enqueues a webhook.test, the worker delivers it, and the
 *      receiver sees a POST with valid HMAC and the expected headers.
 *   2. /deliveries/{id} reports status='delivered' after a successful test.
 *   3. When the receiver returns 410, the delivery becomes 'abandoned' and
 *      the subscription is auto-deactivated.
 *   4. When the receiver returns 500, the delivery becomes 'failed' with
 *      next_retry_at scheduled in the future (we don't wait for the retry).
 *
 * Setup:
 *   - Dev server running: npm run dev
 *   - Fixture nodes applied: psql $DATABASE_URL -f scripts/seed-test-webhooks.sql
 *
 * Usage:
 *   node scripts/verify-webhooks-delivery.mjs [--base http://localhost:3000]
 */

import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'http://localhost:3000').replace(/\/$/, '');
const SUBS = `${BASE}/api/webhooks/subscriptions`;
const DELIV = `${BASE}/api/webhooks/deliveries`;
const PRIMARY_TOKEN = 'test_h5_token_primary_secret_for_verify';

let pass = 0;
let fail = 0;
const failures = [];
function ok(label, detail = '') { pass++; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`); }
function ko(label, detail = '') { fail++; failures.push({ label, detail }); console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`); }

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

function startMockReceiver(respondWith) {
  const received = [];
  let response = { ...respondWith };
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      received.push({
        method: req.method,
        url: req.url,
        headers: { ...req.headers },
        rawBody: body,
      });
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}/hook`,
        received,
        setResponse: (r) => { response = { ...response, ...r }; },
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

async function deleteSubscriptionsForNode(token) {
  // Soft-delete every active sub so the test starts clean.
  const list = await req('GET', SUBS, { token });
  for (const s of list.body?.subscriptions ?? []) {
    if (s.active) await req('DELETE', `${SUBS}/${s.id}`, { token });
  }
}

(async () => {
  console.log(`Servicialo webhook delivery verification`);
  console.log(`  base: ${BASE}\n`);

  // Pre: clean state for primary node
  await deleteSubscriptionsForNode(PRIMARY_TOKEN);

  // ── Mock 1: 200 OK happy path ──
  const happy = await startMockReceiver({ status: 200 });

  let subId;
  let subSecret;
  {
    const r = await req('POST', SUBS, {
      token: PRIMARY_TOKEN,
      body: { url: happy.url, subscribed_events: ['webhook.test'] },
    });
    if (r.status === 201 && r.body?.id) {
      subId = r.body.id;
      subSecret = r.body.secret;
      ok('subscription_created_for_loopback', `id=${subId}`);
    } else {
      ko('subscription_created_for_loopback', JSON.stringify(r.body));
      await happy.close();
      process.exit(1);
    }
  }

  // ── 1. POST /test → delivered + HMAC ──
  console.log('\n[1] /test happy path');
  {
    const r = await req('POST', `${SUBS}/${subId}/test`, {
      token: PRIMARY_TOKEN,
      body: { payload: { hello: 'world' } },
    });
    if (r.status === 202 && r.body?.delivery_id) ok('test_returns_202_with_delivery_id', r.body.delivery_id);
    else ko('test_returns_202_with_delivery_id', JSON.stringify(r.body));

    if (r.body?.status === 'delivered') ok('test_status_delivered');
    else ko('test_status_delivered', `status=${r.body?.status}`);

    if (happy.received.length === 1) ok('mock_received_one_post');
    else ko('mock_received_one_post', `n=${happy.received.length}`);

    if (happy.received.length > 0) {
      const got = happy.received[0];
      const sig = got.headers['x-servicialo-signature'];
      const expected = 'sha256=' + createHmac('sha256', subSecret).update(got.rawBody).digest('hex');
      if (sig === expected) ok('hmac_signature_valid');
      else ko('hmac_signature_valid', `got=${sig} expected=${expected}`);

      if (got.headers['x-servicialo-event-type'] === 'webhook.test') ok('header_event_type_set');
      else ko('header_event_type_set', `got=${got.headers['x-servicialo-event-type']}`);

      if (got.headers['x-servicialo-delivery-id'] === r.body?.delivery_id) ok('header_delivery_id_set');
      else ko('header_delivery_id_set', `got=${got.headers['x-servicialo-delivery-id']}`);

      if (got.headers['x-servicialo-event-id']) ok('header_event_id_set');
      else ko('header_event_id_set');

      if (got.headers['x-servicialo-timestamp']) ok('header_timestamp_set');
      else ko('header_timestamp_set');

      try {
        const env = JSON.parse(got.rawBody);
        if (env.event === 'webhook.test' && env.event_id && env.emitted_at && env.data?.payload?.hello === 'world') {
          ok('envelope_well_formed');
        } else {
          ko('envelope_well_formed', JSON.stringify(env));
        }
      } catch (e) {
        ko('envelope_well_formed', `parse error: ${e.message}`);
      }
    }

    // GET /deliveries/{id} should report delivered
    if (r.body?.delivery_id) {
      const d = await req('GET', `${DELIV}/${r.body.delivery_id}`, { token: PRIMARY_TOKEN });
      if (d.status === 200 && d.body?.status === 'delivered') ok('deliveries_endpoint_reports_delivered');
      else ko('deliveries_endpoint_reports_delivered', JSON.stringify(d.body));
    }
  }

  await happy.close();

  // ── 2. 410 Gone → abandoned + auto-deactivate ──
  console.log('\n[2] receiver returns 410 → abandoned + deactivate');
  await deleteSubscriptionsForNode(PRIMARY_TOKEN);
  const gone = await startMockReceiver({ status: 410 });
  {
    const c = await req('POST', SUBS, {
      token: PRIMARY_TOKEN,
      body: { url: gone.url, subscribed_events: ['webhook.test'] },
    });
    const goneSubId = c.body?.id;
    if (!goneSubId) {
      ko('gone_subscription_created', JSON.stringify(c.body));
    } else {
      const t = await req('POST', `${SUBS}/${goneSubId}/test`, { token: PRIMARY_TOKEN, body: {} });
      if (t.body?.status === 'abandoned') ok('gone_delivery_marked_abandoned');
      else ko('gone_delivery_marked_abandoned', JSON.stringify(t.body));

      const list = await req('GET', `${SUBS}?active=false`, { token: PRIMARY_TOKEN });
      const found = (list.body?.subscriptions ?? []).find((s) => s.id === goneSubId);
      if (found && !found.active && found.deactivated_reason === 'subscriber_gone_410') {
        ok('gone_subscription_auto_deactivated');
      } else {
        ko('gone_subscription_auto_deactivated', JSON.stringify(found));
      }
    }
  }
  await gone.close();

  // ── 3. 500 → failed + next_retry_at scheduled (no waiting for retry) ──
  console.log('\n[3] receiver returns 500 → failed with next_retry_at');
  await deleteSubscriptionsForNode(PRIMARY_TOKEN);
  const flaky = await startMockReceiver({ status: 500 });
  {
    const c = await req('POST', SUBS, {
      token: PRIMARY_TOKEN,
      body: { url: flaky.url, subscribed_events: ['webhook.test'] },
    });
    const id = c.body?.id;
    if (!id) {
      ko('flaky_subscription_created', JSON.stringify(c.body));
    } else {
      const t = await req('POST', `${SUBS}/${id}/test`, { token: PRIMARY_TOKEN, body: {} });
      if (t.body?.status === 'failed') ok('flaky_delivery_marked_failed');
      else ko('flaky_delivery_marked_failed', JSON.stringify(t.body));

      const d = await req('GET', `${DELIV}/${t.body?.delivery_id}`, { token: PRIMARY_TOKEN });
      if (d.body?.next_retry_at && new Date(d.body.next_retry_at) > new Date()) {
        ok('flaky_next_retry_at_in_future', d.body.next_retry_at);
      } else {
        ko('flaky_next_retry_at_in_future', JSON.stringify(d.body));
      }
      if (d.body?.attempts === 1) ok('flaky_attempts_incremented');
      else ko('flaky_attempts_incremented', `attempts=${d.body?.attempts}`);
    }
  }
  await flaky.close();

  // Cleanup
  await deleteSubscriptionsForNode(PRIMARY_TOKEN);

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
