# Servicialo HTTP Profile

**Canonical HTTP binding for the Servicialo MCP Tool Interface**

| | |
|---|---|
| **Profile Version** | 1.0.0 |
| **Protocol Version** | 0.8 |
| **Date** | 2026-03-15 |
| **Status** | Draft |
| **License** | Apache-2.0 |

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

All endpoints are relative to:

```
/servicialo/v1/
```

Implementations MAY prepend a host-specific prefix (e.g., `https://api.example.com/servicialo/v1/`).

### 2.2 Required HTTP Headers

Every request MUST include:

| Header | Value | Notes |
|---|---|---|
| `Content-Type` | `application/vnd.api+json` | Required for requests with a body. |
| `Accept` | `application/vnd.api+json` | Required on all requests. |
| `X-Servicialo-Version` | `0.8` | Protocol version. Servers MUST reject unknown versions with `406`. |

Authenticated endpoints additionally require:

| Header | Value |
|---|---|
| `Authorization` | Implementation-defined (e.g., `Bearer <token>`, `ApiKey <key>`). |

### 2.3 Actor Header

All authenticated endpoints accept an `X-Servicialo-Actor` header as a Base64-encoded JSON object:

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

Alternatively, the `actor` field MAY be included in the request body for `POST`/`PATCH` operations. When present in both, the request body takes precedence.

When `actor.type` is `agent`, the `mandate_id` field is REQUIRED per protocol §10.

### 2.4 Response Envelope

#### 2.4.1 Success — Single Resource

```json
{
  "data": {
    "type": "sessions",
    "id": "ses_abc123",
    "attributes": { }
  }
}
```

#### 2.4.2 Success — Collection

```json
{
  "data": [
    {
      "type": "services",
      "id": "svc_001",
      "attributes": { }
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 20
  },
  "links": {
    "self": "/servicialo/v1/services?page=1&per_page=20",
    "next": "/servicialo/v1/services?page=2&per_page=20",
    "prev": null,
    "first": "/servicialo/v1/services?page=1&per_page=20",
    "last": "/servicialo/v1/services?page=3&per_page=20"
  }
}
```

#### 2.4.3 Success — Action Result

For endpoints that trigger an action (confirm, transition, cancel, etc.), the response MUST return the affected resource in its new state:

```json
{
  "data": {
    "type": "sessions",
    "id": "ses_abc123",
    "attributes": { }
  },
  "meta": {
    "transition": {
      "from": "scheduled",
      "to": "confirmed",
      "at": "2026-03-15T10:30:00Z"
    }
  }
}
```

### 2.5 Error Envelope

All error responses MUST use the following format:

