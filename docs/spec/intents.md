# A2A Intent Payloads — Servicialo Protocol

**Version 1.1.0** | Reference implementation: **Mamá Pro** via Coordinalo

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

All requests use **JSON-RPC 2.0** with method `message/send`:

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
          "text": "..."
        }
      ]
    }
  }
}
```

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
  "name": "Mama Pro",
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
    "name": "Mama Pro",
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
| `description` | string | Yes | What the service includes |
| `price` | number | Yes | Base price in the smallest useful unit (e.g. CLP whole pesos) |
| `currency` | string | Yes | ISO 4217 currency code (`CLP`, `USD`, `UF`) |
| `price_unit` | string | Yes | Always `"servicio"` |
| `modality` | string | Yes | `"presencial"`, `"a_domicilio"`, or `"remoto"` |
| `duration_minutes` | integer | Yes | Session duration in minutes |
| `category` | string | No | Service category (e.g. `"kinesiologia"`) |
| `requirements` | string | No | What the client needs to bring/prepare |
| `expected_outcome` | string | No | What the client can expect |
| `tags` | string[] | No | Searchable tags |
| `suggested_frequency` | string | No | Recommended frequency (e.g. `"semanal"`) |
| `treatment_length` | string | No | Typical treatment duration (e.g. `"8 sesiones"`) |

#### Error Responses

| Status | Shape | When |
|--------|-------|------|
| 404 | `{ "servicialo_version": "1.0", "org": "{slug}", "error": "Organization \"{slug}\" not found in resolver" }` | Organization doesn't exist or isn't discoverable |
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

\* Exactly one query mode is required: `date`, `from`+`days`, or `next`.

#### Query Modes

| Mode | Params | Description |
|------|--------|-------------|
| **Single day** | `date=2026-04-01` | All slots for one specific day |
| **Date range** | `from=2026-04-01&days=7` | All slots across N days |
| **Next N slots** | `next=5` | Next 5 available slots across upcoming days |

#### Success Response (200) — Date Range / Single Day

```json
{
  "servicialo_version": "1.0",
  "organization": {
    "name": "Mama Pro",
    "slug": "clinica-demo"
  },
  "results": [
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
        { "start": "09:00", "end": "10:00" },
        { "start": "10:00", "end": "11:00" },
        { "start": "14:00", "end": "15:00" },
        { "start": "15:00", "end": "16:00" }
      ],
      "timezone": "America/Santiago"
    },
    {
      "date": "2026-04-02",
      "provider": {
        "id": "clx1abc123",
        "name": "Dra. Maria Gonzalez"
      },
      "service": {
        "id": "cmiofz81v00fdus0wfmw2tav9",
        "duration_minutes": 60
      },
      "available_slots": [],
      "timezone": "America/Santiago",
      "reason": "ALL_SLOTS_BOOKED"
    }
  ]
}
```

#### Success Response (200) — Next N Slots

```json
{
  "servicialo_version": "1.0",
  "organization": {
    "name": "Mama Pro",
    "slug": "clinica-demo"
  },
  "results": [
    {
      "date": "2026-04-01",
      "start": "09:00",
      "end": "10:00",
      "provider": {
        "id": "clx1abc123",
        "name": "Dra. Maria Gonzalez"
      }
    },
    {
      "date": "2026-04-01",
      "start": "10:00",
      "end": "11:00",
      "provider": {
        "id": "clx1abc123",
        "name": "Dra. Maria Gonzalez"
      }
    }
  ]
}
```

#### Slot Result Fields

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `date` | string (YYYY-MM-DD) | Yes | The date |
| `provider.id` | string | Yes | Provider identifier |
| `provider.name` | string | Yes | Provider display name |
| `service.id` | string | Yes* | Service identifier |
| `service.duration_minutes` | integer | Yes* | Duration in minutes |
| `available_slots` | array | Yes* | Array of `{ start, end }` time strings (HH:MM) |
| `timezone` | string | Yes | IANA timezone (e.g. `America/Santiago`) |
| `reason` | string | No | Why no slots: `NO_AVAILABILITY_CONFIGURED`, `NO_SLOTS_FOR_DATE`, `ALL_SLOTS_BOOKED` |

\* Present in date-range/single-day mode. In `next` mode, `start` and `end` are top-level.

#### Error Responses

| Status | Shape | When |
|--------|-------|------|
| 400 | `{ "error": "serviceId is required" }` | Missing required param |
| 400 | `{ "error": "Invalid date format" }` | Bad date string |
| 404 | Same as `list_services` 404 | Org not found |
| 502 | Same as `list_services` 502 | Upstream unavailable |

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
    "derived_state": "scheduled",
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
| `servicialo_version` | string | Protocol version |
| `success` | boolean | Always `true` on 201 |
| `session.id` | string | Unique session identifier |
| `session.status` | string | Internal status (`agendado` or `pendiente_confirmacion`) |
| `session.derived_state` | string | Servicialo canonical state (see [Lifecycle States](#lifecycle-states)) |
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
| 400 | `VALIDATION_ERROR` | `{ "error": "clientEmail is required" }` | Missing required field |
| 400 | `SLOT_OUTSIDE_HOURS` | `{ "error": "Requested time is outside provider availability" }` | Slot doesn't fall within provider's schedule |
| 400 | `PAST_DATE` | `{ "error": "Cannot book in the past" }` | `scheduledAt` is before now |
| 402 | `PAYMENT_REQUIRED` | `{ "error": "Service requires prepayment", "code": "PAYMENT_REQUIRED" }` | Service requires pre-payment |
| 402 | `PAYMENT_NOT_APPROVED` | `{ "error": "...", "code": "PAYMENT_NOT_APPROVED" }` | PaymentIntent not approved |
| 402 | `PAYMENT_INSUFFICIENT` | `{ "error": "...", "code": "PAYMENT_INSUFFICIENT" }` | Payment amount too low |
| 402 | `PAYMENT_ALREADY_USED` | `{ "error": "...", "code": "PAYMENT_ALREADY_USED" }` | PaymentIntent reused |
| 404 | — | `{ "error": "Service not found" }` | Invalid serviceId |
| 404 | — | `{ "error": "Provider not found" }` | Invalid providerId |
| 409 | `SLOT_CONFLICT` | `{ "error": "Slot is already taken" }` | Double-booking detected |
| 502 | — | Same shape as other 502s | Upstream unavailable |

---

### 4. `cancel_session`

Cancel an existing session. Cancellation policy from the service contract may apply.

#### REST Request

```
POST /api/servicialo/{orgSlug}/sessions/{sessionId}/cancel
Content-Type: application/json
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
| `reason` | string (max 500) | **Yes** | Cancellation reason |
| `cancelledBy` | string | No | `"client"`, `"provider"`, or `"admin"` (default: `"admin"`) |

