---
title: "Servicialo: The Destination Layer for Human Services in the Age of AI Agents"
version: "1.0.0"
date: "2026-03"
author: "Franco Danioni — Servicialo (servicialo.com)"
license: "MIT"
keywords:
  - open protocol
  - professional services
  - AI agents
  - service lifecycle
  - orchestration
  - interoperability
  - Model Context Protocol
  - Agent-to-Agent
  - dispute resolution
  - proof of delivery
  - data governance
  - financial inclusion
---

# Servicialo: The Destination Layer for Human Services in the Age of AI Agents

**Version 1.0.0 — March 2026**

> **APA Citation:**
> Danioni, F. (2026). *Servicialo: The destination layer for human services in the age of AI agents* (Version 1.0.0). https://servicialo.com
>
> **ISO 690 Citation:**
> DANIONI, Franco. *Servicialo: The destination layer for human services in the age of AI agents* [online]. Version 1.0.0. March 2026 [accessed 2026]. Available at: https://servicialo.com

---

Every day, millions of people in Latin America need a service — a therapist for their child, a lawyer for their lease, a trainer for their recovery. And every day, millions of providers deliver those services informally: they confirm by WhatsApp, track payments in a notebook, and invoice by boleta. They are invisible to banking, invisible to technology, invisible to the economy they sustain. Servicialo is an open protocol that makes human services discoverable, bookable, and verifiable by any software agent or human client — a universal destination layer built on top of MCP and A2A, the emerging standards for AI agent communication.

---

## Executive Summary

Professional services represent a significant share of global economic activity, but their coordination remains fragmented across incompatible vertical silos. A healthcare professional, a lawyer, a teacher, and a home repair technician face structurally identical problems — scheduling, confirming, delivering, documenting, billing, and verifying — yet each uses tools that model these processes in incompatible ways. This fragmentation worsens with the emergence of AI agents that need to discover, coordinate, and settle services programmatically, without a common vocabulary or interoperability guarantees.

Servicialo proposes an open protocol, licensed under MIT, that defines the orchestration layer for professional service delivery. The protocol models each service through 8 canonical dimensions — identity, provider, client, schedule, location, lifecycle, evidence, and billing — and defines a lifecycle of 9 universal states that any service must traverse from request to final verification. Additionally, it defines the Service Order as the bilateral agreement that groups atomic services under agreed commercial conditions.

The protocol includes first-class exception flows, a dispute resolution mechanism with algorithmic arbitration, a decision model for AI agents with explicit autonomy boundaries, an MCP (Model Context Protocol) server with 34 tools organized across 7 lifecycle phases, and full A2A (Agent-to-Agent) interoperability for inter-agent discovery. Servicialo is not a product: it is neutral protocol infrastructure that any platform can implement as a sovereign node.

---

## Keywords

Open protocol, professional services, AI agents, lifecycle, orchestration, interoperability, Model Context Protocol (MCP), Agent-to-Agent (A2A), dispute resolution, proof of delivery, data governance, portability, data sovereignty, financial inclusion, destination layer.

---

## Table of Contents

