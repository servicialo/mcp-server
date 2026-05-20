# Benchmarks API — Servicialo

**Status:** v0.1
**Endpoints:** `GET /api/benchmarks`, `GET /api/benchmarks/segments`
**Tools:** `market.get_benchmark`, `market.list_segments`

---

## What this gives you

The benchmarks API answers questions like:
- *"What fraction of health bookings in CL are made same-day vs 1+ weeks in advance?"*
- *"What's the most common payment method for home services in MX?"*
- *"What share of legal consultations end in `no_show_client` vs `completed`?"*

Because every payload field in operational telemetry is **bucketed** (see [telemetry-operational.md](./telemetry-operational.md)), benchmarks are not numeric percentiles — they're **distributions of buckets** within a segment.

---

## Access tiers (contribute-to-access)

The endpoints are public — anyone can call them — but **the time window they expose depends on whether your node is contributing operational telemetry**. This is the protocol's "no free-riders" rule, implementing Principle #7.

| Tier | Identification | Recent contribution | What you see |
|---|---|---|---|
| **0** | none | — | Window forced to `[now-180d, now-90d]` — i.e., a 90-day band ending 90 days ago |
| **1** | valid token, but < 50 events in 30d | not enough | Same as tier 0 |
| **2** | valid token, ≥ 50 events in 30d | active contributor | Full 90-day window up to "now" |