#### Success Response (200)

```json
{
  "servicialo_version": "1.0",
  "success": true,
  "session": {
    "id": "cm5xyz789session",
    "status": "cancelado",
    "derived_state": "cancelled",
    "cancelled_at": "2026-04-01T18:30:00.000Z",
    "cancelled_by": "client",
    "reason": "Paciente enfermo, no puede asistir"
  },
  "cancellation_policy_applied": true,
  "charge_amount": 0
}
```

#### Error Responses

| Status | Shape | When |
|--------|-------|------|
| 400 | `{ "error": "reason is required" }` | Missing reason |
| 404 | `{ "error": "Session not found" }` | Invalid sessionId |
| 409 | `{ "error": "Session cannot be cancelled in current state" }` | Already completed/cancelled |

---

### 5. `reschedule_session`

Move a session to a new time. The original session is cancelled and a new one is created.

#### REST Request

```
POST /api/servicialo/{orgSlug}/sessions/{sessionId}/reschedule
Content-Type: application/json
```

#### Request Body

```json
{
  "newScheduledAt": "2026-04-05T14:00:00-04:00",
  "reason": "Conflicto de horario"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newScheduledAt` | string (ISO 8601) | **Yes** | New appointment datetime with timezone |
| `reason` | string (max 500) | No | Reason for rescheduling |
| `newProviderId` | string | No | Change provider (optional) |

#### Success Response (200)

```json
{
  "servicialo_version": "1.0",
  "success": true,
  "original_session": {
    "id": "cm5xyz789session",
    "status": "cancelado"
  },
  "new_session": {
    "id": "cm5abc456session",
    "status": "agendado",
    "derived_state": "scheduled",
    "scheduled_at": "2026-04-05T14:00:00.000Z",
    "duration_minutes": 60,
    "service": "Asesoria Lactancia",
    "client_email": "martin.lopez@gmail.com"
  }
}
```

