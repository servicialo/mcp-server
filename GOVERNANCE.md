# Servicialo Governance

| | |
|---|---|
| **Canonical URL** | `https://servicialo.com/governance` |
| **Version** | 0.9 |
| **License** | Apache-2.0 |

**The orchestration layer for the AI-agent service economy**

This document defines the governance framework for the Servicialo protocol: how decisions are made, how data is governed, and how the network operates as neutral infrastructure.

---

## Protocol neutrality

Servicialo is an open protocol, not a product. It defines the common language for scheduling, identity verification, delivery evidence, and financial settlement of professional services. No single company, implementation, or node owns the protocol.

- **Coordinalo** is the reference implementation — not the owner
- Any platform can implement the protocol as a sovereign node
- The protocol is Apache-2.0-licensed and community-governed
- Governance decisions follow the RFC process defined in [CONTRIBUTING.md](./CONTRIBUTING.md)

The relationship is analogous to HTTP and Apache/Nginx, or SQL and PostgreSQL/MySQL. Servicialo is the protocol. Implementations are sovereign.

---

## Network narrative

### Every node contributes, every node benefits

Each platform that implements Servicialo generates operational data: scheduling patterns, no-show rates, demand signals, pricing distributions, exception frequencies. In isolation, this data serves only the platform that generated it.

When nodes contribute aggregate, anonymous metrics to the protocol layer, collective intelligence forms. This intelligence — demand patterns, operational benchmarks, vertical-specific insights — flows back to every participating node.

### The Waze parallel

Waze works because every driver is simultaneously a consumer and a contributor. Each driver's GPS data is insignificant alone. But the aggregate — real-time traffic, optimal routes, incident detection — creates value that no single driver could generate. The network gets smarter with every participant. No single driver owns the traffic data.

Servicialo follows the same model:

1. **Each node contributes** anonymous, aggregate operational metrics
2. **The protocol aggregates** across nodes, verticals, and geographies
3. **Collective intelligence improves all nodes** — demand forecasting, pricing benchmarks, operational efficiency metrics
4. **No single implementation captures the value** — the intelligence is a protocol commons

### What flows to the protocol layer

Only aggregate, anonymous metrics. Never individual client, provider, or session data.

| Metric category | Examples | Granularity |
|----------------|----------|-------------|
| **Scheduling** | Booking lead time, no-show rate, reschedule rate | By vertical, region, org size |
| **Delivery** | Completion rate, average duration vs. expected, exception frequency | By vertical, service type |
| **Financial** | Average price by service type, collection rate, dispute rate | By vertical, region |
| **Demand** | Search volume by vertical and geography, unmet demand signals | By vertical, region, time |

### What stays at the node

Everything else. Client records, provider details, session-level data, financial transactions, clinical notes, contracts — all operational data remains under the full sovereignty of each implementation.

---

## Data governance principles

### 1. Network data is a protocol commons

Data contributed to the network belongs to the protocol, not to any implementation. It cannot be captured, resold, licensed, or monopolized by any participant — including the reference implementation.

### 2. Node sovereignty

Each implementation retains full ownership and control of its operational data. Contributing to the network is voluntary. Nodes can stop contributing at any time. Withdrawal removes access to network intelligence (contribute-to-access model).

### 3. Anonymity by design

Individual records never leave a node. Only aggregate metrics — computed locally before transmission — flow to the protocol layer. Minimum segment size of 5 organizations prevents re-identification.

### 4. Symmetric benefit

The contribute-to-access model ensures that no node can free-ride on the network. You receive benchmarks proportional to what you contribute. Larger contributors don't get privileged access — they get the same benchmarks as everyone else.

### 5. Transparent aggregation

The algorithms that aggregate and distribute network intelligence are open source and auditable. No black-box scoring. No hidden ranking. No preferential treatment.

---

## Contribute-to-access policy (v0.1)

This is the operational policy that implements Principle #7 (collective intelligence as a common good) for the benchmarks API. It's deliberately small — there are no premium tiers, no pricing, no per-event credits. The only axis is *whether your node is contributing telemetry to the commons*.

