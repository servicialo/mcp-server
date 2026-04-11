# Servicialo Protocol — Quick Spec

> Self-contained reference for developers and AI agents evaluating or implementing the protocol.
> Source of truth: [`PROTOCOL.md`](./PROTOCOL.md) v0.9. Last synced: 2026-03-23.

---

## 1. The 8 Dimensions

Every service is modeled across 8 canonical dimensions, universal across verticals.

| # | Dimension | What it captures | Example fields |
|:-:|-----------|-----------------|----------------|
| 1 | **Identity (What)** | The activity or outcome being delivered | `type`, `vertical`, `name`, `duration_minutes`, `requirements` |
| 2 | **Provider (Who Delivers)** | Professional or entity delivering the service | `provider.id`, `credentials`, `trust_score`, `organization_id` |
| 3 | **Client (Who Receives)** | Beneficiary of the service; payer is explicitly separated | `client.id`, `client.payer_id` |
| 4 | **Schedule (When)** | Temporal window for the service | `requested_at`, `scheduled_for`, `duration_expected` |
| 5 | **Location (Where)** | Physical or virtual location; may reference a Resource entity | `type` (in_person/remote), `address`, `resource_id`, `coordinates` |
| 6 | **Lifecycle (States)** | Current position in the 6+3 state lifecycle (6 core + 3 financial extension) | `current_state`, `transitions[]` (audit trail), `exceptions[]` |
| 7 | **Evidence (Proof)** | How the service proves it occurred | `checkin`, `checkout`, `duration_actual`, `evidence[]`, `data_sensitivity` |
| 8 | **Billing (Payment)** | Financial settlement, independent from lifecycle | `amount`, `payer`, `status`, `payment_id`, `tax_document` |

A **Resource** (physical space/equipment) is a first-class entity with `capacity`, `buffer_minutes`, its own availability schedule, and equipment list. Optional — solo practices work without it.

---

## 2. The 6+3 Lifecycle States

### Core Lifecycle (REQUIRED — states 1–6)

```
Requested → Scheduled → Confirmed → In Progress → Completed → Documented
```

| # | State | Trigger | Notes |
|:-:|-------|---------|-------|
| 1 | `requested` | Client/agent submits request | Entry point |
| 2 | `scheduled` | System matches availability (provider, optionally resource) | Three-way commitment if resource assigned |
| 3 | `confirmed` | Both parties acknowledge | Provider + client confirm |
| 4 | `in_progress` | Check-in detected (GPS + timestamp) | Delivery begins |
| 5 | `completed` | Provider marks delivery complete | Duration auto-calculated from checkin/checkout |
| 6 | `documented` | Clinical note, report, or evidence filed | Vertical-specific evidence schema applied |

### Financial Extension (OPTIONAL — states 7–9)

| # | State | Trigger | Notes |
|:-:|-------|---------|-------|
| 7 | `invoiced` | Tax document emitted | Billing dimension updated |
| 8 | `collected` | Payment received and confirmed | Only `collected` sessions count toward payroll |
| 9 | `verified` | Client confirms OK, or silence window expires (auto-verify) | Terminal happy-path state |

> Implementations that decouple financial lifecycle MUST expose financial state via `payments.get_status`, not through `lifecycle.get_state`. The REQUIRED terminal state for the core service lifecycle is `documented` (or `verified` if delivery verification is implemented). States 7–9 are OPTIONAL — implementations MAY bundle them into the session lifecycle or manage them independently.

### Verification Deadline

> After transitioning to `delivered`, implementations MUST set a `verification_deadline` (ISO 8601 timestamp). The default deadline is 12 hours from delivery. Acceptable range: [1 hour, 72 hours]. If no client action (verify or dispute) occurs before the deadline, the implementation MUST auto-transition to `verified` with `method: "auto"` in the transition record. `lifecycle.get_state` MUST include `verification_deadline` when current state is `delivered`.

### Optional State: `pending_confirmation`

> Implementations that require explicit confirmation after booking MAY use the state `pending_confirmation` between `requested` and `scheduled`. Agents MUST handle this as a valid state where valid transitions are `confirm` → `scheduled` or `cancel` → `cancelled`.

