# Implementación Mínima de Servicialo

Un ejemplo completo y ejecutable del backend más simple posible compatible con Servicialo. Esto NO es Coordinalo — es el mínimo absoluto que pasa compliance del protocolo.

**Vertical:** Salud (kinesiología)
**Cobertura:** 8/8 dimensiones · 9/9 estados · 3 flujos de excepción · 6 endpoints MCP

> **[Read in English](./minimal-implementation.en.md)**
>
> Cada sección anota qué parte del spec satisface.

---

## Arquitectura

```
Agente AI  ←→  Servidor MCP  ←→  Tu API HTTP  ←→  Store en memoria
```

El servidor MCP traduce llamadas de herramientas del agente a requests HTTP. Tu API implementa la lógica de negocio. Este ejemplo usa un servidor Express con almacenamiento en memoria — reemplaza con la base de datos que prefieras.

---

## 1. El Catálogo de Servicios (§5 — 8 Dimensiones)

Un solo servicio hardcodeado. En producción, esto viene de una base de datos.

```typescript
// catalog.ts — Definición de servicio que satisface las 8 dimensiones

export const SERVICES = [
  {
    id: "srv_kine_rehab",
    type: "physical_therapy_session",         // §5.1 Identidad
    vertical: "health",
    name: "Sesión de rehabilitación — 45 min",
    duration_minutes: 45,
    visibility: "public",

    provider: {                                // §5.2 Proveedor
      id: "pro_andrea",
      organization_id: "org_clinica_minima",
      credentials: ["kinesiologist_cl"],
      trust_score: 85,
    },

    location: {                                // §5.5 Ubicación
      type: "in_person" as const,
      address: "Av. Providencia 1234, Of. 501",
      coordinates: { lat: -33.4265, lng: -70.6155 },
    },

    billing: {                                 // §5.8 Cobro
      amount: { value: 35000, currency: "CLP" },
    },

    evidence_required: ["gps", "duration", "notes"],  // §5.7 Evidencia
  },
];
```

**Satisface:** §5.1 (identidad), §5.2 (proveedor), §5.5 (ubicación), §5.7 (evidencia), §5.8 (cobro). Las dimensiones §5.3 (cliente), §5.4 (agenda), y §5.6 (ciclo de vida) se llenan cuando se crea una reserva.

---

## 2. La Máquina de Estados (§6 — 9 Estados, §7 — Flujos de Excepción)

```typescript
// lifecycle.ts

export type ServiceState =
  | "requested" | "scheduled" | "confirmed" | "in_progress"
  | "completed" | "documented" | "invoiced" | "collected" | "verified"
  | "cancelled" | "disputed" | "rescheduling";

// §6.1 — Los estados DEBEN ser estrictamente ordenados. Sin saltos.
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
  by: string;       // §6.1 — quién disparó la transición
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

## 3. El Store de Reservas

```typescript
// store.ts — Store en memoria. Reemplazar con tu base de datos.

import { ServiceState, Transition, Exception } from "./lifecycle.js";

export interface Booking {
  id: string;

  // §5.1 Identidad
  service_id: string;
  service_name: string;
  vertical: string;

  // §5.2 Proveedor
  provider_id: string;

  // §5.3 Cliente
  client_id: string;
  payer_id?: string;

  // §5.4 Agenda
  requested_at: string;
  scheduled_for: string;
  duration_minutes: number;

  // §5.5 Ubicación
  location: { type: string; address: string; coordinates: { lat: number; lng: number } };

  // §5.6 Ciclo de vida
  current_state: ServiceState;
  transitions: Transition[];
  exceptions: Exception[];

  // §5.7 Evidencia
  proof: {
    checkin?: string;
    checkout?: string;
    duration_actual?: number;
    evidence: Array<{ type: string; captured_at: string; data: Record<string, unknown> }>;
  };

  // §5.8 Cobro
  billing: {
    amount: { value: number; currency: string };
    status: "pending" | "charged" | "invoiced" | "paid" | "disputed";
  };
}

export const bookings = new Map<string, Booking>();
```

---

## 4. API HTTP — 6 Endpoints

### Endpoint 1: `GET /services` → herramienta MCP `services.list` (§13.1)

Retorna el catálogo público de servicios. Sin autenticación.

```typescript
// GET /services
// Herramienta MCP: services.list (Fase 1 — Descubrir)
// Spec: §13.1 — Modo Descubrimiento

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
      "name": "Sesión de rehabilitación — 45 min",
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

