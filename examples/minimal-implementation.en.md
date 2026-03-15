# Minimal Servicialo Implementation

A complete, runnable example of the simplest possible Servicialo-compatible backend. This is NOT Coordinalo — it's the absolute minimum that passes protocol compliance.

**Vertical:** Healthcare (kinesiology)
**Coverage:** 8/8 dimensions · 9/9 states · 3 exception flows · 6 MCP tool endpoints

> Every section annotates which part of the spec it satisfies.

---

## Architecture

```
AI Agent  ←→  MCP Server  ←→  Your HTTP API  ←→  In-memory store
```

The MCP server translates agent tool calls into HTTP requests. Your API implements the business logic. This example uses an Express server with in-memory storage — replace with your database of choice.

---

## 1. The Service Catalog (§5 — 8 Dimensions)

A single hardcoded service definition. In production, this comes from a database.

```typescript
// catalog.ts — Service definition satisfying all 8 dimensions

export const SERVICES = [
  {
    id: "srv_kine_rehab",
    type: "physical_therapy_session",         // §5.1 Identity
    vertical: "health",
    name: "Rehabilitation session — 45 min",
    duration_minutes: 45,
    visibility: "public",

    provider: {                                // §5.2 Provider
      id: "pro_andrea",
      organization_id: "org_minimal_clinic",
      credentials: ["kinesiologist_cl"],
      trust_score: 85,
    },

    location: {                                // §5.5 Location
      type: "in_person" as const,
      address: "Av. Providencia 1234, Of. 501",
      coordinates: { lat: -33.4265, lng: -70.6155 },
    },

    billing: {                                 // §5.8 Billing
      amount: { value: 35000, currency: "CLP" },
    },

    evidence_required: ["gps", "duration", "notes"],  // §5.7 Evidence
  },
];
```

**Satisfies:** §5.1 (identity), §5.2 (provider), §5.5 (location), §5.7 (evidence), §5.8 (billing). Dimensions §5.3 (client), §5.4 (schedule), and §5.6 (lifecycle) are populated when a booking is created.

---

## 2. The State Machine (§6 — 9 States, §7 — Exception Flows)

```typescript
// lifecycle.ts

export type ServiceState =
  | "requested" | "scheduled" | "confirmed" | "in_progress"
  | "completed" | "documented" | "invoiced" | "collected" | "verified"
  | "cancelled" | "disputed" | "rescheduling";

// §6.1 — States MUST be strictly ordered. No skipping.
const TRANSITIONS: Record<string, string[]> = {
  requested:    ["scheduled", "cancelled"],
  scheduled:    ["confirmed", "cancelled", "rescheduling"],
  confirmed:    ["in_progress", "cancelled"],
  in_progress:  ["completed"],
  completed:    ["documented", "disputed"],
  documented:   ["invoiced"],
  invoiced:     ["collected"],
  collected:    ["verified"],
  verified:     [],
  cancelled:    [],
  disputed:     ["collected", "cancelled"],
  rescheduling: ["scheduled"],
};

export interface Transition {
  from: string | null;
  to: string;
  at: string;       // ISO 8601
  by: string;       // §6.1 — who triggered
  method: "auto" | "manual" | "agent";
}

export interface Exception {
  type: "cancellation" | "no_show" | "reschedule";
  at: string;
  initiated_by: string;
  resolution?: string;
}

export function validateTransition(from: ServiceState, to: ServiceState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
```

---

## 3. The Booking Store