**Rules:** Core states (1–6) are strictly ordered — no skipping. Financial extension states (7–9) are strictly ordered when implemented. Each transition records `from`, `to`, `at`, `by`, `method` (auto/manual/agent), and `metadata`. When `method = agent`, `mandate_id` is required.

---

## 3. The Two Entities

### Service (Atomic Unit)

The atomic unit of professional service delivery. Modeled across the 8 dimensions. May exist standalone or within a Service Order.

### Service Order (Commercial Agreement)

A bilateral agreement to deliver a set of services under defined commercial terms.

| Axis | What it defines |
|------|----------------|
| **Scope** | Authorized service types, quantity/hours limits, expiry condition |
| **Pricing** | Model (fixed / time & materials / rate card / mixed), currency, rates |
| **Payment schedule** | When money moves (upfront / milestone / periodic / on delivery / custom) |

**Service Order lifecycle:** `draft → proposed → negotiating → active → paused → completed | cancelled`

A quote IS a Service Order in `draft` or `proposed` state — no separate quote object.

### Computed Ledger (read-only, on the Service Order)

| Field | Meaning |
|-------|---------|
| `services_verified` | Count of services in `verified` state |
| `hours_consumed` | Total hours across verified services |
| `amount_consumed` | Value consumed at pricing model rates |
| `amount_billed` | Total invoiced to date |
| `amount_collected` | Total payments received |
| `amount_remaining` | Authorized scope not yet consumed |

**Relationship (Principle 6):** Service Order = what was agreed. Atomic Service = what was delivered. The ledger bridges both.

---

## 4. Exception Flows

6 first-class exception flows. Any of these may redirect out of the happy path.

| Exception | Trigger | From state | To state | Key rule |
|-----------|---------|-----------|----------|----------|
| **Client no-show** | Client absent past grace period | `confirmed` | `cancelled (no_show)` | Charge penalty per policy; free provider slot |
| **Provider no-show** | Provider absent or last-minute cancel | `confirmed` | `reassigning → scheduled` | Auto-find replacement; notify client; flag provider |
| **Cancellation** | Either party cancels pre-delivery | Any pre-delivery | `cancelled` | Apply cancellation policy by time remaining |
| **Quality dispute** | Client disputes within dispute window | `completed` | `disputed` | Freeze charge; request additional evidence; resolve to `verified` or `cancelled` |
| **Rescheduling** | Either party needs different time | `scheduled`/`confirmed` | `rescheduling → scheduled` | Maintain same provider when possible; handle resource conflicts |
| **Partial delivery** | Service cannot be completed in full | `in_progress` | `partial` | Document what was delivered; adjust invoice proportionally |

---

## 5. MCP Tools by Phase

34 tools implemented in `@servicialo/mcp-server` v0.8.0. 9 public (no auth) + 25 authenticated (API key + org ID).

### Phase 0 — DNS Resolution (3 public tools)

| Tool | Description | Auth |
|------|-------------|------|
| `resolve.lookup` | Resolve orgSlug → endpoint + trust level | No |
| `resolve.search` | Search global resolver by country and vertical | No |
| `trust.get_score` | Trust score (0–100), level, last activity | No |

### Phase 1 — Discovery (6 public tools)

| Tool | Description | Auth |
|------|-------------|------|
| `registry.search` | Search organizations by vertical, location, country | No |
| `registry.get_organization` | Public details: services, providers, booking config | No |
| `registry.manifest` | Server manifest: capabilities, protocol version, metadata | No |
| `scheduling.check_availability` | Available slots (3-variable: provider ∧ client ∧ resource) | No |
| `services.list` | Public service catalog of an organization | No |
| `a2a.get_agent_card` | A2A Agent Card for inter-agent discovery | No |

### Phase 2 — Understand (2 tools)

| Tool | Description | Scopes |
|------|-------------|--------|
| `service.get` | Full 8 dimensions of a service | `service:read` |
| `contract.get` | Contract terms: evidence required, cancellation policy, dispute window | `service:read` `order:read` |

### Phase 3 — Commit (3 tools)

