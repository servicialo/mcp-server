# Servicialo Protocol Specification

**Version:** 0.1  
**Status:** Draft  
**License:** MIT  
**Reference Implementation:** [Coordinalo](https://coordinalo.com)

---

## Table of Contents

1. [Overview](#1-overview)
2. [The 8 Dimensions of a Service](#2-the-8-dimensions-of-a-service)
3. [The 9 Universal States](#3-the-9-universal-states)
4. [Exception Flows](#4-exception-flows)
5. [The 6 Principles](#5-the-6-principles)
6. [Schema](#6-schema)
7. [Telemetry Extension (Planned)](#7-telemetry-extension-planned)
8. [MCP Server](#8-mcp-server)
9. [Implementations](#9-implementations)
10. [Contributing](#10-contributing)

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

## 2. The 8 Dimensions of a Service

Every professional service — from a physical therapy session to a legal consultation — can be described across 8 dimensions. These are the minimum fields required for an AI agent to fully understand and coordinate a service.

### 2.1 Identity (What)

The activity or outcome being delivered.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `svc_abc123` |
| `type` | string | Service category | `physical_therapy_session` |
| `vertical` | enum | Industry vertical | `health`, `legal`, `home`, `education` |
| `name` | string | Human-readable name | "Kinesiology Session - 45min" |
| `duration_minutes` | integer | Expected duration | `45` |
| `requirements` | string[] | Prerequisites | `["medical_referral", "intake_form"]` |

### 2.2 Provider (Who Delivers)

The professional or entity delivering the service.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `provider.id` | string | Provider identifier | `prov_xyz789` |
| `provider.credentials` | string[] | Required certifications | `["kinesiologist_cl", "colegio_medico"]` |
| `provider.trust_score` | number | 0-100, calculated from history | `92` |
| `provider.organization_id` | string | Parent organization | `org_mamapro` |

### 2.3 Client (Who Receives)

The beneficiary of the service.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `client.id` | string | Client identifier | `cli_def456` |
| `client.payer_id` | string | May differ from client | `payer_fonasa` |

**Design decision:** The payer is explicitly separated from the client. In healthcare, insurance pays. In corporate training, the employer pays. In education, the parent pays. Most scheduling APIs ignore this distinction.

### 2.4 Schedule (When)

The temporal window for the service.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `schedule.requested_at` | datetime | When the request was made | `2026-02-10T08:00:00Z` |
| `schedule.scheduled_for` | datetime | Agreed start time | `2026-02-10T10:00:00Z` |
| `schedule.duration_expected` | integer | Expected minutes | `45` |

### 2.5 Location (Where)

Physical or virtual location.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `location.type` | enum | `in_person`, `virtual`, `home_visit` | `in_person` |
| `location.address` | string | Physical address | "Av. Providencia 1234, Santiago" |
| `location.room` | string | Specific room/box | `"Box 3"` |
| `location.coordinates` | object | lat/lng | `{lat: -33.42, lng: -70.61}` |

### 2.6 Lifecycle (States)

Current position in the 9-state lifecycle. See [Section 3](#3-the-9-universal-states).

| Field | Type | Description |
|-------|------|-------------|
| `lifecycle.current_state` | enum[9] | Current state |
| `lifecycle.transitions` | transition[] | State change history |
| `lifecycle.exceptions` | exception[] | No-shows, disputes, etc. |

### 2.7 Proof of Delivery (Evidence)

How the service proves it occurred.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `proof.checkin` | datetime | Provider/client arrived | `2026-02-10T09:58:00Z` |
| `proof.checkout` | datetime | Session ended | `2026-02-10T10:43:00Z` |
| `proof.duration_actual` | integer | Actual minutes | `45` |
| `proof.evidence` | evidence[] | GPS, signatures, photos | `[{type: "gps", ...}]` |

### 2.8 Billing (Payment)

Financial settlement for the service.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `billing.amount` | money | Service price | `{value: 35000, currency: "CLP"}` |
| `billing.payer` | reference | Who pays | `payer_fonasa` |
| `billing.status` | enum | `pending`, `invoiced`, `paid`, `disputed` | `paid` |
| `billing.tax_document` | reference | Invoice/receipt | `inv_001234` |

---

## 3. The 9 Universal States

Every service — from a medical consultation to a home repair — passes through the same lifecycle. The 9 states are the minimum required for an AI agent to verify with certainty that a service was requested, delivered, documented, and settled.

```
Requested → Scheduled → Confirmed → In Progress → Completed → Documented → Invoiced → Collected → Verified
```

| # | State | Description | Trigger |
|---|-------|-------------|---------|
| 1 | **Requested** | Client or agent defines what they need | Client submits request |
| 2 | **Scheduled** | Time, provider, and location assigned | System matches availability |
| 3 | **Confirmed** | Both parties acknowledge | Provider + client confirm |
| 4 | **In Progress** | Service is being delivered | Check-in detected |
| 5 | **Completed** | Service delivery finished | Provider marks complete |
| 6 | **Documented** | Record/evidence generated | Clinical note, report, photos filed |
| 7 | **Invoiced** | Financial document issued | Invoice generated |
| 8 | **Collected** | Payment received | Payment confirmed |
| 9 | **Verified** | Delivery confirmed by both parties | Client confirms or silence window expires |

### Why 9 states?

Fewer states lose critical information — without separating "Completed" from "Documented", you can't know if the clinical record was filed. Without separating "Invoiced" from "Collected", you can't track payment status.

More states add friction. 9 is the minimum viable set for an AI agent to verify the full service chain with certainty.

### State transitions

States are strictly ordered. A service cannot skip states (e.g., jump from Scheduled to Documented). However, exception flows can redirect a service out of the happy path at any point. See [Section 4](#4-exception-flows).

Each transition records:

```yaml
transition:
  from: "completed"
  to: "documented"
  at: "2026-02-10T11:00:00Z"
  by: "provider_xyz"        # who triggered
  method: "auto"             # auto | manual | agent
  metadata: {}               # context-specific data
```

---

## 4. Exception Flows

A robust standard doesn't just define the happy path. It defines what happens when things go wrong. These are first-class flows, not edge cases.

### 4.1 Client No-Show

**Trigger:** Client doesn't arrive within the grace period.

```
Confirmed → Cancelled (no_show)
```

- Charges penalty per organization policy
- Frees provider's time slot for reallocation
- Increments client's no-show counter (strike system)
- Provider is compensated per policy

### 4.2 Provider No-Show

**Trigger:** Provider doesn't arrive or cancels last-minute.

```
Confirmed → Reassigning → Scheduled (new provider)
```

- System automatically finds replacement provider
- Client notified of change
- Original provider flagged

### 4.3 Cancellation

**Trigger:** Either party cancels before the service.

```
Any pre-delivery state → Cancelled
```

- Cancellation policy applied based on time remaining
- Full refund if outside penalty window
- Partial/no refund within penalty window

### 4.4 Quality Dispute

**Trigger:** Client disputes the quality of a completed service.

```
Completed → In Review
```

- Payment frozen
- Additional evidence requested from both parties
- Admin or arbitration resolves
- Resolves to: Verified (provider wins) or Cancelled (client wins, refund issued)

### 4.5 Rescheduling

**Trigger:** Either party needs to change the time.

```
Scheduled/Confirmed → Rescheduling → Scheduled (new time)
```

- Finds compatible time for both parties
- Maintains same provider when possible
- Rescheduling policy may apply

### 4.6 Partial Delivery

**Trigger:** Service cannot be completed in full.

```
In Progress → Partial
```

- Documents what was delivered
- Adjusts invoice proportionally
- Schedules continuation if needed

---

## 5. The 6 Principles

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

---

## 6. Schema

The canonical schema in YAML. Implementations may use JSON, protobuf, or any serialization format that preserves the structure.

```yaml
service:
  # 2.1 Identity
  id: string                    # Unique identifier
  type: string                  # Service category
  vertical: string              # health | legal | home | education | ...
  name: string                  # Human-readable name
  duration_minutes: integer     # Expected duration

  # 2.2 Provider
  provider:
    id: string
    credentials: string[]       # Required certifications
    trust_score: number         # 0-100, calculated from history
    organization_id: string     # Parent organization

  # 2.3 Client
  client:
    id: string
    payer_id: string            # May differ from client

  # 2.4 Schedule
  schedule:
    requested_at: datetime
    scheduled_for: datetime
    duration_expected: integer   # minutes

  # 2.5 Location
  location:
    type: enum                  # in_person | virtual | home_visit
    address: string
    room: string
    coordinates:
      lat: number
      lng: number

  # 2.6 Lifecycle
  lifecycle:
    current_state: enum         # The 9 universal states
    transitions: transition[]   # State change history
    exceptions: exception[]     # No-shows, disputes, etc.

  # 2.7 Proof of Delivery
  proof:
    checkin: datetime
    checkout: datetime
    duration_actual: integer     # minutes
    evidence: evidence[]        # GPS, signatures, photos, docs

  # 2.8 Billing
  billing:
    amount:
      value: number
      currency: string          # ISO 4217
    payer: reference
    status: enum                # pending | invoiced | paid | disputed
    tax_document: reference

# Supporting types
transition:
  from: string
  to: string
  at: datetime
  by: string                    # who triggered
  method: enum                  # auto | manual | agent
  metadata: object

exception:
  type: enum                    # no_show | cancellation | dispute | reschedule | partial
  at: datetime
  initiated_by: string
  resolution: string
  resolved_at: datetime

evidence:
  type: enum                    # gps | signature | photo | document | duration
  captured_at: datetime
  data: object                  # type-specific payload
```

---

## 7. Telemetry Extension (Planned)

> **Status:** Design phase. Not yet implemented. Included in the specification to signal architectural intent and reserve the extension point.

### 7.1 Purpose

Individual service organizations operate in isolation. A clinic with a 15% no-show rate has no way of knowing whether that's above or below average for their vertical, region, or service type. A professional wondering if their session completion rate is competitive has no benchmark.

The Telemetry Extension enables **voluntary, anonymized data sharing** across Servicialo implementations. Organizations that opt in contribute aggregate operational metrics and, in return, receive market benchmarks that no individual actor could produce alone.

This is analogous to how payment networks generate aggregate market intelligence (spending indices, fraud models, sector benchmarks) from the transaction flow across their rails. The difference: Servicialo captures the complete service delivery cycle, not just the financial transaction. It sees not only "how much was paid" but "how the value was delivered" — from scheduling patterns to verification rates to dispute resolution times.

### 7.2 Design Principles

1. **Optional, not required.** The base protocol (Sections 1-6) works without telemetry. Telemetry is a separate extension that implementations may choose to support.

2. **Aggregate only.** No individual client, provider, or session data is ever shared. Only organization-level aggregates are transmitted.

3. **Symmetric incentive.** Contribute data → access benchmarks. Don't contribute → don't access. This creates natural network effects where participation grows because the benchmarks become more valuable with more participants.

4. **Privacy by design.** Organizations are anonymized in the benchmark dataset. Individual identities are never exposed to other participants.

5. **Open computation.** The aggregation methodology is published. Any participant can verify how benchmarks are calculated.

### 7.3 What Gets Shared

Organizations that opt in contribute periodic snapshots (recommended: monthly) containing aggregate metrics only.

#### Operational Metrics

| Metric | Description | Granularity |
|--------|-------------|-------------|
| `session_count` | Total sessions in period | By service type |
| `state_distribution` | Sessions per lifecycle state | Counts per state |
| `completion_rate` | % of scheduled sessions reaching Verified | Overall + by service type |
| `no_show_rate` | % of confirmed sessions resulting in no-show | Client + provider split |
| `cancellation_rate` | % cancelled, with timing breakdown | By cancellation window |
| `dispute_rate` | % of completed sessions disputed | Overall |
| `dispute_resolution_time` | Median time to resolve disputes | Hours |
| `verification_rate` | % verified by client vs auto-verified | Split |
| `avg_time_between_states` | Median transition time per state pair | Per transition |

#### Financial Metrics (Optional Tier)

| Metric | Description | Granularity |
|--------|-------------|-------------|
| `avg_session_price` | Average price per session | By service type |
| `collection_rate` | % of invoiced amount collected | Overall |
| `avg_days_to_collect` | Median days from invoice to payment | Overall |
| `payer_distribution` | % self-pay vs third-party payer | Split |
| `revenue_per_provider` | Average monthly revenue per provider | Anonymized range |

#### Demand Metrics (Optional Tier)

| Metric | Description | Granularity |
|--------|-------------|-------------|
| `demand_by_day` | Session count by day of week | Distribution |
| `demand_by_hour` | Session count by hour of day | Distribution |
| `utilization_rate` | % of available slots filled | Overall |
| `booking_lead_time` | Median days between booking and session | Overall |
| `seasonality_index` | Month-over-month demand variation | 12-month rolling |

### 7.4 What Gets Returned (Benchmarks)

Participants receive benchmarks segmented by dimensions they can act on.

#### Segmentation Dimensions

| Dimension | Values | Example |
|-----------|--------|---------|
| `vertical` | health, legal, education, home, beauty, ... | "health" |
| `service_type` | Per vertical | "physical_therapy" |
| `region` | Country, city, zone | "CL-RM" (Santiago metro) |
| `org_size` | solo, small (2-5), medium (6-15), large (16+) | "small" |
| `period` | month, quarter, year | "2026-Q1" |

#### Benchmark Response

```yaml
benchmark:
  segment:
    vertical: "health"
    service_type: "physical_therapy"
    region: "CL-RM"
    org_size: "small"
    period: "2026-01"
    sample_size: 47           # organizations in this segment

  metrics:
    no_show_rate:
      p25: 0.08               # 25th percentile
      p50: 0.12               # median
      p75: 0.18               # 75th percentile
      your_value: 0.15        # this organization's value
      your_percentile: 62     # where you rank

    completion_rate:
      p25: 0.78
      p50: 0.85
      p75: 0.91
      your_value: 0.88
      your_percentile: 58

    avg_session_price:
      p25: 25000              # CLP
      p50: 32000
      p75: 40000
      your_value: 35000
      your_percentile: 65

    utilization_rate:
      p25: 0.55
      p50: 0.68
      p75: 0.80
      your_value: 0.72
      your_percentile: 59

    # ... additional metrics per tier
```

### 7.5 Protocol Endpoints

Two new MCP tools added to the authenticated toolset:

#### `telemetry.contribute`

Submit an anonymized operational snapshot.

```yaml
# Request
telemetry.contribute:
  period: "2026-01"            # reporting period
  vertical: "health"
  service_type: "physical_therapy"
  region: "CL-RM"
  org_size: "small"
  metrics:
    session_count: 312
    completion_rate: 0.88
    no_show_rate: 0.15
    cancellation_rate: 0.07
    dispute_rate: 0.02
    verification_rate: 0.91    # client-verified (vs auto)
    avg_session_price: 35000
    collection_rate: 0.94
    utilization_rate: 0.72
    demand_by_day: [0.08, 0.18, 0.20, 0.19, 0.18, 0.12, 0.05]  # Sun-Sat
    booking_lead_time_days: 3.2

# Response
{
  "status": "accepted",
  "benchmark_access_until": "2026-03-01T00:00:00Z",
  "contribution_id": "contrib_abc123"
}
```

#### `telemetry.benchmark`

Retrieve benchmarks for a segment.

```yaml
# Request
telemetry.benchmark:
  vertical: "health"
  service_type: "physical_therapy"
  region: "CL-RM"
  org_size: "small"
  period: "2026-01"
  metrics: ["no_show_rate", "completion_rate", "utilization_rate"]

# Response
# See benchmark response format in 7.4
```

### 7.6 Privacy & Security

| Concern | Mitigation |
|---------|------------|
| Individual client data | Never collected. Only aggregate counts. |
| Provider identification | Never included. Revenue ranges, not individual figures. |
| Organization identification | Anonymized in benchmark dataset. Participants see only their own position. |
| Small segment re-identification | Minimum sample size of 5 organizations per segment. Below threshold → segment broadened automatically. |
| Data retention | Snapshots retained for 24 months rolling. Older data purged. |
| Withdrawal | Organizations can stop contributing at any time. Historical contributions are removed within 30 days. Benchmark access revoked immediately. |
| Competitive intelligence | No participant can identify or reverse-engineer another participant's data. |

### 7.7 Incentive Model

The telemetry extension operates on a **contribute-to-access** model:

```
Contribute monthly snapshot → Access benchmarks for 30 days
Stop contributing → Lose benchmark access
```

This creates a virtuous cycle:
- More organizations contribute → benchmarks become more accurate
- More accurate benchmarks → more organizations want access
- More participants → richer segmentation possible
- Richer segmentation → more actionable insights
- More actionable insights → higher willingness to contribute

There is no monetary cost to participate. The "price" is the data contribution itself.

### 7.8 Network Effects & Value Accumulation

At different scales, the telemetry network enables different capabilities:

| Scale | Capability | Example |
|-------|-----------|---------|
| 10 orgs | Basic benchmarks per vertical | "Your no-show rate vs. average" |
| 50 orgs | Regional + service type segmentation | "Physical therapy in Santiago vs. Valparaíso" |
| 200 orgs | Predictive demand models | "Expect 20% demand increase in March" |
| 500 orgs | Cross-vertical insights | "Healthcare no-shows correlate with seasonal patterns" |
| 1,000+ orgs | Market intelligence products | Published indices, lending risk models, policy inputs |

The protocol is designed so that value grows superlinearly with participation. The 1,000th organization gets dramatically more value than the 10th — but the 10th still gets something useful.

### 7.9 Relationship to AI Engines

In implementations that include AI capabilities, telemetry data feeds into intelligence engines:

| Engine | Telemetry Input | Output |
|--------|----------------|--------|
| Categorization | Service type distribution across network | Standardized service taxonomy |
| Forecasting | Demand patterns, seasonality, booking lead times | Demand predictions for capacity planning |
| Optimization | Utilization rates, scheduling patterns | Optimal time slot recommendations |
| Recommendation | Cross-vertical service patterns | Service offering suggestions |

The categorization taxonomy — how services are classified — must be standardized across implementations for benchmarks to be comparable. This is why the protocol includes `vertical` and `service_type` as first-class fields. The open categorization standard ensures that a physical therapy session in Santiago is classified the same way as one in Bogotá.

### 7.10 Implementation Timeline

The telemetry extension is not required for protocol compliance. It will be activated when:

1. **Prerequisite:** 10+ organizations on a single implementation generating consistent data
2. **Phase 1:** Basic operational benchmarks (no-show rate, completion rate, utilization)
3. **Phase 2:** Financial benchmarks (pricing, collection rates) — requires additional opt-in
4. **Phase 3:** Demand intelligence (seasonality, predictions) — requires 50+ organizations
5. **Phase 4:** Cross-implementation benchmarks — requires 2+ implementations sharing anonymized data

---

## 8. MCP Server

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

### Authenticated Mode (23 total tools)

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

**Additional tools include:** `scheduling.book`, `scheduling.reschedule`, `scheduling.cancel`, `clients.list`, `clients.get`, `clients.create`, `payments.create_sale`, `payments.record_payment`, `notifications.send_session_reminder`, plus 10 more for payments, providers, and payroll.

**Planned tools (Telemetry Extension):** `telemetry.contribute`, `telemetry.benchmark`

### Package

- **npm:** [@servicialo/mcp-server](https://www.npmjs.com/package/@servicialo/mcp-server)
- **GitHub:** [servicialo/mcp-server](https://github.com/servicialo/mcp-server)

---

## 9. Implementations

Any platform can implement the Servicialo specification. Compatible implementations expose the 8 dimensions and 9 states in their data model and can connect to the MCP server.

### Reference Implementation

| Platform | Vertical | Status | URL |
|----------|----------|--------|-----|
| Coordinalo | Health (kinesiology) | ✅ Live | [coordinalo.com](https://coordinalo.com) |

### Implementing the Protocol

To be listed as a compatible implementation, a platform must:

1. Model services using the 8 dimensions (Section 2)
2. Implement the 9 lifecycle states (Section 3)
3. Handle at least 3 exception flows (Section 4)
4. Expose an API that the MCP server can connect to
5. (Optional) Support the Telemetry Extension (Section 7)

Submit an implementation for listing via [GitHub Issues](https://github.com/servicialo/mcp-server/issues).

---

## 10. Contributing

Servicialo is an open standard. Contributions are welcome:

- **Protocol design:** Open an issue to propose changes to dimensions, states, or principles
- **Implementations:** Build a compatible platform and submit for listing
- **Telemetry Extension:** Feedback on the data model, privacy design, and incentive structure
- **Translations:** The protocol spec is in English; the reference implementation serves Latin American markets

### Versioning

The protocol follows semantic versioning:
- **Patch (0.1.x):** Clarifications, typo fixes, examples
- **Minor (0.x.0):** New optional fields, new exception flows, extensions
- **Major (x.0.0):** Breaking changes to required fields or state model

---

## License

MIT — Use it, implement it, extend it. Attribution appreciated but not required.

---

*Servicialo is maintained by [Grupo Digitalo](https://grupodigitalo.com). Born in Chile, built for the world.*