### Endpoint 2: `GET /availability` → herramienta MCP `scheduling.check_availability` (§13.1)

Retorna horarios disponibles. Sin autenticación.

```typescript
// GET /availability?service_id=X&date_from=Y&date_to=Z
// Herramienta MCP: scheduling.check_availability (Fase 1 — Descubrir)
// Spec: §13.1 — Modo Descubrimiento

app.get("/availability", (req, res) => {
  const { service_id, date_from, date_to } = req.query;
  const service = SERVICES.find((s) => s.id === service_id);
  if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

  // En producción: intersectar calendario del proveedor, calendario del recurso,
  // y reservas existentes (§6.2 — scheduler de 3 variables)
  // Para este ejemplo mínimo, retornamos slots hardcodeados
  res.json({
    service_id,
    provider: {
      id: service.provider.id,
      credentials: service.provider.credentials,
    },
    slots: [
      { date: date_from, start: "10:00", end: "10:45" },
      { date: date_from, start: "15:00", end: "15:45" },
    ],
  });
});
```

**Request:**
```http
GET /availability?service_id=srv_kine_rehab&date_from=2026-03-20&date_to=2026-03-24
```

**Response:**
```json
{
  "service_id": "srv_kine_rehab",
  "provider": {
    "id": "pro_andrea",
    "credentials": ["kinesiologist_cl"]
  },
  "slots": [
    { "date": "2026-03-20", "start": "10:00", "end": "10:45" },
    { "date": "2026-03-20", "start": "15:00", "end": "15:45" }
  ]
}
```

---

### Endpoint 3: `POST /bookings` → herramienta MCP `scheduling.book` (§13.2.2)

Crea una reserva. Transiciones: `→ requested → scheduled`.

```typescript
// POST /bookings
// Herramienta MCP: scheduling.book (Fase 3 — Comprometer)
// Spec: §13.2.2 — Compromiso

app.post("/bookings", (req, res) => {
  const { service_id, client_id, payer_id, starts_at } = req.body;
  const service = SERVICES.find((s) => s.id === service_id);
  if (!service) return res.status(404).json({ error: "Servicio no encontrado" });

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
    current_state: "scheduled",     // §6: requested → scheduled en un paso
    transitions: [
      // §6.1 — Cada transición DEBE registrar from, to, at, by
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
  "service_name": "Sesión de rehabilitación — 45 min",
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

### Endpoint 4: `POST /bookings/:id/confirm` → herramienta MCP `scheduling.confirm` (§13.2.2)

Ambas partes confirman. Transición: `scheduled → confirmed`.

```typescript
// POST /bookings/:id/confirm
// Herramienta MCP: scheduling.confirm (Fase 3 — Comprometer)
// Spec: §13.2.2 — Compromiso, §6 estado 3

