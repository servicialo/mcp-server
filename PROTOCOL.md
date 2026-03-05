# Servicialo Protocol Specification

**Version:** 0.3
**Status:** Stable
**License:** MIT
**Reference Implementation:** [Coordinalo](https://coordinalo.com)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Entities](#2-core-entities)
3. [The 8 Dimensions of a Service](#3-the-8-dimensions-of-a-service)
4. [The 9 Universal States](#4-the-9-universal-states)
5. [Exception Flows](#5-exception-flows)
6. [Service Order](#6-service-order)
7. [The Principles](#7-the-principles)
8. [Schema](#8-schema)
9. [Agent Decision Model](#9-agent-decision-model)
10. [MCP Server](#10-mcp-server)
11. [Telemetry Extension](#11-telemetry-extension)
12. [Implementations](#12-implementations)
13. [Contributing](#13-contributing)

---

## 1. Overview

Servicialo is an open standard for modeling the complete lifecycle of professional service delivery — from request to verified completion.

Unlike scheduling APIs that model "when", payment APIs that model "how much", or healthcare APIs that model "what clinical data", Servicialo models the entire value delivery chain: who provides, who receives, who pays, when, where, what evidence proves delivery occurred, and what documentation results.

The protocol is designed for two audiences simultaneously:

- **Humans** designing, delivering, and managing professional services
- **AI agents** that need to discover, coordinate, verify, and settle services programmatically

### Why a new standard?

Professional services represent a $6T+ global market with no universal protocol. Every platform builds its own data model for appointments, payments, and verification. The result: services are siloed, non-interoperable, and invisible to AI agents.

Servicialo defines the minimum viable schema for any AI agent to interact with any professional service — regardless of the platform that manages it.

### What Servicialo is NOT

- Not a scheduling API (though it includes scheduling)
- Not a payments protocol (though it includes payment states)
- Not a healthcare standard (though it works for healthcare)
- Not a platform (platforms implement it)

---

## 2. Core Entities

The protocol is built around two objects and their relationship.

**Service** is the atomic unit of delivery. It models a single instance of a professional service through the 8 dimensions defined in [Section 3](#3-the-8-dimensions-of-a-service). A Service can exist standalone or within a Service Order.

**Service Order** is the commercial agreement that groups one or more Services under a defined scope, an agreed price, and a payment schedule. It is optional — not every Service belongs to an Order.

The key relationship: when a Service belongs to a Service Order, its `billing` dimension is **informative** (it records the economic value of the individual service unit) but **not transactional** (it does not generate an invoice). Invoicing is the exclusive responsibility of the Service Order, which triggers it according to its own payment schedule.

A Service without a Service Order is a valid, complete object. The Order is an optional upper layer, not a requirement.

```
Organization
└── Service Order (optional)
    ├── scope: what services, how many, what type
    ├── pricing: how value is calculated
    ├── payment_schedule: when money moves
    └── Services (atomic units)
        └── 8 dimensions each
```

---

## 3. The 8 Dimensions of a Service

Every professional service — from a physical therapy session to a legal consultation — can be described across 8 dimensions. These are the minimum fields required for an AI agent to fully understand and coordinate a service.

> When a Service belongs to a Service Order, the `billing` dimension is informative — it records the economic value of the individual service unit. The Service Order determines when and how invoicing occurs.

### 3.1 Identity (What)

The activity or outcome being delivered.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `svc_abc123` |
| `type` | string | Service category | `physical_therapy_session` |
| `vertical` | enum | Industry vertical | `health`, `legal`, `home`, `education` |
| `name` | string | Human-readable name | "Kinesiology Session - 45min" |
| `duration_minutes` | integer | Expected duration | `45` |
| `requirements` | string[] | Prerequisites | `["medical_referral", "intake_form"]` |

### 3.2 Provider (Who Delivers)

The professional or entity delivering the service.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `provider.id` | string | Provider identifier | `prov_xyz789` |
| `provider.credentials` | string[] | Required certifications | `["kinesiologist_cl", "colegio_medico"]` |
| `provider.trust_score` | number | 0-100, calculated from history | `92` |
| `provider.organization_id` | string | Parent organization | `org_mamapro` |

### 3.3 Client (Who Receives)

The beneficiary of the service.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `client.id` | string | Client identifier | `cli_def456` |
| `client.payer_id` | string | May differ from client | `payer_fonasa` |

**Design decision:** The payer is explicitly separated from the client. In healthcare, insurance pays. In corporate training, the employer pays. In education, the parent pays. Most scheduling APIs ignore this distinction.

### 3.4 Schedule (When)

The temporal window for the service.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `schedule.requested_at` | datetime | When the request was made | `2026-02-10T08:00:00Z` |
| `schedule.scheduled_for` | datetime | Agreed start time | `2026-02-10T10:00:00Z` |
| `schedule.duration_expected` | integer | Expected minutes | `45` |

### 3.5 Location (Where)

Physical or virtual location.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `location.type` | enum | `in_person`, `virtual`, `home_visit` | `in_person` |
| `location.address` | string | Physical address | "Av. Providencia 1234, Santiago" |
| `location.room` | string | Specific room/box | `"Box 3"` |
| `location.coordinates` | object | lat/lng | `{lat: -33.42, lng: -70.61}` |
| `location.resource_id` | string | Reference to a Resource entity (see 3.5b) | `res_box3` |

**Design decision:** `location.room` remains as a human-readable label for simple cases where resource management is unnecessary. When a service requires scheduling a physical resource with its own availability and constraints, `location.resource_id` references a full Resource entity (Section 3.5b). Both fields can coexist — `room` for display, `resource_id` for scheduling logic.

### 3.5b Resource (What Physical Space or Equipment)

A Resource is a physical entity — a room, a dental chair, a gym court, a therapy box — that a service may require for delivery. It is optional: virtual sessions, home visits, and services delivered at the client's location have no Resource. But when a Resource exists, it is a first-class entity with its own identity, availability calendar, and constraints.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `resource.id` | string | Unique identifier | `res_box3` |
| `resource.organization_id` | string | Owning organization | `org_mamapro` |
| `resource.name` | string | Human-readable name | `"Box 3"` |
| `resource.type` | string | Category | `"room"`, `"box"`, `"chair"`, `"equipment"` |
| `resource.capacity` | integer | Max simultaneous sessions | `1` |
| `resource.buffer_minutes` | integer | Reset time between uses | `15` |
| `resource.equipment` | string[] | Available equipment | `["camilla", "TENS", "ultrasonido"]` |
| `resource.location` | string | Physical location description | `"2nd floor, east wing"` |
| `resource.is_active` | boolean | Whether bookable | `true` |
| `resource.rules` | object | Business logic constraints | `{max_hours_per_day: 8}` |

#### Why Resource is a separate dimension — not a field on Location

A Resource has its own calendar of availability, independent from the provider and the client. It can be blocked for reasons unrelated to any session — maintenance, deep cleaning, institutional reservation, equipment calibration. Treating it as a text field on Location — as most scheduling systems do — collapses two distinct concepts and generates conflicts that only surface in production: the provider is available, the client is available, but the room is under maintenance. By the time a team discovers this conflict in a text-field model, they've already shipped a broken scheduler and are patching it with ad-hoc rules.

A correct implementation models Resource as an entity that participates in availability intersection alongside provider and client. When scheduling a session, the system must verify three-way availability: provider free AND client free AND resource free.

#### The buffer problem

The buffer is not provider time and not client time — it is resource time. A physical therapist can see the next patient immediately. The therapy box needs 15 minutes of sanitization. If the buffer lives on the provider's schedule, the model is wrong — and the error compounds when the same pattern appears in dentistry (instrument sterilization), group fitness (room cleaning), or coworking (turnover reset).

`buffer_minutes` is a first-class field on Resource — not buried inside `rules` — because the scheduler needs it for arithmetic. When computing available slots, the effective occupation of a resource is `session_duration + buffer_minutes`. This is a mathematical operation, not a business rule. Fields that the scheduler needs for arithmetic belong in the schema; fields that encode business logic belong in `rules`.

#### Capacity and group sessions

When `capacity > 1`, the Resource can host multiple simultaneous sessions as long as the total number of clients does not exceed `capacity`. The scheduler must verify:

```
current_clients + new_clients ≤ resource.capacity
```

This is not a special case — it is the general behavior. `capacity = 1` is simply the individual session case. A yoga studio with `capacity = 20` and a dental chair with `capacity = 1` use the exact same scheduling logic; only the number differs.

#### Resource Availability

A Resource has its own recurring availability schedule, independent from provider schedules. Each availability block defines when the resource is bookable.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `availability.resource_id` | string | Parent resource | `res_box3` |
| `availability.day_of_week` | integer | 0 = Sunday, 6 = Saturday | `1` |
| `availability.start_time` | string | Start time (HH:mm) | `"08:00"` |
| `availability.end_time` | string | End time (HH:mm) | `"18:00"` |
| `availability.is_available` | boolean | Available or blocked | `true` |
| `availability.timezone` | string | IANA timezone | `"America/Santiago"` |
| `availability.block_order` | integer | Block sequence within a day | `1` |

**Design decision:** Resource availability is modeled as recurring weekly blocks, the same pattern used for provider availability. This allows the scheduler to apply the same intersection algorithm across all three entities (provider, client preference, resource) without special-casing any of them. `block_order` enables multiple availability blocks per day (e.g., a room available 08:00–12:00 and 14:00–18:00, closed for lunch). The combination of `resource_id + day_of_week + block_order` is unique — each block within a day is an independent availability window.

### 3.6 Lifecycle (States)

Current position in the 9-state lifecycle. See [Section 4](#4-the-9-universal-states).

| Field | Type | Description |
|-------|------|-------------|
| `lifecycle.current_state` | enum[9] | Current state |
| `lifecycle.transitions` | transition[] | State change history |
| `lifecycle.exceptions` | exception[] | No-shows, disputes, etc. |

### 3.7 Proof of Delivery (Evidence)

How the service proves it occurred.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `proof.checkin` | datetime | Provider/client arrived | `2026-02-10T09:58:00Z` |
| `proof.checkout` | datetime | Session ended | `2026-02-10T10:43:00Z` |
| `proof.duration_actual` | integer | Actual minutes | `45` |
| `proof.evidence` | evidence[] | GPS, signatures, photos | `[{type: "gps", ...}]` |

### 3.8 Billing (Payment)

Financial settlement for the service. Billing has its own status independent from the lifecycle state — a service can be Collected in the lifecycle while its billing is still `invoiced` (e.g., waiting for insurance reimbursement).

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `billing.amount` | money | Service price | `{value: 35000, currency: "CLP"}` |
| `billing.payer` | reference | Who pays (may differ from client) | `payer_fonasa` |
| `billing.status` | enum | `pending` \| `charged` \| `invoiced` \| `paid` \| `disputed` | `charged` |
| `billing.charged_at` | datetime | When charge was applied to account | `2026-02-10T11:05:00Z` |
| `billing.payment_id` | reference | Linked payment (may be a prepaid package) | `pkg_001` |
| `billing.tax_document` | reference | Invoice/receipt if issued | `inv_001234` |

**Design decision:** `charged` and `paid` are explicitly separated. **Charged** means the amount was debited from the client's balance or added to their debt — it always happens 1:1 with a Completed session. **Paid** means cash was received, and may have occurred upstream (when the client purchased a prepaid package) or downstream (insurance reimbursement). Most professional service platforms in Latin America operate on prepaid packages — conflating charge and payment loses critical information about cash flow.

---

## 4. The 9 Universal States

Every service — from a physical therapy session to a legal consultation — passes through the same lifecycle. The 9 states are the minimum required for an AI agent to verify with certainty that a service was requested, delivered, documented, and settled.

```
Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → Facturado → Cobrado → Verificado
```

| # | Key (enum) | Nombre | Description | Trigger |
|---|------------|--------|-------------|---------|
| 1 | **requested** | Solicitado | Client or agent defines what they need | Client submits request |
| 2 | **scheduled** | Agendado | Time, provider, and location assigned | System matches availability |
| 3 | **confirmed** | Confirmado | Both parties acknowledge | Provider + client confirm |
| 4 | **in_progress** | En Curso | Service is being delivered | Check-in detected |
| 5 | **completed** | Completado | Provider marks delivery complete | Provider confirms (1-tap WhatsApp or app) |
| 6 | **documented** | Documentado | Record/evidence generated | Clinical note, report, or evidence filed |
| 7 | **invoiced** | Facturado | Tax document issued | Tax document emitted |
| 8 | **collected** | Cobrado | Payment received and confirmed | Payment received and confirmed |
| 9 | **verified** | Verificado | Client confirms OK or silence window expires | Client responds OK, or auto-verified after window |

### Resource commitment in Scheduled state

When a session has an assigned Resource, the **Scheduled** state implies that three entities are simultaneously committed: the provider, the client(s), and the physical resource. This is a stronger commitment than a two-party appointment — releasing any one of the three affects the other two. A provider cancellation frees the resource for reallocation. A resource becoming unavailable (maintenance, emergency) forces rescheduling even if provider and client are still available. Implementations must treat the three-way commitment as atomic: a session is only validly Scheduled when all three entities have confirmed availability for the time slot.

### Why 9 states?

Fewer states lose critical information — without separating Completed from Documented, you can't distinguish "the provider says it happened" from "the evidence is on record". Without separating Invoiced from Collected, you can't know if the payment was actually received. Without separating Collected from Verified, you can't know if the client accepted the outcome.

More states add friction. 9 is the minimum viable set for an AI agent to verify the full service chain with certainty.

### Why Verified comes last

Verification is the closure of the cycle, not a step in the middle. In practice:

1. The provider delivers the service (Completado)
2. The provider documents (writes the clinical note, files the report) (Documentado)
3. The tax document is issued (Facturado)
4. Payment is collected (Cobrado)
5. The client verifies — or the verification window expires and it auto-closes (Verificado)

The client cannot meaningfully verify until the service has been documented, invoiced, and collected. They need the complete picture — the clinical note, the invoice, the payment confirmation — before they can confirm or dispute. Verification that comes before documentation is premature: the client would be confirming something that hasn't been formally recorded yet.

### Intermediate states

Implementations may add states between the universal nine to match their operational reality. For example, an assignment step between Requested and Scheduled, or a quality review step between Documented and Invoiced. The 9 universal states are the minimum — not the maximum.

### Revenue recognition

What triggers the transition from Completed to the financial cycle (Documented → Invoiced → Collected) depends on the **revenue recognition method**, which is an attribute of the service or package — not of the session:

| Method | When revenue is recognized | Example |
|--------|---------------------------|---------|
| Per delivery | Each completed session | Individual therapy session |
| Percentage of completion | Proportional to treatment progress | Orthodontics: each session = X% |
| Milestones | At defined checkpoints | Consulting: interim deliverable, final deliverable |

The protocol does not prescribe which method to use. Each implementation resolves this based on its vertical.

### Why there is no "Paid" state in the lifecycle

Payment flow is tracked in `billing.status`, independently from the lifecycle. In Latin American professional services, the dominant model is prepaid packages — the client pays before the sessions occur. **Collected** means the payment for the session was received or accounted for. **Paid** (in `billing.status`) may have occurred days or weeks earlier when the client purchased the package. For post-paid models (insurance, corporate invoicing), `billing.status` transitions from `pending → invoiced → paid` after the lifecycle closes. The lifecycle captures the milestone; `billing.status` captures the flow.

### State transitions

States are strictly ordered. The 9 universal states cannot be skipped (e.g., jump from Scheduled to Documented). Intermediate states added by implementations fit between the universal states and follow the same forward-only rule. Exception flows can redirect a service out of the happy path at any point. See [Section 5](#5-exception-flows).

Each transition records:

```yaml
transition:
  from: "collected"
  to: "verified"
  at: "2026-02-10T11:00:00Z"
  by: "client_def456"       # who triggered (client, provider, system, or agent)
  method: "auto"             # auto | manual | agent
  metadata: {}               # context-specific data
```

### Payroll rule

Implementations that calculate provider compensation must read only sessions in **Collected** (Cobrado) state. Sessions that have not yet reached Collected are not yet settled facts and must not count toward payroll. This eliminates the common failure mode where providers register sessions retroactively at month-end to inflate their compensation.

---

## 5. Exception Flows

A robust standard doesn't just define the happy path. It defines what happens when things go wrong. These are first-class flows, not edge cases.

### 5.1 Client No-Show

**Trigger:** Client doesn't arrive within the grace period.

```
Confirmed → Cancelled (no_show)
```

- Charges penalty per organization policy
- Frees provider's time slot for reallocation
- Increments client's no-show counter (strike system)
- Provider is compensated per policy

### 5.2 Provider No-Show

**Trigger:** Provider doesn't arrive or cancels last-minute.

```
Confirmed → Reassigning → Scheduled (new provider)
```

- System automatically finds replacement provider
- Client notified of change
- Original provider flagged

### 5.3 Cancellation

**Trigger:** Either party cancels before the service.

```
Any pre-delivery state → Cancelled
```

- Cancellation policy applied based on time remaining
- Full refund if outside penalty window
- Partial/no refund within penalty window

### 5.4 Quality Dispute

**Trigger:** Client disputes the quality of a completed service within the dispute window.

```
Completed → Disputed
```

- Charge frozen — `billing.status` remains `pending` until resolution
- Additional evidence requested from both parties
- Admin or arbitration resolves
- Resolves to: Collected → Verified (provider wins) or Cancelled (client wins, balance restored)

### 5.5 Rescheduling

**Trigger:** Either party needs to change the time.

```
Scheduled/Confirmed → Rescheduling → Scheduled (new time)
```

- Finds compatible time for both parties
- Maintains same provider when possible
- Rescheduling policy may apply

### 5.6 Partial Delivery

**Trigger:** Service cannot be completed in full.

```
In Progress → Partial
```

- Documents what was delivered
- Adjusts invoice proportionally
- Schedules continuation if needed

### 5.7 Resource Conflict

**Trigger:** The assigned resource becomes unavailable after the session was confirmed — due to maintenance, emergency, equipment failure, or a scheduling error.

```
Confirmed → Resource Reassigning → Confirmed (new resource) | Rescheduling (no alternative)
```

- System searches for an alternative resource that satisfies the same requirements (capacity, equipment) within the same time slot
- **If alternative found:** session is reassigned transparently. The provider is always notified. The client is notified only if the change is material (different location, different room characteristics)
- **If no alternative found:** the exception escalates to a Rescheduling flow (Section 5.5). The session needs a new time slot where all three entities — provider, client, and resource — are available
- The original resource conflict is recorded in `lifecycle.exceptions` with type `resource_conflict`

**Design decision:** Resource Conflict is a distinct exception from Provider No-Show (5.2) because the resolution logic is fundamentally different. A provider replacement changes the *who*; a resource replacement changes the *where*. The client's decision criteria are different — most clients care deeply about which professional treats them and less about which room it happens in. This asymmetry means the notification rules and the escalation thresholds must be modeled separately.

---

## 6. Service Order

### Concept

A Service Order is a bilateral agreement to deliver a set of services under defined commercial terms. Three axes define it completely:

- **Scope** — what services are authorized, how many, of what type
- **Pricing** — how delivery is valued (fixed, time & materials, rate card, mixed)
- **Payment schedule** — when money moves (upfront, by milestones, periodic, on delivery, custom)

A Service Order can be episodic (10 post-surgery sessions), milestone-based (due diligence in 3 phases), time-and-materials-bounded (40 hours of consulting), or permanent (monthly retainer with no end date). The duration type is an attribute of the Order, not a separate entity.

Examples across verticals that the protocol supports with the same object:

- ISAPRE issues authorization for 12 kinesiology sessions → Service Order, payer = ISAPRE, term.type = per_event (medical authorization)
- Company contracts 40 hours of consulting → Service Order, pricing.model = t&m, term.type = project
- Patient purchases unlimited monthly package → Service Order, term.type = monthly, term.auto_renews = true
- Client contracts due diligence paid in 3 milestones → Service Order, payment_schedule.type = milestone

### Lifecycle

```
draft → proposed → negotiating → active → paused → completed
                                   ↘ cancelled
```

| State | Description |
|-------|-------------|
| `draft` | Created but not sent to the client. Equivalent to a draft quote. |
| `proposed` | Sent to the client, awaiting acceptance. Equivalent to a commercial proposal. |
| `negotiating` | Active negotiation of terms. |
| `active` | Accepted and in execution. Verified Services feed the ledger. |
| `paused` | Temporarily suspended (e.g., client hospitalized, budget frozen). |
| `completed` | Scope fulfilled or term expired per defined condition. |
| `cancelled` | Terminated before completion by either party. |

**Design decision:** The `draft` and `proposed` states turn the Service Order into the central object for Estimalo (quoting). A quote IS a Service Order in pre-active state. There is no separate "quote" object.

### Schema

```yaml
service_order:
  # Required fields (marked with *)
  id: string*                       # Unique identifier, e.g. "so_abc123"
  organization_id: string*          # Issuing organization
  client_id: string*                # Beneficiary
  payer_id: string*                 # Who pays (may differ from client)

  # Scope — what is authorized
  scope:
    description: string*            # Human-readable scope definition
    service_types: string[]*        # Authorized service types, e.g. ["physical_therapy_session"]
    quantity_limit: integer         # Max services. null = unlimited
    hours_limit: number             # Max hours. null = not applicable
    expiry_condition: string        # Human-readable completion condition
                                    # e.g. "12 sessions" | "90 days" | "milestone 3 approved"

  # Term — duration and renewal
  term:
    type: enum*                     # permanent | annual | monthly | per_milestone | per_event
    starts_at: datetime*
    ends_at: datetime               # null if permanent or open-ended
    auto_renews: boolean            # default: false
    renewal_notice_days: integer    # days before end to notify. null if auto_renews = false

  # Pricing — how value is calculated
  pricing:
    model: enum*                    # fixed | t&m | rate_card | mixed
    currency: string*               # ISO 4217, e.g. "CLP"
    fixed_amount: number            # required if model = fixed
    rate_card:                      # required if model = t&m or rate_card
      - level: string               # e.g. "junior" | "senior" | "partner"
        billable_rate: number       # what is charged to client per hour
        cost_rate: number           # internal cost per hour

  # Payment schedule — when money moves
  payment_schedule:
    type: enum*                     # upfront | milestone | periodic | on_delivery | custom
    installments:                   # required if type = milestone or custom
      - trigger: string             # e.g. "contract_signed" | "milestone_1_approved" | "2026-03-01"
        amount: number              # fixed amount. null if percentage is used
        percentage: number          # % of total. null if amount is used
        due_days: integer           # days from trigger to payment due date

  # Ledger — computed from verified Services, never manually entered
  ledger:                           # read-only, calculated by the system
    services_verified: integer      # count of verified atomic services
    hours_consumed: number          # total hours across verified services
    amount_consumed: number         # value consumed at pricing rates
    amount_billed: number           # total invoiced to date
    amount_collected: number        # total payments received
    amount_remaining: number        # authorized scope not yet consumed

  # Lifecycle
  lifecycle:
    current_state: enum*            # draft | proposed | negotiating | active | paused | completed | cancelled
    transitions: transition[]       # full audit trail of state changes

  # Services that belong to this order
  service_ids: string[]             # references to atomic Service objects
```

> **Design decision:** The `ledger` is entirely computed — it is never manually entered. As atomic Services transition to `verified` state, the system automatically updates `services_verified`, `hours_consumed`, and `amount_consumed`. This means the Service Order always reflects the real state of delivery without any reconciliation step. The admin's month-end close becomes a review of exceptions, not a reconstruction from scratch.

---

## 7. The Principles

### Principle 1: Every service has a lifecycle

Whether it's a massage or an audit, the 9 states are universal. The specifics of each state vary by vertical, but the sequence is invariant.

### Principle 2: Delivery must be verifiable

If you can't prove the service occurred, it didn't occur. Servicialo defines what constitutes valid evidence so that both humans and AI agents can trust it. Evidence types include: GPS check-in/checkout, duration tracking, signed clinical notes, photos, and client confirmation.

### Principle 3: The payer is not always the client

In healthcare, the insurer pays. In corporate, the employer pays. In education, the guardian pays. The standard explicitly separates beneficiary, requester, and payer as independent entities.

### Principle 4: Exceptions are the rule

No-shows, cancellations, reschedulings, disputes — these aren't edge cases. They happen in 15-30% of all service appointments. A well-designed service defines what happens when things don't go according to plan.

### Principle 5: A service is a product

It has a name, price, duration, requirements, and expected outcome. Defined this way, any AI agent can discover it and coordinate it. Services that aren't productized are invisible to agents.

### Principle 6: AI agents are first-class citizens

The standard is designed so that an AI agent can request, verify, and settle a service with the same confidence as a human. Every field is machine-readable. Every state transition is deterministic. Every exception has a defined resolution path.

### Principle 7: The agreement is separate from the delivery

A Service Order defines *what was agreed*. Atomic Services define *what was delivered*. These are two different objects with two different lifecycles. Conflating them — as most scheduling and billing systems do — creates a fundamental data integrity problem: you can't know whether a dispute is about the terms of the agreement or the quality of the delivery.

Servicialo keeps them separate by design. The Service Order owns the commercial relationship. The atomic Service owns the proof of delivery. The ledger on the Service Order is the computed bridge between the two.

---

## 8. Schema

The canonical schema in YAML. Implementations may use JSON, protobuf, or any serialization format that preserves the structure.

**Machine-readable JSON Schemas:** [`schema/service.schema.json`](./schema/service.schema.json) and [`schema/service-order.schema.json`](./schema/service-order.schema.json) — use these to validate your implementation programmatically.

### Service

```yaml
service:
  # 3.1 Identity
  id: string*                     # Unique identifier
  service_order_id: string        # optional — reference to parent Service Order
  type: string*                   # Service category
  vertical: string*               # health | legal | home | education | ...
  name: string*                   # Human-readable name
  duration_minutes: integer*      # Expected duration

  # 3.2 Provider
  provider:
    id: string*
    credentials: string[]         # Required certifications
    trust_score: number           # 0-100, calculated from history
    organization_id: string*      # Parent organization

  # 3.3 Client
  client:
    id: string*
    payer_id: string              # May differ from client

  # 3.4 Schedule
  schedule:
    requested_at: datetime*
    scheduled_for: datetime       # Set when scheduled
    duration_expected: integer    # minutes

  # 3.5 Location
  location:
    type: enum                    # in_person | virtual | home_visit
    address: string
    room: string
    resource_id: string           # Reference to a Resource entity (optional)
    coordinates:
      lat: number
      lng: number

  # 3.6 Lifecycle
  lifecycle:
    current_state: enum*          # The 9 universal states
    transitions: transition[]     # State change history
    exceptions: exception[]       # No-shows, disputes, etc.

  # 3.7 Proof of Delivery
  proof:
    checkin: datetime
    checkout: datetime
    duration_actual: integer      # minutes
    evidence: evidence[]          # GPS, signatures, photos, docs

  # 3.8 Billing
  billing:                        # informative when service belongs to a Service Order — invoicing is handled by the Order
    amount:
      value: number*
      currency: string*           # ISO 4217
    payer: reference              # May differ from client (insurance, employer, guardian)
    status: enum                  # pending | charged | invoiced | paid | disputed
    charged_at: datetime          # When charge was applied
    payment_id: reference         # Linked payment — may be a prepaid package purchased earlier
    tax_document: reference       # Invoice/receipt if issued
```

### Service Order

```yaml
service_order:
  # Required fields (marked with *)
  id: string*                       # Unique identifier, e.g. "so_abc123"
  organization_id: string*          # Issuing organization
  client_id: string*                # Beneficiary
  payer_id: string*                 # Who pays (may differ from client)

  # Scope — what is authorized
  scope:
    description: string*            # Human-readable scope definition
    service_types: string[]*        # Authorized service types, e.g. ["physical_therapy_session"]
    quantity_limit: integer         # Max services. null = unlimited
    hours_limit: number             # Max hours. null = not applicable
    expiry_condition: string        # Human-readable completion condition
                                    # e.g. "12 sessions" | "90 days" | "milestone 3 approved"

  # Term — duration and renewal
  term:
    type: enum*                     # permanent | annual | monthly | per_milestone | per_event
    starts_at: datetime*
    ends_at: datetime               # null if permanent or open-ended
    auto_renews: boolean            # default: false
    renewal_notice_days: integer    # days before end to notify. null if auto_renews = false

  # Pricing — how value is calculated
  pricing:
    model: enum*                    # fixed | t&m | rate_card | mixed
    currency: string*               # ISO 4217, e.g. "CLP"
    fixed_amount: number            # required if model = fixed
    rate_card:                      # required if model = t&m or rate_card
      - level: string               # e.g. "junior" | "senior" | "partner"
        billable_rate: number       # what is charged to client per hour
        cost_rate: number           # internal cost per hour

  # Payment schedule — when money moves
  payment_schedule:
    type: enum*                     # upfront | milestone | periodic | on_delivery | custom
    installments:                   # required if type = milestone or custom
      - trigger: string             # e.g. "contract_signed" | "milestone_1_approved" | "2026-03-01"
        amount: number              # fixed amount. null if percentage is used
        percentage: number          # % of total. null if amount is used
        due_days: integer           # days from trigger to payment due date

  # Ledger — computed from verified Services, never manually entered
  ledger:                           # read-only, calculated by the system
    services_verified: integer      # count of verified atomic services
    hours_consumed: number          # total hours across verified services
    amount_consumed: number         # value consumed at pricing rates
    amount_billed: number           # total invoiced to date
    amount_collected: number        # total payments received
    amount_remaining: number        # authorized scope not yet consumed

  # Lifecycle
  lifecycle:
    current_state: enum*            # draft | proposed | negotiating | active | paused | completed | cancelled
    transitions: transition[]       # full audit trail of state changes

  # Services that belong to this order
  service_ids: string[]             # references to atomic Service objects
```

### Supporting Types

```yaml
transition:
  from: string
  to: string
  at: datetime
  by: string                    # who triggered
  method: enum                  # auto | manual | agent
  metadata: object

exception:
  type: enum                    # no_show | cancellation | dispute | reschedule | partial
                                # | resource_conflict
  at: datetime
  initiated_by: string
  resolution: string
  resolved_at: datetime

evidence:
  type: enum                    # gps | signature | photo | document | duration
  captured_at: datetime
  data: object                  # type-specific payload

resource:
  id: string*                   # Unique identifier
  organization_id: string*      # Owning organization
  name: string*                 # Human-readable name, e.g. "Box 3"
  type: string                  # Category: "room", "box", "chair", "equipment". Default: "room"
  capacity: integer             # Max simultaneous sessions. Default: 1
  buffer_minutes: integer       # Reset/cleaning time between uses, in minutes. Default: 0
  equipment: string[]           # Available equipment or features
  location: string              # Physical location description (floor, wing, address)
  is_active: boolean            # Whether the resource is currently bookable. Default: true
  rules: object                 # Extensible business logic constraints

resource_availability:
  resource_id: string*          # Parent resource
  day_of_week: integer*         # 0 = Sunday, 6 = Saturday
  start_time: string*           # "HH:mm" format
  end_time: string*             # "HH:mm" format
  is_available: boolean         # Default: true. False = explicitly blocked
  timezone: string              # IANA timezone. Default: "America/Santiago"
  block_order: integer          # Block sequence within a day. Unique per resource_id + day_of_week
```

---

## 9. Agent Decision Model

The protocol defines that agents are first-class citizens, but not all states are equal from an autonomy perspective. Some transitions are deterministic and safe for an agent to execute alone. Others involve ambiguity, real money, or irreversible consequences that require human confirmation. This section establishes that boundary.

| Transition | Agent can act autonomously | Requires human confirmation |
|---|---|---|
| Requested → Scheduled | ✅ System matches availability | — |
| Scheduled → Confirmed | ✅ If both parties have confirmed via registered channel | ⚠️ If confirmation is ambiguous or missing |
| Confirmed → In Progress | ✅ On check-in detection | — |
| In Progress → Completed | — | ✅ Provider must mark |
| Completed → Documented | ✅ If evidence auto-captured (GPS, duration) | ⚠️ If evidence requires human filing (clinical notes) |
| Documented → Invoiced | ✅ If billing rules are fully defined in Service Order | ⚠️ If pricing requires manual calculation |
| Invoiced → Collected | ✅ On payment confirmation from payment system | — |
| Collected → Verified | ✅ On client confirmation or after silence window expires | — |
| Any state → Cancelled | — | ✅ Always requires human or explicit client action |
| Any state → Disputed | — | ✅ Client must initiate |
| Disputed → Resolved | — | ✅ Admin must resolve |
| Confirmed → Resource Reassigning | ✅ If alternative resource available | ⚠️ If no alternative — escalates to Rescheduling |
| Service Order: draft → proposed | — | ✅ Human sends proposal |
| Service Order: proposed → active | — | ✅ Client acceptance required |
| Service Order: active → paused | — | ✅ Human decision |
| Service Order: ledger update | ✅ Automatic on service verified | — |
| Service Order: payment trigger | ✅ If trigger condition is deterministic (date, count) | ⚠️ If trigger requires judgment (milestone approval) |

**The ambiguity rule:** When a transition falls in the ⚠️ category, the agent must pause and surface the ambiguity to a human before proceeding. The agent should never resolve ambiguity by assumption. It should present the available information and the decision required, then wait.

**The irreversibility rule:** Any transition that moves money, generates a legal document, or closes a Service Order is irreversible by default. Agents must treat these as requiring explicit human confirmation regardless of how deterministic the trigger appears.

---

## 10. MCP Server

Servicialo exposes its tools as a Model Context Protocol (MCP) server, enabling AI agents to discover and coordinate professional services natively.

### Discovery Mode (No credentials — 4 public tools)

```bash
npx -y @servicialo/mcp-server
```

| Tool | Description |
|------|-------------|
| `registry.search` | Search organizations by vertical and location |
| `registry.get_organization` | Public details of an organization |
| `scheduling.check_availability` | Check available time slots |
| `services.list` | Public service catalog |

### Authenticated Mode (29 total tools)

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

Additional tools include: `scheduling.book`, `scheduling.reschedule`, `scheduling.cancel`, `clients.list`, `clients.get`, `clients.create`, `payments.create_sale`, `payments.record_payment`, `notifications.send_session_reminder`, plus 10 more for payments, providers, and payroll.

| Tool | Description |
|------|-------------|
| `service_orders.list` | List Service Orders for an organization |
| `service_orders.get` | Get full details of a Service Order including ledger |
| `service_orders.create` | Create a Service Order in draft state |
| `service_orders.propose` | Transition a Service Order from draft to proposed |
| `service_orders.activate` | Transition a Service Order to active (on client acceptance) |
| `service_orders.get_ledger` | Get real-time ledger of a Service Order |

**Planned tools (Telemetry Extension):** `telemetry.contribute`, `telemetry.benchmark`

### Package

- **npm:** [@servicialo/mcp-server](https://www.npmjs.com/package/@servicialo/mcp-server)
- **GitHub:** [servicialo/mcp-server](https://github.com/servicialo/mcp-server)

---

## 11. Telemetry Extension

> **Status:** Design phase. Not yet implemented.

The goal is to enable anonymous, aggregate benchmarks across organizations that implement the protocol. Organizations contribute monthly snapshots of operational metrics and receive in return benchmarks segmented by vertical, region, and size.

The model is contribute-to-access — you contribute data, you access benchmarks. Everything is anonymous and aggregated. Individual client, provider, or session information is never shared. The minimum segment size is 5 organizations to prevent re-identification.

The extension will be activated when the ecosystem reaches 10+ organizations with consistent data.

> Full specification: [telemetry-extension.md](./telemetry-extension.md) *(forthcoming)*

---

## 12. Implementations

Any platform can implement the Servicialo specification. Compatible implementations expose the 8 dimensions and 9 states in their data model and can connect to the MCP server.

### Reference Implementation

| Platform | Vertical | Status | URL |
|----------|----------|--------|-----|
| Coordinalo | Healthcare | ✅ Live | [coordinalo.com](https://coordinalo.com) |

### Implementing the Protocol

To be listed as a compatible implementation, a platform must:

1. Model services using the 8 dimensions (Section 3)
2. Implement the 9 lifecycle states (Section 4)
3. Handle at least 3 exception flows (Section 5)
4. Expose an API that the MCP server can connect to
5. (Optional) Model Service Orders using the schema in Section 6
6. (Optional) Support the Telemetry Extension (Section 11)

Submit an implementation for listing via [GitHub Issues](https://github.com/servicialo/mcp-server/issues).

---

## 13. Contributing

Servicialo is an open standard. Contributions are welcome:

- **Protocol design:** Open an issue to propose changes to dimensions, states, or principles
- **Implementations:** Build a compatible platform and submit for listing
- **Telemetry Extension:** Feedback on the data model, privacy design, and incentive structure
- **Translations:** The protocol spec is in English; the reference implementation serves Latin American markets

### Versioning

The protocol follows semantic versioning:
- **Patch (0.3.x):** Clarifications, typo fixes, examples
- **Minor (0.x.0):** New optional fields, new exception flows, extensions
- **Major (x.0.0):** Breaking changes to required fields or state model

The protocol version is independent from the MCP server package version (`@servicialo/mcp-server`). Both are tracked separately.

### Changelog

#### 0.3 (2026-02-23)

- **Status:** Draft → Stable. The core protocol (8 dimensions, 9 states, 6 exception flows, 7 principles) is considered stable for implementation.
- **JSON Schema:** Published `schema/service.schema.json` and `schema/service-order.schema.json` for machine-readable validation.
- **Agent conversation example:** Added `examples/kinesiology-session.md` with a complete lifecycle walkthrough.
- **Version alignment:** All references across site, README, and spec now consistently say v0.3.

#### 0.2 (2026-02-22)

- **Core Entities:** Introduced Service and Service Order as the two central protocol objects.
- **Service Order:** Full lifecycle (draft → proposed → negotiating → active → paused → completed | cancelled), schema with scope/pricing/payment_schedule/ledger.
- **Agent Decision Model:** Explicit autonomy boundaries for AI agents acting on services and orders.
- **Principle 7:** "The agreement is separate from the delivery."
- **Schema:** Annotated with required/optional fields, added `service_order_id` to Service.
- **MCP Server:** 29 tools (added 6 `service_orders.*` tools).
- **Telemetry Extension:** Collapsed to design-phase summary with link to forthcoming full spec.

#### 0.1 (2026-02-01)

- Initial public draft with 8 dimensions, 9 states, 6 exception flows, 6 principles.
- Billing section with independent `billing.status`.
- Telemetry Extension (planned).
- MCP server reference.

---

## License

MIT — Use it, implement it, extend it. Attribution appreciated but not required.

---

*Servicialo is maintained by [Grupo Digitalo](https://grupodigitalo.com). Born in Chile, built for the world.*
