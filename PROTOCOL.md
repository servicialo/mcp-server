# Servicialo Protocol Specification

**The orchestration layer for the AI-agent service economy**

| | |
|---|---|
| **Version** | 0.9 |
| **Date** | 2026-03-20 |
| **Status** | Draft |
| **License** | Apache-2.0 |
| **Canonical URL** | `https://servicialo.com/spec/v0.9` |
| **Schemas** | `https://servicialo.com/schema/` |

---

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## Table of Contents

1.  [Overview](#1-overview)
2.  [Glossary](#2-glossary)
    - 2.1 [Three-Tier Access Model](#21-three-tier-access-model)
-   [Interoperability Channels](#interoperability-channels)
3.  [Protocol Primitives](#3-protocol-primitives)
4.  [Core Entities](#4-core-entities)
5.  [The 8 Dimensions of a Service](#5-the-8-dimensions-of-a-service)
6.  [The 9 Universal States](#6-the-9-universal-states)
7.  [Exception Flows](#7-exception-flows)
8.  [Service Order](#8-service-order)
9.  [Principles](#9-principles)
10. [Delegated Agency Model](#10-delegated-agency-model)
11. [Agent Decision Model](#11-agent-decision-model)
12. [Provider Profile & Discoverable Attributes](#12-provider-profile--discoverable-attributes)
    - 12.8 [Payment Model](#128-payment-model)
13. [MCP Tool Interface](#13-mcp-tool-interface)
    - 13.0 [Phase 0 — DNS Resolution](#130-phase-0--dns-resolution)
    - 13.7 [A2A Interoperability](#137-a2a-interoperability)
    - 13.8 [MCP Streamable HTTP Transport](#138-mcp-streamable-http-transport)
14. [Network Intelligence](#14-network-intelligence)
15. [Extensibility](#15-extensibility)
16. [Implementations](#16-implementations)
17. [Contributing & Versioning](#17-contributing--versioning)

**Appendices**

- [A. Glossary (extended)](#appendix-a-glossary)
- [B. Changelog v0.6 → v0.7 → v0.8 → v0.9](#appendix-b-changelog)
- [C. Scope Reference](#appendix-c-scope-reference)
- [D. Attribute Key Reference](#appendix-d-attribute-key-reference)

---

## 1. Overview

Servicialo is an open protocol that defines the orchestration layer for professional service delivery in the AI-agent service economy. It provides the common language so that scheduling, identity, resource allocation, and financial settlement flow across platforms without silos.

The protocol models the entire value delivery chain: who provides, who receives, who pays, when, where, what evidence proves delivery occurred, and what documentation results. It is designed for two audiences simultaneously:

- **Humans** who design, deliver, and manage professional services.
- **AI agents** that discover, coordinate, verify, and settle services programmatically.

### 1.1 Motivation

Professional services represent a multi-trillion-dollar global market with no universal protocol. Every platform builds its own data model for appointments, payments, and verification. The result: services are siloed, non-interoperable, and invisible to AI agents. Collective intelligence about service delivery never forms because data is trapped in proprietary systems.

Servicialo defines the minimum viable schema for any AI agent to interact with any professional service — regardless of the platform that manages it. The protocol is neutral infrastructure: no single implementation owns it.

### 1.2 Scope and Non-Goals

Servicialo **is**:

- A protocol that defines data contracts for professional service orchestration.
- Stack-agnostic — it prescribes structures, not implementations.
- Designed for cross-platform interoperability.

Servicialo **is not**:

- A scheduling API (though it includes scheduling semantics).
- A payments protocol (though it includes payment states).
- A healthcare standard (though it works for healthcare).
- A platform (platforms implement it).
- Owned by any single company.

---

## 2. Glossary

Terms used throughout this specification. See [Appendix A](#appendix-a-glossary) for the extended glossary.

| Term | Definition |
|------|------------|
| **Service** | The atomic unit of professional service delivery, modeled across 8 dimensions. |
| **Service Order** | A bilateral commercial agreement that groups one or more Services under a defined scope, pricing model, and payment schedule. |
| **ServiceMandate** | An explicit delegation of capability from a human principal to an AI agent. |
| **Provider** | The professional or entity that delivers a service. |
| **Client** | The beneficiary who receives a service. |
| **Payer** | The entity that pays for a service. MAY differ from the client. |
| **Resource** | A physical entity (room, chair, equipment) required for service delivery. |
| **Principal** | The human or organization that issues a ServiceMandate. |
| **Agent** | An AI system that acts on behalf of a principal under a ServiceMandate. |
| **Scope (mandate)** | A `resource:action` capability pair granted within a ServiceMandate. |
| **Visibility** | Discovery level of a protocol object: `public`, `unlisted`, or `private`. |
| **ProviderAttribute** | A typed, origin-tracked descriptor of a provider's identity, capability, or operational profile. |
| **Transition** | A recorded state change in a lifecycle, including actor, method, and timestamp. |
| **Evidence** | A proof-of-delivery artifact (GPS, signature, photo, document, duration). |

### 2.1 Three-Tier Access Model

The protocol organizes all tool and endpoint access into three tiers based on scope and authentication requirements. This model formalizes the security boundary between public resolution, unauthenticated discovery, and authenticated operations.

| Tier | Name | Scope | Auth | Tools |
|:----:|------|-------|------|-------|
| **0** | **Resolver** | Global — no org context | None | `resolve.lookup`, `resolve.search`, `trust.get_score` |
| **1** | **Discovery** | Org-scoped | None | `registry.search`, `registry.get_organization`, `registry.manifest`, `services.list`, `scheduling.check_availability`, `a2a.get_agent_card` |
| **2** | **Authenticated** | Org-scoped | API key + ServiceMandate for agents (§10) | All remaining tools — lifecycle, delivery, payments, resources, mandates, service orders, resolver admin |

**Tier 0** tools operate against the global resolver and require no organizational context. They answer the question: *where is this organization's endpoint?*

**Tier 1** tools operate within an organizational context but do not require authentication. They answer: *what does this organization offer, and when is it available?*

**Tier 2** tools require API credentials (`SERVICIALO_API_KEY` + `SERVICIALO_ORG_ID`). When `actor.type` is `agent`, a valid ServiceMandate (§10) is additionally required. These tools perform mutations and access protected data.

---

## Interoperability Channels

The Servicialo protocol defines two parallel, equivalent interoperability channels: **MCP** (Model Context Protocol) and **HTTP REST**. MCP is the agent-to-platform channel — it enables AI agents to discover, book, and manage services through structured tool calls. HTTP is the platform-to-platform channel — it enables Servicialo-compatible implementations to interoperate via standard REST endpoints. Both channels expose the same protocol semantics, lifecycle states, and validation rules defined in this specification; neither is a subset of the other. The canonical HTTP contract is defined in [`HTTP_PROFILE.md`](./HTTP_PROFILE.md); the MCP tool interface is defined in [§13](#13-mcp-tool-interface).

---

## 3. Protocol Primitives

The protocol defines four coordination primitives that together cover the complete value chain of professional service delivery.

### 3.1 Schedule Coordination

Multi-party availability intersection between provider, client, and physical resource. The protocol defines a 3-variable scheduler, 9 lifecycle states, and 6 exception flows that handle the reality of service delivery — including no-shows, cancellations, rescheduling, and resource conflicts.

### 3.2 Identity Verification

Provider credentials, trust scores computed from delivery history, and explicit separation of client from payer. The protocol models the fact that in most professional services, the person who receives the service is not the person who pays for it.

### 3.3 Financial Settlement

Billing, invoicing, collection, and revenue sharing between provider, organization, and infrastructure. The Service Order ledger provides a computed, real-time view of consumption vs. commitment. Dispute resolution defines algorithmic arbitration for the majority of cases.

### 3.4 Demand Signals

Aggregate, anonymous operational telemetry across network nodes. Each implementation that contributes data receives benchmarks segmented by vertical, region, and scale. The model is contribute-to-access: collective intelligence is a protocol commons, not an asset of any single implementation.

---

## 4. Core Entities

The protocol is built around two objects and their relationship.

**Service** is the atomic unit of delivery. It models a single instance of a professional service through the 8 dimensions defined in [Section 5](#5-the-8-dimensions-of-a-service). A Service MAY exist standalone or within a Service Order.

**Service Order** is the commercial agreement that groups one or more Services under a defined scope, an agreed price, and a payment schedule. It is OPTIONAL — not every Service belongs to an Order.

The key relationship: when a Service belongs to a Service Order, its `billing` dimension is **informative** (it records the economic value of the individual service unit) but **not transactional** (it does not generate an invoice). Invoicing is the exclusive responsibility of the Service Order, which triggers it according to its own payment schedule.

A Service without a Service Order is a valid, complete object.

```
Organization
└── Service Order (OPTIONAL)
    ├── scope: what services, how many, what type
    ├── pricing: how value is calculated
    ├── payment_schedule: when money moves
    └── Services (atomic units)
        └── 8 dimensions each
```

---

## 5. The 8 Dimensions of a Service

Every professional service — from a physical therapy session to a legal consultation — MUST be described across 8 dimensions. These are the minimum fields required for an AI agent to fully understand and coordinate a service.

> When a Service belongs to a Service Order, the `billing` dimension is informative — it records the economic value of the individual service unit. The Service Order determines when and how invoicing occurs.

### 5.1 Identity (What)

The activity or outcome being delivered.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Unique identifier. |
| `service_order_id` | string | OPTIONAL | Reference to a parent Service Order. |
| `type` | string | REQUIRED | Service category (e.g., `physical_therapy_session`, `legal_consultation`). |
| `vertical` | string | REQUIRED | Industry vertical (e.g., `health`, `legal`, `home`, `education`). |
| `name` | string | REQUIRED | Human-readable service name. |
| `duration_minutes` | integer | REQUIRED | Expected duration in minutes. MUST be ≥ 1. |
| `requirements` | string[] | OPTIONAL | Prerequisites for this service. |
| `visibility` | enum | OPTIONAL | `public` \| `unlisted` \| `private`. Default: `public`. See §5.1.1. |

#### 5.1.1 Visibility Semantics

| Value | Discovery | Access |
|-------|-----------|--------|
| `public` | Indexed in catalogs and search results. | Any agent or human can read the service definition. |
| `unlisted` | Not indexed. Accessible only by direct ID. | Any agent or human with the ID can read it. |
| `private` | Not indexed. Not accessible without authorization. | Only authorized parties (mandate context match). |

Visibility controls **discoverability**, not **authorization**. Even for `public` services, performing any action beyond reading the catalog REQUIRES a valid ServiceMandate (§10).

### 5.2 Provider (Who Delivers)

The professional or entity delivering the service.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider.id` | string | REQUIRED | Provider identifier. |
| `provider.credentials` | string[] | OPTIONAL | Required certifications. |
| `provider.trust_score` | number | OPTIONAL | 0–100, calculated from history. |
| `provider.organization_id` | string | REQUIRED | Parent organization. |
| `provider.profile_id` | string | OPTIONAL | Reference to a ProviderProfile (§12). |

### 5.3 Client (Who Receives)

The beneficiary of the service. The payer is explicitly separated from the client.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client.id` | string | REQUIRED | Client (beneficiary) identifier. |
| `client.payer_id` | string | OPTIONAL | Who pays. MAY differ from client — insurance, employer, guardian. |

### 5.4 Schedule (When)

The temporal window for the service.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schedule.requested_at` | datetime | REQUIRED | When the request was made. ISO 8601. |
| `schedule.scheduled_for` | datetime | OPTIONAL | Agreed start time. Set when the service transitions to `scheduled`. |
| `schedule.duration_expected` | integer | OPTIONAL | Expected duration in minutes. |

### 5.5 Location (Where)

Physical or virtual location.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location.type` | enum | OPTIONAL | `in_person` \| `virtual` \| `home_visit`. |
| `location.address` | string | OPTIONAL | Physical address. |
| `location.room` | string | OPTIONAL | Human-readable room label. |
| `location.resource_id` | string | OPTIONAL | Reference to a Resource entity (§5.5.1). |
| `location.coordinates` | object | OPTIONAL | `{ lat: number, lng: number }`. |

#### 5.5.1 Resource (Physical Space or Equipment)

A Resource is a physical entity — a room, a dental chair, a gym court, a therapy box — that a service MAY require for delivery. It is OPTIONAL: virtual sessions, home visits, and services delivered at the client's location have no Resource. When a Resource exists, it is a first-class entity with its own identity, availability calendar, and constraints.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resource.id` | string | REQUIRED | Unique identifier. |
| `resource.organization_id` | string | REQUIRED | Owning organization. |
| `resource.name` | string | REQUIRED | Human-readable name. |
| `resource.type` | string | OPTIONAL | Category: `room`, `box`, `chair`, `equipment`. Default: `room`. |
| `resource.capacity` | integer | OPTIONAL | Max simultaneous sessions. Default: 1. |
| `resource.buffer_minutes` | integer | OPTIONAL | Reset time between uses, in minutes. Default: 0. |
| `resource.equipment` | string[] | OPTIONAL | Available equipment or features. |
| `resource.location` | string | OPTIONAL | Physical location description. |
| `resource.is_active` | boolean | OPTIONAL | Whether bookable. Default: `true`. |
| `resource.rules` | object | OPTIONAL | Extensible business logic constraints. |

**Buffer semantics:** `buffer_minutes` is resource time, not provider time. When computing available slots, the effective occupation of a resource is `session_duration + buffer_minutes`. This is arithmetic, not a business rule, and therefore belongs in the schema rather than in `rules`.

**Capacity semantics:** When `capacity > 1`, the Resource can host multiple simultaneous sessions. The scheduler MUST verify: `current_clients + new_clients ≤ resource.capacity`. A yoga studio with `capacity = 20` and a dental chair with `capacity = 1` use the same logic.

#### 5.5.2 Resource Availability

A Resource has its own recurring availability schedule, independent from provider schedules.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `availability.resource_id` | string | REQUIRED | Parent resource. |
| `availability.day_of_week` | integer | REQUIRED | 0 = Sunday, 6 = Saturday. |
| `availability.start_time` | string | REQUIRED | Start time (HH:mm). |
| `availability.end_time` | string | REQUIRED | End time (HH:mm). |
| `availability.is_available` | boolean | OPTIONAL | Default: `true`. `false` = explicitly blocked. |
| `availability.timezone` | string | OPTIONAL | IANA timezone identifier. |
| `availability.block_order` | integer | OPTIONAL | Block sequence within a day. |

The combination of `resource_id + day_of_week + block_order` MUST be unique.

### 5.6 Lifecycle (States)

Current position in the 9-state lifecycle. See [Section 6](#6-the-9-universal-states).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lifecycle.current_state` | enum | REQUIRED | One of the 9 universal states or exception states. |
| `lifecycle.transitions` | transition[] | OPTIONAL | State change history (audit trail). |
| `lifecycle.exceptions` | exception[] | OPTIONAL | No-shows, disputes, resource conflicts. |

### 5.7 Proof of Delivery (Evidence)

How the service proves it occurred.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `proof.checkin` | datetime | OPTIONAL | When the provider or client checked in. |
| `proof.checkout` | datetime | OPTIONAL | When the session ended. |
| `proof.duration_actual` | integer | OPTIONAL | Actual minutes. Auto-calculated from checkin/checkout. |
| `proof.evidence` | evidence[] | OPTIONAL | Evidence items: GPS, signatures, photos, documents. |

> **Vertical evidence schemas:** Each vertical defines required vs. optional evidence types, exact payload structures, and deterministic resolution rules. See [`schema/evidence/`](./schema/evidence/) — one schema per vertical (health, home, legal, education, consulting) extending the shared [`base.schema.json`](./schema/evidence/base.schema.json).

### 5.8 Billing (Payment)

Financial settlement for the service. Billing has its own status independent from the lifecycle state.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billing.amount` | object | REQUIRED | `{ value: number, currency: string }`. Currency MUST be ISO 4217. |
| `billing.payer` | string | OPTIONAL | Who pays. MAY differ from client. |
| `billing.status` | enum | OPTIONAL | `pending` \| `charged` \| `invoiced` \| `paid` \| `disputed`. |
| `billing.charged_at` | datetime | OPTIONAL | When the charge was applied. |
| `billing.payment_id` | string | OPTIONAL | Linked payment — MAY reference a prepaid package. |
| `billing.tax_document` | string | OPTIONAL | Reference to invoice or receipt if issued. |

**`charged` vs. `paid`:** `charged` means the amount was debited from the client's balance or added to their debt — it always happens 1:1 with a completed session. `paid` means cash was received, and MAY have occurred upstream (prepaid package) or downstream (insurance reimbursement).

---

## 6. The 9 Universal States

Every service passes through the same lifecycle. The 9 states are the minimum required for an AI agent to verify with certainty that a service was requested, delivered, documented, and settled.

```
Requested → Scheduled → Confirmed → In Progress → Completed → Documented → Invoiced → Collected → Verified
```

| # | Key (enum) | Description | Trigger |
|---|------------|-------------|---------|
| 1 | `requested` | Client or agent defines what they need. | Client submits request. |
| 2 | `scheduled` | Time, provider, and location assigned. | System matches availability. |
| 3 | `confirmed` | Both parties acknowledge. | Provider + client confirm. |
| 4 | `in_progress` | Service is being delivered. | Check-in detected. |
| 5 | `completed` | Provider marks delivery complete. | Provider confirms. |
| 6 | `documented` | Record/evidence generated. | Clinical note, report, or evidence filed. |
| 7 | `invoiced` | Tax document issued. | Tax document emitted. |
| 8 | `collected` | Payment received and confirmed. | Payment received and confirmed. |
| 9 | `verified` | Client confirms OK or silence window expires. | Client responds OK, or auto-verified after window. |

### 6.1 State Transition Rules

States MUST be strictly ordered. The 9 universal states MUST NOT be skipped (e.g., a service MUST NOT jump from `scheduled` directly to `documented`). Implementations MAY add intermediate states between the universal states; these intermediate states MUST follow the same forward-only rule. Exception flows (§7) MAY redirect a service out of the happy path at any point.

Each transition MUST record:

```yaml
transition:
  from: string       # Previous state. null for the initial state.
  to: string         # New state.
  at: datetime       # ISO 8601 timestamp.
  by: string         # Who triggered: client ID, provider ID, "system", or agent ID.
  method: enum       # "auto" | "manual" | "agent".
  metadata: object   # Context-specific data.
```

When `method` is `agent`, the `metadata` object MUST include `mandate_id` (§10).

### 6.2 Resource Commitment in Scheduled State

When a session has an assigned Resource, the `scheduled` state implies that three entities are simultaneously committed: the provider, the client(s), and the physical resource. Implementations MUST treat this three-way commitment as atomic: a session is only validly `scheduled` when all three entities have confirmed availability for the time slot.

### 6.3 Verification as Closure

Verification is the closure of the cycle, not a step in the middle. The client cannot meaningfully verify until the service has been documented, invoiced, and collected. Verification that comes before documentation is premature.

### 6.4 Revenue Recognition

What triggers the transition from `completed` to the financial cycle depends on the **revenue recognition method**, which is an attribute of the service or package — not of the session:

| Method | When Revenue Is Recognized |
|--------|----------------------------|
| Per delivery | Each completed session. |
| Percentage of completion | Proportional to treatment progress. |
| Milestones | At defined checkpoints. |

The protocol does not prescribe which method to use. Each implementation resolves this based on its vertical.

### 6.5 Payroll Rule

Implementations that calculate provider compensation MUST read only sessions in `collected` state. Sessions that have not yet reached `collected` are not yet settled facts and MUST NOT count toward payroll.

### 6.6 Billing Status Independence

There is no `paid` state in the lifecycle because payment flow is tracked in `billing.status`, independently from the lifecycle. The lifecycle captures the milestone; `billing.status` captures the flow.

---

## 7. Exception Flows

Exception flows are first-class flows, not edge cases. They happen in 15–30% of all service appointments.

### 7.1 Client No-Show

**Trigger:** Client does not arrive within the grace period.

```
Confirmed → Cancelled (no_show)
```

- The implementation SHOULD charge a penalty per organization policy.
- The provider's time slot SHOULD be freed for reallocation.
- The client's no-show counter SHOULD be incremented.

### 7.2 Provider No-Show

**Trigger:** Provider does not arrive or cancels last-minute.

```
Confirmed → Reassigning → Scheduled (new provider)
```

- The system SHOULD automatically find a replacement provider.
- The client MUST be notified of the change.
- The original provider SHOULD be flagged.

### 7.3 Cancellation

**Trigger:** Either party cancels before delivery.

```
Any pre-delivery state → Cancelled
```

- Cancellation policy MUST be applied based on time remaining.
- Full refund if outside penalty window; partial/no refund within penalty window.

### 7.4 Quality Dispute

**Trigger:** Client disputes quality of a completed service within the dispute window.

```
Completed → Disputed
```

- The charge MUST be frozen — `billing.status` remains `pending` until resolution.
- Additional evidence SHOULD be requested from both parties.
- Resolution: `Collected → Verified` (provider prevails) or `Cancelled` (client prevails, balance restored).

### 7.5 Rescheduling

**Trigger:** Either party needs to change the time, or an assigned resource becomes unavailable.

```
Scheduled/Confirmed → Rescheduling → Scheduled (new time)
```

- The system SHOULD find a compatible time for both parties.
- The same provider SHOULD be maintained when possible.

**Resource conflict variant:** When the trigger is an unavailable resource rather than a party request, the system MUST first search for an alternative resource within the same time slot. If an alternative is found, the session is reassigned without rescheduling — the provider MUST be notified, the client SHOULD be notified only if the change is material. If no alternative is found, the flow proceeds as a standard rescheduling. Resource conflicts MUST be recorded in `lifecycle.exceptions` with type `resource_conflict`.

### 7.6 Partial Delivery

**Trigger:** Service cannot be completed in full.

```
In Progress → Partial
```

- What was delivered MUST be documented.
- The invoice SHOULD be adjusted proportionally.

---

## 8. Service Order

### 8.1 Concept

A Service Order is a bilateral agreement to deliver a set of services under defined commercial terms. Three axes define it completely:

- **Scope** — what services are authorized, how many, of what type.
- **Pricing** — how delivery is valued (fixed, time & materials, rate card, mixed).
- **Payment schedule** — when money moves (upfront, by milestones, periodic, on delivery, custom).

### 8.2 Service Order Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Unique identifier. |
| `organization_id` | string | REQUIRED | Issuing organization. |
| `client_id` | string | REQUIRED | Beneficiary. |
| `payer_id` | string | REQUIRED | Who pays. MAY differ from client. |
| `visibility` | enum | OPTIONAL | `public` \| `unlisted` \| `private`. Default: `private`. |

#### 8.2.1 Scope

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scope.description` | string | REQUIRED | Human-readable scope definition. |
| `scope.service_types` | string[] | REQUIRED | Authorized service types. Minimum 1. |
| `scope.quantity_limit` | integer \| null | OPTIONAL | Maximum services. `null` = unlimited. |
| `scope.hours_limit` | number \| null | OPTIONAL | Maximum hours. `null` = not applicable. |
| `scope.expiry_condition` | string | OPTIONAL | Human-readable completion condition. |

#### 8.2.2 Term

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `term.type` | enum | REQUIRED | `permanent` \| `annual` \| `monthly` \| `per_milestone` \| `per_event`. |
| `term.starts_at` | datetime | REQUIRED | When the order begins. |
| `term.ends_at` | datetime \| null | OPTIONAL | When the order ends. `null` if permanent. |
| `term.auto_renews` | boolean | OPTIONAL | Default: `false`. |
| `term.renewal_notice_days` | integer \| null | OPTIONAL | Days before end to notify. |

#### 8.2.3 Pricing

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pricing.model` | enum | REQUIRED | `fixed` \| `t&m` \| `rate_card` \| `mixed`. |
| `pricing.currency` | string | REQUIRED | ISO 4217 currency code. |
| `pricing.fixed_amount` | number | Conditional | REQUIRED if `model = fixed`. |
| `pricing.rate_card` | array | Conditional | REQUIRED if `model = t&m` or `rate_card`. Each entry: `{ level, billable_rate, cost_rate }`. |

#### 8.2.4 Payment Schedule

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_schedule.type` | enum | REQUIRED | `upfront` \| `milestone` \| `periodic` \| `on_delivery` \| `custom`. |
| `payment_schedule.installments` | array | Conditional | REQUIRED if type = `milestone` or `custom`. Each entry: `{ trigger, amount, percentage, due_days }`. |

#### 8.2.5 Ledger (Read-Only)

The ledger is entirely computed — it is NEVER manually entered. As atomic Services transition to `verified` state, the system automatically updates these fields.

| Field | Type | Description |
|-------|------|-------------|
| `ledger.services_verified` | integer | Count of services in `verified` state. |
| `ledger.hours_consumed` | number | Total hours across verified services. |
| `ledger.amount_consumed` | number | Value consumed at pricing rates. |
| `ledger.amount_billed` | number | Total invoiced to date. |
| `ledger.amount_collected` | number | Total payments received. |
| `ledger.amount_remaining` | number | Authorized scope not yet consumed. |

### 8.3 Service Order Lifecycle

```
draft → proposed → negotiating → active → paused → completed
                                   ↘ cancelled
```

| State | Description |
|-------|-------------|
| `draft` | Created but not sent. Equivalent to a draft quote. |
| `proposed` | Sent to the client, awaiting acceptance. |
| `negotiating` | Active negotiation of terms. |
| `active` | Accepted and in execution. Verified Services feed the ledger. |
| `paused` | Temporarily suspended. |
| `completed` | Scope fulfilled or term expired per defined condition. |
| `cancelled` | Terminated before completion. |

A quote IS a Service Order in pre-active state. There is no separate "quote" object.

---

## 9. Principles

### Principle 1: Every Service Has a Lifecycle

The 9 states are universal. The specifics of each state vary by vertical, but the sequence is invariant.

### Principle 2: Delivery MUST Be Verifiable

If you cannot prove the service occurred, it did not occur. Evidence types include: GPS check-in/checkout, duration tracking, signed clinical notes, photos, and client confirmation. Each vertical defines its own required evidence and resolution rules — see [`schema/evidence/`](./schema/evidence/) for machine-readable schemas per vertical.

### Principle 3: The Payer Is Not Always the Client

The protocol explicitly separates beneficiary, requester, and payer as independent entities.

### Principle 4: Exceptions Are the Rule

No-shows, cancellations, reschedulings, disputes happen in 15–30% of all service appointments. A well-designed service defines what happens when things go wrong.

### Principle 5: A Service Is a Machine-Readable Product

It has a name, price, duration, requirements, and expected outcome. Services that are not productized are invisible to agents. The protocol is designed so that an AI agent can request, verify, and settle a service with the same confidence as a human. Every field is machine-readable. Every state transition is deterministic. Every exception has a defined resolution path.

### Principle 6: The Agreement Is Separate from the Delivery

A Service Order defines *what was agreed*. Atomic Services define *what was delivered*. These are two different objects with two different lifecycles. The ledger on the Service Order is the computed bridge between the two.

### Principle 7: Collective Intelligence Is a Protocol Commons

Every node that implements the protocol contributes operational data to the network. The aggregate intelligence improves all nodes. This intelligence is a commons of the protocol, not an asset of any single implementation.

### 9.8 Evidence Sensitivity Classification

Every evidence envelope MAY include a `data_sensitivity` field that classifies the sensitivity of the payload. When absent, the evidence is treated as `internal`.

| Level | Definition | Implementation obligations |
|-------|-----------|---------------------------|
| `public` | No restrictions. GPS coordinates, duration, before/after photos in non-clinical contexts. | No special handling required. |
| `internal` | Default. Operational data visible to authorized parties (provider + platform). Scheduling evidence, attendance records, checklists. | Standard access control — only parties to the service may access. |
| `confidential` | Business-sensitive or personally identifiable. Signatures, payment references, session notes, student evaluations, meeting minutes, deliverables. | Implementations SHOULD encrypt at rest and limit access to named roles. |
| `restricted` | Clinical, legal, or privileged data subject to regulatory requirements. Clinical records, diagnoses, legal strategies. | Implementations MUST provide: encryption at rest, per-access audit logging, retention policies compliant with applicable regulations, and a data processing agreement with the implementing organization. |

**Default sensitivity by vertical and evidence type:**

| Vertical | Evidence type | Default sensitivity |
|----------|--------------|-------------------|
| Health | `gps_checkin` / `gps_checkout` | `public` |
| Health | `clinical_record` | `restricted` |
| Health | `treatment_adherence` | `confidential` |
| Health | `notes` (when used in health) | `confidential` (minimum) |
| Legal | `meeting_minutes` | `restricted` |
| Legal | `document_delivery` | `confidential` |
| Legal | `billable_hours` | `confidential` |
| Home | `photo_before` / `photo_after` | `public` |
| Home | `completion_checklist` | `internal` |
| Home | `client_signature` | `confidential` |
| Education | `attendance_record` | `internal` |
| Education | `material_delivery` | `internal` |
| Education | `evaluation` | `confidential` |
| Consulting | `approved_deliverable` | `confidential` |
| Consulting | `committee_minutes` | `confidential` |
| Consulting | `billable_hours` | `confidential` |
| Consulting | `milestone_progress` | `confidential` |

**MUST:** Implementations handling `restricted` evidence MUST provide:
1. Encryption at rest using industry-standard algorithms (AES-256 or equivalent)
2. Per-access audit logging (who accessed what, when, from where)
3. A documented retention policy consistent with applicable jurisdiction-specific regulations
4. A data processing agreement (DPA) between the implementing organization and any sub-processors

The protocol does not prescribe specific regulatory frameworks. The `restricted` classification implies compliance with applicable jurisdiction-specific health or legal data regulations (e.g., Ley 20.584 in Chile, HIPAA in the US, LGPD in Brazil, NOM-024 in Mexico, GDPR in the EU).

**MUST NOT:** The `clinical_record` evidence type in the health vertical MUST be classified as `restricted`. Implementations that downgrade this classification are non-compliant with the protocol.

---

## 10. Delegated Agency Model

### 10.1 Motivation

When an AI agent enters a professional service relationship — scheduling appointments, reading records, processing payments — the trust does not transfer automatically. It MUST be explicitly delegated, bounded, and auditable.

The Delegated Agency Model solves a fundamental problem: how does a protocol that treats AI agents as first-class citizens (Principle 5) ensure that those agents never exceed the authority granted to them?

Existing approaches fail in two modes:

1. **API keys as identity.** The agent authenticates as the organization, inheriting all permissions. There is no record of who authorized what, no scope limitation, and no way to revoke a specific delegation without rotating the entire key.
2. **Role-based proxying.** The agent acts "as" a user via impersonation. The audit trail becomes unreliable — accountability collapses.

The Delegated Agency Model introduces a third path: **explicit mandates**. A human principal issues a ServiceMandate that grants an agent specific capabilities, within a defined context, for a bounded duration.

### 10.2 Design Principles

1. **No self-issuance.** An agent MUST NOT create its own mandate. Authority always flows from a human principal.
2. **Deny by default.** An agent with no valid mandate has zero capabilities beyond public discovery (Phase 1 tools). Scopes are additive.
3. **Conflict-of-interest transparency.** The `acting_for` field declares whose interests the agent serves. An agent MUST NOT act for both the provider and the client within the same service interaction.
4. **Audit immutability.** Every action taken under a mandate MUST produce an audit entry. The audit log is append-only and MUST NOT be retroactively modified.
5. **Graceful degradation.** When a mandate expires or is revoked mid-operation, the agent MUST halt, preserve state, and surface the situation to the principal.
6. **Stack agnosticism.** The mandate model defines contracts and validation rules. It does not prescribe storage, transport, or cryptographic mechanisms.

### 10.3 The ServiceMandate

A ServiceMandate is a first-class protocol object that represents the explicit delegation of capability from a human principal to an agent.

#### 10.3.1 Formal Definition

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mandate_id` | string (UUID v4) | REQUIRED | Unique identifier. |
| `principal_id` | string | REQUIRED | The human or organization that issues the mandate. |
| `principal_type` | enum | REQUIRED | `professional` \| `patient` \| `organization`. |
| `agent_id` | string | REQUIRED | The agent that receives the delegation. |
| `agent_name` | string | OPTIONAL | Human-readable label for the agent. |
| `acting_for` | enum | REQUIRED | `professional` \| `patient` \| `organization`. |
| `context` | string | REQUIRED | Scope boundary. Format: `{context_type}:{context_id}`. |
| `scopes` | string[] | REQUIRED | List of granted capabilities (§10.3.2). Minimum 1. |
| `constraints` | object | OPTIONAL | Additional restrictions (§10.3.3). |
| `issued_at` | datetime | REQUIRED | When the mandate was created. ISO 8601. |
| `expires_at` | datetime | REQUIRED | When the mandate ceases to be valid. MUST be after `issued_at`. |
| `revoked_at` | datetime | OPTIONAL | When the principal explicitly revoked the mandate. |
| `revocation_reason` | string | OPTIONAL | Human-readable reason for revocation. |
| `status` | enum | REQUIRED | `active` \| `expired` \| `revoked` \| `suspended`. |
| `metadata` | object | OPTIONAL | Implementation-specific data. The protocol does not interpret this field. |

#### 10.3.2 Scopes

Scopes follow the pattern `{resource}:{action}` and are additive (deny-by-default). An agent MAY only perform actions for which it holds an explicit scope in a valid, active mandate.

See [Appendix C](#appendix-c-scope-reference) for the complete scope reference.

**Scope hierarchy:** There is no implicit hierarchy. `patient:write` does NOT imply `patient:read`. Both MUST be explicitly granted if both are needed.

**Custom scopes:** Implementations MAY define additional scopes prefixed with `x-` (e.g., `x-clinical:prescribe`). Custom scopes MUST follow the `{resource}:{action}` pattern.

#### 10.3.3 Constraints

OPTIONAL additional restrictions that narrow a mandate beyond its scopes. When present, constraints are enforced conjunctively (all constraints MUST be satisfied).

| Constraint | Type | Description |
|------------|------|-------------|
| `max_actions_per_day` | integer | Maximum actions per calendar day. |
| `allowed_hours` | object | Time window: `{ start: "HH:mm", end: "HH:mm", timezone: "IANA" }`. |
| `ip_allowlist` | string[] | Network-level restriction. CIDR notation or IP addresses. |
| `require_confirmation_above` | object | Financial threshold: `{ amount: number, currency: "ISO 4217" }`. |
| `service_types` | string[] | Restrict to specific service types. |

### 10.4 Mandate Lifecycle

```
                ┌──────────────────────────────────┐
                │                                   │
  Principal     │         ┌──────────┐              │
  issues   ─────┤────────►│  active  │              │
  mandate       │         └────┬─────┘              │
                │              │                    │
                │         ┌────┴──────────────┐     │
                │         │                   │     │
                │    time passes         principal  │
                │    (expires_at)        revokes    │
                │         │                   │     │
                │         ▼                   ▼     │
                │    ┌─────────┐       ┌─────────┐  │
                │    │ expired │       │ revoked │  │
                │    └─────────┘       └─────────┘  │
                │                                   │
                │    ┌───────────┐                   │
                │    │ suspended │◄── org admin      │
                │    └─────┬─────┘   or system       │
                │          │                        │
                │     reactivate                    │
                │     or expire                     │
                │          │                        │
                │          ▼                        │
                │    active / expired               │
                └──────────────────────────────────┘
```

#### 10.4.1 Issuance

A mandate is created when a human principal explicitly delegates capability to an agent. Issuance rules:

1. The `principal_id` MUST reference a verified entity in the system.
2. The principal MUST have the authority to grant the requested scopes.
3. The `acting_for` field MUST be consistent with the principal's role.
4. `issued_at` MUST be set to the current timestamp. `expires_at` MUST be in the future.
5. `status` MUST be set to `active`.

An agent MUST NOT issue a mandate for itself or for another agent.

#### 10.4.2 Validation on Use

Every time an agent presents a mandate to perform an action, the implementation MUST validate:

1. **Existence:** The `mandate_id` references a known mandate.
2. **Status:** `status` is `active`.
3. **Temporal validity:** `issued_at ≤ now < expires_at` and `revoked_at` is null.
4. **Agent identity:** The requesting `agent_id` matches the mandate's `agent_id`.
5. **Scope coverage:** The requested action falls within the mandate's `scopes`.
6. **Context match:** The action's context matches the mandate's `context`.
7. **Conflict-of-interest check:** The `acting_for` does not conflict with the other party (§10.5, Rule 4).
8. **Constraints satisfaction:** All applicable constraints are met.

If any check fails, the action MUST be rejected. The rejection MUST be logged in the audit trail.

#### 10.4.3 Expiration

When the current time exceeds `expires_at`, the mandate transitions to `expired`. Implementations SHOULD check temporal validity on every use rather than relying on background expiration jobs.

Multi-step operations MUST re-validate the mandate at each step.

#### 10.4.4 Revocation

A principal MAY revoke a mandate at any time. Revocation takes effect immediately.

- All pending (non-completed) actions MUST be halted.
- The agent MUST be notified (mechanism is implementation-specific).
- Actions already completed are not rolled back.
- The agent MUST surface the revocation to the user.

#### 10.4.5 Suspension

An organizational administrator or system process MAY temporarily suspend a mandate. Suspension is reversible.

- While suspended, the mandate fails validation (same as revoked) but can be reactivated.
- If `expires_at` passes during suspension, the mandate transitions to `expired` and MUST NOT be reactivated.

### 10.5 Normative Validation Rules

Any implementation claiming Servicialo v0.9 compliance MUST enforce these rules:

| Rule | Statement |
|------|-----------|
| **1. No self-issuance** | `principal_id` MUST reference a human entity. `agent_id` MUST NOT equal `principal_id`. |
| **2. Scope minimality** | Implementations SHOULD warn when a mandate is issued with scopes exceeding the agent's known tool requirements. |
| **3. Temporal boundedness** | Every mandate MUST have a finite `expires_at`. The protocol RECOMMENDS ≤ 90 days with renewal. |
| **4. Conflict-of-interest isolation** | Within a single service interaction, an agent MUST NOT hold active mandates with conflicting `acting_for` values. |
| **5. Context confinement** | A mandate with `context: "org:A"` MUST NOT be used for actions on entities belonging to `org:B`. |
| **6. Revocation immediacy** | Revocation takes effect immediately. Implementations MUST NOT cache mandate validity beyond a single atomic operation. |
| **7. Audit completeness** | Every action and every rejection under a mandate MUST produce an audit entry. |
| **8. Graceful degradation on mandate loss** | On mandate expiration or revocation during a multi-step operation, the agent MUST: (a) halt, (b) preserve in-progress state, (c) surface the loss to the human. It MUST NOT retry or escalate permissions. |

### 10.6 Audit Model

#### 10.6.1 Audit Entry Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audit_id` | string (UUID v4) | REQUIRED | Unique identifier. |
| `mandate_id` | string | REQUIRED | Reference to the ServiceMandate. |
| `agent_id` | string | REQUIRED | The agent that performed the action. |
| `principal_id` | string | REQUIRED | The human principal who authorized the mandate. |
| `acting_for` | enum | REQUIRED | Inherited from the mandate. |
| `action` | string | REQUIRED | The action performed (e.g., `scheduling.book`). |
| `action_input` | object | OPTIONAL | Sanitized input parameters. Sensitive fields MUST be redacted. |
| `action_result` | enum | REQUIRED | `success` \| `failure` \| `rejected` \| `halted`. |
| `failure_reason` | string | OPTIONAL | Reason if `action_result` is `failure` or `rejected`. |
| `resource_id` | string | OPTIONAL | The primary resource affected. |
| `context` | string | REQUIRED | Inherited from the mandate. |
| `timestamp` | datetime | REQUIRED | When the action was performed. ISO 8601. |
| `ip_address` | string | OPTIONAL | Source IP. Implementation-specific. |
| `request_id` | string | OPTIONAL | Correlation ID for distributed tracing. |

#### 10.6.2 Audit Requirements

1. **Append-only.** Audit entries MUST NOT be modified or deleted.
2. **Complete attribution.** Every mutating action performed by an agent MUST produce an audit entry.
3. **Queryable by mandate.** Implementations MUST support querying all audit entries for a given `mandate_id`.
4. **Queryable by principal.** Implementations MUST support querying all audit entries across all mandates for a given `principal_id`.
5. **Retention.** The protocol does not define a minimum retention period. Implementations SHOULD follow applicable regulations.

#### 10.6.3 Integration with Lifecycle Transitions

When `transition.method` is `agent`:

- `transition.by` MUST contain the `agent_id`.
- `transition.metadata` MUST include `mandate_id`.
- A corresponding audit entry MUST exist in the mandate audit trail.

This creates a dual audit path: the service lifecycle records *what happened*; the mandate audit trail records *who authorized it*.

### 10.7 Security Considerations

| Threat | Mitigation |
|--------|------------|
| **Mandate theft** | Validation MUST verify `agent_id`, not just `mandate_id`. Implementations SHOULD bind mandates to agent authentication tokens. |
| **Scope escalation** | Scope validation is REQUIRED at the protocol level. No implicit hierarchy. |
| **Principal impersonation** | Mandate issuance MUST occur through an authenticated channel. Agents MUST NOT call the issuance endpoint. |
| **Audit tampering** | Append-only storage is a protocol REQUIREMENT. Implementations SHOULD consider write-once storage or hash chains. |
| **Revocation race conditions** | Re-validation at each step of multi-step operations. Atomic operations that begin before revocation MAY complete. |
| **Cross-context leakage** | Context confinement (Rule 5) is enforced at every action. |

### 10.8 Service Order Mandate Requirements

- **Creating a Service Order** (`order:write`): Requires a mandate from the organization.
- **Proposing a Service Order** (`order:write`): Requires human confirmation regardless of mandate.
- **Activating a Service Order** (`order:write`): Requires client acceptance — the organization's agent MUST NOT accept on behalf of the client.
- **Ledger updates**: Automatic, triggered by service verification.

---

## 11. Agent Decision Model

Not all states are equal from an autonomy perspective. Some transitions are deterministic and safe for an agent to execute alone. Others involve ambiguity, real money, or irreversible consequences that require human confirmation.

The v0.8 update adds one requirement: **every agent action — whether autonomous or requiring human confirmation — MUST be performed under a valid ServiceMandate (§10).**

| Dimension | Determined by |
|-----------|--------------|
| **Can the agent act?** | ServiceMandate (scopes, context, constraints). |
| **Can the agent act autonomously?** | Agent Decision Model (autonomy matrix below). |
| **Is the action recorded?** | Audit Model (always yes for agent actions). |

### 11.1 Autonomy Matrix

| Transition | Agent Autonomous | Requires Human Confirmation |
|---|---|---|
| `requested` → `scheduled` | YES — system matches availability. | — |
| `scheduled` → `confirmed` | YES — if both parties confirmed via registered channel. | If confirmation is ambiguous or missing. |
| `confirmed` → `in_progress` | YES — on check-in detection. | — |
| `in_progress` → `completed` | — | YES — provider MUST mark. |
| `completed` → `documented` | YES — if evidence is auto-captured. | If evidence requires human filing. |
| `documented` → `invoiced` | YES — if billing rules are fully defined. | If pricing requires manual calculation. |
| `invoiced` → `collected` | YES — on payment confirmation from payment system. | — |
| `collected` → `verified` | YES — on client confirmation or after silence window. | — |
| Any → `cancelled` | — | YES — always requires human or explicit client action. |
| Any → `disputed` | — | YES — client MUST initiate. |
| `disputed` → Resolved | — | YES — admin MUST resolve. |
| `confirmed` → Resource Reassigning | YES — if alternative resource available. | If no alternative — escalates. |
| Service Order: `draft` → `proposed` | — | YES — human sends proposal. |
| Service Order: `proposed` → `active` | — | YES — client acceptance required. |
| Service Order: `active` → `paused` | — | YES — human decision. |
| Service Order: ledger update | YES — automatic on service verified. | — |
| Service Order: payment trigger | YES — if trigger condition is deterministic. | If trigger requires judgment. |

### 11.2 The Ambiguity Rule

When a transition falls in the "requires human confirmation" category, the agent MUST pause and surface the ambiguity to a human before proceeding. The agent MUST NOT resolve ambiguity by assumption.

### 11.3 The Irreversibility Rule

Any transition that moves money, generates a legal document, or closes a Service Order is irreversible by default. Agents MUST treat these as requiring explicit human confirmation regardless of how deterministic the trigger appears.

---

## 12. Provider Profile & Discoverable Attributes

### 12.1 Motivation

Professional service marketplaces face a structural information asymmetry: the client knows what they need, but does not know who is best equipped to provide it. AI agents can bridge this gap — but only if provider attributes are structured, machine-readable, and trustworthy.

Provider attributes belong in the protocol — not in each implementation — for the same reason that service lifecycle states do: interoperability. When a patient's agent queries providers across multiple clinics, the attributes MUST be comparable.

### 12.2 ProviderAttribute

A `ProviderAttribute` is the atomic unit of provider description.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attribute_id` | string (UUID v4) | REQUIRED | Unique identifier. |
| `provider_id` | string | REQUIRED | The professional this attribute describes. |
| `category` | enum | REQUIRED | `identity` \| `capability` \| `availability` \| `geography` \| `economic` \| `trust`. |
| `key` | string | REQUIRED | Attribute key within category. See [Appendix D](#appendix-d-attribute-key-reference). |
| `value` | string \| number \| boolean \| string[] \| object | REQUIRED | Attribute value. Type depends on key definition. |
| `origin` | enum | REQUIRED | `declared` \| `verified` \| `inferred`. |
| `confidence` | number (0.0–1.0) | Conditional | REQUIRED for `inferred` attributes. |
| `evidence_count` | integer | OPTIONAL | Number of data points supporting an inference. |
| `verified_by` | string | OPTIONAL | Entity that confirmed a `verified` attribute. |
| `verified_at` | datetime | OPTIONAL | When verification occurred. |
| `visibility` | enum | REQUIRED | `public` \| `unlisted` \| `private`. |
| `valid_from` | datetime | OPTIONAL | When this attribute became valid. |
| `valid_until` | datetime | OPTIONAL | When this attribute expires. `null` = indefinite. |
| `version` | integer | REQUIRED | Monotonically increasing version number. |
| `updated_at` | datetime | REQUIRED | Last modification timestamp. |

#### 12.2.1 Origin Semantics

| Origin | Definition | Weight in Matching |
|--------|------------|-------------------|
| `declared` | The professional stated this attribute. | Base weight (1.0x). |
| `verified` | A trusted authority confirmed this attribute. | High weight (1.5x). |
| `inferred` | Derived from operational data. | Highest weight (2.0x × confidence). |

Inferred attributes carry the highest weight because they reflect what a professional actually does, not what they claim to do.

#### 12.2.2 Versioning

Attributes are versioned, not overwritten. When an attribute changes:

- The `version` field MUST increment.
- The previous version SHOULD be preserved in the attribute history.
- `updated_at` MUST reflect the latest version.

### 12.3 ProviderProfile

A ProviderProfile aggregates all attributes for a provider within an organizational context.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profile_id` | string (UUID v4) | REQUIRED | Unique identifier. |
| `provider_id` | string | REQUIRED | Reference to provider entity. |
| `organization_id` | string | REQUIRED | Context for this profile variant. |
| `display_name` | string | REQUIRED | Human-readable name. |
| `slug` | string | REQUIRED | URL-safe identifier. |
| `attributes` | ProviderAttribute[] | REQUIRED | Array of typed attributes. |
| `created_at` | datetime | REQUIRED | When the profile was created. |
| `updated_at` | datetime | REQUIRED | Last modification. |
| `version` | integer | REQUIRED | Profile-level version. |

A provider who works at multiple organizations MAY have different attribute sets per context.

### 12.4 Base Taxonomy

The base taxonomy defines the minimum attribute set that every Servicialo implementation MUST support. See [Appendix D](#appendix-d-attribute-key-reference) for the complete key reference with types and descriptions.

The six categories are:

| Category | Purpose |
|----------|---------|
| `identity` | Stable, foundational attributes about the professional. |
| `capability` | What the professional can treat/deliver and how. |
| `availability` | How and when the provider can be reached. |
| `geography` | Where the provider operates. |
| `economic` | Pricing, insurance, and payment attributes. |
| `trust` | System-generated operational metrics. Always `origin: "inferred"`. |

**Domain extensions:** Implementations MAY define domain-specific attributes using the `x-{domain}:` prefix (e.g., `x-health:clinical_approach`). Domain extensions MUST follow the ProviderAttribute structure.

### 12.5 Real-Time vs. Static Attributes

| Type | Update Pattern | Examples |
|------|---------------|----------|
| **Static** | Changed by human action. | `profession`, `license_number`, `conditions_treated`. |
| **Real-time** | Updated automatically from operational data. | `avg_wait_days`, `next_available`, `cancellation_rate`. |

#### 12.5.1 Staleness Thresholds

| Attribute | Maximum Staleness |
|-----------|-------------------|
| `next_available` | 5 minutes |
| `avg_wait_days` | 24 hours |
| `cancellation_rate` | 24 hours |
| `rating_avg` | 1 hour |
| `services_completed` | 24 hours |

If an attribute exceeds its staleness threshold, implementations SHOULD either refresh it on demand or exclude it from matching with a staleness flag.

### 12.6 Semantic Matching

#### 12.6.1 Query Model

An agent MAY query the provider directory using structured criteria:

```json
{
  "query": {
    "conditions": ["urinary_incontinence", "pelvic_pain"],
    "population": "postpartum",
    "modality": "in_person",
    "geography": {
      "city": "Santiago",
      "max_distance_km": 10
    },
    "insurance": "fonasa",
    "max_wait_days": 7,
    "language": "es"
  },
  "patient_context": {
    "age": 34,
    "sex": "female",
    "weeks_postpartum": 8
  }
}
```

#### 12.6.2 Scoring Model

The matching engine produces a **compatibility score** for each provider:

```
score = Σ (match_weight × origin_weight × attribute_score)
```

Where:

| Factor | Values |
|--------|--------|
| `match_weight` | conditions (3.0), population (2.5), geography (2.0), availability (1.5), economic (1.0), trust (1.0). |
| `origin_weight` | declared (1.0), verified (1.5), inferred (2.0 × confidence). |
| `attribute_score` | Binary (0/1) for exact matches, continuous (0.0–1.0) for fuzzy/distance-based matches. |

#### 12.6.3 Result Structure

```json
{
  "results": [
    {
      "provider_id": "provider_abc",
      "display_name": "Dr. Example",
      "organization_id": "org_xyz",
      "compatibility_score": 0.92,
      "match_breakdown": {
        "conditions": { "score": 1.0, "origin": "inferred", "confidence": 0.95 },
        "population": { "score": 1.0, "origin": "inferred", "confidence": 0.88 },
        "geography": { "score": 0.85, "origin": "declared", "distance_km": 3.2 },
        "availability": { "score": 0.9, "origin": "inferred", "next_available": "2026-03-12" },
        "insurance": { "score": 1.0, "origin": "declared" },
        "trust": { "score": 0.88, "rating": 4.8, "services_completed": 1247 }
      }
    }
  ],
  "query_metadata": {
    "total_matches": 12,
    "returned": 10,
    "staleness_warnings": []
  }
}
```

#### 12.6.4 Privacy-Aware Matching

| Requester | Attributes Visible | Mandate Required? |
|-----------|-------------------|-------------------|
| Public search (no auth) | `visibility: "public"` only. | No. |
| Agent with `discovery:read` | `public` + `unlisted`. | Yes. |
| Agent with `patient:read` + `discovery:read` | `public` + `unlisted` + `private` (within mandate context). | Yes. |

### 12.7 JSON-LD Serialization

Provider profiles SHOULD be serializable as JSON-LD for search engine indexation. The protocol defines a minimal JSON-LD context that maps provider attributes to Schema.org types:

| Provider Attribute | Schema.org Property |
|-------------------|---------------------|
| `identity.profession` | `@type` |
| `identity.primary_specialty` | `medicalSpecialty` (health vertical) |
| `identity.bio` | `description` |
| `geography.city` | `areaServed` |
| `geography.address` | `address` |
| `geography.coordinates` | `geo` |
| `economic.price_range` | `priceRange` |
| `trust.rating_avg` | `aggregateRating.ratingValue` |
| `trust.rating_count` | `aggregateRating.reviewCount` |

Attributes without a Schema.org equivalent SHOULD be placed under the `servicialo:` namespace.

### 12.8 Payment Model

The protocol defines two payment modes for service settlement. Both modes use the same `billing.status` track (§6.6), which runs independently from the service lifecycle.

#### 12.8.1 Billing Status Track

```
pending → charged → invoiced → paid
                                 ↘ disputed
```

| Status | Meaning |
|--------|---------|
| `pending` | Service completed, no financial action yet. |
| `charged` | Amount debited from client balance or added to their debt. Occurs 1:1 with a completed session. |
| `invoiced` | Tax document (boleta, factura, invoice) emitted. |
| `paid` | Cash received. MAY occur upstream (prepaid package) or downstream (insurance reimbursement). |
| `disputed` | Charge frozen pending resolution (§7.4). |

`charged` and `paid` are distinct events: `charged` means the economic fact is recorded; `paid` means money moved. A prepaid package is `paid` before `charged`. An insurance claim is `charged` before `paid`.

#### 12.8.2 Post-Service Settlement (Default)

The default mode. Payment occurs after service delivery. The flow follows the Phase 6 tools (§13.2.5):

```
completed → documented → invoiced → collected → verified
                          ↑                       ↑
              payments.create_sale    payments.record_payment
```

| Step | Tool | What happens |
|------|------|-------------|
| 1 | `documentation.create` | Generate the service record (clinical note, inspection report, etc.). Moves session to `documented`. |
| 2 | `payments.create_sale` | Create a sale (charge) for the documented service. Moves session to `invoiced`. Requires `client_id`, `service_id`, `provider_id`, and `unit_price`. |
| 3 | `payments.record_payment` | Record payment received against the sale. Accepts `amount`, `method` (cash, transfer, card, etc.), and optional `reference`. |
| 4 | `payments.get_status` | Query payment status by `sale_id` (single sale) or `client_id` (full account history). |

#### 12.8.3 Prepayment Checkout

Some services require payment before the appointment occurs. The prepayment flow is triggered when the service or organization manifest indicates prepayment is required, or when a booking attempt returns HTTP `402 Payment Required`.

The checkout flow uses REST endpoints (not MCP tools) because it involves client-facing payment UIs:

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /{org}/checkout` | Create a PaymentIntent for the service. Returns a payment link with a 15-minute expiry. |
| 2 | Client pays | Client completes payment via the payment link (external to the protocol). |
| 3 | `GET /{org}/checkout/{id}` | Poll payment status. Returns `pending`, `completed`, or `expired`. |
| 4 | `scheduling.book` with `paymentIntentId` | Once payment is confirmed, complete the booking with the payment reference. The session starts in `requested` state with `billing.status = paid`. |

**Prepayment vs. post-service:** When a service is prepaid, `billing.status` is `paid` from the moment the session is created. The lifecycle states still proceed normally — the session must still be delivered, documented, and verified. Prepayment settles the financial obligation; it does not skip the delivery obligation.

#### 12.8.4 Payment Mode Discovery

Agents SHOULD determine the payment mode before attempting to book:

1. **Manifest flag:** The organization manifest (via `registry.manifest`) MAY include a `requires_prepayment` field per service.
2. **402 response:** A `scheduling.book` call that returns HTTP `402` indicates prepayment is required. The response body SHOULD include the checkout endpoint URL.

Implementations MUST support at least the post-service settlement mode. Prepayment checkout is OPTIONAL.

**Cross-references:** Phase 6 tools (§13.2.5), Genesis Skill 4 — Prepayment Checkout (§13.6).

---

## 13. MCP Tool Interface

Servicialo exposes its tools as a Model Context Protocol (MCP) server, enabling AI agents to discover and coordinate professional services natively.

### 13.0 Phase 0 — DNS Resolution

Phase 0 operates at the **resolver** level — global scope, no organizational context required. It answers the fundamental question: *given an organization slug, where is its Servicialo-compatible endpoint?*

Resolution is the entry point of the protocol. An agent that does not know which organization to contact starts here. The resolver maintains a global registry of organization endpoints, trust scores, and health status.

#### 13.0.1 Public Resolution Tools (Tier 0)

These tools require no authentication and no organizational context.

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `resolve.lookup` | Resolve an `orgSlug` to its MCP/REST endpoint and trust level. Equivalent to a DNS A-record lookup. | None. |
| `resolve.search` | Search the global resolver for organizations by country and vertical. | None. |
| `trust.get_score` | Get the trust score (0–100), trust level, and last activity timestamp for an organization. | None. |

**Schema reference:** [`schema/resolution.schema.json`](./schema/resolution.schema.json) defines the resolution record structure. [`schema/servicialo-config.schema.json`](./schema/servicialo-config.schema.json) defines the per-organization configuration discovered via resolution.

#### 13.0.2 Resolver Administration Tools (Tier 2)

These tools require authentication and modify the resolver's global registry.

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `resolve.register` | Register an organization in the global resolver with its MCP and REST endpoints. | `resolve:write`. |
| `resolve.update_endpoint` | Update the registered endpoints for an organization (portability). | `resolve:write`. |
| `telemetry.heartbeat` | Send a heartbeat to the resolver indicating the organization's node is alive and healthy. | `telemetry:write`. |

Resolver administration enables **portability**: an organization can migrate between Servicialo-compatible backends without losing its identity in the resolver. The `resolve.update_endpoint` tool updates the endpoint mapping without re-registration.

### 13.1 Discovery Mode (No Credentials)

Four public tools are available without authentication. These tools do not require a ServiceMandate.

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `registry.search` | Search organizations by vertical and location. | None. |
| `registry.get_organization` | Public details of an organization. | None. |
| `registry.manifest` | Server manifest: capabilities, protocol version, organization metadata. | None. |
| `scheduling.check_availability` | Check available time slots. | None. |
| `services.list` | Public service catalog. | None. |

#### 13.1.1 `scheduling.check_availability` — Availability Modes

The availability tool supports three modes, determined by the combination of input parameters. This allows implementations to start with provider-only scheduling and add Resource infrastructure incrementally.

**Input parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service_id` | string | REQUIRED | Service to check availability for. |
| `provider_id` | string | CONDITIONAL | Provider identifier. Required for Mode A and Mode C. |
| `resource_id` | string | CONDITIONAL | Resource identifier (§5.5.1). Required for Mode B and Mode C. |
| `date_from` | string | REQUIRED | Start of date range (ISO 8601 date). |
| `date_to` | string | REQUIRED | End of date range (ISO 8601 date). |
| `duration_minutes` | integer | OPTIONAL | Requested slot duration. Defaults to the service's `duration_minutes`. |

**Mode resolution:**

| Mode | Condition | Logic |
|------|-----------|-------|
| **A — Provider only** | `provider_id` present, `resource_id` absent. | Return slots where provider has no confirmed services. No Resource infrastructure required. |
| **B — Resource only** | `resource_id` present, `provider_id` absent. | Return slots where resource is unbooked, respecting `capacity` and `buffer_minutes`. |
| **C — Provider + Resource** | Both `provider_id` and `resource_id` present. | Return intersection of provider availability and resource availability. |

When neither `provider_id` nor `resource_id` is provided, implementations MUST return an error with code `missing_availability_target`.

**Mode A** is the documented default for getting-started scenarios. It requires zero Resource infrastructure and is sufficient for solo practices, freelancers, and any provider without shared physical resources.

**Response schema (all modes):**

```json
{
  "service_id": "string",
  "mode": "provider_only | resource_only | provider_and_resource",
  "provider": {
    "id": "string",
    "credentials": ["string"]
  },
  "resource": {
    "id": "string",
    "name": "string"
  },
  "slots": [
    {
      "date": "string (ISO 8601 date)",
      "start": "string (HH:mm)",
      "end": "string (HH:mm)",
      "confidence_score": "number (0.0–1.0)"
    }
  ],
  "conflict_resolution": {
    "type": "none | provider_available_resource_unavailable | resource_available_provider_unavailable",
    "message": "string"
  }
}
```

- The `provider` object is present in modes A and C; absent in mode B.
- The `resource` object is present in modes B and C; absent in mode A.
- `conflict_resolution` is only populated in mode C when partial availability exists.

**`confidence_score` semantics:**

| Mode | Score | Rationale |
|------|-------|-----------|
| C — Provider + Resource | `1.0` | Both calendars verified; no unknown conflicts. |
| A — Provider only | `0.9` | Provider verified; resource conflicts possible but unknown. |
| B — Resource only | `0.8` | Resource verified; provider conflicts possible but unknown. |

Implementations MAY adjust scores based on additional signals (e.g., historical no-show rates), but MUST NOT exceed the mode ceiling.

**`conflict_resolution` field:**

In mode C, when provider and resource availability do not fully overlap, the response SHOULD include a `conflict_resolution` object describing the mismatch:

| `type` | Description | Recommended action |
|--------|-------------|-------------------|
| `none` | Full overlap; no conflicts. | Proceed normally. |
| `provider_available_resource_unavailable` | Provider has slots but resource is booked. | Suggest alternative resources or dates. |
| `resource_available_provider_unavailable` | Resource is free but provider is busy. | Suggest alternative providers or dates. |

In modes A and B, `conflict_resolution.type` MUST be `none`.

**Reference implementation (Coordinalo):** Implements all three modes. Mode A is the default for organizations that have not configured Resource entities. When an organization creates its first Resource, Coordinalo prompts to associate it with existing services but does not retroactively change the availability mode for existing bookings.

### 13.2 Authenticated Mode

All authenticated tools require API credentials. Tools that mutate state require a valid ServiceMandate when `actor.type` is `agent`.

#### 13.2.1 Phase 2 — Understanding

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `service.get` | Full details of a service. | `service:read`. |
| `contract.get` | Get contractual terms. | `service:read` or `order:read`. |

#### 13.2.2 Phase 3 — Commitment

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `clients.get_or_create` | Find or register a client. | `patient:write`. |
| `scheduling.book` | Book a service appointment. | `schedule:write`. |
| `scheduling.confirm` | Confirm a booking. | `schedule:write`. |

#### 13.2.3 Phase 4 — Lifecycle

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `lifecycle.get_state` | Current lifecycle state. | `service:read`. |
| `lifecycle.transition` | Advance lifecycle state. | `service:write`. |
| `scheduling.reschedule` | Reschedule an appointment. | `schedule:write`. |
| `scheduling.cancel` | Cancel an appointment. | `schedule:write`. |

#### 13.2.4 Phase 5 — Delivery Verification

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `delivery.checkin` | Record check-in. | `evidence:write`. |
| `delivery.checkout` | Record check-out. | `evidence:write`. |
| `delivery.record_evidence` | Submit proof-of-delivery. | `evidence:write`. |

#### 13.2.5 Phase 6 — Closing

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `documentation.create` | Create documentation. | `document:write`. |
| `payments.create_sale` | Create a sale/invoice. | `payment:write`. |
| `payments.record_payment` | Record a payment. | `payment:write`. |
| `payments.get_status` | Get payment status. | `payment:read`. |

#### 13.2.6 Service Order Tools

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `service_orders.list` | List Service Orders. | `order:read`. |
| `service_orders.get` | Get full Service Order details. | `order:read`. |
| `service_orders.create` | Create a Service Order (draft). | `order:write`. |
| `service_orders.propose` | Transition draft → proposed. | `order:write`. |
| `service_orders.activate` | Transition proposed → active. | `order:write`. |
| `service_orders.get_ledger` | Real-time ledger. | `order:read`. |

#### 13.2.7 Mandate Management Tools

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `mandates.list` | List mandates issued by this principal. | `mandate:read`. |
| `mandates.get` | Get mandate details. | `mandate:read`. |
| `mandates.suspend` | Suspend a mandate. | `mandate:admin`. |

#### 13.2.8 Resource Management

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `resource.list` | List resources by organization. | `resource:read`. |
| `resource.get` | Get resource details with availability slots. | `resource:read`. |
| `resource.create` | Create a physical resource. | `resource:write`. |
| `resource.update` | Partial update (patch semantics). | `resource:write`. |
| `resource.delete` | Soft delete (set `is_active = false`). | `resource:write`. |
| `resource.get_availability` | Available slots for a date range (no service_id required). | `resource:read`. |

### 13.3 Actor Parameter

All authenticated tools accept an `actor` parameter:

```json
{
  "actor": {
    "type": "agent",
    "id": "agent_scheduler_01",
    "mandate_id": "mdt_01JAXYZ...",
    "on_behalf_of": {
      "type": "professional",
      "id": "provider_abc"
    }
  }
}
```

When `actor.type` is `agent`, the `mandate_id` field is REQUIRED. The MCP server MUST validate the mandate (§10.4.2) before executing the tool and MUST produce an audit entry (§10.6) regardless of success or failure.

When `actor.type` is `client`, `provider`, or `organization`, the actor operates under direct authentication and mandate validation is not performed.

### 13.4 Package

- **npm:** `@servicialo/mcp-server`
- **Canonical:** `https://github.com/servicialo/mcp-server`

### 13.5 Bookings Lookup

Implementations SHOULD expose a public endpoint for querying existing appointments by client email. This enables AI agents to manage appointments without requiring a prior `session_id`.

**HTTP binding:**

```
GET /api/servicialo/{orgSlug}/bookings?email={email}&status={status}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | REQUIRED | Client email address. |
| `status` | string | OPTIONAL | Filter: `upcoming` (default), `past`, or `all`. |

**Response schema:**

```json
{
  "bookings": [
    {
      "session_id": "string",
      "servicialo_state": "string (one of the 9 universal states)",
      "service": { "name": "string", "vertical": "string" },
      "provider": { "name": "string" },
      "scheduled_for": "string (ISO 8601 datetime)",
      "duration_minutes": "integer"
    }
  ]
}
```

**Constraints:**

- Results MUST be limited to a maximum of 10 entries per request.
- The endpoint MUST NOT require authentication.
- Implementations MAY add rate limiting to prevent enumeration attacks.
- The `servicialo_state` field MUST use the canonical state names defined in §6.

**Use cases:** An AI agent can query this endpoint to list a client's upcoming appointments, then use the returned `session_id` to cancel (`scheduling.cancel`), reschedule (`scheduling.reschedule`), or check detailed status (`lifecycle.get_state`).

### 13.6 Reference Agent Skills (Genesis)

A compliant implementation SHOULD support the following five agent skills, which together cover the complete client-facing service lifecycle. These skills are demonstrated by the reference implementation (Coordinalo) through its **Genesis** skill.

| # | Skill | Description | Primary Tools / Endpoints |
|---|-------|-------------|--------------------------|
| 1 | **Schedule new appointment** | Full booking flow: manifest → availability (single-day, next-N, window) → confirmation → booking. Automatic 402 handling triggers Skill 4. | `services.list`, `scheduling.check_availability`, `scheduling.book` |
| 2 | **Manage existing appointments** | Lookup by email → display list → user chooses: view detailed status, cancel (with cancellation policy evaluation), or reschedule (check availability → new date → confirm). | Bookings Lookup (§13.5), `lifecycle.get_state`, `scheduling.cancel`, `scheduling.reschedule` |
| 3 | **Multi-org discovery** | When the user has no predefined org: registry search by vertical/location → display options → explore service catalog → flow into Skill 1. | `registry.search`, `registry.get_organization`, `services.list` |
| 4 | **Prepayment checkout** | Activated automatically when the service requires prepayment (402 response or manifest flag). Creates checkout → delivers payment link (15 min expiry) → polls status → completes booking with `paymentIntentId`. | `POST /{org}/checkout`, `GET /{org}/checkout/{id}`, `scheduling.book` |
| 5 | **Post-session follow-up** | Confirm attendance, view order/package progress (total sessions vs completed vs pending, amount consumed), bilateral delivery confirmation. | `lifecycle.get_state`, `delivery.checkin`, `delivery.checkout`, `service_orders.get_ledger` |

**Design principle:** The value of implementing Servicialo is that an implementor gets a complete AI assistant covering the full service lifecycle — not just booking, but discovery, management, payment, and verification. These five skills represent the minimum viable agent experience.

### 13.7 A2A Interoperability

Servicialo supports [A2A (Agent-to-Agent)](https://a2a-protocol.org/) as an optional interoperability channel, enabling external agent frameworks (Google ADK, Salesforce Agentforce, LangGraph, etc.) to discover and interact with Servicialo-compatible organizations without using MCP.

#### 13.7.1 Agent Card Discovery

| Tool | Description | Required Scopes |
|------|-------------|-----------------|
| `a2a.get_agent_card` | Returns the A2A-compliant Agent Card for an organization, describing its booking capabilities, supported skills, and authentication requirements. | None (Tier 1 — Discovery). |

The Agent Card follows the [A2A Agent Card specification](https://a2a-protocol.org/) and is served at the well-known path `/.well-known/agent.json` for each organization. It includes:

- Agent name, description, and provider metadata.
- Supported skills (mapped from the organization's service catalog).
- Authentication schemes accepted.
- JSON-RPC endpoint for task submission.

#### 13.7.2 JSON-RPC Bridge

External agents interact with Servicialo organizations via the A2A JSON-RPC protocol. The bridge translates A2A task lifecycle (`submitted → working → completed`) to Servicialo lifecycle states (§6). Implementations that expose A2A MUST maintain semantic equivalence with the MCP tool interface — A2A is a transport, not a different protocol.

**Reference:** [`docs/a2a-interoperability.md`](./docs/a2a-interoperability.md)

### 13.8 MCP Streamable HTTP Transport

The MCP server supports two transport mechanisms:

| Transport | Use Case | Specification |
|-----------|----------|---------------|
| **stdio** | Local agent processes, CLI tools, development. | MCP Specification — stdio transport. |
| **Streamable HTTP** | Remote agents, web-based clients, server-to-server. | MCP Specification — Streamable HTTP transport. |

Streamable HTTP enables remote agents to connect to a Servicialo MCP server over HTTP without requiring a local process. The server exposes a single HTTP endpoint that accepts JSON-RPC messages and returns responses via server-sent events (SSE) for streaming or direct JSON for request-response patterns.

Both transports expose identical tool sets and follow the same access model (§2.1). The transport choice does not affect protocol semantics.

**HTTP contract reference:** [`spec/HTTP_PROFILE.md`](./spec/HTTP_PROFILE.md) defines the canonical REST endpoints. [`spec/openapi.yaml`](./spec/openapi.yaml) provides the OpenAPI 3.1 specification.

---

## 14. Network Intelligence

> **Status:** Design phase. Not yet implemented.

### 14.1 The Network Effect

Every node that implements Servicialo generates operational data: scheduling patterns, no-show rates, pricing distributions, demand signals by vertical and geography. Aggregated across the network, this data becomes collective intelligence.

### 14.2 Contribute-to-Access Model

Organizations contribute monthly snapshots of anonymous, aggregate operational metrics. In return, they receive benchmarks segmented by vertical, region, and scale.

- Everything is anonymous and aggregated.
- Individual client, provider, or session data is NEVER shared.
- Minimum segment size is 5 organizations to prevent re-identification.

### 14.3 Data Governance

The data contributed to the network is governed by the protocol, not by any single implementation.

- Network data is a protocol commons — no implementation can capture, resell, or monopolize it.
- Implementations retain full sovereignty over their operational data.
- Only aggregate, anonymous metrics flow to the protocol layer.

---

## 15. Extensibility

### 15.1 Extending the Service Dimensions

Implementations MAY add fields to any dimension. Additional fields MUST NOT conflict with protocol-defined field names. The protocol RECOMMENDS namespacing extensions with `x-{domain}:` prefix.

### 15.2 Intermediate States

Implementations MAY add states between the 9 universal states. Intermediate states MUST follow the same forward-only rule. Intermediate states MUST NOT replace or skip any of the 9 universal states.

### 15.3 Custom Scopes

Implementations MAY define additional scopes prefixed with `x-` (e.g., `x-clinical:prescribe`). Custom scopes MUST follow the `{resource}:{action}` pattern.

### 15.4 Domain-Specific Attributes

Implementations MAY define domain-specific attribute categories for the Provider Profile using the `x-{domain}:` prefix. Domain extensions MUST follow the `ProviderAttribute` structure (§12.2).

### 15.5 Backward Compatibility

When extending the protocol:

- REQUIRED fields in the protocol MUST NOT be removed.
- New REQUIRED fields MUST NOT be added to existing objects without a major version increment.
- OPTIONAL fields MAY be added in minor version increments.
- Implementations MUST ignore unrecognized fields rather than rejecting them.

---

## 16. Implementations

Any platform can implement the Servicialo specification. To be listed as a compatible implementation, a platform MUST:

1. Model services using the 8 dimensions (§5).
2. Implement the 9 lifecycle states (§6).
3. Handle at least 3 exception flows (§7).
4. Expose an API that an MCP server can connect to.
5. (OPTIONAL) Model Service Orders using the schema in §8.
6. (OPTIONAL) Implement the Delegated Agency Model (§10).
7. (OPTIONAL) Implement Provider Profiles (§12).
8. (OPTIONAL) Contribute to Network Intelligence (§14).

### Reference Implementation

| Platform | Vertical | Status |
|----------|----------|--------|
| Coordinalo | Healthcare | Live |

---

## 17. Contributing & Versioning

### 17.1 Contributing

Servicialo is an open protocol. Contributions are welcome:

- **Protocol design:** Open an issue to propose changes to dimensions, states, or principles.
- **Implementations:** Build a compatible platform and submit for listing.
- **Translations:** The protocol spec is in English; implementations serve global markets.

### 17.2 Versioning

The protocol follows semantic versioning:

- **Patch (0.8.x):** Clarifications, typo fixes, examples.
- **Minor (0.x.0):** New OPTIONAL fields, new exception flows, extensions.
- **Major (x.0.0):** Breaking changes to REQUIRED fields or state model.

The protocol version is independent from the MCP server package version.

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Agent** | An AI system that acts on behalf of a human principal within the Servicialo protocol. Agents operate under ServiceMandates and produce audit entries for every action. |
| **Autonomy matrix** | The decision table (§11.1) that defines which lifecycle transitions an agent MAY perform autonomously and which REQUIRE human confirmation. |
| **Billing status** | An independent status track (`pending` → `charged` → `invoiced` → `paid` → `disputed`) that runs parallel to the lifecycle states. |
| **Buffer minutes** | The reset/cleaning time a Resource requires between uses. Expressed in minutes. Scheduler arithmetic, not a business rule. |
| **Capacity** | The maximum number of simultaneous sessions a Resource can host. |
| **Client** | The beneficiary who receives a service. Explicitly separated from the payer. |
| **Constraint** | An OPTIONAL restriction on a ServiceMandate (time window, daily limit, financial threshold, service type filter). Enforced conjunctively. |
| **Context** | The organizational or personal boundary of a ServiceMandate. Format: `{type}:{id}` (e.g., `org:clinic_a`, `personal:maria`). |
| **Evidence** | A proof-of-delivery artifact. Types: `gps`, `signature`, `photo`, `document`, `duration`, `notes`. |
| **Exception flow** | A defined protocol path for handling deviations from the happy path: no-shows, cancellations, disputes, rescheduling, partial delivery, resource conflicts. |
| **Ledger** | The read-only, system-computed summary on a Service Order that tracks consumption vs. commitment. |
| **Mandate** | See ServiceMandate. |
| **MCP** | Model Context Protocol. The interface through which AI agents interact with Servicialo tools. |
| **Origin** | The provenance of a ProviderAttribute: `declared` (self-reported), `verified` (third-party confirmed), or `inferred` (derived from operational data). |
| **Payer** | The entity that pays for a service. MAY differ from the client (insurance, employer, guardian). |
| **Principal** | The human or organization that issues a ServiceMandate. Authority always originates from a human. |
| **Provider** | The professional or entity that delivers a service. |
| **ProviderAttribute** | A typed, origin-tracked descriptor of a provider's identity, capability, or operational profile. |
| **ProviderProfile** | An aggregation of ProviderAttributes for a provider within a specific organizational context. |
| **Resource** | A physical entity (room, chair, equipment) required for service delivery. Has its own availability calendar. |
| **Scope (mandate)** | A `resource:action` capability pair granted within a ServiceMandate. Additive, deny-by-default. |
| **Scope (order)** | The set of services authorized under a Service Order (types, quantity limits, hour limits). |
| **Service** | The atomic unit of professional service delivery, modeled across 8 dimensions. |
| **Service Order** | A bilateral commercial agreement grouping one or more Services under scope, pricing, and payment terms. |
| **ServiceMandate** | A first-class protocol object representing the explicit delegation of capability from a human principal to an AI agent. |
| **Transition** | A recorded state change in a lifecycle. Includes: `from`, `to`, `at`, `by`, `method`, and `metadata`. |
| **Trust score** | A 0–100 numeric score calculated from a provider's delivery history. |
| **Vertical** | Industry classification: `health`, `legal`, `home`, `education`, etc. |
| **Visibility** | Discovery level: `public` (indexed), `unlisted` (direct ID only), `private` (authorized parties only). |

---

## Appendix B: Changelog

### v0.9 (2026-03-20)

- **Three-Tier Access Model (§2.1).** Formalized the three access tiers: Tier 0 (Resolver — global, no auth), Tier 1 (Discovery — org-scoped, no auth), and Tier 2 (Authenticated — org-scoped, API key + mandate for agents).
- **Phase 0 — DNS Resolution (§13.0).** Documented 6 resolver tools: 3 public (`resolve.lookup`, `resolve.search`, `trust.get_score`) and 3 authenticated (`resolve.register`, `resolve.update_endpoint`, `telemetry.heartbeat`). Cross-references `resolution.schema.json` and `servicialo-config.schema.json`.
- **`registry.manifest` added to Discovery (§13.1).** Documents the server manifest tool for capabilities and version discovery.
- **A2A Interoperability (§13.7).** Formalized `a2a.get_agent_card` as a Tier 1 discovery tool and documented the JSON-RPC bridge for external agent frameworks.
- **MCP Streamable HTTP Transport (§13.8).** Documented stdio and Streamable HTTP as dual transport mechanisms. References `spec/HTTP_PROFILE.md` and `spec/openapi.yaml`.
- **Payment Model (§12.8).** Formalized two payment modes: post-service settlement (default) and prepayment checkout. Documents billing status track, the 4 payment tools, and the checkout REST endpoint pattern.
- **New scopes.** Added `resolve:write` (resolver administration) and `telemetry:write` (heartbeat/health).

### v0.8.1 (2026-03-16)

- **Bookings Lookup (§13.5).** New protocol-level endpoint for querying existing appointments by client email. Enables AI agents to manage appointments without requiring a prior `session_id`.
- **Reference Agent Skills — Genesis (§13.6).** Documented the 5 reference agent skills that cover the complete client-facing service lifecycle: schedule, manage, discover, pay, and follow up.

### v0.8 (2026-03-10)

- **Delegated Agency Model (§10).** Introduced `ServiceMandate` as a first-class protocol object for explicit delegation of capability from human principals to AI agents. Includes 8 normative validation rules, mandate lifecycle (issuance, validation, expiration, revocation, suspension), audit model, and security considerations.
- **Provider Profile & Discoverable Attributes (§12).** Introduced `ProviderProfile` and `ProviderAttribute` with origin-tracked taxonomy across 6 categories (identity, capability, availability, geography, economic, trust). Includes semantic matching model with weighted scoring, JSON-LD serialization for search engine indexation, and real-time vs. static attribute synchronization.
- **Agent Decision Model updated (§11).** Integrated with Delegated Agency Model — every agent action now REQUIRES a valid ServiceMandate.
- **MCP server extended.** Added 3 mandate management tools (`mandates.list`, `mandates.get`, `mandates.suspend`). All authenticated tools now accept `mandate_id` in the `actor` parameter.
- **Provider dimension extended.** Added `profile_id` field to link providers to their ProviderProfile.
- **New scopes.** Added `evidence:write`, `document:read`, `document:write`, `mandate:read`, `mandate:admin`, `discovery:read`, `profile:write`.
- **Service Mandate JSON Schema.** Published `schema/service-mandate.schema.json`.

### v0.7 (2026-03-04)

- **Visibility.** Added `visibility` field (`public` | `unlisted` | `private`) to Service and Service Order. Controls discoverability — `public` services are indexed in catalogs, `unlisted` are accessible by direct ID, `private` are restricted to authorized parties.
- **License.** MIT → Apache-2.0.

### v0.6 (2026-03-01)

- **Two-entity architecture.** Refactored protocol to center on two core objects: Service (atomic delivery unit) and Service Order (commercial agreement).
- **9 lifecycle states.** Added Invoiced between Documented and Collected, bringing the total to 9 universal states plus exception states.
- **Resource entity.** Introduced Resource as a first-class entity with its own availability calendar, capacity, and buffer semantics.
- **Exception flow: Resource Conflict.** Added as a variant of Rescheduling (§7.5).
- **Principle 7.** Added "Collective Intelligence Is a Protocol Commons" (Principles 5 and 6 merged into "A Service Is a Machine-Readable Product").

---

## Appendix C: Scope Reference

Protocol-defined scopes. All scopes follow the `{resource}:{action}` pattern.

| Scope | Description | Typical Mandate |
|-------|-------------|-----------------|
| `schedule:read` | View availability and scheduled services. | Scheduling agent. |
| `schedule:write` | Book, reschedule, cancel services. | Scheduling agent. |
| `patient:read` | Read patient/client records. | Clinical agent. |
| `patient:write` | Create or update patient/client records. | Intake agent. |
| `service:read` | View service details and lifecycle state. | Any operational agent. |
| `service:write` | Transition service lifecycle states. | Lifecycle agent. |
| `payment:read` | View billing status and payment history. | Reconciliation agent. |
| `payment:write` | Create invoices and record payments. | Billing agent. |
| `document:read` | Read clinical notes and documentation. | Documentation agent. |
| `document:write` | Create or update documentation. | Documentation agent. |
| `evidence:write` | Submit proof-of-delivery evidence. | Delivery verification agent. |
| `order:read` | View Service Order details and ledger. | Account management agent. |
| `order:write` | Create, propose, or modify Service Orders. | Sales agent. |
| `discovery:read` | Query unlisted provider attributes. | Discovery agent. |
| `profile:write` | Update provider profile attributes. | Profile management agent. |
| `mandate:read` | View mandates issued by this principal. | Administrative agent. |
| `mandate:admin` | Suspend mandates (not issue — only principals issue). | Organizational admin agent. |
| `resource:read` | View physical resources and their availability. | Scheduling agent. |
| `resource:write` | Create, update, or deactivate physical resources. | Resource management agent. |
| `resolve:write` | Register and update organization endpoints in the global resolver. | Resolver administration agent. |
| `telemetry:write` | Send heartbeat and health signals to the global resolver. | Operations/monitoring agent. |

### Tool-to-Scope Mapping

| Tool | Required Scopes |
|------|-----------------|
| `resolve.lookup` | None (public). |
| `resolve.search` | None (public). |
| `trust.get_score` | None (public). |
| `registry.search` | None (public). |
| `registry.get_organization` | None (public). |
| `registry.manifest` | None (public). |
| `scheduling.check_availability` | None (public). |
| `services.list` | None (public). |
| `a2a.get_agent_card` | None (public). |
| `service.get` | `service:read`. |
| `contract.get` | `service:read` or `order:read`. |
| `clients.get_or_create` | `patient:write`. |
| `scheduling.book` | `schedule:write`. |
| `scheduling.confirm` | `schedule:write`. |
| `lifecycle.get_state` | `service:read`. |
| `lifecycle.transition` | `service:write`. |
| `scheduling.reschedule` | `schedule:write`. |
| `scheduling.cancel` | `schedule:write`. |
| `delivery.checkin` | `evidence:write`. |
| `delivery.checkout` | `evidence:write`. |
| `delivery.record_evidence` | `evidence:write`. |
| `documentation.create` | `document:write`. |
| `payments.create_sale` | `payment:write`. |
| `payments.record_payment` | `payment:write`. |
| `payments.get_status` | `payment:read`. |
| `service_orders.list` | `order:read`. |
| `service_orders.get` | `order:read`. |
| `service_orders.create` | `order:write`. |
| `service_orders.propose` | `order:write`. |
| `service_orders.activate` | `order:write`. |
| `service_orders.get_ledger` | `order:read`. |
| `mandates.list` | `mandate:read`. |
| `mandates.get` | `mandate:read`. |
| `mandates.suspend` | `mandate:admin`. |
| `resolve.register` | `resolve:write`. |
| `resolve.update_endpoint` | `resolve:write`. |
| `telemetry.heartbeat` | `telemetry:write`. |
| `resource.list` | `resource:read`. |
| `resource.get` | `resource:read`. |
| `resource.create` | `resource:write`. |
| `resource.update` | `resource:write`. |
| `resource.delete` | `resource:write`. |
| `resource.get_availability` | `resource:read`. |

---

## Appendix D: Attribute Key Reference

Protocol-defined attribute keys per category. Implementations MUST support these keys. Additional keys MAY be defined using the `x-{domain}:` prefix.

### D.1 Identity (`identity`)

| Key | Type | Description |
|-----|------|-------------|
| `profession` | string | Primary profession. |
| `primary_specialty` | string | Main area of practice. |
| `subspecialties` | string[] | Additional areas of expertise. |
| `title` | string | Academic or professional title. |
| `training_institution` | string | Where the professional studied. |
| `license_number` | string | Professional license/registration number. |
| `license_jurisdiction` | string | Where the license is valid (ISO 3166-1). |
| `years_experience` | integer | Years in practice. |
| `languages` | string[] | Languages spoken (ISO 639-1). |
| `bio` | string | Free-text biography for human display. |
| `photo_url` | string (URL) | Profile photo URL. |

### D.2 Capability (`capability`)

| Key | Type | Description |
|-----|------|-------------|
| `conditions_treated` | string[] | Conditions/diagnoses the provider handles. |
| `techniques` | string[] | Methods and techniques applied. |
| `populations_served` | string[] | Patient demographics served. |
| `age_range` | object | Age range served: `{ min: integer, max: integer }`. |
| `contraindications` | string[] | Conditions the provider does NOT treat. |
| `typical_session_count` | object | Typical treatment duration: `{ min: integer, max: integer }`. |
| `outcome_metrics` | string[] | Outcomes the provider tracks. |

### D.3 Availability (`availability`)

| Key | Type | Typical Origin | Description |
|-----|------|----------------|-------------|
| `modalities` | string[] | declared | Delivery modes: `in_person`, `virtual`, `home_visit`. |
| `typical_hours` | object | inferred | Usual schedule blocks from booking history. |
| `avg_wait_days` | number | inferred | Average days from request to first available slot. |
| `next_available` | datetime | inferred (real-time) | Next open slot — synced from scheduling system. |
| `accepts_new_patients` | boolean | declared | Whether currently accepting new patients/clients. |
| `max_daily_sessions` | integer | declared | Self-imposed daily session limit. |

### D.4 Geography (`geography`)

| Key | Type | Description |
|-----|------|-------------|
| `country` | string | Country (ISO 3166-1). |
| `region` | string | Administrative region. |
| `city` | string | City. |
| `district` | string | Sub-city division (borough, district). |
| `address` | string | Primary practice address. |
| `coordinates` | object | `{ lat: number, lng: number }`. |
| `service_radius_km` | number | For home visits: maximum distance served. |
| `remote_policy` | string | Virtual care scope: `same_region`, `national`, `international`. |

### D.5 Economic (`economic`)

| Key | Type | Description |
|-----|------|-------------|
| `price_range` | object | `{ min: number, max: number, currency: string }`. |
| `insurance_accepted` | string[] | Accepted insurance types. |
| `payment_methods` | string[] | Accepted payment methods. |
| `cancellation_policy` | string | Human-readable cancellation policy. |
| `cancellation_window_hours` | integer | Machine-readable cancellation window in hours. |
| `offers_packages` | boolean | Whether multi-session packages are available. |

### D.6 Trust (`trust`)

All trust attributes have `origin: "inferred"` and `visibility: "public"`.

| Key | Type | Description |
|-----|------|-------------|
| `rating_avg` | number (1.0–5.0) | Average client rating. |
| `rating_count` | integer | Number of ratings. |
| `cancellation_rate` | number (0.0–1.0) | Provider-initiated cancellation rate. |
| `no_show_rate` | number (0.0–1.0) | Client no-show rate. |
| `response_time_hours` | number | Average time to respond to booking requests. |
| `platform_tenure_months` | integer | Months active on the platform. |
| `services_completed` | integer | Total completed services. |
| `repeat_client_rate` | number (0.0–1.0) | Percentage of clients who return. |

---

## Machine-Readable Schemas

- [`schema/service.schema.json`](./schema/service.schema.json)
- [`schema/service-order.schema.json`](./schema/service-order.schema.json)
- [`schema/service-mandate.schema.json`](./schema/service-mandate.schema.json)
- [`schema/resolution.schema.json`](./schema/resolution.schema.json)
- [`schema/servicialo-config.schema.json`](./schema/servicialo-config.schema.json)

---

## License

Apache-2.0 — Use it, implement it, extend it.

---

*Servicialo is maintained by [Grupo Digitalo](https://grupodigitalo.com). Born in Chile, built for the world.*