#### Error Responses

| Status | Shape | When |
|--------|-------|------|
| 400 | `{ "error": "newScheduledAt is required" }` | Missing new datetime |
| 400 | `{ "error": "Requested time is outside provider availability" }` | New slot not in schedule |
| 404 | `{ "error": "Session not found" }` | Invalid sessionId |
| 409 | `{ "error": "Slot is already taken" }` | New slot is booked |
| 409 | `{ "error": "Session cannot be rescheduled in current state" }` | Already completed/cancelled |

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
- A2A endpoint: 100 tasks/minute per agent
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
  "organization": { "name": "Mama Pro", "slug": "clinica-demo" },
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
> "En Mama Pro tienen dos opciones de kinesiologia:
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
  "servicialo_version": "1.0",
  "organization": { "name": "Mama Pro", "slug": "clinica-demo" },
  "results": [
    {
      "date": "2026-03-31",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" },
      "service": { "id": "cmiofy3o7005zus0wvsk0xqdc", "duration_minutes": 60 },
      "available_slots": [
        { "start": "09:00", "end": "10:00" },
        { "start": "11:00", "end": "12:00" }
      ],
      "timezone": "America/Santiago"
    },
    {
      "date": "2026-04-01",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" },
      "service": { "id": "cmiofy3o7005zus0wvsk0xqdc", "duration_minutes": 60 },
      "available_slots": [
        { "start": "10:00", "end": "11:00" },
        { "start": "14:00", "end": "15:00" },
        { "start": "15:00", "end": "16:00" }
      ],
      "timezone": "America/Santiago"
    },
    {
      "date": "2026-04-02",
      "provider": { "id": "clx1abc123", "name": "Dra. Maria Gonzalez" },
      "service": { "id": "cmiofy3o7005zus0wvsk0xqdc", "duration_minutes": 60 },
      "available_slots": [],
      "timezone": "America/Santiago",
      "reason": "ALL_SLOTS_BOOKED"
    }
  ]
}
```

**Agent responds to user:**
> "Esta semana con la Dra. Maria Gonzalez hay estas horas disponibles:
>
> **Martes 31 marzo:** 09:00 o 11:00
> **Miercoles 1 abril:** 10:00, 14:00 o 15:00
> **Jueves 2 abril:** todo ocupado
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
  "scheduledAt": "2026-04-01T10:00:00-04:00",
  "notes": "Hijo de usuario, referido por padre"
}
```

**Response (201):**
```json
{
  "servicialo_version": "1.0",
  "success": true,
  "session": {
    "id": "cm5session123",
    "status": "agendado",
    "derived_state": "scheduled",
    "derived_state_index": 1,
    "scheduled_at": "2026-04-01T14:00:00.000Z",
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
| Empty `available_slots` | Show the `reason` and suggest checking other dates/services |
| 409 `SLOT_CONFLICT` | Re-call `check_availability`, present updated slots |
| 402 `PAYMENT_REQUIRED` | Inform user that prepayment is needed, do NOT collect payment |
| 502 upstream error | Retry once after 5 seconds, then inform user |
| 429 rate limited | Wait `Retry-After` seconds, then retry |

---

## Lifecycle States

Every session traverses these 9 canonical states in order. The `derived_state` and `derived_state_index` fields in responses map to this lifecycle.

```
Index  State          Description
─────  ─────────────  ──────────────────────────────────
  0    requested      Session requested (not yet scheduled)
  1    scheduled      Appointment set (agendado)
  2    confirmed      Provider/client confirmed attendance
  3    in_progress    Session is happening now
  4    completed      Session finished
  5    documented     Clinical/service notes recorded
  6    invoiced       Formal invoice generated
  7    charged        Payment charged to client
  8    verified       Client confirmed service delivery
```

**Exception states** (can be entered from specific states):
- `cancelled` — from any pre-delivery state
- `disputed` — from completed state within dispute window
- `rescheduling` — from scheduled or confirmed
- `reassigning` — from confirmed (provider change)
- `partial` — from in_progress (incomplete delivery)