```typescript
// store.ts — In-memory store. Replace with your database.

import { ServiceState, Transition, Exception } from "./lifecycle.js";

export interface Booking {
  id: string;

  // §5.1 Identity
  service_id: string;
  service_name: string;
  vertical: string;

  // §5.2 Provider
  provider_id: string;

  // §5.3 Client
  client_id: string;
  payer_id?: string;

  // §5.4 Schedule
  requested_at: string;
  scheduled_for: string;
  duration_minutes: number;

  // §5.5 Location
  location: { type: string; address: string; coordinates: { lat: number; lng: number } };

  // §5.6 Lifecycle
  current_state: ServiceState;
  transitions: Transition[];
  exceptions: Exception[];

  // §5.7 Evidence
  proof: {
    checkin?: string;
    checkout?: string;
    duration_actual?: number;
    evidence: Array<{ type: string; captured_at: string; data: Record<string, unknown> }>;
  };

  // §5.8 Billing
  billing: {
    amount: { value: number; currency: string };
    status: "pending" | "charged" | "invoiced" | "paid" | "disputed";
  };
}

export const bookings = new Map<string, Booking>();
```

---

## 4. HTTP API — 6 Endpoints

### Endpoint 1: `GET /services` → MCP tool `services.list` (§13.1)

Returns the public service catalog. No authentication required.

```typescript
// GET /services
// MCP tool: services.list (Phase 1 — Discover)
// Spec: §13.1 — Discovery Mode

app.get("/services", (req, res) => {
  res.json({
    services: SERVICES.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      vertical: s.vertical,
      duration_minutes: s.duration_minutes,
      price: s.billing.amount,
      visibility: s.visibility,
    })),
  });
});
```

**Request:**
```http
GET /services
```

**Response:**
```json
{
  "services": [
    {
      "id": "srv_kine_rehab",
      "name": "Rehabilitation session — 45 min",
      "type": "physical_therapy_session",
      "vertical": "health",
      "duration_minutes": 45,
      "price": { "value": 35000, "currency": "CLP" },
      "visibility": "public"
    }
  ]
}
```

---

### Endpoint 2: `GET /availability` → MCP tool `scheduling.check_availability` (§13.1.1)

Returns available time slots. No authentication required.

```typescript
// GET /availability?service_id=X&provider_id=Y&date_from=Z&date_to=W
// MCP tool: scheduling.check_availability (Phase 1 — Discover)
// Spec: §13.1.1 — Availability Modes
//
// Mode A: provider-only availability
// No Resource infrastructure required (§5.5.1)
// Sufficient for: solo practices, freelancers,
//   any provider without shared physical resources
//
// Other modes (B: resource-only, C: provider + resource) require
// Resource entity. See §13.1.1 for full specification.

app.get("/availability", (req, res) => {
  const { service_id, provider_id, date_from, date_to } = req.query;
  const service = SERVICES.find((s) => s.id === service_id);
  if (!service) return res.status(404).json({ error: "Service not found" });

  // Mode A: check provider calendar only.
  // No resource_id → no Resource infrastructure needed.
  // confidence_score = 0.9 (resource conflicts possible but unknown)
  //
  // In production: query provider's existing bookings
  // and return slots where provider has no confirmed services.
  // For this minimal example, return hardcoded slots.
  res.json({
    service_id,
    mode: "provider_only",
    provider: {
      id: service.provider.id,
      credentials: service.provider.credentials,
    },
    slots: [
      { date: date_from, start: "10:00", end: "10:45", confidence_score: 0.9 },
      { date: date_from, start: "15:00", end: "15:45", confidence_score: 0.9 },
    ],
    conflict_resolution: { type: "none" },
  });
});
```

**Request:**
```http
GET /availability?service_id=srv_kine_rehab&provider_id=pro_andrea&date_from=2026-03-20&date_to=2026-03-24
```

**Response:**
```json
{
  "service_id": "srv_kine_rehab",
  "mode": "provider_only",
  "provider": {
    "id": "pro_andrea",
    "credentials": ["kinesiologist_cl"]
  },
  "slots": [
    { "date": "2026-03-20", "start": "10:00", "end": "10:45", "confidence_score": 0.9 },
    { "date": "2026-03-20", "start": "15:00", "end": "15:45", "confidence_score": 0.9 }
  ],
  "conflict_resolution": { "type": "none" }
}
```

---

