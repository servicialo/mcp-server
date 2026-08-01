# A2A Intent Payloads — Servicialo Protocol

**Version 1.2.0** | Reference implementation: **Coordinalo**

> **1.2.0 (2026-08-01):** payloads verified against the reference implementation — response shapes for `check_availability` (flat `slots`, ISO datetimes), `cancel_session` and `reschedule_session` corrected; authentication (`X-Org-Api-Key`) documented; `derived_state` wire values documented; A2A response format and structured DataPart requests added.

---

## Table of Contents

1. [Overview](#overview)
2. [Transport](#transport)
3. [Agent Discovery](#agent-discovery)
4. [Intent Reference](#intent-reference)
   - [list_services](#1-list_services)
   - [check_availability](#2-check_availability)
   - [book_session](#3-book_session)
   - [cancel_session](#4-cancel_session)
   - [reschedule_session](#5-reschedule_session)
5. [Error Reference](#error-reference)
6. [Autonomous Agent Flow](#autonomous-agent-flow)
7. [Conversation Contract](#conversation-contract)
8. [Lifecycle States](#lifecycle-states)

---

## Overview

Servicialo A2A intents allow an external agent (e.g. a personal assistant) to discover, query, and book professional services on behalf of a user — without touching the implementation's source code.

All communication uses **Google's A2A protocol v0.3.0** over **JSON-RPC 2.0**. The transport is a single POST endpoint per organization.

### The 5 Intents

| Intent | Purpose | Auth Required |
|--------|---------|---------------|
| `list_services` | Browse the service catalog | No |
| `check_availability` | Query available time slots | No |
| `book_session` | Reserve an appointment | No* |
| `cancel_session` | Cancel an existing session | Yes |
| `reschedule_session` | Move a session to a new time | Yes |

\* Booking is public in the current implementation but may require authentication in future versions.

---

## Transport

### Endpoint

```
POST https://{platform}/api/servicialo/{orgSlug}/a2a
```

**Reference:** `POST https://coordinalo.com/api/servicialo/clinica-demo/a2a`

### Protocol

All requests use **JSON-RPC 2.0** with method `message/send`. The message carries either free text (natural-language intent detection) or a structured **DataPart** (deterministic routing — no language model involved):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "kind": "text",
          "text": "Quiero una hora de kinesiologia esta semana"
        }
      ]
    }
  }
}
```

Structured alternative (preferred for agents that already know the intent and params):

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "kind": "data",
          "data": {
            "intent": "check_availability",
            "params": { "serviceId": "cmiofz81v00fdus0wfmw2tav9", "from": "2026-04-01", "days": 7 },
            "client": { "name": "Martin Lopez", "phone": "+56912345678", "email": "martin@mail.com" }
          }
        }
      ]
    }
  }
}
```

`client` is only needed for `book_session`. If a message contains both a DataPart with `intent` and text, the DataPart wins.

### Response

The JSON-RPC `result` is an A2A **Message** from the agent: a human-readable `text` part plus a `data` part with the executed intent, its outcome, and the raw REST response body under `result`:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "kind": "message",
    "role": "agent",
    "messageId": "c6c5944faf1ece3a49af8fedc",
    "parts": [
      { "kind": "text", "text": "Disponibilidad consultada (12 resultado(s)). Detalle en la DataPart." },
      {
        "kind": "data",
        "data": {
          "intent": "check_availability",
          "status": "completed",
          "http_status": 200,
          "result": { "slots": [ ... ], "service": { ... }, "timezone": "America/Santiago" }
        }
      }
    ]
  }
}
```

`data.status` is `"completed"` or `"failed"`; on failure `data.http_status` and `data.result.error` carry the underlying REST error. A free-text message whose intent cannot be resolved (or is missing required data) gets a text-only Message asking for exactly what is missing.

Protocol-level failures use standard JSON-RPC error objects (HTTP 200):

| Code | Meaning |
|------|---------|
| -32600 | Invalid JSON-RPC request |
| -32601 | Method not found (only `message/send` is supported) |
| -32602 | Invalid params (no parts, or unsupported `intent` in a DataPart) |
| -32603 | Internal error |
| -32001 | Organization not found or not discoverable |
| -32002 | Rate limited (HTTP 429 + `Retry-After`) |

### Authentication over A2A

`cancel_session` and `reschedule_session` require the organization API key. Send it as an `X-Org-Api-Key` HTTP header on the A2A POST — it is forwarded to the underlying REST endpoint. Without it, the intent completes as `"failed"` with the REST 401 in the DataPart.

### Alternative: REST Endpoints

Each intent also maps to a direct REST endpoint for simpler integrations:

| Intent | REST Equivalent |
|--------|----------------|
| `list_services` | `GET /api/servicialo/{orgSlug}/services` |
| `check_availability` | `GET /api/servicialo/{orgSlug}/availability?serviceId=...` |
| `book_session` | `POST /api/servicialo/{orgSlug}/book` |
| `cancel_session` | `POST /api/servicialo/{orgSlug}/sessions/{id}/cancel` |
| `reschedule_session` | `POST /api/servicialo/{orgSlug}/sessions/{id}/reschedule` |

The REST endpoints are the **recommended integration path** for structured agents. The A2A endpoint wraps these same endpoints with natural-language intent detection.

---

## Agent Discovery

Before calling any intent, an agent discovers the organization's capabilities via its **Agent Card**.

### Fetch Agent Card

```
GET https://{platform}/api/servicialo/{orgSlug}/.well-known/agent.json
```

### Agent Card Shape

```json
{
  "name": "Clinica Demo",
  "description": "Centro de estimulacion y terapias infantiles",
  "url": "https://coordinalo.com/api/servicialo/clinica-demo/a2a",
  "protocolVersion": "0.3.0",
  "capabilities": {
    "streaming": false,
    "pushNotifications": false
  },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"],
  "skills": [
    {
      "id": "list-services",
      "name": "List services",
      "description": "View the catalog of available professional services",
      "tags": ["catalog", "discovery"]
    },
    {
      "id": "check-availability",
      "name": "Check availability",
      "description": "Query available time slots for scheduling",
      "tags": ["scheduling", "availability"]
    },
    {
      "id": "book-session",
      "name": "Book session",
      "description": "Reserve an appointment with a professional",
      "tags": ["booking", "appointment"]
    }
  ],
  "authentication": {
    "schemes": []
  }
}
```

**Note:** Skills are dynamic — only verified capabilities appear. If the `skills` array is empty or contains only `discover`, the organization has not completed capability verification.

**Note:** The example above is the minimal shape. The reference implementation extends it: `capabilities` also carries `stateTransitionHistory: true`, `defaultInputModes`/`defaultOutputModes` are `["text", "application/json"]`, per-service skills (`id: "service_<id>"`) follow the intent skills, and extra fields (`provider`, `metadata`, `availability`, `providers`, `instructions`, `securitySchemes`, `extensions`) describe the organization and its other channels (MCP endpoint under `extensions.mcp`). Consumers MUST ignore fields they don't understand.

---

## Intent Reference

---

### 1. `list_services`

Returns the organization's public service catalog.

#### REST Request

```
GET /api/servicialo/{orgSlug}/services
```

No query parameters. No authentication.

#### Success Response (200)

```json
{
  "servicialo_version": "1.0",
  "organization": {
    "name": "Clinica Demo",
    "slug": "clinica-demo"
  },
  "services": [
    {
      "id": "cmiofz81v00fdus0wfmw2tav9",
      "name": "Asesoria Lactancia",
      "description": "Asesoria profesional en lactancia materna: tecnicas de agarre, posiciones, manejo de dificultades y apoyo emocional.",
      "price": 40000,
      "currency": "CLP",
      "price_unit": "servicio",
      "modality": "presencial",
      "duration_minutes": 60
    }
  ]
}
```

#### Service Object Fields

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `id` | string | Yes | Unique service identifier (CUID) |
| `name` | string | Yes | Human-readable service name |
| `description` | string \| null | Yes (nullable) | What the service includes. `null` when the organization has not written one. |
| `price` | numeric string | Yes | Base price in the smallest useful unit (e.g. CLP whole pesos). The reference implementation serializes decimals as **numeric strings** (e.g. `"40000"`) — parse with `Number()`. |
| `currency` | string | Yes | ISO 4217 currency code (`CLP`, `USD`, `UF`) |
| `price_unit` | string | Yes | Pricing unit, e.g. `"servicio"` |
| `modality` | string | Yes | `"presencial"`, `"a_domicilio"`, or `"remoto"` |
| `duration_minutes` | integer \| null | Yes (nullable) | Session duration in minutes |
| `category` | string \| null | Yes (nullable) | Service category (e.g. `"kinesiologia"`) |
| `requirements` | string[] | Yes | What the client needs to bring/prepare (empty array when none) |
| `expected_outcome` | string \| null | Yes (nullable) | What the client can expect |
| `tags` | string[] | Yes | Searchable tags (empty array when none) |
| `suggested_frequency` | string \| null | Yes (nullable) | Recommended frequency (e.g. `"semanal"`) |
| `treatment_length` | string \| null | Yes (nullable) | Typical treatment duration (e.g. `"8 sesiones"`) |

#### Error Responses

Calling the platform directly:

| Status | Shape | When |
|--------|-------|------|
| 404 | `{ "error": "Organization not found or not public" }` | Organization doesn't exist or isn't discoverable |

Calling through the servicialo.com proxy (`https://servicialo.com/api/{orgSlug}/...`) adds a resolver layer with its own errors:

| Status | Shape | When |
|--------|-------|------|
| 404 | `{ "servicialo_version": "1.0", "org": "{slug}", "error": "Organization \"{slug}\" not found in resolver" }` | Organization not in the resolver |
| 502 | `{ "servicialo_version": "1.0", "org": "{slug}", "error": "Organization \"{slug}\" has no registered REST endpoint" }` | Org exists but upstream is not configured |
| 502 | `{ "servicialo_version": "1.0", "org": "{slug}", "error": "upstream_unavailable", "message": "..." }` | Upstream server is down |

---

### 2. `check_availability`

Query available time slots for a service (and optionally a specific provider).

#### REST Request

```
GET /api/servicialo/{orgSlug}/availability?serviceId={id}&from={date}&days={n}
```

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | string | **Yes** | Service ID from `list_services` |
| `providerId` | string | No | Filter by provider. Defaults to first assigned provider. |
| `date` | string (YYYY-MM-DD) | No* | Single day query |
| `from` | string (YYYY-MM-DD) | No* | Start of date range |
| `days` | integer (1-90) | No* | Number of days in range (default: 7) |
| `next` | integer (1-50) | No* | Return next N available slots |

\* One query mode per request. Mode precedence: `next` > `from`(+`days`) > `date`. If no mode parameter is sent, the request behaves as a single-day query for today.

#### Query Modes

| Mode | Params | Description |
|------|--------|-------------|
| **Single day** | `date=2026-04-01` | All slots for one specific day |
| **Date range** | `from=2026-04-01&days=7` | All slots across N days |
| **Next N slots** | `next=5` | Next 5 available slots across upcoming days |

#### Success Response (200) — Single Day

A single result object (no wrapper):

```json
{
  "date": "2026-04-01",
  "provider": {
    "id": "clx1abc123",
    "name": "Dra. Maria Gonzalez"
  },
  "service": {
    "id": "cmiofz81v00fdus0wfmw2tav9",
    "duration_minutes": 60
  },
  "available_slots": [
    { "start": "2026-04-01T12:00:00.000Z", "end": "2026-04-01T13:00:00.000Z" },
    { "start": "2026-04-01T13:00:00.000Z", "end": "2026-04-01T14:00:00.000Z" }
  ],
  "timezone": "America/Santiago"
}
```

When the day has no slots, `available_slots` is empty and `reason` explains why:

```json
{
  "date": "2026-04-02",
  "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" },
  "service": { "id": "cmiofz81v00fdus0wfmw2tav9", "duration_minutes": 60 },
  "available_slots": [],
  "timezone": "America/Santiago",
  "reason": "ALL_SLOTS_BOOKED"
}
```

#### Success Response (200) — Date Range / Next N Slots

Both multi-day modes return one flat `slots` list (one entry per slot, tagged with its date):

```json
{
  "slots": [
    {
      "date": "2026-04-01",
      "start": "2026-04-01T12:00:00.000Z",
      "end": "2026-04-01T13:00:00.000Z",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" }
    },
    {
      "date": "2026-04-01",
      "start": "2026-04-01T13:00:00.000Z",
      "end": "2026-04-01T14:00:00.000Z",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" }
    }
  ],
  "service": {
    "id": "cmiofz81v00fdus0wfmw2tav9",
    "duration_minutes": 60
  },
  "timezone": "America/Santiago"
}
```

Days without availability simply contribute no entries — multi-day modes carry no per-day `reason`.

#### Slot Result Fields

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `date` | string (YYYY-MM-DD) | Yes | The date |
| `provider.id` | string | Yes | Provider identifier |
| `provider.name` | string | Yes | Provider display name |
| `service.id` | string | Yes | Service identifier |
| `service.duration_minutes` | integer | Yes | Duration in minutes |
| `start` / `end` | string (ISO 8601 UTC) | Yes | Slot boundaries as full datetimes (e.g. `"2026-04-01T12:00:00.000Z"`), **not** local `HH:MM`. Convert to the response's `timezone` for display. |
| `available_slots` | array | Single-day only | Array of `{ start, end }` datetime pairs |
| `timezone` | string | Yes | IANA timezone (e.g. `America/Santiago`) |
| `reason` | string | Single-day only | Why no slots: `NO_AVAILABILITY_CONFIGURED`, `NO_SLOTS_FOR_DATE`, `ALL_SLOTS_BOOKED` |

#### Error Responses

| Status | Shape | When |
|--------|-------|------|
| 400 | `{ "error": "serviceId is required" }` | Missing required param |
| 404 | `{ "error": "Organization not found or not public" }` | Org not found |
| 404 | `{ "error": "Service not found" }` | Invalid serviceId |
| 404 | `{ "error": "No provider found for this service" }` | No provider assigned (or invalid providerId) |
| 502 | Same as `list_services` 502 | Upstream unavailable (proxy layer only) |

---

### 3. `book_session`

Create a new session (appointment) for a client.

#### REST Request

```
POST /api/servicialo/{orgSlug}/book
Content-Type: application/json
```

#### Request Body

```json
{
  "clientEmail": "martin.lopez@gmail.com",
  "clientName": "Martin",
  "clientLastName": "Lopez",
  "clientPhone": "+56912345678",
  "serviceId": "cmiofz81v00fdus0wfmw2tav9",
  "providerId": "clx1abc123",
  "scheduledAt": "2026-04-02T10:00:00-04:00",
  "duration": 60,
  "notes": "Primera sesion, derivado por pediatra",
  "initialStatus": "scheduled"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clientEmail` | string (email) | **Yes** | Client's email. Creates client + person if not found. |
| `clientName` | string | No | Client first name. Used only on creation. |
| `clientLastName` | string | No | Client last name. Used only on creation. |
| `clientPhone` | string | No | Client phone. Used only on creation. |
| `serviceId` | string | **Yes** | Service ID from `list_services` |
| `providerId` | string | No | Provider ID from `check_availability`. Defaults to first assigned. |
| `scheduledAt` | string (ISO 8601) | **Yes** | Appointment datetime with timezone offset |
| `duration` | integer | No | Duration in minutes. Defaults to service's `duration_minutes`. |
| `notes` | string (max 2000) | No | Session notes visible to provider |
| `initialStatus` | string | No | `"scheduled"` (default) or `"pending_confirmation"` |
| `ventaId` | string | No | Attach to existing sale instead of creating new one |
| `ordenDeServicioId` | string | No | Attach to existing service order |
| `paymentIntentId` | string | No | Pre-payment intent ID (required if service has prepayment) |

#### Success Response (201)

```json
{
  "servicialo_version": "1.0",
  "success": true,
  "session": {
    "id": "cm5xyz789session",
    "status": "agendado",
    "derived_state": "agendado",
    "derived_state_index": 1,
    "scheduled_at": "2026-04-02T10:00:00.000Z",
    "duration_minutes": 60,
    "service": "Asesoria Lactancia",
    "client_email": "martin.lopez@gmail.com"
  },
  "client_portal_url": "https://coordinalo.com/portal/clinica-demo?token=abc123...",
  "order_id": "cm5xyz789order",
  "venta_id": "cm5xyz789venta"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `servicialo_version` | string | Resolver API version (`"1.0"`) |
| `success` | boolean | Always `true` on 201 |
| `session.id` | string | Unique session identifier |
| `session.status` | string | Internal status (`agendado` or `pendiente_confirmacion`) |
| `session.derived_state` | string | Servicialo state as a **Spanish wire value**: `solicitado`, `agendado`, `confirmado`, `en_curso`, `completado`, `documentado`, `facturado`, `cobrado`, `verificado` — mapping 1:1 to the canonical states (see [Lifecycle States](#lifecycle-states)) |
| `session.derived_state_index` | integer (0-8) | Numeric lifecycle position |
| `session.scheduled_at` | string (ISO 8601) | Confirmed appointment time |
| `session.duration_minutes` | integer | Session duration |
| `session.service` | string | Service name |
| `session.client_email` | string | Client email |
| `client_portal_url` | string or null | URL for client self-service portal |
| `order_id` | string | Service order identifier |
| `venta_id` | string | Sale record identifier |

#### Error Responses

| Status | Code | Shape | When |
|--------|------|-------|------|
| 400 | `VALIDATION_ERROR` | `{ "error": "Invalid data", "code": "VALIDATION_ERROR", "details": { ... } }` | Missing/invalid fields (Zod flatten in `details`) |
| 400 | `OUTSIDE_PROVIDER_HOURS` | `{ "error": "Scheduled time is outside provider availability", "code": "OUTSIDE_PROVIDER_HOURS" }` | Slot doesn't fall within provider's schedule |
| 400 | `PAST_DATE` | `{ "error": "Cannot book in the past", "code": "PAST_DATE" }` | `scheduledAt` is before now |
| 402 | `PAYMENT_REQUIRED` | `{ "error": "This service requires prepayment", "code": "PAYMENT_REQUIRED", ... }` | Service requires pre-payment |
| 402 | `PAYMENT_NOT_APPROVED` | `{ "error": "Payment has not been approved", "code": "PAYMENT_NOT_APPROVED" }` | PaymentIntent not approved |
| 402 | `PAYMENT_INSUFFICIENT` | `{ "error": "...", "code": "PAYMENT_INSUFFICIENT" }` | Payment amount too low |
| 402 | `PAYMENT_ALREADY_USED` | `{ "error": "...", "code": "PAYMENT_ALREADY_USED" }` | PaymentIntent reused |
| 404 | — | `{ "error": "Service not found" }` | Invalid serviceId |
| 404 | — | `{ "error": "Provider not found" }` | Invalid providerId |
| 409 | `SLOT_CONFLICT` | `{ "error": "Provider already has a session at this time", "code": "SLOT_CONFLICT" }` | Double-booking detected |
| 502 | — | Same shape as other 502s | Upstream unavailable (proxy layer only) |

---

### 4. `cancel_session`

Cancel an existing session. The applicable cancellation policy is evaluated and reported (as response metadata — the charge itself is handled by the organization's billing flow).

**Authentication required:** send the organization API key as `X-Org-Api-Key`.

#### REST Request

```
POST /api/servicialo/{orgSlug}/sessions/{sessionId}/cancel
Content-Type: application/json
X-Org-Api-Key: {orgApiKey}
```

#### Request Body

```json
{
  "reason": "Paciente enfermo, no puede asistir",
  "cancelledBy": "client"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string (max 500) | No | Cancellation reason. Strongly recommended — it is recorded on the session. |
| `cancelledBy` | string | No | `"client"`, `"provider"`, `"admin"`, or `"system"` (default: `"system"`) |

#### Success Response (200)

```json
{
  "sessionId": "cm5xyz789session",
  "status": "cancelled",
  "policy_applied": {
    "penalty": "partial",
    "penalty_percent": 50
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | The cancelled session |
| `status` | string | Always `"cancelled"` on success |
| `policy_applied.penalty` | string | `"none"`, `"partial"`, or `"full"` per the org's cancellation policy and how close to `scheduledAt` the cancellation happened |
| `policy_applied.penalty_percent` | integer | Present when `penalty` is `"partial"` or `"full"` |

#### Error Responses

| Status | Shape | When |
|--------|-------|------|
| 401 | `{ "error": "API key requerida (X-Org-Api-Key)", "code": "UNAUTHORIZED" }` | Missing/invalid API key |
| 404 | `{ "error": "Session not found" }` | Invalid sessionId |
| 409 | `{ "error": "Session is already cancelled", "code": "ALREADY_CANCELLED" }` | Session already cancelled |
| 400 | `{ "error": "Session cannot be cancelled in its current state", "current_status": "..." }` | Already completed/documented/etc. |

---

### 5. `reschedule_session`

Move a session to a new time. The session is **updated in place** — it keeps its id, provider, sale and order; only `scheduledAt` changes. Availability and conflicts are validated with the same logic as `book_session`.

**Authentication required:** send the organization API key as `X-Org-Api-Key`.

#### REST Request

```
POST /api/servicialo/{orgSlug}/sessions/{sessionId}/reschedule
Content-Type: application/json
X-Org-Api-Key: {orgApiKey}
```

#### Request Body

```json
{
  "scheduledAt": "2026-04-05T14:00:00-04:00"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheduledAt` | string (ISO 8601) | **Yes** | New appointment datetime with timezone offset. (The A2A intent also accepts `newScheduledAt` and maps it to this field; the REST endpoint takes `scheduledAt` only.) |

Changing the provider while rescheduling is not supported — the A2A intent rejects `newProviderId` explicitly rather than dropping it.

#### Success Response (200)

```json
{
  "sessionId": "cm5xyz789session",
  "status": "scheduled",
  "scheduledAt": "2026-04-05T18:00:00.000Z",
  "duration": 60
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | The same session (not a new one) |
| `status` | string | The session's current internal status (unchanged by the reschedule) |
| `scheduledAt` | string (ISO 8601 UTC) | The new appointment time |
| `duration` | integer | Duration in minutes (unchanged) |

#### Error Responses

| Status | Shape | When |
|--------|-------|------|
| 401 | `{ "error": "API key requerida (X-Org-Api-Key)", "code": "UNAUTHORIZED" }` | Missing/invalid API key |
| 400 | `{ "error": "Invalid data", "details": { ... } }` | Missing/invalid `scheduledAt` |
| 400 | `{ "error": "Cannot reschedule to the past", "code": "SLOT_INVALID" }` | New time is before now |
| 400 | `{ "error": "Session cannot be rescheduled in its current state", "code": "SLOT_INVALID", "current_status": "..." }` | Not in `scheduled`/`pending_confirmation`/`confirmed` |
| 400 | `{ "error": "Scheduled time is outside provider availability", "code": "SLOT_INVALID" }` | New slot not in provider's schedule |
| 400 | `{ "error": "Provider already has a session at this time", "code": "SLOT_INVALID" }` | New slot conflicts with another session |
| 404 | `{ "error": "Session not found" }` | Invalid sessionId |

---

## Error Reference

### Standard Error Envelope

All errors follow this shape:

```json
{
  "servicialo_version": "1.0",
  "org": "{orgSlug}",
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

The `code` field is present only for specific error types (e.g. payment errors). The `org` field is present on proxy-level errors but may be absent on upstream errors.

### HTTP Status Codes

| Status | Meaning | Retryable |
|--------|---------|-----------|
| 200 | Success | — |
| 201 | Created (booking) | — |
| 400 | Validation error | No — fix the request |
| 402 | Payment required/invalid | No — resolve payment first |
| 404 | Not found | No — check IDs |
| 409 | Conflict (double-booking, invalid state) | Maybe — re-check availability |
| 429 | Rate limited | Yes — back off |
| 502 | Upstream unavailable | Yes — retry with backoff |
| 500 | Internal error | Yes — retry once |

### Rate Limits

- REST endpoints: governed by platform rate limiter
- A2A endpoint: 100 tasks/minute per IP + organization
- Response header: `Retry-After` (seconds) on 429

---

## Autonomous Agent Flow

This is the complete sequence an external agent follows to book a session from zero.

### Scenario: Padre buscando hora de kinesiologia para su hijo esta semana

---

#### Turn 1: Discovery

**User says:** "Quiero una hora de kinesio esta semana para mi hijo"

**Agent action:** Fetch service catalog

```
GET https://coordinalo.com/api/servicialo/clinica-demo/services
```

**Response:**
```json
{
  "servicialo_version": "1.0",
  "organization": { "name": "Clinica Demo", "slug": "clinica-demo" },
  "services": [
    {
      "id": "cmiofy9re007fus0wn9g1t3h3",
      "name": "Kinesiologia de Piso Pelvico",
      "description": "Rehabilitacion del piso pelvico...",
      "price": 46000,
      "currency": "CLP",
      "modality": "a_domicilio",
      "duration_minutes": 60
    },
    {
      "id": "cmiofy3o7005zus0wvsk0xqdc",
      "name": "Kinesiologia Musculoesqueletica",
      "description": "Kinesiologia para dolor muscular...",
      "price": 40000,
      "currency": "CLP",
      "modality": "a_domicilio",
      "duration_minutes": 60
    }
  ]
}
```

**Agent responds to user:**
> "En Clinica Demo tienen dos opciones de kinesiologia:
> 1. Kinesiologia de Piso Pelvico — $46.000 CLP, 60 min, a domicilio
> 2. Kinesiologia Musculoesqueletica — $40.000 CLP, 60 min, a domicilio
>
> Cual necesitas?"

---

#### Turn 2: Availability

**User says:** "La musculoesqueletica"

**Agent action:** Check availability for this week

```
GET https://coordinalo.com/api/servicialo/clinica-demo/availability?serviceId=cmiofy3o7005zus0wvsk0xqdc&from=2026-03-30&days=7
```

**Response:**
```json
{
  "slots": [
    {
      "date": "2026-03-31",
      "start": "2026-03-31T13:00:00.000Z",
      "end": "2026-03-31T14:00:00.000Z",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" }
    },
    {
      "date": "2026-03-31",
      "start": "2026-03-31T15:00:00.000Z",
      "end": "2026-03-31T16:00:00.000Z",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" }
    },
    {
      "date": "2026-04-01",
      "start": "2026-04-01T13:00:00.000Z",
      "end": "2026-04-01T14:00:00.000Z",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" }
    },
    {
      "date": "2026-04-01",
      "start": "2026-04-01T18:00:00.000Z",
      "end": "2026-04-01T19:00:00.000Z",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" }
    },
    {
      "date": "2026-04-01",
      "start": "2026-04-01T19:00:00.000Z",
      "end": "2026-04-01T20:00:00.000Z",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" }
    }
  ],
  "service": { "id": "cmiofy3o7005zus0wvsk0xqdc", "duration_minutes": 60 },
  "timezone": "America/Santiago"
}
```

Note: `start`/`end` are UTC — the agent converts them to the response's `timezone` before showing them. April 2 contributes no entries, so the agent infers it has no availability.

**Agent responds to user:**
> "Esta semana con la Dra. Maria Gonzalez hay estas horas disponibles:
>
> **Martes 31 marzo:** 10:00 o 12:00
> **Miercoles 1 abril:** 10:00, 15:00 o 16:00
> **Jueves 2 abril:** sin horas disponibles
>
> Cual prefieres?"

---

#### Turn 3: Booking

**User says:** "El miercoles a las 10, a nombre de mi hijo Joaquin Lopez, email joaquin.lopez@mail.com"

**Agent action:** Confirm before booking

**Agent responds to user:**
> "Confirmo la reserva:
> - **Servicio:** Kinesiologia Musculoesqueletica ($40.000 CLP)
> - **Fecha:** Miercoles 1 de abril, 10:00 - 11:00
> - **Profesional:** Dra. Maria Gonzalez
> - **Paciente:** Joaquin Lopez (joaquin.lopez@mail.com)
>
> Confirmo?"

---

#### Turn 4: Execution

**User says:** "Si, confirma"

**Agent action:** Book the session

```
POST https://coordinalo.com/api/servicialo/clinica-demo/book
Content-Type: application/json

{
  "clientEmail": "joaquin.lopez@mail.com",
  "clientName": "Joaquin",
  "clientLastName": "Lopez",
  "serviceId": "cmiofy3o7005zus0wvsk0xqdc",
  "providerId": "clx1abc123",
  "scheduledAt": "2026-04-01T13:00:00.000Z",
  "notes": "Hijo de usuario, referido por padre"
}
```

Note: `scheduledAt` is the chosen slot's `start` passed **verbatim** — the safest way to honor "use the exact slot time".

**Response (201):**
```json
{
  "servicialo_version": "1.0",
  "success": true,
  "session": {
    "id": "cm5session123",
    "status": "agendado",
    "derived_state": "agendado",
    "derived_state_index": 1,
    "scheduled_at": "2026-04-01T13:00:00.000Z",
    "duration_minutes": 60,
    "service": "Kinesiologia Musculoesqueletica",
    "client_email": "joaquin.lopez@mail.com"
  },
  "client_portal_url": "https://coordinalo.com/portal/clinica-demo?token=eyJhbG...",
  "order_id": "cm5order456",
  "venta_id": "cm5venta789"
}
```

**Agent responds to user:**
> "Listo! Hora reservada:
> - **Miercoles 1 de abril, 10:00 - 11:00**
> - **Kinesiologia Musculoesqueletica** con Dra. Maria Gonzalez
> - Joaquin Lopez recibira un email de confirmacion
>
> Si necesitan cancelar o cambiar la hora, avisame."

---

## Conversation Contract

### What an agent MUST do

```
 1. Fetch the Agent Card first to discover capabilities
 2. Always call list_services before check_availability
 3. Always call check_availability before book_session
 4. Always confirm with the user before calling book_session
 5. Include clientEmail in book_session (it's the client identity key)
 6. Include clientName + clientLastName when booking for a new client
 7. Use the exact serviceId and providerId from prior responses
 8. Use the exact slot time from check_availability in scheduledAt
 9. Present prices in human-readable format (e.g. "$40.000 CLP")
10. Handle empty availability gracefully (show reason, suggest alternatives)
11. Preserve timezone from availability response in scheduledAt
```

### What an agent MUST NOT do

```
 1. Call book_session without prior check_availability
 2. Assume a slot is available without checking
 3. Book without explicit user confirmation
 4. Expose internal IDs (session IDs, CUIDs) to the user
 5. Invent or guess serviceId/providerId values
 6. Call cancel_session or reschedule_session without the session ID from book_session
 7. Retry a 409 SLOT_CONFLICT without re-checking availability
 8. Send scheduledAt without timezone offset
 9. Omit clientEmail from book_session
10. Cache availability results — slots change in real time
```

### Error Recovery

| Error | Agent should... |
|-------|----------------|
| 404 on services | Inform user the organization was not found |
| Empty `available_slots` (single-day) | Show the `reason` and suggest checking other dates/services |
| Empty `slots` (multi-day) | No availability in the window — suggest a wider range or another service |
| 409 `SLOT_CONFLICT` | Re-call `check_availability`, present updated slots |
| 402 `PAYMENT_REQUIRED` | Inform user that prepayment is needed, do NOT collect payment |
| 502 upstream error | Retry once after 5 seconds, then inform user |
| 429 rate limited | Wait `Retry-After` seconds, then retry |

---

## Lifecycle States

Every session traverses these 9 milestone states in order. The `derived_state` and `derived_state_index` fields in responses map to this lifecycle. **On the wire, `derived_state` carries the Spanish value** (the reference implementation's vocabulary); the canonical protocol name maps 1:1.

```
Index  Wire value     Canonical      Description
─────  ─────────────  ─────────────  ──────────────────────────────────
  0    solicitado     requested      Session requested (not yet scheduled)
  1    agendado       scheduled      Appointment set
  2    confirmado     confirmed      Provider/client confirmed attendance
  3    en_curso       in_progress    Session is happening now
  4    completado     completed      Session finished
  5    documentado    documented     Clinical/service notes recorded
  6    facturado      invoiced       Formal invoice generated
  7    cobrado        charged        Payment charged to client
  8    verificado     verified       Client confirmed service delivery
```

**Exception states** (can be entered from specific states):
- `cancelled` — from any pre-delivery state
- `disputed` — from completed state within dispute window
- `rescheduling` — from scheduled or confirmed
- `reassigning` — from confirmed (provider change)
- `partial` — from in_progress (incomplete delivery)
