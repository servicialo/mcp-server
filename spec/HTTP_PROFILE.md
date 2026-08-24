# Servicialo HTTP Profile

**Canonical HTTP binding for the Servicialo MCP Tool Interface**

| | |
|---|---|
| **Profile Version** | 1.1.0 |
| **Protocol Version** | 0.10 |
| **Date** | 2026-08-24 |
| **Status** | Draft |
| **License** | Apache-2.0 |

---

## Erratum — what changed in 1.1.0

**1.0.0 described a binding design that was never the implemented reference
wire.** It specified a JSON:API envelope, a `/v1/` base path, an
`X-Servicialo-Actor` header, and paths (`/registry/organizations`,
`/sessions/{id}/transitions`, `/availability`) that no reference client has
ever called. An implementer who built against it would not have interoperated
with the reference implementation.

**1.1.0 documents the contract that actually runs**: the paths, methods, bodies
and vocabulary produced by the reference tool handlers
(`packages/mcp-server/src/tools/**`) through `HttpAdapter`
(`packages/mcp-server/src/adapter-http.ts`), which is the codepath an agent
uses against a non-Coordinalo node. Where this document and the reference code
disagreed, the code won. Where the code diverges from `PROTOCOL.md`, the
divergence is labelled as such and left in place.

**`X-Servicialo-Version` remains `1.0`** because no public wire was ever
implemented under the 1.0.0 design: there is no deployed consumer of the
envelope, paths or header this document previously described, so nothing
observable broke. The header versions the observable contract (§2.2.1), not
this document.

The evidence behind each change is recorded in
[`docs/analysis/contract-audit-2026-08-24.md`](../docs/analysis/contract-audit-2026-08-24.md).