The decision is computed per request; there is no session state. See [GOVERNANCE.md](../GOVERNANCE.md#contribute-to-access-policy-v01) for the policy in full.

### How to identify your node

Set the `X-Servicialo-Node-Token` header to the `ownership_token` you received when your node was registered in `registry_entries`. With `@servicialo/mcp-server` ≥ v0.10, set `SERVICIALO_NODE_TOKEN` in env and the package will attach the header automatically to every `market.*` call.

```bash
# Tier 2 example (with token + active contribution)
curl https://servicialo.com/api/benchmarks?event_type=service_completed&vertical=health&region=CL \
  -H "X-Servicialo-Node-Token: <your-ownership-token>"
```

### Honest response

Every response includes an `access` block, regardless of tier:

```json
{
  "ok": true,
  "segment": { ... "window_clamped": true },
  "access": {
    "tier": 1,
    "contribution_score": 12,
    "contribution_window_days": 30,
    "delay_days_when_clamped": 90,
    "message": "Your node is identified but has not emitted operational telemetry in the last 30 days. Data is delayed by 90 days. Emit ≥50 events to unlock real-time access."
  },
  ...
}
```

You never have to compare two requests to know what tier you were served under.

---

## Privacy floor: k-anonymity ≥ 5

A segment is `(event_type, vertical, region)` over a time window. **A segment is only published when it has at least 5 distinct `org_fingerprint` values contributing data.**

Below that floor, the API returns:

```json
{
  "ok": false,
  "reason": "insufficient_data",
  "contributors": 2,
  "threshold": 5,
  "segment": { ... },
  "sample_size": 17
}
```

No distribution is exposed. Why 5: small enough to be reachable in low-density verticals, large enough that any single contributor's data is statistically diluted before being readable.

This is enforced at query time — `telemetry_segments_90d` and `/api/benchmarks` both apply the same threshold.

---

## `GET /api/benchmarks/segments`

Lists every segment that satisfies k-anon over the trailing 90 days. Use this to discover what's queryable before issuing a `/api/benchmarks` call.

### Query params (all optional)

| Param | Example | Description |
|---|---|---|
| `event_type` | `service_completed` | Filter to one event type |
| `vertical` | `health` | Filter to one vertical |
| `region` | `CL` | Filter to one ISO-2 region |

### Response

```json
{
  "ok": true,
  "window_days": 90,
  "privacy": { "k_anonymity_threshold": 5 },
  "segments": [
    {
      "event_type": "service_completed",
      "vertical": "health",
      "region": "CL",
      "sample_size": 142,
      "contributors": 8,
      "first_event": "2026-02-22T10:14:33Z",
      "last_event": "2026-05-18T17:42:11Z"
    },
    ...
  ]
}
```

---

## `GET /api/benchmarks`

Returns the bucket distribution of a single segment.

### Query params

| Param | Required | Description |
|---|---|---|
| `event_type` | yes | One of: `booking_created`, `service_completed`, `dispute_opened`, `payment_settled` |
| `vertical` | yes | Lowercase, e.g. `health`, `legal`, `home`, `education` |
| `region` | yes | ISO 3166-1 alpha-2, uppercase, e.g. `CL`, `MX`, `BR` |
| `from` | no | ISO date or datetime; default: 90 days ago |
| `to` | no | ISO date or datetime; default: now |

### Response — sufficient data

```json
{
  "ok": true,
  "segment": {
    "event_type": "service_completed",
    "vertical": "health",
    "region": "CL",
    "from": "2026-02-19T00:00:00.000Z",
    "to": "2026-05-19T23:59:59.999Z"
  },
  "sample_size": 142,
  "contributors": 8,
  "distribution": {
    "duration_bucket": {
      "30-60min": { "count": 85, "share": 0.5986 },
      "60-90min": { "count": 32, "share": 0.2254 },
      "15-30min": { "count": 18, "share": 0.1268 },
      "90-120min": { "count": 7, "share": 0.0493 }
    },
    "outcome": {
      "completed": { "count": 118, "share": 0.831 },
      "no_show_client": { "count": 16, "share": 0.1127 },
      "canceled_late": { "count": 5, "share": 0.0352 },
      "partial": { "count": 3, "share": 0.0211 }
    },
    "evidence_completeness": {
      "complete": { "count": 102, "share": 0.7183 },
      "partial": { "count": 12, "share": 0.0845 },
      "missing": { "count": 4, "share": 0.0282 }
    }
  },
  "privacy": { "k_anonymity_threshold": 5 }
}
```

> **`share` is fraction of `sample_size`, not fraction of buckets-present.** If an event type's field is optional, the shares within that field may sum to less than 1 — the gap represents events that didn't report the field. In the `evidence_completeness` example above, the three values sum to 0.831, meaning ~17% of completed services didn't report this field at all.

### Response — insufficient data

Same shape as the `/segments` case above. Always `200 OK` (it's a valid answer, not an error).

### Validation errors → 400

- `region` not matching `^[A-Z]{2}$`
- `event_type` outside the enum
- Missing required params
- Malformed `from` / `to`

---

## MCP tools

Two public tools wrap the endpoints, available without authentication:

### `market.list_segments`

```jsonc
{
  // all optional
  "event_type": "service_completed",
  "vertical": "health",
  "region": "CL"
}
```

### `market.get_benchmark`

```jsonc
{
  "event_type": "payment_settled",
  "vertical": "health",
  "region": "CL",
  "from": "2026-03-01",   // optional
  "to": "2026-05-19"      // optional
}
```

A well-designed agent calls `market.list_segments` first to discover what exists, then `market.get_benchmark` for the segments it cares about.

---

## Implementation notes

- The 90-day window in `telemetry_segments_90d` is fixed at the SQL view level — custom windows require a different view or an RPC function (not yet built).
- The `/benchmarks` endpoint caps raw row reads at `MAX_ROWS = 10000`. Beyond that, segments would need server-side rollup (an aggregation function or materialized view). Not yet hit in practice.
- Both endpoints cache responses for 60 seconds (`Cache-Control: public, max-age=60`).

---

## Receiving snapshots via webhook (push)

Polling `/api/benchmarks` works for ad-hoc queries. For continuous awareness, subscribe to `benchmark.weekly_snapshot`:

```bash
curl -X POST https://servicialo.com/api/webhooks/subscriptions \
  -H "X-Servicialo-Node-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://yourservice.example.com/webhooks","subscribed_events":["benchmark.weekly_snapshot"]}'
```

Every Monday at 00:00 UTC, the cron computes two snapshots (`realtime` for tier 2 subscribers, `delayed` for tier 0/1) and enqueues one delivery per active subscriber. The retry cron processes them within ~5 minutes. The payload mirrors `/api/benchmarks/segments` plus per-segment distributions; full contract in [WEBHOOKS.md](../WEBHOOKS.md).

A delivery includes the same `access` block as `/api/benchmarks` — the subscriber sees, in band, which tier they were served under and why.

---

## Roadmap (still pending)

- Custom time windows (1d / 7d / 30d / 90d / 365d / custom)
- Cross-segment comparison endpoint
- `/api/webhooks/emit` relay for implementer-emitted events (`booking.*`, `payment.*`)