```json
{
  "errors": [
    {
      "status": "422",
      "code": "INVALID_TRANSITION",
      "title": "Invalid state transition",
      "detail": "Cannot transition from 'requested' to 'in_progress'. Valid targets: ['scheduled'].",
      "source": {
        "pointer": "/data/attributes/to_state"
      }
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | Yes | HTTP status code as a string. |
| `code` | string | Yes | Machine-readable error code. Uppercase snake_case. |
| `title` | string | Yes | Short human-readable summary. Stable across locales. |
| `detail` | string | No | Instance-specific explanation. |
| `source.pointer` | string | No | JSON Pointer to the offending field. |
| `source.parameter` | string | No | Query parameter name, if applicable. |

#### Standard Error Codes

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

Collection endpoints MUST support pagination via query parameters:

| Parameter | Default | Description |
|---|---|---|
| `page` | `1` | 1-indexed page number. |
| `per_page` | `20` | Items per page. Maximum: `100`. |

Responses MUST include `meta.total`, `meta.page`, `meta.per_page`, and `links` as shown in §2.4.2.

### 2.7 Date and Time

All datetime values MUST be ISO 8601 with timezone offset or UTC (`Z`). Date-only values (e.g., `date_from`) MUST be `YYYY-MM-DD`.

### 2.8 Idempotency

Clients MAY send an `Idempotency-Key` header on `POST` requests. Servers that support idempotency MUST return the same response for duplicate keys within a reasonable window (RECOMMENDED: 24 hours).

---

## 3. Compliance Levels

### 3.1 REQUIRED — Minimum Compliance

An implementation MUST support these 6 endpoints to claim Servicialo HTTP compliance. They represent the minimum agent cycle: discover → understand → commit → manage → verify → close.

| # | MCP Tool | HTTP Endpoint |
|---|---|---|
| 1 | `registry.search` | `GET /registry/organizations` |
| 2 | `service.get` | `GET /services/{service_id}` |
| 3 | `scheduling.book` | `POST /sessions` |
| 4 | `lifecycle.transition` | `POST /sessions/{session_id}/transitions` |
| 5 | `delivery.record_evidence` | `POST /sessions/{session_id}/evidence` |
| 6 | `payments.create_sale` | `POST /sales` |

### 3.2 OPTIONAL — Extended Compliance

All other endpoints defined in this profile are OPTIONAL. Implementations SHOULD declare which optional endpoints they support via the `GET /` metadata endpoint (see §4).

### 3.3 Capabilities Endpoint

Implementations SHOULD expose:

```
GET /servicialo/v1/
```

Response:

```json
{
  "data": {
    "type": "server",
    "id": "servicialo",
    "attributes": {
      "protocol_version": "0.8",
      "profile_version": "1.0.0",
      "compliance": "extended",
      "capabilities": [
        "registry.search",
        "registry.get_organization",
        "services.list",
        "scheduling.check_availability",
        "service.get",
        "contract.get",
        "clients.get_or_create",
        "scheduling.book",
        "scheduling.confirm",
        "lifecycle.get_state",
        "lifecycle.transition",
        "scheduling.reschedule",
        "scheduling.cancel",
        "delivery.checkin",
        "delivery.checkout",
        "delivery.record_evidence",
        "documentation.create",
        "payments.create_sale",
        "payments.record_payment",
        "payments.get_status"
      ]
    }
  }
}
```

---

## 4. Phase 1 — Discovery

These endpoints are PUBLIC. They MUST NOT require authentication.

---

### 4.1 `registry.search`

Search organizations by vertical and location.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `registry.search` |
| **Method** | `GET` |
| **Path** | `/servicialo/v1/registry/organizations` |

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
{
  "data": [
    {
      "type": "organizations",
      "id": "clinica-dental-sur",
      "attributes": {
        "name": "Clínica Dental Sur",
        "vertical": "dental",
        "location": "Santiago",
        "country": "cl"
      }
    }
  ],
  "meta": { "total": 1, "page": 1, "per_page": 10 }
}
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
| **Path** | `/servicialo/v1/registry/organizations/{org_slug}` |

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
| **Compliance** | OPTIONAL |
| **MCP Tool** | `services.list` |
| **Method** | `GET` |
| **Path** | `/servicialo/v1/organizations/{org_slug}/services` |

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
| **Compliance** | OPTIONAL |
| **MCP Tool** | `scheduling.check_availability` |
| **Method** | `GET` |
| **Path** | `/servicialo/v1/availability` |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `org_slug` | string | Yes | Organization slug. |
| `date_from` | date | Yes | Start date (`YYYY-MM-DD`). |
| `date_to` | date | Yes | End date (`YYYY-MM-DD`). |
| `service_id` | string | No | Filter by service. |
| `provider_id` | string | No | Filter by provider. |
| `resource_id` | string | No | Filter by physical resource. |

**Success Response**

| Status | Body |
|---|---|
| `200 OK` | Collection of available time slots. |

```json
{
  "data": [
    {
      "type": "availability_slots",
      "id": "slot_001",
      "attributes": {
        "provider_id": "prov_abc",
        "starts_at": "2026-03-16T09:00:00-03:00",
        "ends_at": "2026-03-16T09:45:00-03:00",
        "resource_id": "res_box3"
      }
    }
  ]
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
| **Compliance** | REQUIRED |
| **MCP Tool** | `service.get` |
| **Required Scope** | `service:read` |
| **Method** | `GET` |
| **Path** | `/servicialo/v1/services/{service_id}` |

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
  "data": {
    "type": "services",
    "id": "svc_kinesiologia_45",
    "attributes": {
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
  }
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
| **Path** | `/servicialo/v1/services/{service_id}/contract` |

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
| **Path** | `/servicialo/v1/clients` |

**Request Body**

```json
{
  "data": {
    "type": "clients",
    "attributes": {
      "email": "maria@example.com",
      "phone": "+56912345678",
      "name": "María",
      "last_name": "González",
      "actor": {
        "type": "agent",
        "id": "agent_01",
        "mandate_id": "mdt_abc"
      }
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string (email) | No* | Client email. Search key. |
| `phone` | string | No* | Client phone. Search key if no email. |
| `name` | string | No** | First name. Required if creating. |
| `last_name` | string | No** | Last name. Required if creating. |
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
| **Path** | `/servicialo/v1/sessions` |

**Request Body**

```json
{
  "data": {
    "type": "sessions",
    "attributes": {
      "service_id": "svc_001",
      "provider_id": "prov_abc",
      "client_id": "cli_001",
      "starts_at": "2026-03-16T09:00:00-03:00",
      "resource_id": "res_box3",
      "actor": {
        "type": "agent",
        "id": "agent_01",
        "mandate_id": "mdt_abc"
      }
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `service_id` | string | Yes | Service to book. |
| `provider_id` | string | Yes | Assigned provider. |
| `client_id` | string | Yes | Client/beneficiary. |
| `starts_at` | datetime | Yes | Session start time (ISO 8601). |
| `resource_id` | string | No | Physical resource. REQUIRED if the service specifies `location.resource_id`. |
| `actor` | Actor | Yes | Who performs the action. |

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

---

### 6.3 `scheduling.confirm`

Confirm a booked session. Moves to `confirmed` state.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `scheduling.confirm` |
| **Required Scope** | `schedule:write` |
| **Method** | `POST` |
| **Path** | `/servicialo/v1/sessions/{session_id}/confirm` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "confirmations",
    "attributes": {
      "actor": {
        "type": "client",
        "id": "cli_001"
      }
    }
  }
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
| **Path** | `/servicialo/v1/sessions/{session_id}/lifecycle` |

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
  "data": {
    "type": "lifecycle_states",
    "id": "ses_abc123",
    "attributes": {
      "current_state": "confirmed",
      "available_transitions": ["in_progress", "cancelled"],
      "transitions": [
        {
          "from": null,
          "to": "requested",
          "at": "2026-03-15T08:00:00Z",
          "by": "agent_01",
          "method": "agent"
        },
        {
          "from": "requested",
          "to": "confirmed",
          "at": "2026-03-15T08:05:00Z",
          "by": "cli_001",
          "method": "manual"
        }
      ]
    }
  }
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
| **Path** | `/servicialo/v1/sessions/{session_id}/transitions` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "transitions",
    "attributes": {
      "to_state": "in_progress",
      "actor": {
        "type": "provider",
        "id": "prov_abc"
      },
      "reason": null,
      "evidence": {}
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `to_state` | enum | Yes | Target state: `scheduled`, `confirmed`, `in_progress`, `completed`, `documented`, `invoiced`, `collected`, `verified`, `cancelled`. |
| `actor` | Actor | Yes | Who triggers the transition. |
| `reason` | string | No | Reason. REQUIRED for `cancelled`. |
| `evidence` | object | No | Evidence required by the contract for this transition. |

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
| **Method** | `POST` |
| **Path** | `/servicialo/v1/sessions/{session_id}/reschedule` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "reschedules",
    "attributes": {
      "new_datetime": "2026-03-17T10:00:00-03:00",
      "actor": {
        "type": "client",
        "id": "cli_001"
      }
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `new_datetime` | datetime | Yes | New start time (ISO 8601). |
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
| **Path** | `/servicialo/v1/sessions/{session_id}/cancel` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "cancellations",
    "attributes": {
      "reason": "Client requested reschedule but no compatible slot available.",
      "actor": {
        "type": "client",
        "id": "cli_001"
      }
    }
  }
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
| **Path** | `/servicialo/v1/sessions/{session_id}/checkin` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "checkins",
    "attributes": {
      "actor": {
        "type": "provider",
        "id": "prov_abc"
      },
      "location": {
        "lat": -33.4489,
        "lng": -70.6693
      },
      "timestamp": "2026-03-16T09:02:00-03:00"
    }
  }
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
| **Path** | `/servicialo/v1/sessions/{session_id}/checkout` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "checkouts",
    "attributes": {
      "actor": {
        "type": "provider",
        "id": "prov_abc"
      },
      "location": {
        "lat": -33.4489,
        "lng": -70.6693
      },
      "timestamp": "2026-03-16T09:47:00-03:00"
    }
  }
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
| **Path** | `/servicialo/v1/sessions/{session_id}/evidence` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "evidence",
    "attributes": {
      "evidence_type": "gps",
      "data": {
        "lat": -33.4489,
        "lng": -70.6693,
        "accuracy_meters": 5
      },
      "actor": {
        "type": "provider",
        "id": "prov_abc"
      }
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `evidence_type` | enum | Yes | `gps`, `signature`, `photo`, `document`, `duration`, `notes`. |
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

Generate the service record (clinical note, inspection report, etc.). Moves session to `documented`.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `documentation.create` |
| **Required Scope** | `document:write` |
| **Method** | `POST` |
| **Path** | `/servicialo/v1/sessions/{session_id}/documentation` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | string | Session identifier. |

**Request Body**

```json
{
  "data": {
    "type": "documentation",
    "attributes": {
      "content": "Paciente presenta mejoría en rango de movimiento...",
      "template_id": "tmpl_clinical_note",
      "actor": {
        "type": "provider",
        "id": "prov_abc"
      }
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `content` | string | Yes | Documentation content. |
| `template_id` | string | No | Template identifier, if applicable. |
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

Create a sale (charge) linked to a documented service. Moves session to `invoiced`.

| | |
|---|---|
| **Compliance** | REQUIRED |
| **MCP Tool** | `payments.create_sale` |
| **Required Scope** | `payment:write` |
| **Method** | `POST` |
| **Path** | `/servicialo/v1/sales` |

**Request Body**

```json
{
  "data": {
    "type": "sales",
    "attributes": {
      "client_id": "cli_001",
      "service_id": "svc_001",
      "provider_id": "prov_abc",
      "quantity": 1,
      "unit_price": 35000
    }
  }
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `client_id` | string | Yes | — | Client identifier. |
| `service_id` | string | Yes | — | Service identifier. |
| `provider_id` | string | Yes | — | Provider identifier. |
| `quantity` | integer | No | `1` | Number of sessions. |
| `unit_price` | number | Yes | — | Price per unit. |

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
| **Path** | `/servicialo/v1/sales/{sale_id}/payments` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `sale_id` | string | Sale identifier. |

**Request Body**

```json
{
  "data": {
    "type": "payments",
    "attributes": {
      "amount": 35000,
      "method": "transferencia",
      "reference": "TRX-20260316-001"
    }
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | number | Yes | Payment amount. |
| `method` | enum | Yes | `efectivo`, `transferencia`, `mercadopago`, `tarjeta`. |
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

### 9.4 `payments.get_status`

Get payment status for a specific sale or a client's full account.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `payments.get_status` |
| **Required Scope** | `payment:read` |
| **Method** | `GET` |
| **Path** | `/servicialo/v1/payments/status` |

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

---

### 10.1 `service_orders.list`

List service orders.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `service_orders.list` |
| **Required Scope** | `order:read` |
| **Method** | `GET` |
| **Path** | `/servicialo/v1/service-orders` |

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
| **Path** | `/servicialo/v1/service-orders/{order_id}` |

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
| **Path** | `/servicialo/v1/service-orders` |

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
| **Path** | `/servicialo/v1/service-orders/{order_id}/propose` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `order_id` | string | Service Order identifier. |

**Request Body**

```json
{
  "data": {
    "type": "order_transitions",
    "attributes": {
      "actor": { "type": "organization", "id": "org_xyz" }
    }
  }
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
| **Path** | `/servicialo/v1/service-orders/{order_id}/activate` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `order_id` | string | Service Order identifier. |

**Request Body**

```json
{
  "data": {
    "type": "order_transitions",
    "attributes": {
      "actor": { "type": "client", "id": "cli_001" }
    }
  }
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
| **Path** | `/servicialo/v1/service-orders/{order_id}/ledger` |

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

---

### 11.1 `mandates.list`

List mandates issued by the authenticated principal.

| | |
|---|---|
| **Compliance** | OPTIONAL |
| **MCP Tool** | `mandates.list` |
| **Required Scope** | `mandate:read` |
| **Method** | `GET` |
| **Path** | `/servicialo/v1/mandates` |

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
| **Path** | `/servicialo/v1/mandates/{mandate_id}` |

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
| **Path** | `/servicialo/v1/mandates/{mandate_id}/suspend` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `mandate_id` | string | Mandate identifier (UUID). |

**Request Body**

```json
{
  "data": {
    "type": "mandate_actions",
    "attributes": {
      "reason": "Security review in progress."
    }
  }
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
| **Path** | `/servicialo/v1/resources` |

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `organization_id` | string | Yes | Organization identifier. |
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
| **Path** | `/servicialo/v1/resources/{resource_id}` |

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
| **Path** | `/servicialo/v1/resources` |

**Request Body**

```json
{
  "data": {
    "type": "resources",
    "attributes": {
      "organization_id": "org_xyz",
      "name": "Box 3",
      "type": "box",
      "capacity": 1,
      "buffer_minutes": 15,
      "equipment": ["camilla", "TENS"],
      "location": "Piso 2, ala norte",
      "actor": { "type": "organization", "id": "org_xyz" }
    }
  }
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `organization_id` | string | Yes | — | Owner organization. |
| `name` | string | Yes | — | Resource name. |
| `type` | enum | No | — | `room`, `box`, `chair`, `equipment`. |
| `capacity` | integer | No | `1` | Simultaneous capacity. |
| `buffer_minutes` | integer | No | `0` | Preparation time between sessions. |
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
| **Path** | `/servicialo/v1/resources/{resource_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `resource_id` | string | Resource identifier. |

**Request Body**

Only include fields to update. Omitted fields remain unchanged.

```json
{
  "data": {
    "type": "resources",
    "attributes": {
      "capacity": 2,
      "buffer_minutes": 10,
      "actor": { "type": "organization", "id": "org_xyz" }
    }
  }
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
| **Method** | `DELETE` |
| **Path** | `/servicialo/v1/resources/{resource_id}` |

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `resource_id` | string | Resource identifier. |

**Request Body**

```json
{
  "data": {
    "type": "resource_actions",
    "attributes": {
      "actor": { "type": "organization", "id": "org_xyz" }
    }
  }
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
| **Path** | `/servicialo/v1/resources/{resource_id}/availability` |

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

| # | MCP Tool | Method | Path | Compliance |
|---|---|---|---|---|
| 1 | `registry.search` | GET | `/registry/organizations` | REQUIRED |
| 2 | `registry.get_organization` | GET | `/registry/organizations/{org_slug}` | OPTIONAL |
| 3 | `services.list` | GET | `/organizations/{org_slug}/services` | OPTIONAL |
| 4 | `scheduling.check_availability` | GET | `/availability` | OPTIONAL |
| 5 | `service.get` | GET | `/services/{service_id}` | REQUIRED |
| 6 | `contract.get` | GET | `/services/{service_id}/contract` | OPTIONAL |
| 7 | `clients.get_or_create` | POST | `/clients` | OPTIONAL |
| 8 | `scheduling.book` | POST | `/sessions` | REQUIRED |
| 9 | `scheduling.confirm` | POST | `/sessions/{session_id}/confirm` | OPTIONAL |
| 10 | `lifecycle.get_state` | GET | `/sessions/{session_id}/lifecycle` | OPTIONAL |
| 11 | `lifecycle.transition` | POST | `/sessions/{session_id}/transitions` | REQUIRED |
| 12 | `scheduling.reschedule` | POST | `/sessions/{session_id}/reschedule` | OPTIONAL |
| 13 | `scheduling.cancel` | POST | `/sessions/{session_id}/cancel` | OPTIONAL |
| 14 | `delivery.checkin` | POST | `/sessions/{session_id}/checkin` | OPTIONAL |
| 15 | `delivery.checkout` | POST | `/sessions/{session_id}/checkout` | OPTIONAL |
| 16 | `delivery.record_evidence` | POST | `/sessions/{session_id}/evidence` | REQUIRED |
| 17 | `documentation.create` | POST | `/sessions/{session_id}/documentation` | OPTIONAL |
| 18 | `payments.create_sale` | POST | `/sales` | REQUIRED |
| 19 | `payments.record_payment` | POST | `/sales/{sale_id}/payments` | OPTIONAL |
| 20 | `payments.get_status` | GET | `/payments/status` | OPTIONAL |
| 21 | `service_orders.list` | GET | `/service-orders` | OPTIONAL |
| 22 | `service_orders.get` | GET | `/service-orders/{order_id}` | OPTIONAL |
| 23 | `service_orders.create` | POST | `/service-orders` | OPTIONAL |
| 24 | `service_orders.propose` | POST | `/service-orders/{order_id}/propose` | OPTIONAL |
| 25 | `service_orders.activate` | POST | `/service-orders/{order_id}/activate` | OPTIONAL |
| 26 | `service_orders.get_ledger` | GET | `/service-orders/{order_id}/ledger` | OPTIONAL |
| 27 | `mandates.list` | GET | `/mandates` | OPTIONAL |
| 28 | `mandates.get` | GET | `/mandates/{mandate_id}` | OPTIONAL |
| 29 | `mandates.suspend` | POST | `/mandates/{mandate_id}/suspend` | OPTIONAL |
| 30 | `resource.list` | GET | `/resources` | OPTIONAL |
| 31 | `resource.get` | GET | `/resources/{resource_id}` | OPTIONAL |
| 32 | `resource.create` | POST | `/resources` | OPTIONAL |
| 33 | `resource.update` | PATCH | `/resources/{resource_id}` | OPTIONAL |
| 34 | `resource.delete` | DELETE | `/resources/{resource_id}` | OPTIONAL |
| 35 | `resource.get_availability` | GET | `/resources/{resource_id}/availability` | OPTIONAL |

All paths are relative to `/servicialo/v1/`.

---

*End of HTTP Profile v1.0.0*