1. [The HTTP Analogy](#1-the-http-analogy)
2. [The Problem](#2-the-problem)
3. [Built on MCP and A2A](#3-built-on-mcp-and-a2a)
4. [Anatomy of a Service — the 8 Dimensions](#4-anatomy-of-a-service--the-8-dimensions)
5. [Physical Resource as a First-Class Entity](#5-physical-resource-as-a-first-class-entity)
6. [The Two Entities — Service and Service Order](#6-the-two-entities--service-and-service-order)
7. [The Lifecycle — 9 Universal States](#7-the-lifecycle--9-universal-states)
8. [Exception Flows](#8-exception-flows)
9. [Dispute Resolution — the 80/20 Mechanism](#9-dispute-resolution--the-8020-mechanism)
10. [Pre-Agreed Service Contract](#10-pre-agreed-service-contract)
11. [Evidence by Vertical](#11-evidence-by-vertical)
12. [Protocol Principles](#12-protocol-principles)
13. [Governance and Portability](#13-governance-and-portability)
14. [Regulatory Compliance](#14-regulatory-compliance)
15. [AI Agent Traceability](#15-ai-agent-traceability)
16. [Versioning Policy](#16-versioning-policy)
17. [Modules](#17-modules)
18. [Hierarchical Discovery](#18-hierarchical-discovery)
19. [MCP Server](#19-mcp-server)
20. [Why Servicialo](#20-why-servicialo)
21. [Financial Inclusion](#21-financial-inclusion)
22. [Context Before Payment](#22-context-before-payment)
23. [The Digitalo Stack](#23-the-digitalo-stack)
24. [Technical Specification v1.0.0](#24-technical-specification-v100)
25. [Protocol Governance](#25-protocol-governance)
26. [How to Participate](#26-how-to-participate)

---

## 1. The HTTP Analogy

Before HTTP, documents existed but weren't universally addressable. A research paper lived on a specific server, accessible only if you knew the machine, the path, and the protocol that server spoke. There was no standard way for a client — any client — to request any document from any server using a single, universal mechanism.

HTTP changed that. It gave every document a universal address (the URL) and defined a standard protocol for requesting and delivering content. The result wasn't just technical convenience — it was the foundation for an entirely new economy. Once documents were addressable, you could build search engines, hyperlinks, caches, CDNs, and the entire web.

**Before Servicialo, services exist but aren't addressable by agents.** A physiotherapy session exists in a clinic's scheduling system. A legal consultation exists in a law firm's CRM. A personal training session exists in a notebook. But there is no standard way for an AI agent — or any software client — to discover that session, understand its structure, book it, verify it was delivered, and settle the payment, using a single, universal protocol.

**Servicialo gives every service a universal address, accessible by any agent.**

The `/.well-known/` structure is the equivalent of URL standards — a hierarchical discovery mechanism that lets any agent navigate from zero context to a completed booking:

```
servicialo.com/.well-known/registries.json       → meta-registry of implementations
coordinalo.com/.well-known/agents.json            → all discoverable orgs on this implementation
coordinalo.com/api/servicialo/{org}/.well-known/agent.json → capabilities of one org
```

Just as HTTP is indifferent to whether you use Apache or Nginx, Servicialo is indifferent to whether you use Coordinalo or your own implementation. If you comply with the specification, you are a valid node in the network.

| Before | After |
|--------|-------|
| Documents existed but weren't universally addressable | HTTP: every document has a URL, any client can request it |
| Services exist but aren't addressable by agents | Servicialo: every service has a universal address, any agent can coordinate it |

---

## 2. The Problem

Professional service coordination is a problem that transcends industries. A healthcare professional seeing patients, a lawyer advising corporate clients, a private tutor teaching at home, and a technician repairing installations share an identical operational structure: someone requests, someone delivers, they agree on when and where, the service is executed, documented, billed, and verified. Yet each vertical has developed its own tools, vocabularies, and flows, creating incompatible silos.

### 2.1 Structural Fragmentation

Existing tools model fragments of the problem:

| Tool | What it models | What it ignores |
|------|---------------|-----------------|
| Scheduling APIs | When | Who pays, what evidence, how exceptions are resolved |
| Payment gateways | How much | Service lifecycle, proof of delivery |
| Clinical records | Clinical data | Scheduling, billing, client verification |
| Generic CRMs | Commercial relationship | Operational lifecycle, exceptions, evidence |

None of these tools models the complete value chain: who provides, who receives, who pays, when, where, what evidence proves delivery occurred, and what documentation resulted.

### 2.2 The AI Agent Problem

The emergence of AI agents capable of acting on behalf of people and organizations introduces a second problem: these agents need a common vocabulary to discover available services, evaluate providers, book time slots, verify deliveries, and settle payments. Without a shared protocol, each agent must learn the idiosyncrasies of each platform, replicating at machine level the same fragmentation that already exists at the human level.

### 2.3 The Infrastructure Analogy

The history of technology shows that coordination problems at scale are solved with open protocols, not centralized platforms:

| Protocol | What it standardizes | Implementations |
|----------|---------------------|-----------------|
| HTTP | Document transfer | Diverse web servers |
| SMTP | Email delivery | Diverse email providers |
| SQL | Relational data queries | Diverse database engines |
| DNS | Name resolution | Diverse name servers |

Servicialo applies the same pattern to professional services: it defines the standard (the protocol), and any platform can implement it as a sovereign node in the network. No entity owns the protocol. The collective value of the network grows with each node that connects.

---

## 3. Built on MCP and A2A

Servicialo does not exist in isolation. It is built on top of two emerging standards for AI agent communication — and it exists because those standards, powerful as they are, need a domain layer.

### 3.1 MCP — Model Context Protocol

MCP (Anthropic, November 2024) defines how AI agents access tools and data. It is the protocol through which an agent discovers available capabilities and invokes them. Think of MCP as the "how" — the transport mechanism that lets an agent call a function, read a resource, or get context from a server.

MCP is general-purpose. It doesn't know what a physiotherapy session is, what a service lifecycle looks like, or what dunning means in a service context. It provides the plumbing. The domain semantics must come from somewhere else.

### 3.2 A2A — Agent-to-Agent

A2A (Google, April 2025) defines how agents communicate with each other. Where MCP connects an agent to tools, A2A connects agents to agents. It enables discovery (through Agent Cards), task delegation, and multi-agent coordination.

A2A is also general-purpose. It defines how agents find each other and exchange tasks, but it doesn't define what those tasks mean in any specific domain.

### 3.3 Servicialo — The Domain Layer

Servicialo is the domain protocol that gives MCP and A2A a **destination** in the world of professional services. It provides:

- **Semantic vocabulary**: what a service is (8 dimensions), what states it traverses (9-state lifecycle), what happens when things go wrong (6 exception flows)
- **Discovery hierarchy**: how agents navigate from zero context to a specific provider's capabilities via `/.well-known/` endpoints
- **Operational guarantees**: pre-agreed contracts, evidence requirements, dispute resolution, payment settlement
- **Agent governance**: delegated agency model with explicit autonomy boundaries

The relationship:

```
MCP   → how agents access tools and context (transport)
A2A   → how agents talk to each other (inter-agent communication)
Servicialo → what those agents are talking about (domain semantics and destination)
```

Without Servicialo, MCP and A2A can move messages. With Servicialo, those messages mean something — they book a session, verify a delivery, settle a payment, resolve a dispute.

### 3.4 Why a Domain Protocol Was Needed

General-purpose agent protocols don't know:

- What a kinesiologist is, or how their session differs from a lawyer's consultation
- What evidence constitutes proof of delivery in healthcare vs. home services vs. education
- What a 9-state lifecycle looks like, or why "Documented" and "Billed" are distinct states
- What dunning means, or how a boleta differs from a factura
- How to resolve a dispute when the client says the provider didn't show up but the provider has GPS evidence of being there

These are domain-specific concerns that require domain-specific protocol design. Servicialo fills this gap — it is the domain layer that makes MCP and A2A useful for professional services.

---

## 4. Anatomy of a Service — the 8 Dimensions

Every professional service — regardless of vertical — can be described through 8 dimensions. These are the minimum required fields for an AI agent to understand and coordinate a service end-to-end.

| # | Dimension | Description | Examples |
|---|-----------|-------------|----------|
| 1 | **Identity (What)** | The activity or outcome being delivered | Rehabilitation session, legal consultation, tutoring, electrical repair |
| 2 | **Provider (Who delivers)** | The professional or entity executing the service | Certified healthcare professional, licensed lawyer, teacher, technician |
| 3 | **Client (Who receives)** | The service beneficiary, with payer explicitly separated | Patient, company, student, property owner |
| 4 | **Schedule (When)** | The agreed time window | Date, start time, expected duration |
| 5 | **Location (Where)** | The physical or virtual delivery location, including physical resource when applicable | Office, home, video call, meeting room |
| 6 | **Lifecycle (States)** | Current position in the 9 universal states | Requested → Scheduled → ... → Verified |
| 7 | **Evidence (Proof)** | How to demonstrate the service occurred | GPS, digital signature, photos, documents, recorded duration |
| 8 | **Billing (Settlement)** | Financial settlement with state independent of lifecycle | Amount, currency, payer, payment status, tax document |

### 4.1 Identity (What)

The first dimension defines the service as a product: type, vertical, human-readable name, expected duration, and prerequisites. A service that isn't productized — that lacks a defined name, price, and duration — is invisible to an AI agent, because there isn't enough information to discover or coordinate it.

### 4.2 Provider (Who delivers)

The provider has an identifier, verifiable credentials, a trust score computed from operational history, and belongs to an organization. The trust score isn't a subjective rating: it's computed from verifiable operational data — attendance rate, schedule compliance, dispute rate, documentation quality.

### 4.3 Client (Who receives)

> **Design decision:** The payer is explicitly separated from the client. In healthcare, the insurer pays. In corporate services, the company pays. In education, the guardian pays. Most scheduling APIs ignore this distinction, creating data models that cannot represent the financial reality of professional services.

### 4.4 Schedule (When)

Three timestamps define the temporal dimension: when the service was requested, when it was scheduled, and how long it lasts. The separation between request and scheduling enables measuring operational response time.

### 4.5 Location (Where)

Delivery modality can be in-person, virtual, or at-home. When the service requires a specific physical space — an office, a room, equipment — the location references a Resource entity with its own availability calendar (see [Section 5](#5-physical-resource-as-a-first-class-entity)).

### 4.6 Lifecycle (States)

The service's position in its 9-state lifecycle, with complete transition history and registered exceptions. See [Section 7](#7-the-lifecycle--9-universal-states).

### 4.7 Evidence (Proof of delivery)

How to demonstrate the service occurred. Includes check-in and check-out with timestamps, actual duration auto-calculated, and vertical-specific evidence: GPS, digital signatures, photographs, clinical documents, meeting minutes, attendance records.

### 4.8 Billing (Financial settlement)

Billing has its own state, independent of the lifecycle. A service can be in "Billed" state in the lifecycle while its invoicing is still in "invoiced" state (waiting for insurer reimbursement, for example).

> **Design decision:** The states "charged" and "paid" are explicitly separated. **Charged** means the amount was debited from the client's balance or added to their debt — it happens 1:1 with each completed session. **Paid** means cash was received, and may have happened before (when the client bought a prepaid package) or after (insurer reimbursement). In professional services where the dominant model is the prepaid package, confusing charging with payment loses critical cash flow information.

---

## 5. Physical Resource as a First-Class Entity

A Resource is a physical entity — an office, a dental chair, a sports court, a treatment room — that a service may require for delivery. It's optional: virtual sessions, home visits, and services delivered at the client's location don't have a Resource. But when a Resource exists, it's a first-class entity with its own identity, availability calendar, and constraints.

### 5.1 Resource Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | text | Unique identifier |
| `name` | text | Human-readable name: "Room A", "Box 3", "Court 1" |
| `type` | text | Category: room, box, chair, equipment |
| `capacity` | integer | Maximum simultaneous sessions. Default: 1 |
| `buffer_minutes` | integer | Reset time between uses. Default: 0 |
| `equipment` | text[] | Available equipment |
| `active` | boolean | Whether available for bookings |
| `rules` | object | Extensible business logic constraints |

### 5.2 Why the Resource is a Separate Dimension

A Resource has its own availability calendar, independent of the provider and client. It can be blocked for reasons unrelated to any session — maintenance, deep cleaning, institutional reservation, equipment calibration. Treating it as a text field in the location — as most scheduling systems do — collapses two distinct concepts and generates conflicts that only manifest in production: the provider is available, the client is available, but the room is under maintenance.

A correct implementation models the Resource as an entity that participates in the availability intersection alongside the provider and client. When scheduling a session, the system must verify tripartite availability:

```
provider_free ∧ client_free ∧ resource_free
```

### 5.3 The Buffer Problem

The buffer isn't provider time or client time — it's resource time. A professional can see the next client immediately. The office needs 15 minutes for sanitization. If the buffer lives in the provider's schedule, the model is incorrect — and the error multiplies when the same pattern appears in dentistry (instrument sterilization), group classes (room cleaning), or coworking spaces (station reset).

`buffer_minutes` is a first-class field on the Resource — not buried inside `rules` — because the scheduler needs it for arithmetic. The effective occupancy of a resource is `session_duration + buffer_minutes`. This is a mathematical operation, not a business rule.

### 5.4 Capacity and Group Sessions

When `capacity > 1`, the Resource can host multiple simultaneous sessions as long as the total clients don't exceed capacity:

```
current_clients + new_clients ≤ resource.capacity
```

This isn't a special case — it's the general behavior. `capacity = 1` is simply the individual session case. A yoga studio with `capacity = 20` and a dental chair with `capacity = 1` use exactly the same scheduling logic; only the number differs.

---

## 6. The Two Entities — Service and Service Order

The protocol defines exactly two central entities that model the entirety of the provider-client relationship.

### 6.1 The Service (atomic unit)

The Service is the atomic unit of delivery. Each service instance is a concrete event: a rehabilitation session on Tuesday at 10:00, a legal consultation on Friday at 15:00, a private class on Monday at 17:00. A Service has the 8 dimensions described in the previous section and traverses the 9-state lifecycle independently.

### 6.2 The Service Order (bilateral agreement)

The Service Order is a bilateral agreement that groups one or more services under defined commercial conditions. Three axes define it completely:

| Axis | Description | Example |
|------|-------------|---------|
| **Scope** | What services are authorized, how many, of what type | 12 rehabilitation sessions, 40 hours of consulting |
| **Price** | How delivery is valued | Fixed amount, time and materials, rate by level, mixed |
| **Payment schedule** | When money moves | Advance, by milestones, periodic, on delivery, custom |

The Service Order has its own lifecycle:

```
draft → proposal → negotiating → active → paused → completed
                                   ↘ cancelled
```

> **Design decision:** The "draft" and "proposal" states turn the Service Order into the central object for quotes. A quote IS a Service Order in a pre-active state. There is no separate "quote" object.

### 6.3 The Computed Ledger

The Service Order contains a ledger that is entirely computed — never manually entered. As atomic Services transit to "verified" state, the system automatically updates the ledger fields:

| Field | Description |
|-------|-------------|
| `verified_services` | Count of services in verified state |
| `consumed_hours` | Total hours of verified services |
| `consumed_amount` | Value consumed at agreed rates |
| `invoiced_amount` | Total invoiced to date |
| `collected_amount` | Total payments received |
| `remaining_amount` | Authorized scope not consumed |

This means the Service Order always reflects the real state of delivery without any reconciliation step. The administrator's month-end closing becomes an exception review, not a ground-up reconstruction.

### 6.4 Why Two Separate Objects

> **Principle:** The agreement is separate from the delivery. The Service Order defines *what was agreed*. Atomic services define *what was delivered*. Confusing them — as most scheduling and billing systems do — creates a fundamental data integrity problem: you cannot determine whether a dispute is about the agreement terms or about the delivery quality.

---

## 7. The Lifecycle — 9 Universal States

Every professional service — regardless of vertical — traverses the same lifecycle. The 9 states are the minimum required for an AI agent to verify with certainty that a service was requested, delivered, documented, and settled.

```
Requested → Scheduled → Confirmed → In Progress → Completed → Documented → Invoiced → Charged → Verified
```

### State Machine Diagram

```
  HAPPY PATH (forward-only)
  ═════════════════════════

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │REQUESTED │─▶│SCHEDULED │─▶│CONFIRMED │─▶│IN PROGRES│─▶│COMPLETED │
  │    1     │  │    2     │  │    3     │  │    4     │  │    5     │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘
                                                                │
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
  │ VERIFIED │◀─│ CHARGED  │◀─│ INVOICED │◀─│DOCUMENTED│◀──────┘
  │  9 (end) │  │    8     │  │    7     │  │    6     │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘

  EXCEPTION FLOWS
  ════════════════

  From Scheduled/Confirmed:   RESCHEDULING ──▶ Scheduled (new)
  From Confirmed (no-show):   CANCELLED (+ penalty)
  From In Progress:           PARTIAL ──▶ Invoice adjustment
  From Confirmed (resource):  RESOURCE REASSIGNMENT ──▶ Confirmed (new)
  From Completed:             DISPUTED ──▶ Verified or Cancelled
  From pre-delivery:          CANCELLED
  From Confirmed (provider):  PROVIDER REASSIGNMENT ──▶ Scheduled (new)
```

| # | State | Description | Trigger |
|---|-------|-------------|---------|
| 1 | **Requested** | The client or their agent defines what's needed, when, and where | Client sends request |
| 2 | **Scheduled** | Time, provider, location, and resource (if applicable) assigned | System crosses availability |
| 3 | **Confirmed** | Both parties acknowledge commitment. Prerequisites verified | Provider and client confirm |
| 4 | **In Progress** | Check-in detected. Service is being delivered | Check-in detection |
| 5 | **Completed** | Provider marks delivery as complete. Evidence captured | Provider confirms |
| 6 | **Documented** | Formal record generated: clinical note, report, minutes — per vertical | Documentation archived |
| 7 | **Invoiced** | Tax document issued | Boleta or invoice generated |
| 8 | **Charged** | Payment received and confirmed | Payment credited |
| 9 | **Verified** | Client confirms service occurred and was correctly charged, or auto-verifies after silence window | Confirmation or silence |

### 7.1 Why 9 States?

**Fewer states lose critical information:**

- Without separating Completed from Documented, you can't distinguish "the provider says it happened" from "the evidence is in the record."
- Without separating Invoiced from Charged, you can't know if payment was actually received.
- Without separating Charged from Verified, you can't know if the client accepted the outcome.

**More states add unnecessary friction.** 9 is the minimum viable set for an AI agent to verify the complete service chain with certainty.

### 7.2 Why Verified is the Last State?

Verification is the cycle's closure, not an intermediate step. In practice:

1. The provider delivers (Completed)
2. The provider documents (Documented)
3. Tax document is issued (Invoiced)
4. Payment is received (Charged)
5. Client verifies — or the verification window expires and auto-closes (Verified)

The client cannot meaningfully verify until the service has been documented, invoiced, and charged. They need the complete picture — documentation, invoice, payment confirmation — before they can confirm or dispute. Verification before documentation is premature.

### 7.3 Tripartite Commitment in Scheduled State

When a session has an assigned Resource, the Scheduled state implies three entities are simultaneously committed: provider, client, and physical resource. This is a stronger commitment than a bilateral appointment — releasing any of the three affects the other two. The implementation must treat the tripartite commitment as atomic.

### 7.4 Intermediate States

Implementations can add states between the 9 universal ones to fit their operational reality. For example, an assignment step between Requested and Scheduled, or a quality review between Documented and Invoiced. The 9 universal states are the minimum — not the maximum.

### 7.5 State Transitions

States are strictly ordered. Universal states cannot be skipped (e.g., going from Scheduled to Documented). Each transition records:

- From which state and to which state
- When it occurred (timestamp)
- Who triggered it (client, provider, system, or AI agent)
- How it was triggered (`auto`, `manual`, or `agent`)
- Context-specific metadata

### 7.6 Payroll Rule

Implementations that calculate provider compensation must read only sessions in **Charged** state. Sessions that haven't reached this state aren't consummated facts and shouldn't count toward payroll. This eliminates the common failure mode where providers retroactively register sessions at month-end to inflate their compensation.

---

## 8. Exception Flows

A robust protocol doesn't only define the happy path. It defines what happens when things fail. These are first-class flows, not edge cases. Statistically, exceptions occur in 15–30% of all service appointments.

### 8.1 Client No-Show

**Trigger:** Client doesn't arrive within the grace period.

```
Confirmed → Cancelled (no-show)
```

- Penalty applied per organization policy
- Provider's time slot freed for reassignment
- Client's no-show counter incremented (strike system)
- Provider compensated per policy

### 8.2 Provider No-Show

**Trigger:** Provider doesn't arrive or cancels last minute.

```
Confirmed → Reassigning → Scheduled (new provider)
```

- System automatically searches for replacement provider
- Client notified of change
- Original provider flagged

### 8.3 Cancellation

**Trigger:** Either party cancels before the service.

```
Any pre-delivery state → Cancelled
```

- Cancellation policy applied based on remaining time
- Full refund if outside penalty window
- Partial or no refund within the window

### 8.4 Quality Dispute

**Trigger:** Client disputes the quality of a completed service within the dispute window.

```
Completed → Disputed
```

- Charge automatically frozen
- Additional evidence requested from both parties
- Administration or arbitration resolves
- Resolves to: Charged → Verified (provider wins) or Cancelled (client wins, balance restored)

### 8.5 Rescheduling

**Trigger:** Either party needs to change the schedule.

```
Scheduled/Confirmed → Rescheduling → Scheduled (new time)
```

- Searches for compatible time for both parties (and resource, if applicable)
- Keeps same provider when possible
- Rescheduling policy may apply charges

### 8.6 Partial Delivery

**Trigger:** Service cannot be completed in its entirety.

```
In Progress → Partial
```

- What was delivered is documented
- Invoice adjusted proportionally
- Continuation scheduled if needed

### 8.7 Resource Conflict

**Trigger:** Assigned resource becomes unavailable after confirmation — due to maintenance, emergency, equipment failure, or scheduling error.

```
Confirmed → Resource Reassignment → Confirmed (new resource) | Rescheduling (no alternative)
```

- System searches for alternative resource meeting same requirements (capacity, equipment) within the same time slot
- **If alternative found:** session reassigned. Provider always notified. Client notified only if change is material (different location, different characteristics)
- **If no alternative:** exception escalates to a Rescheduling flow

> **Design decision:** Resource conflict is a distinct exception from provider no-show because the resolution logic is fundamentally different. A provider replacement changes the *who*; a resource replacement changes the *where*. Most clients care deeply about which professional sees them and less about which room it happens in. This asymmetry demands that notification rules and escalation thresholds be modeled separately.

---

## 9. Dispute Resolution — the 80/20 Mechanism

Dispute resolution in professional services follows a predictable pattern: approximately 80% of cases can be resolved algorithmically, evaluating available evidence against contractual rules. The remaining 20% requires human judgment through peer arbitration.

### 9.1 Dispute Flow

| Step | Stage | Description | Actor |
|------|-------|-------------|-------|
| 1 | **Opening** | Either party opens a dispute within the defined deadline. Charge automatically frozen | Client, provider, or agent |
| 2 | **Evidence Review** | Additional evidence requested from both parties. Evaluated against contract | System or administration |
| 3 | **Resolution** | If provider wins: Charged → Verified. If client wins: Cancelled with balance restored | Administration or arbitration |

### 9.2 Algorithmic Resolution (~80% of cases)

The system evaluates available evidence against rules defined in the service contract:

- Do check-in and check-out records exist with valid metadata?
- Is documentation complete and signed as required?
- Does actual duration match agreed duration within an acceptable margin?
- Was the agreed checklist completed?

When evidence satisfies contractual criteria unambiguously, the dispute resolves automatically without human intervention. This reduces operational costs and resolution times.

### 9.3 Peer Arbitration (~20% of cases)

When evidence is ambiguous or insufficient for algorithmic resolution, the dispute escalates to peer arbitration from the same vertical. Professionals with verified experience in the same discipline evaluate the case. Arbitration configuration is defined in the service contract:

- Number of arbitrators based on disputed amount
- Maximum amount disputable without external escalation
- Time window for resolution

---

## 10. Pre-Agreed Service Contract

Before any service can be booked, the service contract defines the operational rules both parties accept. This contract isn't an extensive legal document — it's a structured set of fields that an AI agent can read and apply deterministically.

| Field | Description | Example |
|-------|-------------|---------|
| `required_evidence` | What evidence must be recorded for the service to be considered delivered | Check-in + check-out + signed documentation |
| `dispute_window` | Time window to open a dispute after Completed | 48 hours |
| `cancellation_policy` | Penalty rules by remaining time | 0% if >24h, 50% if 2-24h, 100% if <2h |
| `no_show_policy` | What happens if a party doesn't show | Client: 100% charge. Provider: reassignment + penalty |
| `arbitration` | Peer arbitration configuration if applicable | 1 arbitrator if amount < $50, 3 if ≥ $50 |
| `max_dispute_amount` | Maximum amount disputable without external escalation | Equivalent to $500 USD |

> The service contract **must** be consulted before any booking or state transition action. This guarantees that both humans and AI agents operate under the same explicit rules.

---

## 11. Evidence by Vertical

Proof of delivery isn't generic — each vertical has specific evidence requirements reflecting its regulatory obligations, professional practices, and client expectations. The protocol defines required evidence per vertical, and each implementation can extend it according to its needs.

### 11.1 Healthcare

| Evidence Type | Description | Automatic |
|---------------|-------------|-----------|
| Check-in | Provider GPS timestamp on arrival | Yes |
| Check-out | Provider GPS timestamp on departure | Yes |
| Signed clinical record | Clinical record signed by professional and patient | No |
| Plan adherence | Treatment plan execution checklist | No |

**Resolution rule:** If check-in/check-out records exist and clinical record is signed by both parties, service delivered. If record or signature is missing, escalate.

### 11.2 Home Services

| Evidence Type | Description | Automatic |
|---------------|-------------|-----------|
| Before photo | Photo of initial state with timestamp and GPS | No |
| After photo | Photo of final result with timestamp and GPS | No |
| Checklist | Agreed tasks marked as completed | No |
| Client signature | Digital client signature confirming receipt | No |

**Resolution rule:** If before/after photos exist with valid metadata and checklist complete, service delivered. If client signature is missing, escalate.

### 11.3 Legal

| Evidence Type | Description | Automatic |
|---------------|-------------|-----------|
| Meeting minutes | Record of what was discussed and agreed | No |
| Document delivery | Confirmation of delivery of generated documents | No |
| Hour log | Billable hours with activity descriptions | No |

**Resolution rule:** If minutes exist and logged hours are within agreed range, service delivered. If hours exceed agreement without justification, escalate.

### 11.4 Education

| Evidence Type | Description | Automatic |
|---------------|-------------|-----------|
| Attendance record | Confirmation of student and teacher presence | Yes |
| Material delivery | Material or assignments delivered to student | No |
| Assessment record | Assessment or feedback from the session | No |

**Resolution rule:** If attendance recorded and material delivered, service delivered. If assessment is missing and contract requires it, escalate.

### 11.5 Consulting

| Evidence Type | Description | Automatic |
|---------------|-------------|-----------|
| Approved deliverable | Document or artifact delivered with formal client approval | No |
| Committee minutes | Record of committee/follow-up meeting with attendees and agreements | No |
| Hour log | Billable hours with activity descriptions by category | No |
| Milestone progress | Progress percentage against milestone defined in Service Order | No |

**Resolution rule:** If deliverable approved by client and logged hours within authorized budget, service delivered. If hours exceed budget without scope change authorization, escalate.

### 11.6 Comparative Summary

| Vertical | Automatable evidence | Manual evidence | Key resolution criteria |
|----------|---------------------|----------------|------------------------|
| Healthcare | GPS check-in/out | Clinical record, adherence | Record signed by both parties |
| Home Services | — | Photos, checklist, signature | Photos with valid metadata + complete checklist |
| Legal | — | Minutes, documents, hours | Hours within agreed range |
| Education | Attendance | Material, assessment | Attendance + material delivered |
| Consulting | — | Deliverable, minutes, hours, milestone | Approved deliverable + hours within budget |

### 11.7 Extensibility

Each vertical can define additional evidence types. The protocol defines the structure (type, capture timestamp, specific data), not a closed catalog. A translation services implementation can add "translated file with quality control"; an architecture services implementation can add "plans approved by the client." The key is that each evidence type has a resolution rule that an AI agent can evaluate deterministically.

---

## 12. Protocol Principles

Seven principles guide the protocol's design. These aren't aspirations — they are design constraints that inform every technical decision.

> **Principle 1: Every service has a lifecycle.**
> Whether it's a rehabilitation session or a financial audit. The 9 lifecycle states are universal for any professional service. The specifics within each state vary by vertical, but the sequence is invariant.

> **Principle 2: Delivery must be verifiable.**
> If you can't prove the service occurred, it didn't occur. The standard defines what constitutes valid evidence so that both humans and AI agents can trust it. Evidence types include: GPS, recorded duration, signed documents, photographs, and client confirmation.

> **Principle 3: The payer isn't always the client.**
> In healthcare, the insurer pays. In corporate services, the company pays. In education, the guardian pays. The protocol explicitly separates the beneficiary, the requester, and the payer as independent entities.

> **Principle 4: Exceptions are the rule.**
> No-shows, cancellations, reschedulings, disputes — these aren't edge cases. They occur in 15–30% of all service appointments. A well-designed service defines what happens when something fails.

> **Principle 5: A service is a machine-readable product.**
> It has a name, price, duration, requirements, and expected outcome. Defined this way, any AI agent can discover it, coordinate it, and close it with the same confidence as a human. Every field is machine-readable. Every state transition is deterministic. Every exception has a defined resolution path.

> **Principle 6: The agreement is separate from the delivery.**
> The Service Order defines what was agreed. Atomic services define what was delivered. They are distinct objects with distinct lifecycles. The computed ledger in the Service Order is the bridge between both.

> **Principle 7: Collective intelligence is a protocol commons.**
> Every node implementing the protocol contributes operational data to the network. Aggregate intelligence improves all nodes — like Waze, where each driver contributes and everyone navigates better. This intelligence is a protocol commons, not an asset of any implementation.

---

## 13. Governance and Portability

### 13.1 The Client as Owner of Their Information

The protocol establishes that operational data belongs to the parties that generate it — fundamentally, the client. A person who receives professional services throughout their life generates a history including completed sessions, clinical or professional documentation, payments made, and disputes resolved. This history shouldn't be captive on any platform.

### 13.2 Data Portability

Any protocol implementation must allow the client to export their history in an interoperable format defined by the standard. This includes:

- Service history with their 8 dimensions
- Generated documentation (records, reports, minutes)
- Payment and invoicing history
- Exceptions and disputes with their resolutions

### 13.3 Node Sovereignty

Each organization implementing the protocol operates as a sovereign node. This means:

- **Data ownership:** The organization retains complete sovereignty over its operational data
- **Operational autonomy:** Each node decides which verticals to serve, what prices to charge, what cancellation policies to apply
- **Voluntary interoperability:** Nodes connect to the protocol by choice and can disconnect without losing their data

### 13.4 Network Intelligence as Commons

When multiple nodes contribute aggregate, anonymous data to the network, the resulting collective intelligence — demand patterns, price benchmarks, operational efficiency metrics — is a protocol commons. No implementation can capture, resell, or monopolize this intelligence.

#### The Contribute-to-Access Model

Network intelligence access is proportional to contribution. This model guarantees symmetric benefit and incentivizes honest participation.

**What each node contributes (monthly snapshot, anonymous and aggregate):**

| Category | Contributed Metrics | Example |
|----------|-------------------|---------|
| Volume | Service count by state, by vertical | 340 verified services in healthcare vertical |
| Time Efficiency | Average time between states | Median 2.3 hours between Requested and Scheduled |
| Exceptions | No-show, cancellation, rescheduling, dispute rates | 8.2% client no-shows, 1.1% disputes |
| Pricing | Price distribution by service type (percentiles, not individual values) | P25/P50/P75 for rehabilitation sessions: $25K / $35K / $50K |
| Resource Utilization | Physical resource occupancy rate by type | Offices at 72% average capacity |
| Conversion | Proposal to active order conversion rate | 43% of proposed orders reach active state |

**What each node receives in return:**

| Contribution Level | Received Benchmarks |
|-------------------|-------------------|
| Basic (volume + exceptions) | General averages for their vertical and region |
| Standard (+ pricing + efficiency) | Percentiles by vertical, region, and comparable scale |
| Complete (all categories) | Comparative dashboard with relative position in each metric, temporal trends, and deviation alerts |

---

## 14. Regulatory Compliance

The protocol is designed to facilitate compliance with the main data protection regulations in force in jurisdictions where professional services operate.

### 14.1 Chilean Law 19.628 — Personal Data Protection

| Requirement | How the protocol facilitates it |
|------------|-------------------------------|
| Informed consent | Service contract explicitly defines what data is collected and why |
| Treatment purpose | Each schema field has a description documenting its purpose |
| Access and rectification rights | Data portability allows client to export and review their information |
| Deletion right | Protocol supports personal data deletion while preserving anonymous aggregate records |

### 14.2 GDPR (European Union)

| Requirement | How the protocol facilitates it |
|------------|-------------------------------|
| Legal basis for processing | Pre-agreed service contract establishes contractual basis |
| Data minimization | 8 dimensions define minimum necessary fields — no superfluous data collected |
| Portability (Art. 20) | Export in structured, commonly used, machine-readable format |
| Right to be forgotten (Art. 17) | Separation between operational data (deletable) and anonymous aggregate data (retainable) |
| Privacy by design (Art. 25) | Protocol architecture integrates privacy from schema definition |

### 14.3 LGPD (Brazil)

| Requirement | How the protocol facilitates it |
|------------|-------------------------------|
| Legal bases (Art. 7) | Service contract as basis for data processing |
| Data subject rights (Art. 18) | Access, correction, portability, and deletion supported by protocol |
| International transfer | Schema is jurisdiction-agnostic; transfer rules defined by each node |

### 14.4 AI Regulation

| Jurisdiction | Regulation | Relevant Requirement | How Servicialo Anticipates It |
|-------------|-----------|---------------------|------------------------------|
| European Union | AI Act | Transparency and traceability for high-risk AI systems | Each transition records `method: agent` with agent ID and reference to represented person |
| European Union | AI Act — Art. 14 | Human oversight of AI systems | Agent decision model defines explicit autonomy boundaries with mandatory human escalation |
| Latin America | Emerging AI regulatory frameworks | Algorithmic accountability and affected parties' rights | Retrospective audit of transition history allows determining responsibility for each decision |

---

## 15. AI Agent Traceability

AI agents are first-class citizens in the protocol, but not all states are equal from an autonomy perspective. Some transitions are deterministic and safe for an agent to execute alone. Others involve ambiguity, real money, or irreversible consequences that require human confirmation.

### 15.1 Agent Decision Model

| Transition | Agent can act alone | Requires human confirmation |
|-----------|--------------------|-----------------------------|
| Requested → Scheduled | Yes — system crosses availability | — |
| Scheduled → Confirmed | Yes — if both parties confirmed | If confirmation is ambiguous |
| Confirmed → In Progress | Yes — on check-in detection | — |
| In Progress → Completed | — | Yes — provider must mark |
| Completed → Documented | Yes — if auto-captured evidence | If manual documentation required |
| Documented → Invoiced | Yes — if billing rules defined | If manual calculation required |
| Invoiced → Charged | Yes — on payment confirmation | — |
| Charged → Verified | Yes — on client confirmation or window expiry | — |
| Any state → Cancelled | — | Yes — always requires human action |
| Any state → Disputed | — | Yes — client must initiate |

### 15.2 Traceability Rules

Each state transition records who triggered it (`by`) and how (`method`). When an AI agent executes a transition, the record includes:

- **Agent identifier:** A unique ID identifying the specific agent
- **Method:** `agent` — distinguishing it from `auto` (system) and `manual` (human)
- **On behalf of:** If the agent acts on behalf of a client or provider, reference to the represented person

### 15.3 The Delegated Agency Model

The protocol treats AI agents as first-class actors — but never trusts them implicitly. Every agent action requires a **ServiceMandate**: an explicit delegation of capability from a human principal to an agent.

Each mandate specifies: **for whom** the agent acts, **what** it can do (scopes), and **for how long**. The MCP server validates each tool call against 8 checks before execution:

| # | Check | What it prevents |
|---|-------|-----------------|
| 1 | **Status** — mandate must be `active` | Use of revoked or expired mandates |
| 2 | **Temporal validity** — `issued_at ≤ now < expires_at` | Time-based attacks |
| 3 | **Agent identity** — `mandate.agent_id === requesting agent` | Agent impersonation |
| 4 | **Scope coverage** — mandate scopes cover tool requirements | Privilege escalation |
| 5 | **Context** — mandate context matches request | Cross-org data access |
| 6 | **Conflict of interest** — agent can't act for both parties | Dual agency violations |
| 7 | **Constraints** — allowed hours, daily limits, financial thresholds | Over-autonomous agents |
| 8 | **Audit** — every action logged with sanitized inputs | Non-repudiation |

---

## 16. Versioning Policy

The protocol follows semantic versioning:

| Level | Meaning | Example |
|-------|---------|---------|
| **Patch (1.0.x)** | Clarifications, typo corrections, additional examples | 1.0.1 |
| **Minor (1.x.0)** | New optional fields, new exception flows, extensions | 1.1.0 |
| **Major (x.0.0)** | Breaking changes to required fields or state model | 2.0.0 |

### 16.1 Version Independence

The protocol version is independent of the MCP server version (`@servicialo/mcp-server`). Both are tracked separately. An MCP server update can include implementation improvements without changing the protocol version.

### 16.2 Backward Compatibility

Minor changes are always additive — they add optional fields or extensions that existing implementations can ignore without breaking. Major changes are communicated with sufficient advance notice for implementations to migrate.

---

## 17. Modules

The protocol is organized into modules that allow incremental adoption. An implementation can start with the core module and add additional modules as needed.

### 17.1 Servicialo Core (Stable)

Everything needed to model a professional service from start to finish.

**Audience:** Any platform where two parties make a delivery commitment and need a verifiable account of what happened.

**Includes:**

- Complete lifecycle (9 universal states)
- The 8 service dimensions
- Physical resource as first-class entity
- Service orders (commercial agreement + computed ledger)
- 6 exception flows
- 7 fundamental principles
- Proof of delivery with configurable evidence per vertical
- Pre-agreed service contract
- MCP server for AI agents (34 tools across 7 phases + resource management and resolver)

### 17.2 Servicialo/Finance (In Design)

Payment distribution among involved parties.

**Audience:** Platforms that intermediate payments between clients and professionals, or that charge commissions and infrastructure fees.

**Includes:**

- Payment distribution to three recipients (professional, organization, infrastructure)
- Distribution types: percentage, fixed amount, mixed
- Settlement timing: per session, monthly, at closing
- Infrastructure concept (physical resource as cost component)

### 17.3 Servicialo/Disputes (In Design)

Formal dispute resolution with algorithmic and peer arbitration.

**Audience:** Platforms with sufficient volume to justify structured arbitration — or where the amount per service makes disputes economically relevant.

---

## 18. Hierarchical Discovery

One of Servicialo's key architectural innovations is the three-level `/.well-known/` hierarchy that enables any agent to navigate from zero context to a completed booking.

### 18.1 The Three Levels

```
Level 0 — Meta-Registry
  servicialo.com/.well-known/registries.json
  → Lists known Servicialo-compliant implementations

Level 1 — Implementation Registry
  coordinalo.com/.well-known/agents.json
  → All discoverable organizations on this implementation

Level 2 — Organization Agent Card
  coordinalo.com/api/servicialo/{orgSlug}/.well-known/agent.json
  → Capabilities, services, availability for one organization
```

### 18.2 Level 0 — Meta-Registry

The meta-registry at `servicialo.com/.well-known/registries.json` is the entry point for any agent that has no prior context. It lists all known Servicialo-compliant implementations with their status and registry endpoints.

```json
{
  "version": "1.0.0",
  "description": "Known Servicialo-compliant implementation registries",
  "registries": [
    {
      "name": "Coordinalo",
      "description": "Reference implementation — multi-tenant SaaS for professional services",
      "registry": "https://coordinalo.com/.well-known/agents.json",
      "platform": "https://coordinalo.com",
      "status": "production",
      "since": "2026-03-31"
    }
  ]
}
```

An agent reads this file to discover which implementations exist and where their registries live.

### 18.3 Level 1 — Implementation Registry

Each Servicialo-compliant implementation exposes a registry of all discoverable organizations at `/.well-known/agents.json`. This is the equivalent of a DNS zone file — it maps organization identifiers to their agent card endpoints.

The registry includes each organization's slug, name, vertical, country, trust score, and a pointer to their Level 2 agent card.

### 18.4 Level 2 — Organization Agent Card

Each organization has an Agent Card at `/.well-known/agent.json` that describes its capabilities in full detail:

- **Identity:** name, slug, vertical, country, description
- **Services:** catalog of bookable services with prices, durations, and modalities
- **Providers:** available professionals with their specializations and trust scores
- **Capabilities:** which protocol features are implemented (lifecycle states, exception flows, evidence types)
- **Endpoints:** MCP server URL, REST API URL, A2A task router URL
- **Authentication:** how to obtain credentials for authenticated operations

### 18.5 Full Navigation Flow

An agent starting from zero context follows this path to complete a booking:

```
1. GET servicialo.com/.well-known/registries.json
   → discovers Coordinalo as a production implementation

2. GET coordinalo.com/.well-known/agents.json
   → discovers organizations, finds "clinica-kinesia" in healthcare vertical

3. GET coordinalo.com/api/servicialo/clinica-kinesia/.well-known/agent.json
   → learns: MCP endpoint, services catalog, provider list, trust score

4. Connect to MCP server at coordinalo.com/api/mcp
   → 9 public tools available without authentication

5. registry.search({ vertical: "kinesiologia", location: "santiago" })
   → confirms organization match

6. services.list({ org_slug: "clinica-kinesia" })
   → lists available services

7. scheduling.check_availability({ service_id: "srv_rehab", date_from: "2026-04-01" })
   → returns available slots

8. [Authenticate] → 34 tools available

9. scheduling.book({ service_id: "srv_rehab", provider_id: "prov_111", ... })
   → session booked, lifecycle begins
```

The key insight: **an agent with no prior knowledge of Servicialo can navigate the entire hierarchy and complete a booking using only standard HTTP and the /.well-known/ convention.** No documentation needed. No API keys needed for discovery. The protocol is self-describing.

---

## 19. MCP Server

Servicialo exposes its tools as a Model Context Protocol (MCP) server, enabling AI agents to discover and coordinate professional services natively. The server also supports A2A (Agent-to-Agent) discovery through the `a2a.get_agent_card` tool.

### 19.1 Operating Modes

| Mode | Available Tools | Requirements |
|------|----------------|-------------|
| **Discovery** | 9 public tools | No configuration |
| **Authenticated** | 34 complete tools | API key + organization ID |

### 19.2 The 7 Phases and 34 Tools

#### Phase 0: Resolve (3 public tools)

DNS resolution: locate an organization's endpoint in the global resolver.

| Tool | Description |
|------|-------------|
| `resolve.lookup` | Resolve an orgSlug to its MCP/REST endpoint and trust level |
| `resolve.search` | Search registered organizations by country and vertical |
| `trust.get_score` | Get trust score (0-100, level, last activity) |

#### Phase 1: Discover (6 public tools)

Always available, no authentication.

| Tool | Description |
|------|-------------|
| `registry.search` | Search organizations by vertical and location |
| `registry.get_organization` | Get public details of an organization |
| `registry.manifest` | Get server manifest: capabilities, protocol version, metadata |
| `scheduling.check_availability` | Check available slots (3-variable scheduler: provider ∧ client ∧ resource) |
| `services.list` | List an organization's public service catalog |
| `a2a.get_agent_card` | Get the A2A Agent Card for inter-agent discovery |

#### Phase 2: Understand (2 tools)

Understand the service structure and contractual terms before committing.

| Tool | Description |
|------|-------------|
| `service.get` | Get the 8 dimensions of a service |
| `contract.get` | Get the pre-agreed service contract. **Must** be called before any Phase 3+ action |

#### Phase 3: Commit (3 tools)

Book and confirm a service session.

| Tool | Description |
|------|-------------|
| `clients.get_or_create` | Find client by email/phone or create if new |
| `scheduling.book` | Book new session (state "Requested"). Accepts optional `resource_id` for physical resource |
| `scheduling.confirm` | Confirm booked session (state "Confirmed"). Both parties must confirm |

#### Phase 4: Lifecycle (4 tools)

Manage state transitions and exception flows.

| Tool | Description |
|------|-------------|
| `lifecycle.get_state` | Get current state, available transitions, and history |
| `lifecycle.transition` | Execute state transition with evidence |
| `scheduling.reschedule` | Exception flow: reschedule to new time |
| `scheduling.cancel` | Exception flow: cancel session with contractual policy |

#### Phase 5: Verify Delivery (3 tools)

Record proof of service delivery.

| Tool | Description |
|------|-------------|
| `delivery.checkin` | Record check-in with GPS + timestamp (state "In Progress") |
| `delivery.checkout` | Record check-out with GPS + timestamp (state "Completed"). Duration auto-calculated |
| `delivery.record_evidence` | Record delivery evidence by vertical: GPS, signature, photo, document, duration, notes |

#### Phase 6: Close (4 tools)

Documentation, invoicing, and payment settlement.

| Tool | Description |
|------|-------------|
| `documentation.create` | Generate service record: clinical note, inspection report, class minutes (state "Documented") |
| `payments.create_sale` | Create a charge for documented service (state "Charged") |
| `payments.record_payment` | Record payment received. Payment is independent of lifecycle |
| `payments.get_status` | Query payment status or client account balance history |

#### Resource Management (6 tools)

| Tool | Description |
|------|-------------|
| `resource.list` | List an organization's physical resources |
| `resource.get` | Get resource details with availability slots |
| `resource.create` | Create a new physical resource (room, box, equipment) |
| `resource.update` | Update resource (semantic patch) |
| `resource.delete` | Deactivate resource (soft delete) |
| `resource.get_availability` | Query availability by date range |

#### Resolver Administration (3 tools)

| Tool | Description |
|------|-------------|
| `resolve.register` | Register organization in the global resolver |
| `resolve.update_endpoint` | Update registered endpoints (portability) |
| `telemetry.heartbeat` | Send heartbeat indicating active node |

### 19.3 Installation

```bash
# Discovery mode (no credentials)
npx -y @servicialo/mcp-server

# Authenticated mode (with credentials)
# Configure: SERVICIALO_API_KEY, SERVICIALO_ORG_ID
```

### 19.4 Package

- **npm:** `@servicialo/mcp-server`
- **Repository:** https://github.com/servicialo/mcp-server

---

## 20. Why Servicialo

### 20.1 Network Logic

The value of a professional services protocol grows exponentially with each implementing node, following Metcalfe's law. An isolated node gets the benefits of structured lifecycle and verifiable proof of delivery. Two nodes can exchange client referrals with verifiable history. Ten nodes generate statistically significant benchmarks by vertical and region. A hundred nodes create a collective intelligence network that benefits all participants.

### 20.2 The Regulatory Opportunity

Data protection regulations in multiple jurisdictions converge on three requirements: portability, informed consent, and data minimization. An open protocol that integrates these principles from its design doesn't just facilitate compliance — it positions its implementers at an advantage before future regulations that expand these requirements.

### 20.3 The Economic Model

Servicialo as a protocol is free (MIT license). It doesn't charge for use, transactions, or volume. Economic value is captured at the implementation layer — each node monetizes according to its particular business model: subscriptions, commissions, licenses, or consulting services.

This model replicates the proven dynamic of successful protocols: HTTP is free, but web servers, CDNs, and hosting platforms generate value on top of it. SQL is free, but commercial database engines and managed services capture value at the implementation layer.

---

## 21. Financial Inclusion

### 21.1 The Boleta Economy

In Latin America, millions of professionals operate in what can be called the "boleta economy." They don't have employment contracts or payslips. They invoice through boletas de honorarios (service receipts), work with multiple clients, and manage their own schedules. They are the backbone of the service economy — healthcare, education, legal, fitness, wellness, home services.

The financial system treats them as invisible. No payslip means no credit score. No credit score means no credit card. No credit card means no automated billing. The providers who sustain the service economy cannot participate in the financial infrastructure that every other sector takes for granted.

### 21.2 Why Informal Providers Are Excluded from Banking

Traditional credit scoring relies on signals designed for employed workers:

| Signal | Available for employees | Available for boleta workers |
|--------|------------------------|------------------------------|
| Payslip / salary proof | Yes | No |
| Employment contract | Yes | No |
| Employer verification | Yes | No |
| Bank account with regular deposits | Usually | Rarely |
| Credit history | Often | Rarely |

The result: professionals with stable client bases, excellent delivery records, and consistent income cannot access basic financial products. The problem isn't risk — it's data. The financial system lacks the signals to evaluate these providers.

### 21.3 Structured Service Data as Better Underwriting

Servicialo generates exactly the signals that traditional underwriting lacks:

| Traditional Signal | Servicialo Signal | Why It's Better |
|-------------------|-------------------|-----------------|
| Payslip (static, monthly) | Recurring client base (dynamic, continuous) | Shows actual demand, not just employment |
| Employment verification | Verified delivery history (8 dimensions × 9 states) | Shows performance, not just employment status |
| Bank deposits | Payment history with service context | Shows why money moved, not just that it moved |
| — | Attendance rate | Direct reliability signal |
| — | Dispute rate | Direct quality signal |
| — | Client retention rate | Direct sustainability signal |

A provider who has delivered 200 verified sessions over 6 months, with a 96% attendance rate, 0.5% dispute rate, and 80% client retention is a better credit risk than most employed workers — but no bank can see these signals today.

### 21.4 The Path

```
Structured service context (Servicialo)
    ↓
Credit scoring based on operational data
    ↓
Digitalo card (financial instrument)
    ↓
Payment facilitation (automated billing, subscription collection)
    ↓
Financial visibility and economic participation
```

This is inclusion by design, not charity. The protocol generates the data. The data enables the scoring. The scoring enables the financial product. The financial product enables the provider to participate in the economy they sustain.

---

## 22. Context Before Payment

### 22.1 What Payment Rails See

Every payment network — Visa, Mastercard, bank transfers, PSPs — sees the same thing:

```
Amount: $35,000 CLP
Merchant: "Clínica Kinesia Ltda."
Category: MCC 8099 (Health Services)
Date: 2026-03-15
Status: Approved
```

That's it. The payment rail knows money moved. It knows approximately what category of merchant received it. It knows nothing about the service that justified the payment.

### 22.2 What Servicialo Sees

For the same transaction, Servicialo sees:

```
Who needs what:     María López needs pelvic floor rehabilitation
From whom:          Dr. Bárbara Sánchez (certified, trust score 94)
When:               Tuesday 10:00, 45 minutes scheduled
Where:              Box 3, Clínica Kinesia, Providencia
Whether delivered:  Check-in 9:58, check-out 10:42, clinical record signed
Client satisfaction: NPS 9, auto-verified after 48h silence
Payment context:    Session 8 of 12, prepaid package, $35,000/session
Provider history:   200 verified sessions, 96% attendance, 0.5% disputes
```

### 22.3 Why Intent Data is More Valuable Than Transaction Data

Transaction data tells you what happened financially. Service context tells you **why** it happened, **whether** it was delivered, and **how well** it went. This context is structurally unavailable to payment networks because they are positioned after the service decision, not during it.

The implications:

- **For credit scoring:** Service context is a better predictor of financial reliability than transaction history
- **For fraud detection:** Context that includes proof of delivery eliminates a class of fraud that payment data alone cannot detect
- **For pricing:** Understanding service delivery patterns enables dynamic pricing that transaction-level data cannot support
- **For recommendations:** Knowing what service was needed (not just what was paid) enables intelligent referral networks

### 22.4 The Moat

This context cannot be reconstructed retroactively by any payment network. You cannot derive from a $35,000 charge at MCC 8099 that it was María's 8th rehabilitation session, that the provider has a 96% attendance rate, or that the clinical record was signed by both parties. The context exists at the point of service coordination — and Servicialo is positioned there.

Payment networks can see money move. Servicialo can see why it should move, whether the service justified it, and what happens next.

---

## 23. The Digitalo Stack

Servicialo is the open protocol. Coordinalo is the reference implementation. But the complete vision requires a full stack — from scheduling to financial intelligence. The Digitalo stack is how the reference implementation modules work together:

```
┌─────────────────────────────────────────────────────────┐
│                    SERVICIALO                            │
│         The open protocol that makes it all              │
│              addressable by agents                       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Coordinalo   │  │  Compensalo  │  │ Relacionalo  │  │
│  │  Scheduling & │  │  Payment     │  │  CRM &       │  │
│  │  service      │  │  reconcili-  │  │  patient     │  │
│  │  orchestration│  │  ation       │  │  communication│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  Balancealo   │  │  Habilitalo  │                     │
│  │  Personal &   │  │  ETL &       │                     │
│  │  group        │  │  connector   │                     │
│  │  financial    │  │  layer       │                     │
│  │  intelligence │  │              │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                          │
│                  DIGITALO STACK                           │
└──────────────────────────────────────────────────────────┘
```

| Module | Role | What It Does |
|--------|------|-------------|
| **Coordinalo** | Scheduling & service orchestration | Session lifecycle, provider availability, public booking, resource management. The reference implementation of Servicialo Core. |
| **Compensalo** | Payment reconciliation | Matches bank transactions to service sessions. Bridges the gap between what the protocol says was charged and what the bank says was received. |
| **Relacionalo** | CRM & patient communication | Client relationship management, automated WhatsApp/email communication, audience segmentation, appointment reminders, dunning sequences. |
| **Balancealo** | Personal & group financial intelligence | Provider compensation calculation, organizational financial dashboards, revenue analytics, occupancy metrics. |
| **Habilitalo** | ETL & connector layer | Data integration, external system connectors, import/export pipelines, migration tools. The plumbing that connects the stack to the outside world. |
| **Servicialo** | The open protocol | Defines the vocabulary, lifecycle, evidence requirements, and agent interface that makes the entire stack addressable and interoperable. |

Each module can operate independently. Coordinalo works without Compensalo. Relacionalo works without Balancealo. But together, they form a complete operational platform for professional services — and every interaction generates the structured data that feeds the financial inclusion thesis.

---

## 24. Technical Specification v1.0.0

```yaml
# ─────────────────────────────────────────────
# SERVICIALO v1.0.0
# Complete Technical Specification
# ─────────────────────────────────────────────

service:
  id: text                        # Unique identifier
  service_order_id: text          # Optional — reference to parent Order
  type: text                      # Service category
  vertical: text                  # health | legal | home | education | consulting | ...
  name: text                      # Human-readable name
  duration_minutes: integer       # Expected duration
  requirements: text[]            # Prerequisites

  provider:                       # Dimension 2 — Who delivers
    id: text
    credentials: text[]           # Required certifications
    trust_score: number           # 0-100, computed from history
    organization_id: text         # Parent organization

  client:                         # Dimension 3 — Who receives
    id: text
    payer_id: text                # May differ from client

  schedule:                       # Dimension 4 — When
    requested_at: datetime
    scheduled_for: datetime
    expected_duration: minutes

  location:                       # Dimension 5 — Where
    type: in_person | virtual | at_home
    address: text
    room: text                    # Readable label (coexists with resource_id)
    coordinates:
      lat: number
      lng: number
    resource_id: text             # Optional — reference to Resource entity

  resource:                       # Dimension 5b — Physical resource (optional)
    id: text
    name: text                    # "Box 3", "Room A", "Chair 2"
    type: text                    # box | room | chair | equipment
    capacity: integer             # Max simultaneous clients. Default: 1
    buffer_minutes: integer       # Reset time between uses. Default: 0
    equipment: text[]
    location: text                # Physical description (floor, wing, address)
    active: boolean               # Whether available for bookings
    rules: object                 # Extensible business logic constraints

  resource_availability:          # Resource recurring calendar
    resource_id: text
    day_of_week: integer          # 0 = Sunday, 6 = Saturday
    start_time: text              # "HH:mm"
    end_time: text                # "HH:mm"
    available: boolean            # true = available, false = blocked
    timezone: text                # IANA timezone
    block_order: integer          # Sequence within the day

  lifecycle:                      # Dimension 6 — States
    current_state: enum           # The 9 universal states
      - requested
      - scheduled
      - confirmed
      - in_progress
      - completed
      - documented
      - invoiced
      - charged
      - verified
    exception_states:             # States outside happy path
      - cancelled
      - disputed
      - reassigning
      - rescheduling
      - partial
    transitions: transition[]     # Change history
    exceptions: exception[]       # No-shows, disputes, etc.

  proof_of_delivery:              # Dimension 7 — Evidence
    check_in: datetime
    check_out: datetime
    actual_duration: minutes      # Auto-calculated
    evidence: evidence[]          # GPS, signature, photos, documents

  billing:                        # Dimension 8 — Financial settlement
    amount:
      value: number
      currency: text              # ISO 4217 (CLP, USD, MXN, BRL, EUR, ...)
    payer: reference              # May differ from client
    status: pending | charged | invoiced | paid | disputed
    charged_at: datetime          # 1:1 with lifecycle Charged state
    payment_id: reference         # Linked payment (may be prepaid package)
    tax_document: ref             # Boleta/invoice if issued

# ─────────────────────────────────────────────
# SERVICE ORDER
# Bilateral agreement grouping services
# ─────────────────────────────────────────────

service_order:
  id: text                        # Unique identifier
  organization_id: text           # Issuing organization
  client_id: text                 # Beneficiary
  payer_id: text                  # Who pays

  scope:                          # What services are authorized
    description: text
    service_types: text[]
    quantity_limit: integer | null
    hours_limit: number | null
    expiration_condition: text

  term:                           # Duration and renewal
    type: permanent | annual | monthly | by_milestone | by_event
    starts_at: datetime
    ends_at: datetime | null
    auto_renews: boolean
    renewal_notice_days: integer | null

  pricing:                        # How delivery is valued
    model: fixed | time_materials | rate | mixed
    currency: text
    fixed_amount: number
    rates:
      - level: text
        billable_rate: number
        cost_rate: number

  payment_schedule:               # When money moves
    type: advance | milestone | periodic | on_delivery | custom
    installments:
      - trigger: text
        amount: number | null
        percentage: number | null
        due_days: integer

  ledger:                         # Computed — never manually entered
    verified_services: integer
    consumed_hours: number
    consumed_amount: number
    invoiced_amount: number
    collected_amount: number
    remaining_amount: number

  lifecycle:
    current_state: draft | proposal | negotiating | active | paused | completed | cancelled
    transitions: transition[]

  service_ids: text[]             # References to atomic services

# ─────────────────────────────────────────────
# SUPPORT TYPES
# ─────────────────────────────────────────────

transition:
  from: text | null               # null for initial state
  to: text
  at: datetime
  by: text                        # Client, provider, system, or agent ID
  method: auto | manual | agent
  metadata: object

exception:
  type: no_show | cancellation | dispute | rescheduling | partial | resource_conflict
  at: datetime
  initiated_by: text
  resolution: text
  resolved_at: datetime

evidence:
  type: gps | signature | photo | document | duration | notes
  captured_at: datetime
  data: object                    # Type-specific payload

actor:
  type: client | provider | organization | agent
  id: text
  on_behalf_of:                   # Optional — when agent acts as representative
    type: client | provider
    id: text

service_contract:
  required_evidence: text[]
  dispute_window: text
  cancellation_policy: object
  no_show_policy: object
  arbitration: object
  max_dispute_amount: number

service_mandate:
  mandate_id: text
  principal_id: text
  principal_type: text
  agent_id: text
  agent_name: text
  acting_for: text
  context: text
  scopes: text[]
  constraints: object
  issued_at: datetime
  expires_at: datetime
  status: active | suspended | expired | revoked
```

---

## 25. Protocol Governance

Servicialo is an open specification. Any platform that complies with the specification is a valid network node — just as any server implementing HTTP is a valid web server. No permission, approval, or membership required.

### 25.1 Current State

Servicialo is maintained by its author. The protocol is in active design phase where iteration speed is the priority. Decisions about protocol evolution, change acceptance, and implementation certification are concentrated in a single maintainer. This is explicit and documented.

### 25.2 Anti-Capture Design

The protocol incorporates structural mechanisms that prevent capture by any actor — including its own author.

#### (a) Objective and Automated Certification

Implementation certification is deterministic: if an implementation passes the test suite, it's certified. No discretionary approval, no gatekeepers, no subjective review processes.

Tests verify:
- Correct modeling of the 8 service dimensions
- Implementation of the 9 lifecycle states with valid transitions
- Handling of at least 3 exception flows
- Responses conforming to the protocol's JSON Schema

#### (b) Reputation Based on Verified Deliveries

Reputation in the network derives from real deliveries verified through the protocol — not from governance tokens, delegated votes, or participation metrics. Trust is earned by delivering services, not by accumulating influence.

### 25.3 Guiding Principle: Indifference to the Implementer

The protocol must be **indifferent to who implements it** — just as HTTP is indifferent to whether you use Apache or Nginx, and SMTP is indifferent to whether you use Gmail or Fastmail. If you comply with the specification, you are a valid network node. No permissions, no approvals, no exceptions.

---

## 26. How to Participate

Servicialo is an open protocol under MIT license. There are three ways to participate:

### 26.1 Implementers

Organizations building professional service platforms can implement the protocol as a sovereign node.

**Minimum requirements to be listed as a compatible implementation:**

1. Model services using the 8 dimensions
2. Implement the 9 lifecycle states
3. Handle at least 3 exception flows
4. Expose an API that the MCP server can connect to
5. (Optional) Model Service Orders
6. (Optional) Contribute to network intelligence

### 26.2 Service Providers

Professionals and organizations delivering services can adopt the protocol through any compatible implementation. Benefits include:

- Portable professional history between platforms
- Trust score based on verifiable data, not subjective reviews
- Access to industry benchmarks to optimize operations

### 26.3 AI Agent Developers

Teams building AI agents can integrate the MCP server so their agents discover, coordinate, and settle professional services.

**Quick start:**

```bash
npx -y @servicialo/mcp-server
```

With 9 public tools available without authentication, an agent can immediately search organizations, explore service catalogs, and check availability.

### 26.4 Protocol Contributions

- **Protocol design:** Propose changes to dimensions, states, or principles via public issues
- **Extensions:** Design additional modules (Finance, Disputes, Telemetry)
- **Translations:** The specification is maintained in Spanish and English
- **Documentation:** Improve examples, implementation guides, and use cases

**Repository:** https://github.com/servicialo/mcp-server

**Website:** https://servicialo.com

**Specification:** https://spec.servicialo.com

---

## License

MIT — Use, implement, extend. Attribution is appreciated but not required.

---

*Servicialo is an open protocol maintained by its community of implementers. No company owns the protocol. The network's collective intelligence is a commons.*
