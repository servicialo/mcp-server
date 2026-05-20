# Operational Telemetry — Servicialo

**Status:** v0.1 (early — accepting feedback before freezing the catalog)
**Schema:** [`schema/telemetry/operational-event.schema.json`](../schema/telemetry/operational-event.schema.json)
**Endpoint:** `POST https://servicialo.com/api/telemetry/operational`

---

## Why this exists

Servicialo's seventh principle is *"collective intelligence is a protocol common good"*. Without operational telemetry, the network only knows **how many nodes exist** — not what's happening on them. Operational telemetry is what enables benchmarks like "the median home-cleaning session in CL is 90 minutes" or "the no-show rate for evening kinesiology slots is 18%".

This is the contract every Servicialo-compatible node uses to contribute to that common pool.

---

## What gets emitted, and what does NOT

| ✅ Emitted (bucketed) | ❌ Never emitted |
|---|---|
| Hour-of-day bucket (e.g. `09-12`) | Exact start time |
| Duration bucket (e.g. `30-60min`) | Exact duration |
| Price band (e.g. `25-50k` CLP) | Exact price |
| Outcome (`completed`, `no_show_client`, …) | Provider name, client name |
| Lead-time bucket (e.g. `1-2_weeks`) | Booking ID, session ID |
| Country (ISO-2, e.g. `CL`) | City, region, GPS, IP |
| Vertical (`health`, `legal`, …) | Service name, description |
| `org_fingerprint` (SHA-256 hash) | Org slug, name, URL |

The salt for `org_fingerprint` is a constant in the MCP server package — it's an obfuscation layer (so a database leaker can't trivially map events back to orgs), not an authentication mechanism.

---

## Event catalog (v0.1)

Four event types are supported. Future events must go through an RFC.

### `booking_created`

Emitted when `scheduling.book` succeeds.

```json
{
  "lead_time_bucket": "3-7_days",
  "slot_hour_bucket": "09-12",
  "weekday": 2,
  "channel": "agent"
}
```

### `service_completed`

Emitted when `delivery.checkout` succeeds OR `lifecycle.transition` lands on a terminal state (`Cancelado`, `Inasistencia_*`).

```json
{
  "duration_bucket": "30-60min",
  "outcome": "completed",
  "evidence_completeness": "complete"
}
```

### `dispute_opened`

(Specified but not yet auto-emitted — disputes module is `en diseño`.)

```json
{
  "opened_by": "client",
  "reason_category": "quality",
  "time_to_resolve_bucket": "1-3_days",
  "resolved_in_favor_of": "split"
}
```

### `payment_settled`

Emitted when `payments.record_payment` succeeds.

```json
{
  "price_band": "25-50k",
  "currency": "CLP",
  "payment_method": "transfer",
  "time_to_collect_bucket": "immediate"
}
```

---

## Contributing as an implementer

If you run a Servicialo-compatible platform other than the reference MCP server, you SHOULD emit the same events to enable benchmark inclusion. Two paths:

### Path A — use `@servicialo/mcp-server` as your stdio surface

Set these env vars and the package handles emission automatically:

```bash
SERVICIALO_VERTICAL=health        # required for meaningful aggregation
SERVICIALO_REGION=CL              # ISO 3166-1 alpha-2
SERVICIALO_ORG_ID=your-org-slug   # used to derive org_fingerprint
```

### Path B — emit directly

`POST` to `https://servicialo.com/api/telemetry/operational` with a payload matching the schema. Example:

```bash
curl -X POST https://servicialo.com/api/telemetry/operational \
  -H "Content-Type: application/json" \
  -d '{
    "protocol_version": "0.9",
    "event_type": "booking_created",
    "vertical": "health",
    "region": "CL",
    "occurred_at": "2026-05-19T14:30:00Z",
    "org_fingerprint": "sha256(your-slug + salt)",
    "payload": {
      "lead_time_bucket": "1-2_weeks",
      "slot_hour_bucket": "09-12",
      "weekday": 3,
      "channel": "agent"
    }
  }'
```

Always returns `202 Accepted` (or `400` if the payload doesn't match the schema). Telemetry is best-effort — implementers should treat it as fire-and-forget.

---

## Opt-out

Operational telemetry is on by default in `@servicialo/mcp-server`. To disable for a deploy:

```bash
SERVICIALO_OPERATIONAL_TELEMETRY=false
```

Independent of `SERVICIALO_TELEMETRY` (which controls only the node-init heartbeat). Implementers using Path B are responsible for their own opt-out logic.

---

## Privacy floor: k-anonymity

When the network publishes benchmarks (a future endpoint, not yet live), every aggregate row must satisfy `count_distinct(org_fingerprint) ≥ 5`. Segments below that threshold return `insufficient_data` instead of a value. This is enforced server-side at query time — implementers don't need to worry about it.

---

## Roadmap

- v0.2: schema for benchmark query endpoint (`/api/benchmarks/...`)
- v0.3: webhooks so nodes can subscribe to weekly snapshot pushes
- v0.4: contribute-to-access gating (nodes that don't contribute see only quarterly delayed data)
