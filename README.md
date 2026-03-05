<div align="center">

# Servicialo

**The open standard for services**

Anyone can create a service.<br>
**Any agent can coordinate it.**

Servicialo defines the universal language for creating, delivering, and verifying<br>
professional services — for humans and AI agents alike.

`Open standard` `Machine-readable` `Designed for humans`

[Website](https://servicialo.com) ・ [Specification](./PROTOCOL.md) ・ [MCP Server](./packages/mcp-server) ・ [npm](https://www.npmjs.com/package/@servicialo/mcp-server)

**[Leer en Español](./README.es.md)**

</div>

---

## The problem

Without a standard protocol, every service platform speaks its own language. An AI agent that wants to schedule a medical appointment, verify a home repair, or settle a legal consultation needs a different integration for each one.

**Servicialo is the common language.** If a platform implements it, any agent can operate that business — with no additional integration. The difference between an agent that informs and an agent that operates.

---

## What is a service

> *A service is a promise of transformation delivered at a specific time and place.*

Unlike a product, a service cannot be stored, resold, or returned. It is consumed the moment it is delivered. That makes it fundamentally different — and that is why it needs its own standard.

A service originates from three sources:

| Origin | Key question | Example |
|--------|-------------|---------|
| **From an asset** | *What do you have that others need?* | An empty apartment → temporary lodging |
| **From an advantage** | *What do you know that others don't?* | Physiotherapy certification → sports rehabilitation |
| **From your time** | *What can you do that others won't or can't?* | Available hours → professional cleaning |

---

## The 8 dimensions

Every professional service — from a physiotherapy session to a tax audit — is modeled with the same 8 dimensions:

| | Dimension | What it captures | Example |
|:---:|-----------|-----------------|---------|
| **1** | **What** | The activity or outcome being delivered | Physiotherapy session, electrical repair |
| **2** | **Who delivers** | The service provider, with credentials | Certified physiotherapist, licensed electrician |
| **3** | **Who receives** | The client — with payer explicitly separated | Patient (insurer pays), employee (company pays) |
| **4** | **When** | Agreed time window | 2026-02-10 from 10:00 to 10:45 |
| **5** | **Where** | Physical or virtual location, with optional `resource_id` linking to a physical Resource (3.5b: room, box, chair, equipment) | Clinic room 3, home visit, video call |
| **6** | **Lifecycle** | Current position in the 9 lifecycle states | Collected → next: Verified |
| **7** | **Evidence** | How delivery is proven | GPS + duration + client signature |
| **8** | **Billing** | Financial settlement, independent from lifecycle | $35 USD · collected · prepaid package |

> **The payer is not always the client.** In healthcare the insurer pays. In corporate the employer pays. In education the guardian pays. The standard explicitly separates client from payer — because in practice they are rarely the same person.

---

## The 9 universal states

Whether it's a massage or an audit, every service transitions through the same lifecycle:

```
Requested → Scheduled → Confirmed → In Progress → Completed → Documented → Invoiced → Collected → Verified
```

| # | State | What happens |
|:-:|-------|-------------|
| 1 | **Requested** | The client or their agent defines what they need, when, and where |
| 2 | **Scheduled** | Time, provider, and location are assigned. Calendar is blocked |
| 3 | **Confirmed** | Both parties acknowledge the commitment |
| 4 | **In Progress** | Check-in detected. The service is being delivered |
| 5 | **Completed** | The provider marks delivery as complete |
| 6 | **Documented** | Formal record generated: clinical notes, work report, minutes |
| 7 | **Invoiced** | Tax document issued |
| 8 | **Collected** | Payment received and confirmed |
| 9 | **Verified** | The client confirms — cycle closed |

> **Verified is the closure.** The client cannot verify until they have the complete picture: documented evidence, issued invoice, and applied charge. Premature verification forces the client to confirm something that has no formal record yet.

---

## Exceptions are the rule

Exceptions are not edge cases. They occur in **15–30% of appointments**. A well-designed service defines what happens when things don't go as planned:

| Exception | Transition | What happens |
|-----------|-----------|-------------|
| **Client no-show** | Confirmed → Cancelled | Penalty applied, provider's time freed |
| **Provider no-show** | Confirmed → Reassigning → Scheduled | Automatic replacement search |
| **Cancellation** | Any pre-delivery → Cancelled | Agreed cancellation policy applied |
| **Quality dispute** | Completed → Disputed | Billing frozen, evidence requested |
| **Rescheduling** | Scheduled/Confirmed → Rescheduling → Scheduled | Same provider kept if possible |
| **Resource conflict** | Scheduled → Rescheduling → Scheduled | Resource double-booked or unavailable — reassign resource or reschedule |
| **Partial delivery** | In Progress → Partial | Delivered portion documented, invoice adjusted |

---

## Service and Service Order

The protocol is built on two objects and their relationship:

```
Organization
└── Service Order                ← commercial agreement (optional)
    ├── scope                     what services, how many, what type
    ├── pricing                   how value is calculated
    ├── payment schedule          when money moves
    └── Services                 ← atomic delivery units
        └── 8 dimensions each
```

> **The Service** is the atomic unit of delivery — what actually happened. **The Service Order** is the commercial agreement that groups services under a scope, pricing model, and payment schedule.

When a Service belongs to an Order, its billing dimension is **informational** — it records the economic value, but does not generate an invoice. Invoicing is the exclusive responsibility of the Order.

The same structure works across any vertical:

| Vertical | Example | Scope | Payments |
|----------|---------|-------|----------|
| **Healthcare** | Physiotherapy plan | 12 sessions | Per session |
| **Consulting** | Hourly contract | 40 hours of legal advisory | Monthly based on usage |
| **Projects** | Due diligence in 3 phases | Defined milestones | Per approved milestone |

---

## Evidence by vertical

Each vertical defines what constitutes proof that the service occurred — with no ambiguity, so an algorithm can resolve 80% of disputes without human intervention:

<details>
<summary><b>Healthcare</b> — 4 evidence types</summary>

| Evidence | Description | Capture |
|----------|-------------|:-------:|
| Check-in record | GPS timestamp when provider arrives | auto |
| Check-out record | GPS timestamp when provider leaves | auto |
| Signed clinical notes | Clinical record signed by provider and patient | manual |
| Treatment plan adherence | Checklist of treatment plan items completed | manual |

**Resolution rule:** If check-in/out records exist and clinical notes are signed by both parties → service delivered. If notes or signature missing → escalate.

</details>

<details>
<summary><b>Home</b> — 4 evidence types</summary>

| Evidence | Description | Capture |
|----------|-------------|:-------:|
| Before photo | Photo of initial state with timestamp and GPS | manual |
| After photo | Photo of final result with timestamp and GPS | manual |
| Task checklist | Agreed tasks marked as completed | manual |
| Client signature | Digital signature confirming reception | manual |

**Resolution rule:** If before/after photos exist with valid metadata and checklist is complete → service delivered. If client signature missing → escalate.

</details>

<details>
<summary><b>Legal</b> — 3 evidence types</summary>

| Evidence | Description | Capture |
|----------|-------------|:-------:|
| Meeting minutes | Record of what was discussed and agreed | manual |
| Document delivery | Confirmation of generated documents delivered | manual |
| Time log | Billable hours with activity descriptions | manual |

**Resolution rule:** If minutes exist and logged hours are within agreed range → service delivered. If hours exceed agreement without justification → escalate.

</details>

<details>
<summary><b>Education</b> — 3 evidence types</summary>

| Evidence | Description | Capture |
|----------|-------------|:-------:|
| Attendance record | Confirmation of student and teacher presence | auto |
| Material delivery | Materials or assignments delivered to student | manual |
| Evaluation | Session evaluation or feedback | manual |

**Resolution rule:** If attendance recorded and material delivered → service delivered. If evaluation missing and contract requires it → escalate.

</details>

---

## Dispute resolution

When there is disagreement, the mechanism does not depend on goodwill, does not require a centralized judge, and an AI agent can execute it with the same confidence as a human:

**1. Opening** — Either party opens a dispute within the defined window. Billing is frozen automatically.

**2. Evidence review** — Additional evidence is requested from both parties. The system compares recorded evidence against the contract.

**3. Resolution** — If provider wins: Collected → Verified. If client wins: Cancelled with balance restored.

> **80/20.** 80% of disputes are resolved automatically by comparing evidence against contract. No human intervention, no discretion, no delay. The remaining 20% escalate to peer arbitrators from the same professional vertical who vote within 48 hours.

---

## MCP Server

Servicialo exposes its tools as an MCP server, enabling AI agents to discover and coordinate professional services natively.

### Quickstart

```bash
npx -y @servicialo/mcp-server
```

With that, your agent can already search organizations, check availability, and list services — no credentials required.

### Authenticated mode

For the full cycle — schedule, verify delivery, collect payment:

```json
{
  "mcpServers": {
    "servicialo": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_API_KEY": "your_api_key",
        "SERVICIALO_ORG_ID": "your_org_id"
      }
    }
  }
}
```

Credentials are obtained by each organization from their Servicialo-compatible platform.

### The 6 agent phases — 20 tools

A well-designed agent follows this order:

| # | Phase | What it solves | Tools |
|:-:|-------|---------------|-------|
| 1 | **Discover** | What's available | `registry.search` · `registry.get_organization` · `scheduling.check_availability` · `services.list` |
| 2 | **Understand** | Service dimensions and rules | `service.get` · `contract.get` |
| 3 | **Commit** | Client identity and booking | `clients.get_or_create` · `scheduling.book` · `scheduling.confirm` |
| 4 | **Manage** | State and transitions | `lifecycle.get_state` · `lifecycle.transition` · `scheduling.reschedule` · `scheduling.cancel` |
| 5 | **Verify** | Proof of delivery | `delivery.checkin` · `delivery.checkout` · `delivery.record_evidence` |
| 6 | **Close** | Documentation and billing | `documentation.create` · `payments.create_sale` · `payments.record_payment` · `payments.get_status` |

The standard guarantees that any agent can complete the full cycle with any compatible implementation.

### Full examples

**[Physiotherapy session](./examples/kinesiology-session.md)** — Healthcare vertical. GPS check-in, signed clinical notes, bank transfer payment.

**[Electrical repair](./examples/home-repair.md)** — Home vertical. Home visit, before/after photos, task checklist, client signature, cash payment.

---

## The 7 principles

| # | Principle | |
|:-:|-----------|---|
| 1 | **Every service has a lifecycle** | Whether it's a massage or an audit. The 9 states are universal. |
| 2 | **Delivery must be verifiable** | If you can't prove the service happened, it didn't happen. Servicialo defines what constitutes valid evidence so humans and AI agents can trust it. |
| 3 | **The payer is not always the client** | In healthcare the insurer pays. In corporate the employer pays. In education the guardian pays. The standard explicitly separates client from payer. |
| 4 | **Exceptions are the rule** | No-shows, cancellations, rescheduling, disputes. A well-designed service defines what happens when things don't go as planned. |
| 5 | **A service is a product** | It has a name, price, duration, requirements, and expected outcome. Defined this way, any AI agent can discover and coordinate it. |
| 6 | **AI agents are first-class citizens** | The standard is designed so an AI agent can request, verify, and close a service with the same confidence as a human. |
| 7 | **The agreement is separate from delivery** | The Service Order defines what was agreed. The atomic service defines what was delivered. Two distinct objects with two distinct lifecycles. |

---

## Layered architecture

Adopt only what you need. Core covers the complete cycle. Modules add capabilities for more complex operations.

### Servicialo Core — `stable`

Everything needed to model a professional service from start to finish.

For any platform where two parties make a delivery commitment and need a verifiable account of what happened — from a psychology practice to a cleaning company with multiple accounts, teams, and high staff turnover.

Includes: lifecycle (9 states) · 8 dimensions · resource management · service orders · exception flows · proof of delivery · MCP protocol (20 tools)

### Servicialo/Finance — `in design`

Payment distribution between provider, organization, and infrastructure — with clear settlement rules.

For platforms that intermediate payments between clients and providers, or that charge commissions.

### Servicialo/Disputes — `in design`

Formal resolution with algorithmic arbitration (~80%) and peer arbitration from the same vertical (~20%).

For platforms with enough volume or where the amount per service makes disputes economically relevant.

---

## Schema

JSON Schemas for automated validation: [`schema/service.schema.json`](./schema/service.schema.json) and [`schema/service-order.schema.json`](./schema/service-order.schema.json)

```yaml
# ── SERVICIALO v0.6 ──────────────────
# The 8 dimensions of a service

service:
  id: string
  service_order_id: string              # Optional — reference to parent Order
  type: string                          # Service category
  vertical: string                      # health | legal | home | education | ...
  name: string
  duration_minutes: integer

  provider:
    id: string
    credentials: string[]               # Required certifications
    trust_score: number                  # 0-100, computed from history
    organization_id: string

  client:
    id: string
    payer_id: string                    # May differ from client

  schedule:
    requested_at: datetime
    scheduled_for: datetime
    expected_duration: minutes

  location:
    type: in_person | virtual | home_visit
    address: string
    room: string
    resource_id: string               # Optional — reference to Resource (3.5b)
    coordinates:
      lat: number
      lng: number

  lifecycle:
    current_state: enum[9]              # The 9 universal states
    transitions: transition[]
    exceptions: exception[]

  proof:
    checkin: datetime
    checkout: datetime
    actual_duration: minutes
    evidence: evidence[]                # GPS, signature, photos, documents

  billing:                              # Informational if part of an Order
    amount:
      value: number
      currency: string                  # ISO 4217
    payer: reference                    # May differ from client
    status: pending | charged | invoiced | paid | disputed
    charged_at: datetime
    payment_id: reference
    tax_document: reference
```

---

## Implementations

Any platform can implement Servicialo. To be listed it must model the 8 dimensions, implement the 9 states, handle at least 3 exception flows, and expose an API connectable to the MCP server.

| Platform | Vertical | Coverage | Status |
|----------|----------|----------|:------:|
| [**Coordinalo**](https://coordinalo.com) | Healthcare | 8/8 dimensions · 9/9 states · 6/6 exceptions · 7/7 principles | Live |

> Building for professional services? [Open an issue](https://github.com/servicialo/mcp-server/issues) to list your implementation.

---

## What's in this repository

```
servicialo/
├── app/                  # servicialo.com — standard website (Next.js)
├── components/           # Website components
├── examples/             # Agent-server conversations
├── lib/                  # Protocol data
├── packages/
│   └── mcp-server/       # @servicialo/mcp-server — MCP server (npm)
├── schema/               # JSON Schemas for validation
├── PROTOCOL.md           # Full specification
└── README.md
```

|  | Version | Status |
|---|---------|--------|
| Protocol | 0.6 | Stable |
| @servicialo/mcp-server | 0.6.0 | [npm](https://www.npmjs.com/package/@servicialo/mcp-server) |

---

## License

MIT — Servicialo is an open standard. Anyone can implement it.
