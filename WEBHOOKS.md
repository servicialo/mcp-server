# Servicialo — Webhook Specification (DRAFT)

> **Status:** Draft v0.1 — This is a thin specification for how a Servicialo node should notify external agents of asynchronous state changes. Delivery guarantees are NOT yet defined. See [HTTP_PROFILE.md §2.0](./spec/HTTP_PROFILE.md) for the gap acknowledgment between MCP server-initiated notifications and HTTP webhook delivery.

## When to Emit

A node SHOULD emit a webhook when a **state transition is triggered by a human or system** — not when triggered by the receiving agent itself (to avoid feedback loops).

Specifically, emit when:
- A human (provider, client, admin) triggers a lifecycle transition
- A system process (scheduler, payment gateway, auto-verification) changes state
- A different agent than the subscriber triggers a change

Do NOT emit when:
- The subscribing agent itself triggered the transition (the agent already knows)

## Events

| Event | Trigger | Description |
|-------|---------|-------------|
| `service.state_changed` | Any lifecycle transition (§6.1) | Core event — fires on every state change in the 9-state lifecycle. |
| `service.exception` | Exception flow entered (§7) | Service enters `cancelled`, `disputed`, `no_show`, `reassigning`, `rescheduling`, or `partial`. |
| `payment.received` | Transition to `collected` | Payment confirmed by the billing system. |
| `payment.overdue` | Grace period expired | Dunning sequence triggered — payment not received within contract terms. |
| `dispute.opened` | Transition to `disputed` | Client or provider opens a dispute. |
| `dispute.resolved` | Dispute exits `disputed` state | Dispute resolved — service moves to `verified`, `cancelled`, or `rescheduling`. |
| `mandate.expiring` | Mandate approaches `valid_until` | Agent mandate (§10) will expire within a configurable threshold. |
| `evidence.submitted` | Evidence added to a service | New evidence item attached — useful for agents monitoring verification readiness. |

## Payload Structure

Webhook payloads mirror the transition object defined in PROTOCOL.md §6.1, wrapped in an event envelope:

```json
{
  "event": "service.state_changed",
  "event_id": "evt_abc123",
  "emitted_at": "2026-03-23T14:30:00Z",
  "data": {
    "service_id": "svc_xyz",
    "service_order_id": "ord_456",
    "transition": {
      "from": "completed",
      "to": "documented",
      "at": "2026-03-23T14:29:58Z",
      "by": "prov_789",
      "method": "manual",
      "metadata": {}
    },
    "vertical": "health",
    "organization_id": "org_abc"
  }
}
```

### Envelope Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Event name from the table above. |
| `event_id` | string | Yes | Unique event identifier for idempotency. |
| `emitted_at` | datetime | Yes | ISO 8601 timestamp of when the event was emitted. |
| `data` | object | Yes | Event-specific payload. |
| `data.service_id` | string | Yes | Affected service. |
| `data.service_order_id` | string | No | Parent order, if applicable. |
| `data.transition` | object | Conditional | Transition record (§6.1). Present for state change events. |
| `data.vertical` | string | Yes | Vertical of the affected service. |
| `data.organization_id` | string | Yes | Organization that owns the service. |

## Subscription (Informative)

This spec does NOT define a subscription registration endpoint. Implementations that support webhooks SHOULD:

1. Allow subscribers to register a callback URL and select events
2. Include an `X-Servicialo-Signature` header with HMAC-SHA256 of the payload for verification
3. Support filtering by `vertical`, `organization_id`, and/or `service_order_id`
4. Retry failed deliveries with exponential backoff (implementation-defined)

> **Open question:** Should subscriptions be per-organization, per-agent mandate, or both? This will be resolved in a future version.

## Idempotency

Consumers MUST handle duplicate deliveries. The `event_id` field is unique per event and SHOULD be used for deduplication.

## Security

- Webhook URLs MUST use HTTPS
- Implementations SHOULD sign payloads with a shared secret
- Consumers SHOULD verify signatures before processing
- Payloads MUST NOT include sensitive data (credentials, tokens, PII) — only references (IDs)
