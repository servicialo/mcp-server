#!/usr/bin/env node
/**
 * End-to-end smoke test for the A2A endpoint of a Servicialo node.
 *
 * Usage:
 *   node scripts/verify-a2a.mjs [--base http://localhost:3000] [--org coordinalo]
 *
 * Requires a running dev server (`npm run dev`) with the target org seeded
 * and `discoverable=true`. Each check is reported independently — the script
 * does not abort on the first failure so you can see the full picture.
 *
 * Exit code is 0 if all checks pass, 1 otherwise.
 */

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg('--base', 'http://localhost:3000').replace(/\/$/, '');
const ORG = arg('--org', 'coordinalo');
const A2A_URL = `${BASE}/api/servicialo/${ORG}/a2a`;
const AGENT_CARD_URL = `${BASE}/api/servicialo/${ORG}/.well-known/agent.json`;

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

async function rpc(method, params, headers = {}) {
  const body = { jsonrpc: '2.0', id: cryptoRandomId(), method, params };
  const res = await fetch(A2A_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ raw: 'non-json response' }));
  return { http: res.status, body: json, requestId: body.id };
}

function cryptoRandomId() {
  return `req-${Math.random().toString(36).slice(2, 10)}`;
}

async function check1_agentCard() {
  console.log('\n[1] GET /.well-known/agent.json');
  try {
    const res = await fetch(AGENT_CARD_URL);
    if (res.status !== 200) {
      ko('agent_card_http_200', `got ${res.status}`);
      return null;
    }
    const card = await res.json();
    if (card.protocolVersion?.startsWith('0.3')) {
      ok('protocol_version_0.3.x');
    } else {
      ko('protocol_version_0.3.x', `got ${card.protocolVersion}`);
    }
    if (Array.isArray(card.skills) && card.skills.length > 0) {
      ok('declares_skills', `${card.skills.length} skill(s)`);
    } else {
      ko('declares_skills', 'no skills');
    }
    if (Array.isArray(card.authentication?.schemes) && card.authentication.schemes.length > 0) {
      ok('declares_auth_scheme');
    } else {
      ko('declares_auth_scheme', 'authentication.schemes is empty');
    }
    return card;
  } catch (err) {
    ko('agent_card_reachable', String(err));
    return null;
  }
}

async function check2_unknownIntent() {
  console.log('\n[2] message/send with unknown intent');
  const r = await rpc('message/send', {
    message: { role: 'user', parts: [{ kind: 'text', text: 'hola, que tal' }] },
  });
  if (r.body.result?.status?.state === 'input-required') {
    ok('unknown_intent_returns_input_required');
  } else {
    ko('unknown_intent_returns_input_required', JSON.stringify(r.body));
  }
}

async function check3_availability() {
  console.log('\n[3] message/send for availability');
  const r = await rpc('message/send', {
    message: { role: 'user', parts: [{ kind: 'text', text: 'que disponibilidad tienes?' }] },
  });
  const state = r.body.result?.status?.state;
  if (state === 'completed' || state === 'failed') {
    ok('availability_terminal_state', `state=${state}`);
    if (state === 'failed') {
      console.log(`        (upstream not reachable — handler still produced a task)`);
    }
    return r.body.result;
  }
  ko('availability_terminal_state', `state=${state}`);
  return null;
}

async function check4_servicesIntent() {
  console.log('\n[4] message/send for services catalog');
  const r = await rpc('message/send', {
    message: { role: 'user', parts: [{ kind: 'text', text: 'que servicios ofreces?' }] },
  });
  const state = r.body.result?.status?.state;
  if (state === 'completed' || state === 'failed') {
    ok('services_terminal_state', `state=${state}`);
  } else {
    ko('services_terminal_state', `state=${state}`);
  }
}

async function check5_bookingConversation() {
  console.log('\n[5] message/send booking — multi-turn');
  const r1 = await rpc('message/send', {
    message: { role: 'user', parts: [{ kind: 'text', text: 'quiero reservar una hora' }] },
  });
  const taskId = r1.body.result?.id;
  const ctxId = r1.body.result?.contextId;
  if (r1.body.result?.status?.state === 'input-required' && taskId && ctxId) {
    ok('booking_turn1_input_required', `taskId=${taskId}`);
  } else {
    ko('booking_turn1_input_required', JSON.stringify(r1.body));
    return;
  }

  const r2 = await rpc('message/send', {
    message: {
      role: 'user',
      taskId,
      contextId: ctxId,
      parts: [{ kind: 'text', text: 'Juan Pérez, juan@example.com, kinesiología, 2026-05-20T10:00' }],
    },
  });
  const r2State = r2.body.result?.status?.state;
  if (r2State === 'completed' || r2State === 'failed') {
    ok('booking_turn2_terminal_state', `state=${r2State}`);
  } else {
    ko('booking_turn2_terminal_state', `state=${r2State} (likely missing fields parser issue)`);
  }
  return { taskId, ctxId, r2State };
}

async function check6_tasksGet(taskId) {
  console.log('\n[6] tasks/get');
  if (!taskId) {
    ko('tasks_get_skipped', 'no taskId available');
    return;
  }
  const r = await rpc('tasks/get', { id: taskId });
  if (r.body.result?.id === taskId) {
    ok('tasks_get_returns_same_id');
  } else {
    ko('tasks_get_returns_same_id', JSON.stringify(r.body));
  }
}

async function check7_tasksCancel(taskId) {
  console.log('\n[7] tasks/cancel');
  if (!taskId) {
    ko('tasks_cancel_skipped', 'no taskId available');
    return;
  }
  const r = await rpc('tasks/cancel', { id: taskId });
  const state = r.body.result?.status?.state;
  if (state === 'canceled' || state === 'completed' || state === 'failed') {
    ok('tasks_cancel_returns_terminal', `state=${state}`);
  } else {
    ko('tasks_cancel_returns_terminal', `state=${state}`);
  }
}

async function check8_invalidMethod() {
  console.log('\n[8] JSON-RPC error: unknown method');
  const r = await rpc('does/not/exist', {});
  if (r.body.error?.code === -32601) {
    ok('unknown_method_returns_-32601');
  } else {
    ko('unknown_method_returns_-32601', JSON.stringify(r.body));
  }
}

async function check9_missingId() {
  console.log('\n[9] JSON-RPC error: missing id');
  const res = await fetch(A2A_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'message/send', params: {} }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.error?.code === -32600) {
    ok('missing_id_returns_-32600');
  } else {
    ko('missing_id_returns_-32600', JSON.stringify(json));
  }
}

(async () => {
  console.log(`Servicialo A2A verification`);
  console.log(`  base: ${BASE}`);
  console.log(`  org:  ${ORG}`);

  await check1_agentCard();
  await check2_unknownIntent();
  await check3_availability();
  await check4_servicesIntent();
  const booking = await check5_bookingConversation();
  await check6_tasksGet(booking?.taskId);
  await check7_tasksCancel(booking?.taskId);
  await check8_invalidMethod();
  await check9_missingId();

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