---

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Conventions](#2-conventions)
3. [Compliance Levels](#3-compliance-levels)
4. [Phase 1 — Discovery](#4-phase-1--discovery)
5. [Phase 2 — Understanding](#5-phase-2--understanding)
6. [Phase 3 — Commitment](#6-phase-3--commitment)
7. [Phase 4 — Lifecycle](#7-phase-4--lifecycle)
8. [Phase 5 — Delivery Verification](#8-phase-5--delivery-verification)
9. [Phase 6 — Closing](#9-phase-6--closing)
10. [Service Orders](#10-service-orders)
11. [Mandate Management](#11-mandate-management)
12. [Resource Management](#12-resource-management)
13. [HTTP Gaps](#13-http-gaps)

---

## 1. Purpose

The Servicialo protocol (§13) defines its tool interface as MCP operations. This document defines a canonical HTTP profile that maps every MCP tool to a REST endpoint with exact semantic parity. HTTP and MCP are **parallel channels** — neither wraps the other. A conformant HTTP implementation MUST produce identical outcomes to a conformant MCP implementation for the same logical operation.

This profile does NOT define authentication mechanisms. Implementations MUST provide authentication but MAY choose any scheme (Bearer tokens, API keys, OAuth 2.0, etc.). The profile defines only the `Authorization` header requirement.

---

## 2. Conventions

### 2.1 Base Path

All endpoints in this document are written relative to `/v1/`, and resolve
against the implementation's base URL:

```
{base}/v1/
```

`{base}` is the value a client is configured with (`SERVICIALO_BASE_URL` in the
reference client). It MAY include a host-specific prefix — `https://api.example.com`
and `https://example.com/servicialo` are both valid, yielding
`https://api.example.com/v1/sessions` and `https://example.com/v1/sessions`.

Implementations MUST NOT require the literal segment `/servicialo` before `/v1`.
1.0.0 specified a fixed `/v1/` base; the reference adapter has always
concatenated `{base}` + `/v1` + path
(`packages/mcp-server/src/adapter-http.ts`), so a node that only answers on
`/v1/` is unreachable unless the operator folds that segment into
`{base}`.

### 2.2 Required HTTP Headers

Every request MUST include:

| Header | Value | Notes |
|---|---|---|
| `Content-Type` | `application/json` | Required for requests with a body. |
| `Accept` | `application/json` | RECOMMENDED. The reference client does not send it; servers MUST NOT require it. |
| `X-Servicialo-Version` | `1.0` | Version of this HTTP binding — see §2.2.1. Servers MUST reject unknown versions with `406`. |

Authenticated endpoints additionally require:

| Header | Value |
|---|---|
| `Authorization` | Implementation-defined (e.g., `Bearer <token>`, `ApiKey <key>`). |

#### 2.2.1 What `X-Servicialo-Version` versions

`X-Servicialo-Version` identifies a compatible family of the observable HTTP
contract. It changes when, and only when, a change is incompatible for a
consumer: paths, methods, required fields, wire vocabulary, error codes,
preconditions, or observable semantics.

It does **not** automatically follow the protocol version, and it does not
follow the editorial revision of this document. Three versions are in play and
they are deliberately independent:

| Version | Current | What it tracks |
|---|---|---|
| Protocol | `0.10` (draft) | The protocol itself — `protocol/manifest.yaml` → `protocol.version`. |
| HTTP Profile document | `1.1.0` | The editorial revision of *this document* — `bindings.http.profile_version`. |
| `X-Servicialo-Version` | `1.0` | The observable HTTP contract — `bindings.http.resolver_api_version`. |

So "HTTP Profile 1.1.0 / Protocol 0.10 draft / `X-Servicialo-Version` 1.0" is
not a contradiction: the header versions compatibility, not maturity and not
edition. A draft protocol can have a stable binding; rewriting this document to
describe the same wire more accurately changes the profile version and leaves
the header untouched.

Implementations MUST send the literal value above. Servers MUST reject an
unknown value with `406`.

### 2.3 Actor

The actor travels **in the request body**, as a field named `actor`, on every
write operation. Servers MUST accept it there.

```json
{
  "type": "agent",
  "id": "agent_scheduler_01",
  "mandate_id": "mdt_01JAXYZ",
  "on_behalf_of": {
    "type": "professional",
    "id": "provider_abc"
  }
}
```

When `actor.type` is `agent`, the `mandate_id` field is REQUIRED per protocol §10.

1.0.0 specified an `X-Servicialo-Actor` header carrying this object Base64-encoded.
**No reference tool sends that header** and no reference client reads it, so it is
removed rather than kept as an unexercised alternative. Implementations MAY accept
it as an extension; they MUST NOT require it.

### 2.3.1 Organization context

Authenticated requests carry the organization in the `X-Servicialo-Org` header
(`packages/mcp-server/src/adapter-http.ts`). This header runs today and was
undocumented in 1.0.0.

| Header | Value | Notes |
|---|---|---|
| `X-Servicialo-Org` | Organization slug or id | Sent on authenticated requests, and on public requests when the client is org-scoped. |
| `X-Servicialo-Node-Token` | Opaque token | Sent on public requests when `SERVICIALO_NODE_TOKEN` is set. Optional. |

### 2.4 Response Envelope

**Responses are plain JSON objects.** There is no envelope: a resource is
returned as the resource, a collection as an array or as an object whose fields
the client reads directly.

1.0.0 specified a JSON:API envelope (`{"data":{"type","id","attributes"}}`).
No reference tool produces or unwraps it: every handler returns `res.json()`
verbatim to the caller (`packages/mcp-server/src/adapter-http.ts`). An
implementation that wrapped its payloads as 1.0.0 described would hand agents
an object whose fields are one level deeper than any consumer expects.

#### 2.4.1 Single resource

```json
{
  "id": "ses_abc123",
  "status": "confirmed",
  "serviceId": "svc_001",
  "startTime": "2026-03-16T09:00:00-03:00"
}
```

#### 2.4.2 Collection

```json
[
  { "id": "svc_001", "name": "Kinesiología", "duration_minutes": 45 }
]
```

Implementations MAY return a wrapper object with the collection under a named
field (the reference availability endpoint returns `slots`). Clients MUST NOT
assume a fixed wrapper name across operations; each operation below documents
what it returns.

#### 2.4.3 Action result

For endpoints that trigger an action (confirm, transition, cancel), the response
SHOULD return the affected resource in its new state, so the caller can read the
resulting `status` without a follow-up read.

### 2.5 Errors

**What the reference client does:** any non-2xx response is a failure. It reads
the body as text and raises an error carrying the method, path, status and that
text (`packages/mcp-server/src/adapter-http.ts`). It does **not** parse a JSON
error body, and it does not branch on any error code.

Consequently:

- Implementations MUST signal failure with an appropriate HTTP status code.
  This is the only part of error handling any reference codepath depends on.
- The structured envelope below is **RECOMMENDED**, not required. It is **not
  exercised by the reference client** — no reference code reads `errors[]`,
  `code`, `title`, `source`, or any of the codes in the table. Declaring it a
  MUST would assert an interoperability guarantee nothing verifies.
- A machine-readable `code` remains valuable for humans debugging an
  integration and for future clients; new implementations SHOULD emit it.

```json
{
  "errors": [
    {
      "status": "422",
      "code": "INVALID_TRANSITION",
      "title": "Invalid state transition",
      "detail": "Cannot transition from 'requested' to 'in_progress'. Valid targets: ['scheduled'].",
      "source": { "pointer": "/toState" }
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | Yes* | HTTP status code as a string. |
| `code` | string | Yes* | Machine-readable error code. Uppercase snake_case. |
| `title` | string | Yes* | Short human-readable summary. Stable across locales. |
| `detail` | string | No | Instance-specific explanation. |
| `source.pointer` | string | No | JSON Pointer to the offending field. |
| `source.parameter` | string | No | Query parameter name, if applicable. |

\* Required *within the envelope*, when an implementation chooses to emit it.
The envelope itself is RECOMMENDED.

#### Standard Error Codes (RECOMMENDED)

None of these is exercised by the reference client; the HTTP status is what it
acts on.

| Code | Status | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Resource does not exist. |
| `VALIDATION_ERROR` | 422 | Request body failed schema validation. |
| `INVALID_TRANSITION` | 422 | State transition is not permitted. |
| `MANDATE_REQUIRED` | 403 | Agent action requires a valid mandate. |
| `MANDATE_EXPIRED` | 403 | Mandate has expired or been revoked. |
| `SCOPE_INSUFFICIENT` | 403 | Mandate does not grant the required scope. |
| `CONFLICT` | 409 | Resource state conflicts with the operation. |
| `UNSUPPORTED_VERSION` | 406 | `X-Servicialo-Version` header is unknown. |
| `UNAUTHORIZED` | 401 | Missing or invalid credentials. |
| `FORBIDDEN` | 403 | Valid credentials but insufficient permissions. |
| `RESOURCE_UNAVAILABLE` | 409 | Physical resource is not available for the requested slot. |

### 2.6 Pagination

**Not verified.** 1.0.0 required `page`/`per_page` query parameters and
`meta`/`links` in every collection response. No reference tool sends either
parameter, and no reference code reads `meta` or `links`, so this profile
cannot state a requirement that any implementation has met.

Implementations that paginate SHOULD use `page` (1-indexed) and `per_page`
(default `20`, maximum `100`), and SHOULD describe the shape they return in
their own documentation. Clients MUST NOT assume pagination is present.

`registry.search` and `scheduling.check_availability` accept a `limit` and a
date range respectively (§4.1, §4.4) — those are the only result-bounding
parameters any reference tool sends.

### 2.7 Date and Time

All datetime values MUST be ISO 8601 with timezone offset or UTC (`Z`). Date-only values (e.g., `date_from`) MUST be `YYYY-MM-DD`.

### 2.8 Idempotency

Clients MAY send an `Idempotency-Key` header on `POST` requests. Servers that support idempotency MUST return the same response for duplicate keys within a reasonable window (RECOMMENDED: 24 hours).

---

## 3. Compliance Levels

### 3.1 REQUIRED — Minimum Compliance

An implementation MUST support these 6 endpoints to claim Servicialo HTTP
compliance. They are the operations named in
`conformance.core.required_operations` in
[`protocol/manifest.yaml`](../protocol/manifest.yaml) — **that list is
canonical; this table restates it.** `scripts/verify-conformance-parity.mjs`
fails CI if the two disagree.

Each satisfies one clause of the CORE sentence in
[`public/spec/certification.md`](../public/spec/certification.md): *a consumer
MUST be able to discover an offer, know its availability before committing it,
create the commitment, manage that commitment's lifecycle, and record evidence
of delivery.*

| # | MCP Tool | HTTP Endpoint | Clause |
|---|---|---|---|
| 1 | `registry.manifest` | `GET /v1/manifest` | the node declares itself |
| 2 | `services.list` | `GET /v1/organizations/{org_slug}/services` | discover an offer |
| 3 | `scheduling.check_availability` | `GET /v1/organizations/{org_slug}/availability` | know availability before committing it |
| 4 | `scheduling.book` | `POST /v1/sessions` | create the commitment |
| 5 | `lifecycle.transition` | `POST /v1/sessions/{session_id}/lifecycle/transition` | manage the lifecycle |
| 6 | `delivery.record_evidence` | `POST /v1/sessions/{session_id}/evidence` | record evidence of delivery |

**What changed from 1.0.0, and why.** The 1.0.0 table listed
`registry.search`, `service.get` and `payments.create_sale` as REQUIRED and
omitted `registry.manifest`, `services.list` and `scheduling.check_availability`
— while marking `registry.manifest` REQUIRED in its own section (§4.0), so the
document contradicted itself on the count.

- `registry.search` is **not a node requirement**: cross-node discovery is the
  resolver's job. A node is discoverable because it is registered.
- `service.get` returns the 8 dimensions of one delivery and is genuinely
  useful, but a consumer can discover, commit and deliver without it. OPTIONAL.
- `payments.create_sale` is **settlement**, an OPTIONAL/FULL capability (§9.2).
  Requiring it would make every free or externally-billed service non-conformant.
- `scheduling.check_availability` is required because committing a slot without
  being able to ask whether it is free is not a usable coordination contract.
  It was already listed as mandatory in `IMPLEMENTORS.md` and already exercised
  by the compatibility suite; naming it here makes those consistent.

### 3.2 OPTIONAL — Extended Compliance

All other endpoints in this profile are OPTIONAL. Implementations SHOULD declare
which they support via the capabilities endpoint (§3.3).

Three OPTIONAL endpoints are **conveniences**: their effect is reachable through
the required operations, which is why requiring them would inflate CORE without
adding a capability.

| Convenience | Expressible as |
|---|---|
| `scheduling.confirm` (§6.3) | `lifecycle.transition` → `confirmed` |
| `delivery.checkin` (§8.1) | `lifecycle.transition` → `in_progress`, plus `delivery.record_evidence` (`gps`) |
| `delivery.checkout` (§8.2) | `lifecycle.transition` → `delivered`, plus `delivery.record_evidence` (`gps`, `duration`) |

Verified against the reference tool schemas: `confirmed`, `in_progress` and
`delivered` are all valid `lifecycle.transition` targets, and `gps` and
`duration` are valid `delivery.record_evidence` types. One behaviour is **not**
reproducible that way: the reference implementation computes real duration
automatically on checkout. That is reference behaviour, not a protocol
requirement — a client using the required operations supplies duration itself.

### 3.3 Capabilities Endpoint

Implementations SHOULD expose:

```
GET {base}/v1/
```

Response:

```json
{
  "protocol_version": "0.10",
  "profile_version": "1.1.0",
  "compliance": "extended",
  "capabilities": [
    "registry.manifest",
    "services.list",
    "scheduling.check_availability",
    "scheduling.book",
    "lifecycle.transition",
    "delivery.record_evidence",
    "registry.search",
    "registry.get_organization",
    "service.get",
    "contract.get",
    "clients.get_or_create",
    "scheduling.confirm",
    "lifecycle.get_state",
    "scheduling.reschedule",
    "scheduling.cancel",
    "delivery.checkin",
    "delivery.checkout",
    "documentation.create",
    "payments.create_sale",
    "payments.record_payment",
    "payments.get_status"
  ]
}
```

---

## 4. Phase 1 — Discovery

These endpoints are PUBLIC. They MUST NOT require authentication.

---

### 4.0 `registry.manifest`

Server manifest — returns protocol version, server name, and available endpoints.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `registry.manifest` |
| **Method** | `GET` |
| **Path** | `/v1/manifest` |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Server manifest object. |

```json
{
  "protocol_version": "0.10",
  "name": "Coordinalo",
  "description": "Plataforma abierta para la gestión integral de servicios profesionales.",
  "endpoints": {
    "registry": "/api/servicialo/registry",
    "services": "/api/servicialo/{orgSlug}/services",
    "availability": "/api/servicialo/{orgSlug}/availability"
  }
}
```

---

### 4.1 `registry.search`

Search organizations by vertical and location.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `registry.search` |
| **Method** | `GET` |
| **Path** | `/v1/registry` |

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `vertical` | string | Yes | — | Service vertical (e.g., `kinesiologia`, `dental`). |
| `location` | string | No | — | City or district filter. |
| `country` | string | No | `cl` | ISO 3166-1 alpha-2 country code. |
| `limit` | integer | No | `10` | Maximum results. Max: `100`. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Collection of organization summaries. |

```json
[
  {
    "slug": "clinica-dental-sur",
    "name": "Clínica Dental Sur",
    "vertical": "dental",
    "location": "Santiago",
    "country": "cl"
  }
]
```

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Missing `vertical` parameter. |

---

### 4.2 `registry.get_organization`

Get public details of an organization.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `registry.get_organization` |
| **Method** | `GET` |
| **Path** | `/v1/organizations/{org_slug}/services` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `org_slug` | string | Organization slug. |

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `country` | string | No | `cl` | ISO 3166-1 alpha-2. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Organization with services, professionals, and booking configuration. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Organization slug does not exist. |

---

### 4.3 `services.list`

List the public service catalog of an organization.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `services.list` |
| **Method** | `GET` |
| **Path** | `/v1/organizations/{org_slug}/services` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `org_slug` | string | Organization slug. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Collection of public Service objects (per `schema/service.schema.json`). |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Organization slug does not exist. |

---

### 4.4 `scheduling.check_availability`

Check available time slots without authentication.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `scheduling.check_availability` |
| **Method** | `GET` |
| **Path** | `/v1/organizations/{org_slug}/availability` |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `org_slug` | string | Yes | Organization slug. |
| `date_from` | date | Yes | Start date (`YYYY-MM-DD`). |
| `date_to` | date | Yes | End date (`YYYY-MM-DD`). |
| `service_id` | string | No | Filter by service. |
| `provider_id` | string | No | Filter by provider. |
| `resourceId` | string | No | Filter by physical resource. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Collection of available time slots. |

```json
{
  "slots": [
    {
      "providerId": "prov_abc",
      "start": "2026-03-16T12:00:00Z",
      "end": "2026-03-16T12:45:00Z",
      "resourceId": "res_box3"
    }
  ],
  "timezone": "America/Santiago"
}
```

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Missing required query parameters. |

---

## 5. Phase 2 — Understanding

These endpoints require authentication.

---

### 5.1 `service.get`

Get the full 8-dimension service definition.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service.get` |
| **Required Scope** | `service:read` |
| **Method** | `GET` |
| **Path** | `/v1/services/{service_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `service_id` | string | Service identifier. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Service object per `schema/service.schema.json`. |

```json
{
  "id": "svc_kinesiologia_45",
  "type": "physical_therapy_session",
  "vertical": "health",
  "name": "Sesión de rehabilitación — 45 min",
  "duration_minutes": 45,
  "provider": { "id": "prov_abc", "organization_id": "org_xyz" },
  "client": { "id": "cli_001" },
  "schedule": { "requested_at": "2026-03-15T08:00:00Z" },
  "location": { "type": "in_person", "room": "Box 3" },
  "lifecycle": { "current_state": "requested" },
  "proof": {},
  "billing": { "amount": { "value": 35000, "currency": "CLP" } }
}
```

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Service does not exist. |
| `403` | `SCOPE_INSUFFICIENT` | Mandate lacks `service:read`. |

---

### 5.2 `contract.get`

Get the service contract (rules, policies, evidence requirements).

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `contract.get` |
| **Required Scope** | `service:read` or `order:read` |
| **Method** | `GET` |
| **Path** | `/v1/services/{service_id}/contract` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `service_id` | string | Service identifier. |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `org_id` | string | Yes | Organization identifier. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Contract object with cancellation, no-show, arbitration policies, and required evidence. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Service or organization does not exist. |

---

## 6. Phase 3 — Commitment

---

### 6.1 `clients.get_or_create`

Find a client by email or phone. If not found, create with the provided data. Upsert semantics.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `clients.get_or_create` |
| **Required Scope** | `patient:write` |
| **Method** | `POST` |
| **Path** | `/v1/clients` |

**Request Body**

```json
{
  "email": "maria@example.com",
  "phone": "+56912345678",
  "name": "María",
  "lastName": "González",
  "actor": { "type": "agent", "id": "agent_01", "mandate_id": "mdt_abc" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string (email) | No* | Client email. Search key. |
| `phone` | string | No* | Client phone. Search key if no email. |
| `name` | string | No** | First name. Required if creating. |
| `lastName` | string | No** | Last name. Required if creating. |
| `actor` | Actor | Yes | Who performs the action. |

\* At least one of `email` or `phone` is REQUIRED.
\** REQUIRED when the client does not already exist.

**Success Responses**

| Status | Condition | Body |
|---|---|---|
| `200 OK` | Client found. | Client object with history summary. |
| `201 Created` | Client created. | New client object. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Neither `email` nor `phone` provided. |

---

### 6.2 `scheduling.book`

Book a new session. Creates the session in `requested` state.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `scheduling.book` |
| **Required Scope** | `schedule:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions` |

**Request Body**

```json
{
  "serviceId": "svc_001",
  "providerId": "prov_abc",
  "clientId": "cli_001",
  "startTime": "2026-03-16T09:00:00-03:00",
  "resourceId": "res_box3",
  "actor": { "type": "agent", "id": "agent_01", "mandate_id": "mdt_abc" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `serviceId` | string | Yes | Service to book. |
| `providerId` | string | Yes | Assigned provider. |
| `clientId` | string | Yes | Client/beneficiary. |
| `startTime` | datetime | Yes | Session start time (ISO 8601). |
| `resourceId` | string | No | Physical resource. REQUIRED if the service specifies `location.resource_id`. |
| `actor` | Actor | Yes | Who performs the action. |
| `human_intent_confirmed` | boolean | No | Caller asserts a human reviewed and confirmed this booking intent. Defaults to `false`. Caller-neutral vocabulary; see §6.2.1. |

**Success Response**

| Status | Body |
|---|---|
| `201 Created` | Session object in `requested` state. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `409` | `CONFLICT` | Time slot is no longer available. |
| `409` | `RESOURCE_UNAVAILABLE` | Physical resource is booked for this slot. |
| `422` | `VALIDATION_ERROR` | Missing required fields. |

#### 6.2.1 Implementer Considerations (non-normative)

The `human_intent_confirmed` field is caller-neutral vocabulary: it records
what the caller asserts, not what the implementer must do. Implementations
that accept bookings without confirmed human intent are encouraged to apply
abuse-mitigation measures appropriate to their deployment. The choice of
mechanisms and thresholds — rate-limit windows, audit retention, identity
probes, response shaping — is implementation policy and out of scope for
this specification.

---

### 6.3 `scheduling.confirm`

Confirm a booked session. Moves to `confirmed` state.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `scheduling.confirm` |
| **Required Scope** | `schedule:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions/{session_id}/confirm` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "actor": { "type": "client", "id": "cli_001" }
}
```

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Session object in `confirmed` state. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `422` | `INVALID_TRANSITION` | Session is not in a confirmable state. |

---

## 7. Phase 4 — Lifecycle

---

### 7.1 `lifecycle.get_state`

Get the current lifecycle state, available transitions, and transition history.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `lifecycle.get_state` |
| **Required Scope** | `service:read` |
| **Method** | `GET` |
| **Path** | `/v1/sessions/{session_id}/lifecycle` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Lifecycle state with available transitions and history. |

```json
{
  "id": "ses_abc123",
  "current_state": "confirmed",
  "available_transitions": ["in_progress", "cancelled"],
  "transitions": [
    { "from": null, "to": "requested", "at": "2026-03-15T08:00:00Z", "by": "agent_01", "method": "agent" },
    { "from": "requested", "to": "confirmed", "at": "2026-03-15T08:05:00Z", "by": "cli_001", "method": "manual" }
  ]
}
```

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |

---

### 7.2 `lifecycle.transition`

Execute a state transition on a session.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `lifecycle.transition` |
| **Required Scope** | `service:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions/{session_id}/lifecycle/transition` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "toState": "in_progress",
  "actor": { "type": "provider", "id": "prov_abc" },
  "reason": null,
  "evidence": {}
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `toState` | enum | Yes | Target state, from the canonical lifecycle enum (`PROTOCOL.md` §6): `scheduled`, `confirmed`, `in_progress`, `completed`, `documented`, `invoiced`, `collected`, `verified`, `cancelled`. **The reference implementation diverges — see below.** |
| `actor` | Actor | Yes | Who triggers the transition. |
| `reason` | string | No | Reason. REQUIRED for `cancelled`. |
| `evidence` | object | No | Evidence required by the contract for this transition. |

> **Reference implementation divergence.** The reference `lifecycle.transition`
> tool accepts `delivered` and `charged` where the canonical enum has
> `completed` and `invoiced`/`collected`
> (`packages/mcp-server/src/tools/authenticated/lifecycle.ts`). This is a known
> divergence recorded in
> [`protocol/manifest.yaml`](../protocol/manifest.yaml) under
> `state_machines.service_lifecycle.reference_implementation_divergence`, kept
> for compatibility with the Coordinalo upstream API. A coordinated migration
> is in progress in
> [PR #23](https://github.com/servicialo/mcp-server/pull/23).
>
> This is **the reference implementation's vocabulary, not the protocol's**. A
> new implementation SHOULD accept the canonical values. One that also accepts
> `delivered`/`charged` will interoperate with reference clients built before
> the migration lands.

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Session object with updated state and transition record. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `422` | `INVALID_TRANSITION` | Transition is not permitted from the current state. |
| `422` | `VALIDATION_ERROR` | Missing required `reason` for cancellation. |

---

### 7.3 `scheduling.reschedule`

Reschedule a session to a new date/time. Exception flow (§7.5).

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `scheduling.reschedule` |
| **Required Scope** | `schedule:write` |
| **Method** | `PUT` |
| **Path** | `/v1/sessions/{session_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "startTime": "2026-03-17T10:00:00-03:00",
  "actor": { "type": "client", "id": "cli_001" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `startTime` | datetime | Yes | New start time (ISO 8601). |
| `actor` | Actor | Yes | Who reschedules. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Session object with new scheduled time (state returns to `scheduled`). |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `409` | `CONFLICT` | New time slot is not available. |
| `422` | `INVALID_TRANSITION` | Session cannot be rescheduled from its current state. |

---

### 7.4 `scheduling.cancel`

Cancel a session. Applies cancellation policy per contract (§7.3).

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `scheduling.cancel` |
| **Required Scope** | `schedule:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions/{session_id}/cancel` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "reason": "Client requested reschedule but no compatible slot available.",
  "actor": { "type": "client", "id": "cli_001" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | No | Cancellation reason. |
| `actor` | Actor | Yes | Who cancels. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Session object in `cancelled` state with cancellation policy applied. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `422` | `INVALID_TRANSITION` | Session is in a non-cancellable state (e.g., already `verified`). |

---

## 8. Phase 5 — Delivery Verification

---

### 8.1 `delivery.checkin`

Record provider or client check-in. Moves session to `in_progress`.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `delivery.checkin` |
| **Required Scope** | `evidence:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions/{session_id}/checkin` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "actor": { "type": "provider", "id": "prov_abc" },
  "location": { "lat": -33.4489, "lng": -70.6693 },
  "timestamp": "2026-03-16T09:02:00-03:00"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `actor` | Actor | Yes | Who checks in. |
| `location` | object | No | GPS coordinates (`lat`, `lng`). |
| `timestamp` | datetime | No | Check-in time. Default: server time. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Session object in `in_progress` state with check-in recorded. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `422` | `INVALID_TRANSITION` | Session is not in `confirmed` state. |

---

### 8.2 `delivery.checkout`

Record check-out at service completion. Moves session to `completed`.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `delivery.checkout` |
| **Required Scope** | `evidence:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions/{session_id}/checkout` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "actor": { "type": "provider", "id": "prov_abc" },
  "location": { "lat": -33.4489, "lng": -70.6693 },
  "timestamp": "2026-03-16T09:47:00-03:00"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `actor` | Actor | Yes | Who checks out. |
| `location` | object | No | GPS coordinates (`lat`, `lng`). |
| `timestamp` | datetime | No | Check-out time. Default: server time. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Session object in `completed` state with duration calculated. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `422` | `INVALID_TRANSITION` | Session is not in `in_progress` state. |

---

### 8.3 `delivery.record_evidence`

Record proof-of-delivery evidence.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `delivery.record_evidence` |
| **Required Scope** | `evidence:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions/{session_id}/evidence` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "evidenceType": "gps",
  "data": { "lat": -33.4489, "lng": -70.6693, "accuracy_meters": 5 },
  "data_sensitivity": "internal",
  "actor": { "type": "provider", "id": "prov_abc" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `evidenceType` | enum | Yes | `gps`, `signature`, `photo`, `document`, `duration`, `notes`. |
| `data` | object | Yes | Type-specific payload. |
| `actor` | Actor | Yes | Who records the evidence. |

**Success Response**

| Status | Body |
|---|---|
| `201 Created` | Session object with evidence recorded. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `422` | `VALIDATION_ERROR` | Invalid evidence type or data payload. |

---

## 9. Phase 6 — Closing

---

### 9.1 `documentation.create`

Generate the service record (clinical note, inspection report, etc.).

**Precondition — reference behaviour, not a protocol MUST.** The reference tool
documents that this is called after delivery, and the reference implementation
requires the session to have completed before it will accept documentation.
`PROTOCOL.md` does not state that ordering as a normative requirement, and
§6.0 explicitly imposes no total order across delivery, evidence, acceptance and
settlement — so this profile records it as the reference's behaviour rather than
a requirement on every implementation. Whether the upstream enforces it in every
case is **not verified** from this repository.

**Effect:** in the reference implementation the session moves to `documented`.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `documentation.create` |
| **Required Scope** | `document:write` |
| **Method** | `POST` |
| **Path** | `/v1/sessions/{session_id}/documentation` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "content": "Paciente presenta mejoría en rango de movimiento...",
  "templateId": "tmpl_clinical_note",
  "actor": { "type": "provider", "id": "prov_abc" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `content` | string | Yes | Documentation content. |
| `templateId` | string | No | Template identifier, if applicable. |
| `actor` | Actor | Yes | Who creates the documentation. |

**Success Response**

| Status | Body |
|---|---|
| `201 Created` | Session object in `documented` state with documentation record. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Session does not exist. |
| `422` | `INVALID_TRANSITION` | Session is not in `completed` state. |

---

### 9.2 `payments.create_sale`

Create a settlement object (a sale) linked to a delivery.

**Settlement is decoupled from the lifecycle.** Creating a sale does **not**
normatively move the session to `invoiced`. `PROTOCOL.md` §6.0 imposes no total
order across delivery, evidence, acceptance and settlement, and the three
financial states are an OPTIONAL extension — an implementation MAY manage
settlement entirely outside the session lifecycle and remain conformant.

The reference implementation does couple them: creating a sale advances the
session. That is **reference behaviour, documented here so an implementer can
predict it — not a rule to reproduce.**

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `payments.create_sale` |
| **Required Scope** | `payment:write` |
| **Method** | `POST` |
| **Path** | `/v1/sales` |

**Request Body**

```json
{
  "clientId": "cli_001",
  "serviceId": "svc_001",
  "providerId": "prov_abc",
  "quantity": 1,
  "unitPrice": 35000
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `clientId` | string | Yes | — | Client identifier. |
| `serviceId` | string | Yes | — | Service identifier. |
| `providerId` | string | Yes | — | Provider identifier. |
| `quantity` | integer | No | `1` | Number of sessions. |
| `unitPrice` | number | Yes | — | Price per unit. |

**Success Response**

| Status | Body |
|---|---|
| `201 Created` | Sale object. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Missing required fields. |

---

### 9.3 `payments.record_payment`

Record a payment against an existing sale.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `payments.record_payment` |
| **Required Scope** | `payment:write` |
| **Method** | `POST` |
| **Path** | `/v1/payments` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `sale_id` | string | Sale identifier. |

**Request Body**

```json
{
  "ventaId": "sale_001",
  "amount": 35000,
  "paymentMethod": "transferencia",
  "reference": "TRX-20260316-001"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `ventaId` | string | Yes | Identifier of the sale this payment settles. |
| `amount` | number | Yes | Payment amount. |
| `paymentMethod` | enum | Yes | `efectivo`, `transferencia`, `mercadopago`, `tarjeta`. **Spanish values — see note below.** |
| `reference` | string | No | Transaction reference. |

**Success Response**

| Status | Body |
|---|---|
| `201 Created` | Payment record linked to sale. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Sale does not exist. |
| `422` | `VALIDATION_ERROR` | Invalid payment method or amount. |

---

> **Vocabulary note.** `payments.record_payment` is the one reference
> operation whose wire vocabulary is Spanish: the sale identifier is `ventaId`
> and `paymentMethod` takes `efectivo` / `transferencia` / `mercadopago` /
> `tarjeta`. This is documented as it runs, not endorsed. It is unrelated to
> the `delivered`/`charged` lifecycle divergence (§7.2) and is not covered by
> that migration. Renaming it would break the reference implementation, so it
> is tracked as a separate gap.

### 9.4 `payments.get_status`

Get payment status for a specific sale or a client's full account.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `payments.get_status` |
| **Required Scope** | `payment:read` |
| **Method** | `GET` |
| **Path** | `/v1/sales/{sale_id}` or `/v1/clients/{client_id}/account-history` |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sale_id` | string | No* | Sale identifier. |
| `client_id` | string | No* | Client identifier for full account. |

\* Exactly one of `sale_id` or `client_id` is REQUIRED.

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Payment status or account history. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Sale or client does not exist. |
| `422` | `VALIDATION_ERROR` | Neither `sale_id` nor `client_id` provided. |

---

## 10. Service Orders

These endpoints manage bilateral commercial agreements (protocol §8).

> **Specified, not implemented.** No `service_orders.*` tool exists in the reference MCP server (`@servicialo/mcp-server`) today. These operations are tracked as `specified_unimplemented_tools` in `protocol/manifest.yaml`.

---

### 10.1 `service_orders.list`

List service orders.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service_orders.list` |
| **Required Scope** | `order:read` |
| **Method** | `GET` |
| **Path** | `/v1/service-orders` |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `organization_id` | string | No | Filter by organization. |
| `client_id` | string | No | Filter by client. |
| `state` | enum | No | Filter by lifecycle state: `draft`, `proposed`, `negotiating`, `active`, `paused`, `completed`, `cancelled`. |
| `page` | integer | No | Page number. |
| `per_page` | integer | No | Items per page. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Paginated collection of Service Order summaries. |

---

### 10.2 `service_orders.get`

Get full service order details.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service_orders.get` |
| **Required Scope** | `order:read` |
| **Method** | `GET` |
| **Path** | `/v1/service-orders/{order_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `order_id` | string | Service Order identifier. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Service Order object per `schema/service-order.schema.json`. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Order does not exist. |

---

### 10.3 `service_orders.create`

Create a new service order in `draft` state.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service_orders.create` |
| **Required Scope** | `order:write` |
| **Method** | `POST` |
| **Path** | `/v1/service-orders` |

**Request Body**

The body MUST conform to `schema/service-order.schema.json`. The `lifecycle.current_state` field is ignored; the server sets it to `draft`.

**Success Response**

| Status | Body |
|---|---|
| `201 Created` | Service Order object in `draft` state. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Body does not conform to schema. |

---

### 10.4 `service_orders.propose`

Transition a service order from `draft` to `proposed`.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service_orders.propose` |
| **Required Scope** | `order:write` |
| **Method** | `POST` |
| **Path** | `/v1/service-orders/{order_id}/propose` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `order_id` | string | Service Order identifier. |

**Request Body**

```json
{
  "actor": { "type": "organization", "id": "org_xyz" }
}
```

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Service Order in `proposed` state. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Order does not exist. |
| `422` | `INVALID_TRANSITION` | Order is not in `draft` state. |

---

### 10.5 `service_orders.activate`

Transition a service order from `proposed` to `active`.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service_orders.activate` |
| **Required Scope** | `order:write` |
| **Method** | `POST` |
| **Path** | `/v1/service-orders/{order_id}/activate` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `order_id` | string | Service Order identifier. |

**Request Body**

```json
{
  "actor": { "type": "client", "id": "cli_001" }
}
```

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Service Order in `active` state. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Order does not exist. |
| `422` | `INVALID_TRANSITION` | Order is not in `proposed` state. |

---

### 10.6 `service_orders.get_ledger`

Get the real-time computed ledger for a service order.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service_orders.get_ledger` |
| **Required Scope** | `order:read` |
| **Method** | `GET` |
| **Path** | `/v1/service-orders/{order_id}/ledger` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `order_id` | string | Service Order identifier. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Ledger object with `services_verified`, `hours_consumed`, `amount_consumed`, `amount_billed`, `amount_collected`, `amount_remaining`. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Order does not exist. |

---

## 11. Mandate Management

These endpoints manage ServiceMandate objects (protocol §10).

> **Specified, not implemented.** No `mandates.*` tool exists in the reference MCP server (`@servicialo/mcp-server`) today, and mandate scopes are advisory in the reference implementation (not enforced at the MCP tool boundary). Tracked as `specified_unimplemented_tools` in `protocol/manifest.yaml`.

---

### 11.1 `mandates.list`

List mandates issued by the authenticated principal.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `mandates.list` |
| **Required Scope** | `mandate:read` |
| **Method** | `GET` |
| **Path** | `/v1/mandates` |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | enum | No | Filter: `active`, `expired`, `revoked`, `suspended`. |
| `page` | integer | No | Page number. |
| `per_page` | integer | No | Items per page. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Paginated collection of mandates per `schema/service-mandate.schema.json`. |

---

### 11.2 `mandates.get`

Get mandate details.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `mandates.get` |
| **Required Scope** | `mandate:read` |
| **Method** | `GET` |
| **Path** | `/v1/mandates/{mandate_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `mandate_id` | string | Mandate identifier (UUID). |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Mandate object per `schema/service-mandate.schema.json`. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Mandate does not exist. |

---

### 11.3 `mandates.suspend`

Suspend an active mandate.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `mandates.suspend` |
| **Required Scope** | `mandate:admin` |
| **Method** | `POST` |
| **Path** | `/v1/mandates/{mandate_id}/suspend` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `mandate_id` | string | Mandate identifier (UUID). |

**Request Body**

```json
{
  "reason": "Security review in progress."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | No | Suspension reason. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Mandate object with `status: "suspended"`. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Mandate does not exist. |
| `409` | `CONFLICT` | Mandate is already suspended, expired, or revoked. |

---

## 12. Resource Management

These endpoints manage physical resources (rooms, boxes, equipment) per protocol §3 Dimension 3.5b.

---

### 12.1 `resource.list`

List physical resources of an organization.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `resource.list` |
| **Required Scope** | `resource:read` |
| **Method** | `GET` |
| **Path** | `/v1/resources` |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `organizationId` | string | Yes | Organization identifier. |
| `type` | enum | No | Filter: `room`, `box`, `chair`, `equipment`. |
| `is_active` | boolean | No | Filter by active/inactive. |
| `page` | integer | No | Page number. |
| `per_page` | integer | No | Items per page. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Paginated collection of Resource objects. |

---

### 12.2 `resource.get`

Get full details of a physical resource including availability blocks.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `resource.get` |
| **Required Scope** | `resource:read` |
| **Method** | `GET` |
| **Path** | `/v1/resources/{resource_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `resource_id` | string | Resource identifier. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Resource object with `availability` blocks (recurring schedule). |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Resource does not exist. |

---

### 12.3 `resource.create`

Create a new physical resource.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `resource.create` |
| **Required Scope** | `resource:write` |
| **Method** | `POST` |
| **Path** | `/v1/resources` |

**Request Body**

```json
{
  "organizationId": "org_xyz",
  "name": "Box 3",
  "type": "box",
  "capacity": 1,
  "bufferMinutes": 15,
  "equipment": ["camilla", "TENS"],
  "location": "Piso 2, ala norte",
  "actor": { "type": "organization", "id": "org_xyz" }
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `organizationId` | string | Yes | — | Owner organization. |
| `name` | string | Yes | — | Resource name. |
| `type` | enum | No | — | `room`, `box`, `chair`, `equipment`. |
| `capacity` | integer | No | `1` | Simultaneous capacity. |
| `bufferMinutes` | integer | No | `0` | Preparation time between sessions. |
| `equipment` | string[] | No | — | Available equipment. |
| `location` | string | No | — | Physical location within the org. |
| `rules` | object | No | — | Resource-specific rules. |
| `actor` | Actor | Yes | — | Who creates the resource. |

**Success Response**

| Status | Body |
|---|---|
| `201 Created` | Resource object (active by default). |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Missing required fields. |

---

### 12.4 `resource.update`

Partial update of a physical resource (patch semantics).

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `resource.update` |
| **Required Scope** | `resource:write` |
| **Method** | `PATCH` |
| **Path** | `/v1/resources/{resource_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `resource_id` | string | Resource identifier. |

**Request Body**

Only include fields to update. Omitted fields remain unchanged.

```json
{
  "capacity": 2,
  "bufferMinutes": 10,
  "actor": { "type": "organization", "id": "org_xyz" }
}
```

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Updated Resource object. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Resource does not exist. |

---

### 12.5 `resource.delete`

Soft-delete a resource (sets `is_active = false`).

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `resource.delete` |
| **Required Scope** | `resource:write` |
| **Method** | `PATCH` |
| **Path** | `/v1/resources/{resource_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `resource_id` | string | Resource identifier. |

**Request Body**

```json
{
  "isActive": false,
  "actor": { "type": "organization", "id": "org_xyz" }
}
```

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Resource object with `is_active: false`. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Resource does not exist. |

Note: This is always a soft delete. The resource is never physically removed.

---

### 12.6 `resource.get_availability`

Get available time slots for a resource in a date range. Pure calendar query — independent of any service.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `resource.get_availability` |
| **Required Scope** | `resource:read` |
| **Method** | `GET` |
| **Path** | `/v1/resources/{resource_id}/availability` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `resource_id` | string | Resource identifier. |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `date_from` | date | Yes | Start date (`YYYY-MM-DD`). |
| `date_to` | date | Yes | End date (`YYYY-MM-DD`). |
| `timezone` | string | No | IANA timezone (e.g., `America/Santiago`). Default: resource's timezone. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Collection of available time slots. |

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `404` | `NOT_FOUND` | Resource does not exist. |
| `422` | `VALIDATION_ERROR` | Missing date parameters. |

---

## 13. HTTP Gaps

The following MCP behaviors do not have a direct HTTP equivalent. Implementations encountering these scenarios MUST document their approach.

| Gap ID | MCP Behavior | Description |
|---|---|---|
| `[HTTP_GAP: streaming]` | MCP supports streaming responses via SSE. | HTTP implementations MAY support streaming via `text/event-stream` for long-running operations (e.g., `lifecycle.transition` with async evidence validation). This profile does not mandate a streaming convention. |
| `[HTTP_GAP: subscriptions]` | MCP supports server-initiated notifications. | HTTP implementations MAY use webhooks for lifecycle event subscriptions. This profile does not define a webhook registration endpoint. Implementations that support subscriptions SHOULD document their webhook contract separately. |
| `[HTTP_GAP: tool_discovery]` | MCP servers expose their tool catalog via `tools/list`. | The HTTP equivalent is the capabilities endpoint (§3.3). Implementations SHOULD also publish an OpenAPI specification. |
| `[HTTP_GAP: binary_evidence]` | MCP can embed binary data (photos, signatures) inline. | HTTP implementations SHOULD accept binary evidence via `multipart/form-data` on the `POST .../evidence` endpoint. The `Content-Type` header for such requests is `multipart/form-data` instead of `application/vnd.api+json`. The JSON metadata MUST be sent as a part named `meta`. |
| `[HTTP_GAP: batch_operations]` | MCP tools are invoked one at a time. | HTTP implementations MAY support batch requests (e.g., booking multiple sessions atomically). This profile does not define a batch endpoint. |

---

## Appendix A: Endpoint Summary

Compliance in this table is the same set as §3.1, which restates
`conformance.core.required_operations` from
[`protocol/manifest.yaml`](../protocol/manifest.yaml).
`scripts/verify-conformance-parity.mjs` fails CI if this table, §3.1, the
manifest, `spec/openapi.yaml`, the implementer guides or the compatibility
suite disagree.

| # | MCP Tool | Method | Path | Compliance |
|---|---|---|---|---|
| 1 | `registry.manifest` | GET | `/v1/manifest` | REQUIRED |
| 2 | `registry.search` | GET | `/v1/registry` | OPTIONAL |
| 3 | `registry.get_organization` | GET | `/v1/organizations/{org_slug}/services` | OPTIONAL |
| 4 | `services.list` | GET | `/v1/organizations/{org_slug}/services` | REQUIRED |
| 5 | `scheduling.check_availability` | GET | `/v1/organizations/{org_slug}/availability` | REQUIRED |
| 6 | `service.get` | GET | `/v1/services/{service_id}` | OPTIONAL |
| 7 | `contract.get` | GET | `/v1/services/{service_id}/contract` | OPTIONAL |
| 8 | `clients.get_or_create` | POST | `/v1/clients` | OPTIONAL |
| 9 | `scheduling.book` | POST | `/v1/sessions` | REQUIRED |
| 10 | `scheduling.confirm` | POST | `/v1/sessions/{session_id}/confirm` | OPTIONAL |
| 11 | `lifecycle.get_state` | GET | `/v1/sessions/{session_id}/lifecycle` | OPTIONAL |
| 12 | `lifecycle.transition` | POST | `/v1/sessions/{session_id}/lifecycle/transition` | REQUIRED |
| 13 | `scheduling.reschedule` | PUT | `/v1/sessions/{session_id}` | OPTIONAL |
| 14 | `scheduling.cancel` | POST | `/v1/sessions/{session_id}/cancel` | OPTIONAL |
| 15 | `delivery.checkin` | POST | `/v1/sessions/{session_id}/checkin` | OPTIONAL |
| 16 | `delivery.checkout` | POST | `/v1/sessions/{session_id}/checkout` | OPTIONAL |
| 17 | `delivery.record_evidence` | POST | `/v1/sessions/{session_id}/evidence` | REQUIRED |
| 18 | `documentation.create` | POST | `/v1/sessions/{session_id}/documentation` | OPTIONAL |
| 19 | `payments.create_sale` | POST | `/v1/sales` | OPTIONAL |
| 20 | `payments.record_payment` | POST | `/v1/payments` | OPTIONAL |
| 21 | `payments.get_status` | GET | `/v1/sales/{sale_id}` | OPTIONAL |
| 21b | `payments.get_status` (account) | GET | `/v1/clients/{client_id}/account-history` | OPTIONAL |
| 22 | `resource.list` | GET | `/v1/resources` | OPTIONAL |
| 23 | `resource.get` | GET | `/v1/resources/{resource_id}` | OPTIONAL |
| 24 | `resource.create` | POST | `/v1/resources` | OPTIONAL |
| 25 | `resource.update` | PATCH | `/v1/resources/{resource_id}` | OPTIONAL |
| 26 | `resource.delete` | PATCH | `/v1/resources/{resource_id}` | OPTIONAL |
| 27 | `resource.get_availability` | GET | `/v1/resources/{resource_id}/availability` | OPTIONAL |

`resource.delete` is a soft delete: the reference tool sends
`PATCH {"isActive": false}` to the resource path rather than `DELETE`
(1.0.0 specified `DELETE`).

`payments.get_status` is one tool over two endpoints: it reads a sale when given
a sale id, and an account history when given a client id.

**Specified, not implemented — binding shape not verified.** The following are
defined in §10 and §11 and tracked as `specified_unimplemented_tools` in the
manifest. No reference tool calls them, so unlike every row above, their paths
and bodies have not been checked against running code.

| MCP Tool | Method | Path |
|---|---|---|
| `service_orders.list` | GET | `/v1/service-orders` |
| `service_orders.get` | GET | `/v1/service-orders/{order_id}` |
| `service_orders.create` | POST | `/v1/service-orders` |
| `service_orders.propose` | POST | `/v1/service-orders/{order_id}/propose` |
| `service_orders.activate` | POST | `/v1/service-orders/{order_id}/activate` |
| `service_orders.get_ledger` | GET | `/v1/service-orders/{order_id}/ledger` |
| `mandates.list` | GET | `/v1/mandates` |
| `mandates.get` | GET | `/v1/mandates/{mandate_id}` |
| `mandates.suspend` | POST | `/v1/mandates/{mandate_id}/suspend` |

All paths resolve against `{base}` (§2.1).

---

*End of HTTP Profile v1.1.0*