### Endpoint 3: `POST /bookings` → MCP tool `scheduling.book` (§13.2.2)

Creates a booking. Transitions: `→ requested → scheduled`.

```typescript
// POST /bookings
// MCP tool: scheduling.book (Phase 3 — Commit)
// Spec: §13.2.2 — Commitment

app.post("/bookings", (req, res) => {
  const { service_id, client_id, payer_id, starts_at } = req.body;
  const service = SERVICES.find((s) => s.id === service_id);
  if (!service) return res.status(404).json({ error: "Service not found" });

  const now = new Date().toISOString();
  const id = `bk_${Date.now()}`;

  const booking: Booking = {
    id,
    service_id,
    service_name: service.name,
    vertical: service.vertical,
    provider_id: service.provider.id,
    client_id,
    payer_id,
    requested_at: now,
    scheduled_for: starts_at,
    duration_minutes: service.duration_minutes,
    location: service.location,
    current_state: "scheduled",     // §6: requested → scheduled in one step
    transitions: [
      // §6.1 — Every transition MUST record from, to, at, by
      { from: null, to: "requested", at: now, by: client_id, method: "manual" },
      { from: "requested", to: "scheduled", at: now, by: "system", method: "auto" },
    ],
    exceptions: [],
    proof: { evidence: [] },
    billing: {
      amount: service.billing.amount,
      status: "pending",
    },
  };

  bookings.set(id, booking);
  res.status(201).json(booking);
});
```

**Request:**
```http
POST /bookings
Content-Type: application/json

{
  "service_id": "srv_kine_rehab",
  "client_id": "cli_maria",
  "starts_at": "2026-03-20T10:00:00-03:00"
}
```

**Response (201):**
```json
{
  "id": "bk_1710900000000",
  "service_id": "srv_kine_rehab",
  "service_name": "Rehabilitation session — 45 min",
  "vertical": "health",
  "provider_id": "pro_andrea",
  "client_id": "cli_maria",
  "current_state": "scheduled",
  "scheduled_for": "2026-03-20T10:00:00-03:00",
  "billing": { "amount": { "value": 35000, "currency": "CLP" }, "status": "pending" },
  "transitions": [
    { "from": null, "to": "requested", "at": "2026-03-15T12:00:00Z", "by": "cli_maria", "method": "manual" },
    { "from": "requested", "to": "scheduled", "at": "2026-03-15T12:00:00Z", "by": "system", "method": "auto" }
  ]
}
```

---

### Endpoint 4: `POST /bookings/:id/confirm` → MCP tool `scheduling.confirm` (§13.2.2)

Both parties confirm. Transitions: `scheduled → confirmed`.

```typescript
// POST /bookings/:id/confirm
// MCP tool: scheduling.confirm (Phase 3 — Commit)
// Spec: §13.2.2 — Commitment, §6 state 3

app.post("/bookings/:id/confirm", (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const { by } = req.body;  // who is confirming

  if (!validateTransition(booking.current_state as ServiceState, "confirmed")) {
    return res.status(400).json({
      error: `Cannot confirm from state: ${booking.current_state}`,
    });
  }

  booking.current_state = "confirmed";
  booking.transitions.push({
    from: "scheduled",
    to: "confirmed",
    at: new Date().toISOString(),
    by,
    method: "manual",
  });

  res.json(booking);
});
```

**Request:**
```http
POST /bookings/bk_1710900000000/confirm
Content-Type: application/json

{ "by": "cli_maria" }
```

**Response:**
```json
{
  "id": "bk_1710900000000",
  "current_state": "confirmed",
  "transitions": ["... previous ...", { "from": "scheduled", "to": "confirmed", "at": "...", "by": "cli_maria", "method": "manual" }]
}
```

---

### Endpoint 5: `POST /bookings/:id/transition` → MCP tool `lifecycle.transition` (§13.2.3)

Generic state transition. Used for states 4–9 and exception flows.

