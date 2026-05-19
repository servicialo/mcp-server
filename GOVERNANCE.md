# Servicialo Governance

| | |
|---|---|
| **Canonical URL** | `https://servicialo.com/governance` |
| **Version** | 0.9 |
| **License** | Apache-2.0 |

**The orchestration layer for the AI-agent service economy**

This document defines the governance framework for the Servicialo protocol: who stewards it today, how protocol decisions are made, how data is governed, and how the network operates as neutral infrastructure.

---

## Stewardship

Servicialo SpA (Santiago, Chile) is the **initial steward** of the Servicialo Protocol. Stewardship means hosting the canonical specification repository, coordinating the RFC process, and accepting or rejecting protocol changes per the RFC procedure (see [RFC-001](./rfcs/RFC-001-rfc-process-and-deprecation-policy.md)).

The current maintainer acting on behalf of Servicialo SpA is [@francodanioni](https://github.com/francodanioni).

Stewardship is **not ownership**. The protocol is Apache-2.0-licensed, the canonical events and lifecycle are open, and any implementation can build on the spec without permission. Servicialo SpA does not gate adoption, does not run a certification program, and does not collect fees for protocol use.

Coordinalo, the reference implementation, is a separate product. It does not define the protocol unilaterally — protocol changes flow only through the RFC process.

---

## Protocol neutrality

Servicialo is an open protocol, not a product. It defines the common language for scheduling, identity verification, delivery evidence, and financial settlement of professional services. No single company, implementation, or node owns the protocol.

- **Coordinalo** is the reference implementation — not the owner
- Any platform can implement the protocol as a sovereign node
- The protocol is Apache-2.0-licensed and community-governed
- Governance decisions follow the RFC process defined in [RFC-001](./rfcs/RFC-001-rfc-process-and-deprecation-policy.md) and summarized in [CONTRIBUTING.md](./CONTRIBUTING.md)

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

## Decision-making

### Protocol changes

Changes to the Servicialo specification (dimensions, states, principles, extensions) follow the RFC process defined in [RFC-001](./rfcs/RFC-001-rfc-process-and-deprecation-policy.md):

1. Proposal via pull request using [`rfcs/RFC-TEMPLATE.md`](./rfcs/RFC-TEMPLATE.md), assigned the next sequential number.
2. Open comment window — duration depends on RFC type (see RFC-001 §3.2). The maintainer opens or links a GitHub Discussion thread when the RFC enters `Open for Comment`.
3. Final Comment Period — 1 week before decision.
4. The maintainer takes one of four actions: **Accept**, **Reject** (with rationale), **Return to Draft** (with feedback), or extend the comment period.
5. Accepted RFCs are merged into the specification and assigned a target version.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the contribution overview and [RFC-001](./rfcs/RFC-001-rfc-process-and-deprecation-policy.md) for the full RFC procedure.

### Governance evolution

The current governance model is single-maintainer. The long-term goal is to enable broader stewardship as external adoption matures. Concrete evolution depends on the conditions below, not on a fixed schedule:

| Stage | Governance model | Conditions |
|-------|-----------------|------------|
| **Current** | Single maintainer ([@francodanioni](https://github.com/francodanioni)) acting on behalf of Servicialo SpA | — |
| **Contributors group** | Maintainer + active external contributors with review rights | Sustained external contribution to RFCs and review |
| **Multi-stakeholder stewardship** | Shared stewardship across multiple independent implementers | Multiple production implementations and willingness to share governance load |

The pace of evolution is not predetermined. No automatic transition is promised, and any change to this model will itself go through the RFC process.

### Stewardship transition principles

These principles guide how stewardship evolves as the ecosystem matures:

- **Broader stewardship requires active external implementers.** Stewardship widens when there is demonstrated, sustained participation from implementers outside the initial maintainer — not on a calendar trigger.
- **Protocol governance should remain implementation-neutral.** No implementation, including the reference implementation, should be in a position to define protocol semantics outside the RFC process.
- **Operational proof informs RFCs but does not replace them.** Patterns proven in production by reference implementations are valuable input to RFCs but are not, on their own, protocol changes.
- **Future governance changes must themselves be proposed through RFC.** Any modification to this governance document — including stewardship transitions — flows through the same RFC procedure as any other protocol change.

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