| Tool | Description | Scopes |
|------|-------------|--------|
| `clients.get_or_create` | Find or create client by email/phone | `patient:write` |
| `scheduling.book` | Book session → `requested`. Optional `resource_id`, optional `submission` | `schedule:write` |
| `scheduling.confirm` | Confirm booking → `confirmed` | `schedule:write` |

### Phase 4 — Lifecycle (4 tools)

| Tool | Description | Scopes |
|------|-------------|--------|
| `lifecycle.get_state` | Current state, available transitions, history | `service:read` |
| `lifecycle.transition` | Execute state transition with evidence | `service:write` |
| `scheduling.reschedule` | Reschedule (contract policy may apply) | `schedule:write` |
| `scheduling.cancel` | Cancel (cancellation policy applied) | `schedule:write` |

### Phase 5 — Verify Delivery (3 tools)

| Tool | Description | Scopes |
|------|-------------|--------|
| `delivery.checkin` | Check-in: GPS + timestamp → `in_progress` | `evidence:write` |
| `delivery.checkout` | Check-out: GPS + timestamp → `completed` (duration auto-calculated) | `evidence:write` |
| `delivery.record_evidence` | Record evidence: gps, signature, photo, document, duration, notes | `evidence:write` |

**Evidence sensitivity:** Each evidence envelope supports an optional `data_sensitivity` field (`public`, `internal`, `confidential`, `restricted`). Default: `internal`. See [PROTOCOL.md §9.8](./PROTOCOL.md#98-evidence-sensitivity-classification) for level definitions and per-vertical defaults. `restricted` evidence requires encryption at rest, access logging, and retention policies.

### Phase 6 — Close (4 tools)

| Tool | Description | Scopes |
|------|-------------|--------|
| `documentation.create` | Generate service record → `documented` | `document:write` |
| `payments.create_sale` | Create charge → `invoiced` | `payment:write` |
| `payments.record_payment` | Record payment received | `payment:write` |
| `payments.get_status` | Payment status or client account balance | `payment:read` |

### Resource Management (6 tools)

| Tool | Description | Scopes |
|------|-------------|--------|
| `resource.list` | List physical resources by organization | `resource:read` |
| `resource.get` | Resource details + availability slots | `resource:read` |
| `resource.create` | Create resource (room, box, equipment) | `resource:write` |
| `resource.update` | Update resource (patch semantics) | `resource:write` |
| `resource.delete` | Soft delete (`is_active = false`) | `resource:write` |
| `resource.get_availability` | Availability by date range | `resource:read` |

### Resolver Administration (3 tools)

| Tool | Description | Scopes |
|------|-------------|--------|
| `resolve.register` | Register org in global resolver | `resolve:write` |
| `resolve.update_endpoint` | Update endpoints (backend portability) | `resolve:write` |
| `telemetry.heartbeat` | Heartbeat: node is alive | `telemetry:write` |

---

## 6. Minimum Implementation Requirements

From PROTOCOL.md §16. To be listed as a compatible Servicialo implementation:

| # | Requirement | Reference | Mandatory |
|:-:|-------------|-----------|:---------:|
| 1 | Model services using the **8 dimensions** | §5 | Yes |
| 2 | Implement the **6 core lifecycle states** (requested through documented). Financial states (invoiced, collected, verified) are optional extensions. | §6 | Yes |
| 3 | Handle **at least 3 exception flows** | §7 | Yes |
| 4 | Expose an **API that an MCP server can connect to** | §13 | Yes |
| 5 | Model Service Orders (§8 schema) | §8 | No |
| 6 | Implement the Delegated Agency Model | §10 | No |
| 7 | Implement Provider Profiles | §12 | No |
| 8 | Contribute to Network Intelligence | §14 | No |

---

## 7. API Surface

The MCP server connects to a backend via an adapter. The backend must expose endpoints covering these operations (inferred from tool definitions). HTTP routes are not prescribed by the protocol — each implementation chooses its own REST surface.

### Discovery (public, no auth)

| Operation | Input | Output |
|-----------|-------|--------|
| Search organizations | `vertical`, `location`, `country` | Organization list |
| Get organization details | `org_id` or `slug` | Public profile, services, providers |
| Get server manifest | — | Capabilities, protocol version, org metadata |
| Check availability | `service_id`, `provider_id`?, `resource_id`?, `date_from`, `date_to` | Available time slots with confidence scores |
| List services | `org_id` | Service catalog |
| Get A2A agent card | `org_id` | A2A Agent Card JSON |

### DNS Resolution (public, no auth)

| Operation | Input | Output |
|-----------|-------|--------|
| Lookup org endpoint | `org_slug` | MCP/REST endpoint URL, trust level |
| Search resolver | `country`, `vertical` | Matching organizations |
| Get trust score | `org_slug` | Score 0–100, level, last activity |

### Authenticated operations (API key + org ID)

| Operation | Input | Output |
|-----------|-------|--------|
| Get service (8 dimensions) | `service_id` | Full service object |
| Get contract | `service_id` or `order_id` | Contract terms |
| Get or create client | `email` or `phone`, `name` | Client record |
| Book session | `service_id`, `provider_id`, `client_id`, `datetime`, `resource_id`?, `submission`? | Booking in `requested` state |
| Confirm session | `booking_id` | Booking in `confirmed` state |
| Get lifecycle state | `session_id` | Current state + transitions + history |
| Transition state | `session_id`, `to_state`, `evidence`? | Updated state |
| Reschedule | `session_id`, `new_datetime` | Rescheduled session |
| Cancel | `session_id`, `reason`? | Cancelled session |
| Check-in | `session_id`, `gps`, `timestamp` | Session in `in_progress` |
| Check-out | `session_id`, `gps`, `timestamp` | Session in `completed` |
| Record evidence | `session_id`, `type`, `payload` | Evidence attached |
| Create documentation | `session_id`, `content` | Session in `documented` |
| Create sale | `session_id`, `amount`? | Sale/invoice created |
| Record payment | `sale_id`, `method`, `amount` | Payment recorded |
| Get payment status | `sale_id` or `client_id` | Payment status / balance |
| CRUD resources | `resource_id`?, fields | Resource entity |
| Resource availability | `resource_id`, `date_from`, `date_to` | Available slots |
| Register in resolver | `org_slug`, `endpoints` | Registration confirmed (subject to readiness validation) |
| Update endpoint | `org_slug`, `endpoints` | Endpoints updated |
| Send heartbeat | `org_slug` | Heartbeat acknowledged |

### Submission Context

`scheduling.book` MAY accept a `submission` object:

- `channel` (enum: `web` | `whatsapp` | `phone` | `chat` | `api` | `other`) — REQUIRED
- `submitted_by_type` (enum: `human` | `agent` | `human_with_agent_assistance`) — REQUIRED
- `agent_id` (string) — REQUIRED when `submitted_by_type` includes "agent"
- `agent_name` (string) — OPTIONAL
- `platform` (string) — OPTIONAL

When `submitted_by_type` is `agent` or `human_with_agent_assistance`, `agent_id` MUST reference a valid mandate. Implementations MUST persist submission context for audit purposes.

### Rate Limiting

Public (unauthenticated) endpoints MUST implement rate limiting. Rate-limited responses MUST return HTTP 429 with a `Retry-After` header (seconds until next allowed request).

Implementations SHOULD include the following headers on all public responses:

- `X-RateLimit-Limit` — maximum requests per window
- `X-RateLimit-Remaining` — remaining requests in current window

MCP servers that proxy to an upstream backend MUST forward 429 responses and `Retry-After` values to the calling agent.

### Registry Readiness Validation

Before accepting `resolve.register`, the resolver MUST verify that the organization meets minimum bookability requirements:

- At least one active service
- At least one provider assigned to that service
- At least one availability block configured for that provider

Registration attempts that fail this check MUST return HTTP 422 with error code `not_bookable` and a human-readable message indicating which requirement is missing. Implementations MAY perform this validation at registration time (server-side) or delegate to the resolver (registry-side). At least one party MUST enforce it.

**Authentication:** All authenticated operations require `X-API-Key` + `X-Org-Id` headers. When `actor.type = agent`, a valid ServiceMandate (§10) with appropriate scopes is additionally required.