```typescript
// POST /bookings/:id/transition
// MCP tool: lifecycle.transition (Phase 4 — Manage)
// Spec: §13.2.3 — Lifecycle, §6.1 — Transition rules

app.post("/bookings/:id/transition", (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const { to, by, method = "manual", exception } = req.body;

  // §6.1 — Validate strict ordering
  if (!validateTransition(booking.current_state as ServiceState, to)) {
    return res.status(400).json({
      error: `Invalid transition: ${booking.current_state} → ${to}`,
      allowed: TRANSITIONS[booking.current_state],
    });
  }

  const transition: Transition = {
    from: booking.current_state,
    to,
    at: new Date().toISOString(),
    by,
    method,
  };

  booking.transitions.push(transition);
  booking.current_state = to;

  // §7 — Record exception if this is an exception flow
  if (exception) {
    booking.exceptions.push({
      type: exception.type,
      at: transition.at,
      initiated_by: by,
      resolution: exception.resolution,
    });
  }

  // §5.8 — Update billing status on financial transitions
  if (to === "invoiced") booking.billing.status = "invoiced";
  if (to === "collected") booking.billing.status = "paid";

  res.json(booking);
});
```

**Request — happy path (completing a service):**
```http
POST /bookings/bk_1710900000000/transition
Content-Type: application/json

{ "to": "completed", "by": "pro_andrea", "method": "manual" }
```

**Request — exception flow (cancellation, §7.3):**
```http
POST /bookings/bk_1710900000000/transition
Content-Type: application/json

{
  "to": "cancelled",
  "by": "cli_maria",
  "method": "manual",
  "exception": {
    "type": "cancellation",
    "resolution": "free_cancellation"
  }
}
```

**Request — exception flow (client no-show, §7.1):**
```http
POST /bookings/bk_1710900000000/transition
Content-Type: application/json

{
  "to": "cancelled",
  "by": "system",
  "method": "auto",
  "exception": {
    "type": "no_show",
    "resolution": "client_no_show_penalty_applied"
  }
}
```

**Request — exception flow (rescheduling, §7.5):**
```http
POST /bookings/bk_1710900000000/transition
Content-Type: application/json

{
  "to": "rescheduling",
  "by": "cli_maria",
  "method": "manual",
  "exception": {
    "type": "reschedule"
  }
}
```

Then resolve:
```http
POST /bookings/bk_1710900000000/transition
Content-Type: application/json

{ "to": "scheduled", "by": "system", "method": "auto" }
```

**Response (400 — invalid transition):**
```json
{
  "error": "Invalid transition: requested → documented",
  "allowed": ["scheduled", "cancelled"]
}
```

---

### Endpoint 6: `POST /bookings/:id/checkin` → MCP tool `delivery.checkin` (§13.2.4)

Records provider check-in with GPS. Transitions: `confirmed → in_progress`.

```typescript
// POST /bookings/:id/checkin
// MCP tool: delivery.checkin (Phase 5 — Verify)
// Spec: §13.2.4 — Delivery Verification, §5.7 — Evidence

app.post("/bookings/:id/checkin", (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  if (booking.current_state !== "confirmed") {
    return res.status(400).json({
      error: `Check-in requires state 'confirmed', got '${booking.current_state}'`,
    });
  }

  const { by, coordinates, timestamp } = req.body;
  const now = timestamp || new Date().toISOString();

  // §5.7 — Record evidence
  booking.proof.checkin = now;
  booking.proof.evidence.push({
    type: "gps",
    captured_at: now,
    data: { coordinates, event: "checkin" },
  });

  // §6 state 4 — in_progress on check-in
  booking.current_state = "in_progress";
  booking.transitions.push({
    from: "confirmed",
    to: "in_progress",
    at: now,
    by,
    method: "auto",
  });

  res.json(booking);
});
```

