# Servicialo — Webhook Specification

> **Status:** v0.2 — Registry-emitted events are stable (delivery worker landed in H5). Implementer-emitted events (`booking.*`, etc.) are still spec-only — node implementations may emit them but the registry does not relay them yet.

## What's in this document

- **Registry-emitted events** (live): events that the protocol-level cron emits to subscribers — e.g. weekly benchmark snapshots
- **Implementer-emitted events** (spec): events that individual node implementations emit when their own state changes — e.g. a booking moved from `confirmed` to `in_progress`
- **Subscription API**: how a node registers a webhook with the protocol registry
- **Delivery semantics**: signing, retries, auto-deactivation

---

## Registry-emitted events

These are the events that `https://servicialo.com` itself dispatches to subscribers. Currently:

| Event | When emitted | Delivered by |
|-------|--------------|--------------|
| `benchmark.weekly_snapshot` | Mondays at 00:00 UTC | `/api/cron/benchmark-weekly-snapshot` → enqueues one delivery per active subscriber |
| `webhook.test` | When a node calls `POST /api/webhooks/subscriptions/{id}/test` | Inline (synchronous to the API caller) |

The snapshot payload reflects the subscriber's tier (see [GOVERNANCE.md](./GOVERNANCE.md#contribute-to-access-policy-v01)): tier-2 subscribers get the last 7 days in real time; tier 0/1 subscribers get the 7-day band ending 90 days ago.

---

## Implementer-emitted events (spec only)

These are emitted by individual node implementations from their own runtime. The registry does **not** relay them today — they are documented here so that future work (an `/api/webhooks/emit` mediator) has a stable contract.

| Event | Trigger | Description |
|-------|---------|-------------|
| `service.state_changed` | Any lifecycle transition (§6.1) | Core event — fires on every state change in the 9-state lifecycle |
| `service.exception` | Exception flow entered (§7) | Service enters `cancelled`, `disputed`, `no_show`, `reassigning`, `rescheduling`, or `partial` |
| `payment.received` | Transition to `collected` | Payment confirmed by the billing system |
| `payment.overdue` | Grace period expired | Dunning sequence triggered |
| `dispute.opened` | Transition to `disputed` | Client or provider opens a dispute |
| `dispute.resolved` | Dispute exits `disputed` state | Dispute resolved |
| `mandate.expiring` | Mandate approaches `valid_until` | Agent mandate (§10) will expire within a configurable threshold |
| `evidence.submitted` | Evidence added to a service | New evidence item attached |
| `booking.created`, `booking.confirmed`, `booking.cancelled` | Convenience aliases for common transitions | — |

### When to emit (informative)

A node SHOULD emit when:
- A human (provider, client, admin) triggers a lifecycle transition
- A system process (scheduler, payment gateway, auto-verification) changes state
- A different agent than the subscriber triggers the change

A node SHOULD NOT emit when the subscribing agent itself triggered the transition (avoids feedback loops — the agent already knows).

---

## Envelope (all events)

```json
{
  "event": "benchmark.weekly_snapshot",
  "event_id": "evt_3f9a0c2e-1d7f-4b8c-9a2e-...",
  "emitted_at": "2026-05-19T22:30:00Z",
  "data": { /* event-specific */ }
}
```

| Field | Type | Description |
|---|---|---|
| `event` | string | Event name from the table above |
| `event_id` | string | Unique per event — use for idempotent processing |
| `emitted_at` | datetime | ISO 8601 timestamp of when the event was emitted |
| `data` | object | Event-specific payload |

---

## Subscription API