### Tiers

| Tier | Identification | Contribution criterion | What you see |
|------|---------------|-----------------------|--------------|
| **0** | None (anonymous) | — | Benchmarks delayed by 90 days |
| **1** | `X-Servicialo-Node-Token` valid, slug in `registry_entries` | Fewer than 50 operational events in the last 30 days | Benchmarks delayed by 90 days |
| **2** | Same as tier 1 | ≥50 operational events in the last 30 days | Real-time benchmarks (up to "now") |

There is no tier above 2. A high-volume contributor and a node that just barely crossed the threshold see the exact same data — that's principle #4 (symmetric benefit).

### What counts as "an operational event"

Any row in `telemetry_events` whose `org_fingerprint = SHA256(your_slug ‖ salt)`. The four event types defined in the [operational-event schema](./schema/telemetry/operational-event.schema.json):

- `booking_created`
- `service_completed`
- `dispute_opened`
- `payment_settled`

A node emits these automatically when it uses `@servicialo/mcp-server`'s authenticated tools (`scheduling.book`, `delivery.checkout`, `payments.record_payment`, certain `lifecycle.transition` targets). Implementers using Path B (direct emission) can post events themselves.

### How to identify your node

1. Register your node (creates a row in `registry_entries` with an `ownership_token`)
2. Set `SERVICIALO_NODE_TOKEN=<your ownership token>` in your MCP server deploy
3. The token is sent in the `X-Servicialo-Node-Token` header on every market.* call

The token is a long opaque string; it is not a password. Treat it like a webhook signing secret — store in env vars, never commit, rotate if leaked.

### Honest disclosure in responses

Every benchmark response includes an `access` block stating:

- the tier the request was served under
- the contribution score over the last 30 days
- whether the time window was clamped (delayed)
- a message describing how to upgrade if not on tier 2

This is deliberate: a caller should never *discover* they were on a lower tier by comparing two responses. The contract is transparent.

### Why no payment tier

A "pay-for-data" tier would let a deep-pocketed implementer free-ride. The whole point of the commons is that the only currency is contribution. If a vertical needs benchmarks but no one contributes, the answer is to bootstrap contributors (e.g. give them the MCP server pre-configured), not to sell access to fewer contributors' data.

### Future evolution

The thresholds (50 events / 30 days / 90-day delay) are v0.1 numbers and may change as the network grows. Changes go through the RFC process. They will never become *more* restrictive without a deprecation period.

---

## Decision-making

### Protocol changes

Changes to the Servicialo specification (dimensions, states, principles, extensions) follow the RFC process:

1. Proposal via GitHub Issue using the RFC template
2. 14-day open discussion period
3. Review and decision by maintainers
4. Accepted proposals assigned to a version milestone

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full process.

### Governance evolution

The current governance model is single-maintainer. As the ecosystem grows, governance will evolve:

| Stage | Governance model | Trigger |
|-------|-----------------|---------|
| **Current** | Single maintainer ([@fdanioni](https://github.com/fdanioni)) | — |
| **Contributors group** | Maintainer + active contributors with review rights | 3+ active external contributors |
| **Steering committee** | Multi-stakeholder committee with formal voting | 3+ independent implementations |

The goal is decentralized governance that matches the decentralized nature of the protocol.

---

## Implementations

Any platform can implement Servicialo. To be listed as a compatible implementation:

1. Model services using the 8 dimensions
2. Implement the 9 lifecycle states
3. Handle at least 3 of the 6 exception flows
4. Adhere to the 7 core principles
5. Expose an API connectable to the MCP server

Implementations are sovereign nodes. They own their data, their user relationships, and their business model. The protocol ensures interoperability — it does not prescribe how implementations operate internally.

| Implementation | Role | Relationship to protocol |
|---------------|------|--------------------------|
| **Coordinalo** | Reference implementation | First implementation, proves the spec works. Does not own or control the protocol |
| **Future implementations** | Sovereign nodes | Any CRM, platform, or system that implements the spec |

---

## License

Apache-2.0 — Servicialo is an open protocol. This governance document is part of the protocol specification.