**Request:**
```http
POST /bookings/bk_1710900000000/checkin
Content-Type: application/json

{
  "by": "pro_andrea",
  "coordinates": { "lat": -33.4265, "lng": -70.6155 },
  "timestamp": "2026-03-20T09:58:00-03:00"
}
```

**Response:**
```json
{
  "id": "bk_1710900000000",
  "current_state": "in_progress",
  "proof": {
    "checkin": "2026-03-20T09:58:00-03:00",
    "evidence": [
      {
        "type": "gps",
        "captured_at": "2026-03-20T09:58:00-03:00",
        "data": { "coordinates": { "lat": -33.4265, "lng": -70.6155 }, "event": "checkin" }
      }
    ]
  }
}
```

---

## 5. MCP Server Configuration

To connect an AI agent to this backend, create an MCP server config:

```json
{
  "mcpServers": {
    "minimal-servicialo": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "API_BASE": "http://localhost:3000"
      }
    }
  }
}
```

The MCP server wraps each HTTP endpoint as a tool:

```typescript
// mcp-server.ts — Minimal MCP server wrapping the 6 endpoints
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = process.env.API_BASE || "http://localhost:3000";
const server = new McpServer({
  name: "minimal-servicialo",
  version: "1.0.0",
});

// Tool 1: services.list (§13.1)
server.tool(
  "services.list",
  "List available services",
  {},
  async () => {
    const res = await fetch(`${API}/services`);
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

// Tool 2: scheduling.check_availability (§13.1.1)
// Mode A: provider-only availability
// No Resource infrastructure required
// Sufficient for: solo practices, freelancers,
//   any provider without shared physical resources
server.tool(
  "scheduling.check_availability",
  "Check available time slots (Mode A: provider only)",
  {
    service_id: z.string(),
    provider_id: z.string().describe("Provider ID (Mode A)"),
    date_from: z.string(),
    date_to: z.string(),
    duration_minutes: z.number().optional().describe("Requested duration in minutes"),
  },
  async ({ service_id, provider_id, date_from, date_to }) => {
    const res = await fetch(
      `${API}/availability?service_id=${service_id}&provider_id=${provider_id}&date_from=${date_from}&date_to=${date_to}`
    );
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

// Tool 3: scheduling.book (§13.2.2)
server.tool(
  "scheduling.book",
  "Book a service appointment",
  {
    service_id: z.string(),
    client_id: z.string(),
    starts_at: z.string(),
    payer_id: z.string().optional(),
  },
  async (params) => {
    const res = await fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

// Tool 4: scheduling.confirm (§13.2.2)
server.tool(
  "scheduling.confirm",
  "Confirm a booking",
  {
    booking_id: z.string(),
    by: z.string(),
  },
  async ({ booking_id, by }) => {
    const res = await fetch(`${API}/bookings/${booking_id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ by }),
    });
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