app.post("/bookings/:id/confirm", (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Reserva no encontrada" });

  const { by } = req.body;  // quién confirma

  if (!validateTransition(booking.current_state as ServiceState, "confirmed")) {
    return res.status(400).json({
      error: `No se puede confirmar desde el estado: ${booking.current_state}`,
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

---

### Endpoint 5: `POST /bookings/:id/transition` → herramienta MCP `lifecycle.transition` (§13.2.3)

Transición genérica de estado. Usado para estados 4–9 y flujos de excepción.

```typescript
// POST /bookings/:id/transition
// Herramienta MCP: lifecycle.transition (Fase 4 — Gestionar)
// Spec: §13.2.3 — Ciclo de vida, §6.1 — Reglas de transición

app.post("/bookings/:id/transition", (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Reserva no encontrada" });

  const { to, by, method = "manual", exception } = req.body;

  // §6.1 — Validar orden estricto
  if (!validateTransition(booking.current_state as ServiceState, to)) {
    return res.status(400).json({
      error: `Transición inválida: ${booking.current_state} → ${to}`,
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

  // §7 — Registrar excepción si es un flujo de excepción
  if (exception) {
    booking.exceptions.push({
      type: exception.type,
      at: transition.at,
      initiated_by: by,
      resolution: exception.resolution,
    });
  }

  // §5.8 — Actualizar estado de cobro en transiciones financieras
  if (to === "invoiced") booking.billing.status = "invoiced";
  if (to === "collected") booking.billing.status = "paid";

  res.json(booking);
});
```

**Request — camino feliz (completar servicio):**
```http
POST /bookings/bk_1710900000000/transition
Content-Type: application/json

{ "to": "completed", "by": "pro_andrea", "method": "manual" }
```

**Request — flujo de excepción (cancelación, §7.3):**
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

**Request — flujo de excepción (no-show del cliente, §7.1):**
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

**Request — flujo de excepción (reagendamiento, §7.5):**
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

Luego resolver:
```http
POST /bookings/bk_1710900000000/transition
Content-Type: application/json

{ "to": "scheduled", "by": "system", "method": "auto" }
```

**Response (400 — transición inválida):**
```json
{
  "error": "Transición inválida: requested → documented",
  "allowed": ["scheduled", "cancelled"]
}
```

---

### Endpoint 6: `POST /bookings/:id/checkin` → herramienta MCP `delivery.checkin` (§13.2.4)

Registra check-in del proveedor con GPS. Transición: `confirmed → in_progress`.

```typescript
// POST /bookings/:id/checkin
// Herramienta MCP: delivery.checkin (Fase 5 — Verificar)
// Spec: §13.2.4 — Verificación de entrega, §5.7 — Evidencia

app.post("/bookings/:id/checkin", (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Reserva no encontrada" });

  if (booking.current_state !== "confirmed") {
    return res.status(400).json({
      error: `Check-in requiere estado 'confirmed', recibido '${booking.current_state}'`,
    });
  }

  const { by, coordinates, timestamp } = req.body;
  const now = timestamp || new Date().toISOString();

  // §5.7 — Registrar evidencia
  booking.proof.checkin = now;
  booking.proof.evidence.push({
    type: "gps",
    captured_at: now,
    data: { coordinates, event: "checkin" },
  });

  // §6 estado 4 — in_progress al hacer check-in
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

## 5. Configuración del Servidor MCP

Para conectar un agente AI a este backend, crea un config de servidor MCP:

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

El servidor MCP envuelve cada endpoint HTTP como una herramienta:

```typescript
// mcp-server.ts — Servidor MCP mínimo envolviendo los 6 endpoints
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API = process.env.API_BASE || "http://localhost:3000";
const server = new McpServer({
  name: "minimal-servicialo",
  version: "1.0.0",
});

// Herramienta 1: services.list (§13.1)
server.tool(
  "services.list",
  "Listar servicios disponibles",
  {},
  async () => {
    const res = await fetch(`${API}/services`);
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

// Herramienta 2: scheduling.check_availability (§13.1)
server.tool(
  "scheduling.check_availability",
  "Consultar horarios disponibles",
  {
    service_id: z.string(),
    date_from: z.string(),
    date_to: z.string(),
  },
  async ({ service_id, date_from, date_to }) => {
    const res = await fetch(
      `${API}/availability?service_id=${service_id}&date_from=${date_from}&date_to=${date_to}`
    );
    return { content: [{ type: "text", text: await res.text() }] };
  }
);

// Herramienta 3: scheduling.book (§13.2.2)
server.tool(
  "scheduling.book",
  "Reservar un servicio",
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

// Herramienta 4: scheduling.confirm (§13.2.2)
server.tool(
  "scheduling.confirm",
  "Confirmar una reserva",
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

// Herramienta 5: lifecycle.transition (§13.2.3)
server.tool(
  "lifecycle.transition",
  "Transicionar un servicio a un nuevo estado",
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

// Herramienta 6: delivery.checkin (§13.2.4)
server.tool(
  "delivery.checkin",
  "Registrar check-in con coordenadas GPS",
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

## 6. Recorrido Completo del Ciclo de Vida

Un agente AI ejecuta el camino feliz completo:

```
Agente                             API                           Estado
  │                                 │                              │
  ├─ services.list ────────────────►│                              │
  │◄─ srv_kine_rehab ──────────────│                              │
  │                                 │                              │
  ├─ scheduling.check_availability─►│                              │
  │◄─ [10:00, 15:00] ─────────────│                              │
  │                                 │                              │
  ├─ scheduling.book ──────────────►│── requested → scheduled ────►│
  │◄─ bk_123 ─────────────────────│                              │
  │                                 │                              │
  ├─ scheduling.confirm ───────────►│── scheduled → confirmed ────►│
  │                                 │                              │
  ├─ delivery.checkin ─────────────►│── confirmed → in_progress ──►│
  │                                 │                              │
  ├─ lifecycle.transition(completed)►│── in_progress → completed ──►│
  ├─ lifecycle.transition(documented)►│── completed → documented ───►│
  ├─ lifecycle.transition(invoiced)─►│── documented → invoiced ────►│
  ├─ lifecycle.transition(collected)►│── invoiced → collected ─────►│
  ├─ lifecycle.transition(verified)─►│── collected → verified ─────►│
  │                                 │                              │
  └─ Listo. 9 estados recorridos.  │                              │
```

---

## 7. Recorrido de Flujos de Excepción

### Cancelación (§7.3)

```
Estado: scheduled
Agente llama: lifecycle.transition({ to: "cancelled", exception: { type: "cancellation" } })
Resultado: scheduled → cancelled
```

### No-show del Cliente (§7.1)

```
Estado: confirmed
Sistema detecta: el cliente no llegó dentro del período de gracia
Sistema llama: lifecycle.transition({ to: "cancelled", by: "system", method: "auto", exception: { type: "no_show" } })
Resultado: confirmed → cancelled (con penalización)
```

### Reagendamiento (§7.5)

```
Estado: confirmed
Agente llama: lifecycle.transition({ to: "rescheduling", exception: { type: "reschedule" } })
Resultado: confirmed → rescheduling

Agente llama: lifecycle.transition({ to: "scheduled" })
Resultado: rescheduling → scheduled (con nueva hora)
```

---

## Resumen de Compliance

| Requisito | Spec § | Estado | Cómo |
|-----------|--------|--------|------|
| 8 dimensiones modeladas | §5 | Hecho | Catálogo de servicios + objeto de reserva |
| 9 estados del ciclo de vida | §6 | Hecho | Máquina de estados con orden estricto |
| Transiciones registradas | §6.1 | Hecho | `from`, `to`, `at`, `by`, `method` en cada transición |
| Sin salto de estados | §6.1 | Hecho | `validateTransition()` rechaza saltos inválidos |
| Flujo de cancelación | §7.3 | Hecho | Cualquier pre-entrega → cancelled |
| No-show del cliente | §7.1 | Hecho | confirmed → cancelled (no_show) |
| Reagendamiento | §7.5 | Hecho | scheduled/confirmed → rescheduling → scheduled |
| API conectable a MCP | §13 | Hecho | 6 endpoints mapeados a herramientas MCP |
| Evidencia registrada | §5.7 | Hecho | GPS check-in almacenado en `proof.evidence` |

---

## Qué NO Implementa Este Ejemplo

Todo esto es opcional para compliance pero existe en el spec completo:

| Feature | Por qué se omitió | Spec § |
|---------|-------------------|--------|
| Órdenes de Servicio | No requerido para compliance | §8 |
| Agencia Delegada / Mandatos | Opcional | §10 |
| Perfiles de Proveedor | Opcional | §12 |
| Inteligencia de Red | Opcional, en diseño | §14 |
| Gestión de recursos | Implementación mínima tiene una sala implícita | §5.5.1 |
| Autenticación | Ortogonal al protocolo | — |
| Disputas de calidad | Solo se requieren 3 flujos de excepción | §7.4 |
| Entrega parcial | Solo se requieren 3 flujos de excepción | §7.6 |
| Conflictos de recurso | Solo se requieren 3 flujos de excepción | §7.7 |

[SPEC GAP] El protocolo no define un contrato de API HTTP — solo firmas de herramientas MCP. Esto significa que dos implementaciones compatibles pueden tener APIs REST completamente diferentes. La capa del servidor MCP es lo que provee interoperabilidad, no la capa HTTP.

[SPEC GAP] El protocolo no especifica cómo `scheduling.check_availability` debe computar slots cuando no existe una entidad Resource. Este ejemplo retorna slots hardcodeados. Una implementación real necesita intersectar calendarios de proveedores con reservas existentes.