| Endpoint | Purpose |
|---|---|
| `POST /api/webhooks/subscriptions` | Create. Body: `{ url, subscribed_events[] }`. Returns `{ id, secret, ... }` — **secret is returned only once** |
| `GET /api/webhooks/subscriptions` | List your subscriptions (no secrets, includes health fields) |
| `PATCH /api/webhooks/subscriptions/{id}` | Update `subscribed_events`. Other fields are immutable |
| `DELETE /api/webhooks/subscriptions/{id}` | Soft delete (`active=false`). Idempotent |
| `POST /api/webhooks/subscriptions/{id}/rotate-secret` | Rotate the HMAC secret. Rate-limited 1/min |
| `POST /api/webhooks/subscriptions/{id}/reactivate` | Bring back a deactivated subscription, reset `consecutive_failures` to 0 |
| `POST /api/webhooks/subscriptions/{id}/test` | Enqueue a `webhook.test` event and report the outcome synchronously |
| `GET /api/webhooks/deliveries/{id}` | Poll the state of a delivery by id |

All require header `X-Servicialo-Node-Token: <ownership_token>` (resolved against `registry_entries.ownership_token`). See [GOVERNANCE.md](./GOVERNANCE.md) for how nodes register.

### Validation

- URL must use `https://` (or `http://localhost` / `http://127.0.0.1` for dev)
- `subscribed_events` must be non-empty and every entry must come from `lib/webhooks/events.ts`
- POST with `(node_id, url, events)` matching an existing active subscription → **409 Conflict** with `existing_id`
- Subscriptions belonging to another node → **404** (existence is not leaked)

---

## Delivery semantics

### Headers

Every outgoing POST carries:

```
Content-Type: application/json
User-Agent: Servicialo-Webhooks/0.1
X-Servicialo-Event-Id: evt_<uuid>
X-Servicialo-Event-Type: <event name>
X-Servicialo-Delivery-Id: <uuid>      ← unique to this attempt
X-Servicialo-Timestamp: <iso datetime>
X-Servicialo-Signature: sha256=<hex>
```

### Verifying the signature

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(rawBody: string, header: string, secret: string): boolean {
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const got = header.slice('sha256='.length);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}
```

The HMAC is computed over the **raw request body** — verify before parsing JSON.

### Retry & backoff

| Receiver responds | Action |
|---|---|
| 2xx | `delivered`, reset `consecutive_failures` |
| 410 Gone | `abandoned` + subscription auto-deactivated (subscriber asked out) |
| Other 4xx | `failed`, no retry (the subscriber's bug to fix) |
| 5xx, timeout, network error | retry per schedule below |

Retry schedule: **1 min → 5 min → 30 min**, max **3 attempts**. After that → `abandoned`.

After **3 consecutive abandoned** deliveries for the same subscription → `active=false`, `deactivated_reason='delivery_failures'`. The owner reactivates manually via `POST /reactivate` once they've fixed their endpoint.

The fetch timeout to the subscriber is **10 seconds**.

### Idempotency

Consumers MUST handle duplicate deliveries. The `X-Servicialo-Event-Id` header (also in the JSON body's `event_id`) is unique per event and should be used for deduplication.

### Security

- HTTPS required (loopback exempt for dev)
- HMAC signature over raw body — verify before any further processing
- The shared secret is sent only at subscription creation and after `/rotate-secret`. There is no API that returns an existing secret
- Payloads MUST NOT include sensitive raw data (credentials, tokens, PII) — only bucketed/anonymized values for registry events

---

## Testing your endpoint

```bash
# 1. Create the subscription (save the secret it returns)
curl -X POST https://servicialo.com/api/webhooks/subscriptions \
  -H "X-Servicialo-Node-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://yourservice.example.com/webhook","subscribed_events":["webhook.test"]}'

# 2. Trigger a test delivery — synchronous response with the outcome
curl -X POST https://servicialo.com/api/webhooks/subscriptions/<id>/test \
  -H "X-Servicialo-Node-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"payload":{"hello":"world"}}'

# Response: { "delivery_id": "...", "status": "delivered" | "failed" | "abandoned", ... }

# 3. Inspect any past delivery
curl https://servicialo.com/api/webhooks/deliveries/<delivery_id> \
  -H "X-Servicialo-Node-Token: $TOKEN"
```

For an offline E2E that spins up its own receiver, run [`scripts/verify-webhooks-delivery.mjs`](./scripts/verify-webhooks-delivery.mjs).