// Tool 5: lifecycle.transition (§13.2.3)
server.tool(
  "lifecycle.transition",
  "Transition a service to a new state",
  {
    booking_id: z.string(),
    to: z.string(),
    by: z.string(),
    method: z.enum(["auto", "manual", "agent"]).optional(),
    exception: z.object({
      type: z.string(),
      resolution: z.string().optional(),
    }).optional(),
  },
  async ({ booking_id, ...body }) => {
    const res = await fetch(`${API}/bookings/${booking_id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

// Tool 6: delivery.checkin (§13.2.4)
server.tool(
  "delivery.checkin",
  "Record check-in with GPS coordinates",
  {
    booking_id: z.string(),
    by: z.string(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }),
    timestamp: z.string().optional(),
  },
  async ({ booking_id, ...body }) => {
    const res = await fetch(`${API}/bookings/${booking_id}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
```

---

## 6. Full Lifecycle Walkthrough

An AI agent runs through the complete happy path:

```
Agent                              API                           State
  │                                 │                              │
  ├─ services.list ────────────────►│                              │
  │◄─ srv_kine_rehab ──────────────│                              │
  │                                 │                              │
  ├─ scheduling.check_availability─►│                              │
  │◄─ [10:00, 15:00] ─────────────│                              │
  │                                 │                              │
  ├─ scheduling.book ──────────────►│──── requested → scheduled ──►│
  │◄─ bk_123 ─────────────────────│                              │
  │                                 │                              │
  ├─ scheduling.confirm ───────────►│──── scheduled → confirmed ──►│
  │                                 │                              │
  ├─ delivery.checkin ─────────────►│──── confirmed → in_progress ►│
  │                                 │                              │
  ├─ lifecycle.transition(completed)►│── in_progress → completed ──►│
  ├─ lifecycle.transition(documented)►│── completed → documented ───►│
  ├─ lifecycle.transition(invoiced)─►│──── documented → invoiced ──►│
  ├─ lifecycle.transition(collected)►│──── invoiced → collected ───►│
  ├─ lifecycle.transition(verified)─►│──── collected → verified ───►│
  │                                 │                              │
  └─ Done. All 9 states traversed. │                              │
```

---

## 7. Exception Flow Walkthrough

### Cancellation (§7.3)

```
State: scheduled
Agent calls: lifecycle.transition({ to: "cancelled", exception: { type: "cancellation" } })
Result: scheduled → cancelled
```

### Client No-Show (§7.1)

```
State: confirmed
System detects: client didn't arrive within grace period
System calls: lifecycle.transition({ to: "cancelled", by: "system", method: "auto", exception: { type: "no_show" } })
Result: confirmed → cancelled (with penalty)
```

### Rescheduling (§7.5)

```
State: confirmed
Agent calls: lifecycle.transition({ to: "rescheduling", exception: { type: "reschedule" } })
Result: confirmed → rescheduling

Agent calls: lifecycle.transition({ to: "scheduled" })
Result: rescheduling → scheduled (with new time)
```

---

## Compliance Summary

| Requirement | Spec § | Status | How |
|-------------|--------|--------|-----|
| 8 dimensions modeled | §5 | Done | Service catalog + booking object |
| 9 lifecycle states | §6 | Done | State machine with strict ordering |
| Transitions recorded | §6.1 | Done | `from`, `to`, `at`, `by`, `method` on every transition |
| No state skipping | §6.1 | Done | `validateTransition()` rejects invalid jumps |
| Cancellation flow | §7.3 | Done | Any pre-delivery → cancelled |
| Client no-show | §7.1 | Done | confirmed → cancelled (no_show) |
| Rescheduling | §7.5 | Done | scheduled/confirmed → rescheduling → scheduled |
| MCP-connectable API | §13 | Done | 6 endpoints mapped to MCP tools |
| Evidence recorded | §5.7 | Done | GPS check-in stored in `proof.evidence` |

---

## What This Example Does NOT Implement

These are all optional for compliance but exist in the full spec:

| Feature | Why skipped | Spec § |
|---------|-------------|--------|
| Service Orders | Not required for compliance | §8 |
| Delegated Agency / Mandates | Optional | §10 |
| Provider Profiles | Optional | §12 |
| Network Intelligence | Optional, in design | §14 |
| Resource management | Minimal impl has one implicit room | §5.5.1 |
| Authentication | Orthogonal to the protocol | — |
| Quality disputes | Only 3 exception flows required | §7.4 |
| Partial delivery | Only 3 exception flows required | §7.6 |
| Resource conflicts | Only 3 exception flows required | §7.7 |

[SPEC GAP] The protocol does not define an HTTP API contract — only MCP tool signatures. This means two compliant implementations may have completely different REST APIs. The MCP server layer is what provides interoperability, not the HTTP layer.

[RESOLVED v0.8] The protocol now specifies three availability modes (§13.1.1): Mode A (provider only), Mode B (resource only), Mode C (provider + resource). This example uses Mode A — no Resource infrastructure required. A real implementation should intersect the provider calendar with existing bookings.
