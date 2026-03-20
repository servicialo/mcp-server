# Implementando Servicialo

Guía paso a paso para construir una plataforma compatible con Servicialo. No necesitas implementar todo — solo el core que hace tus datos de servicio interoperables.

> **Versión del protocolo:** 0.9 · **Spec:** [`PROTOCOL.md`](./PROTOCOL.md) · **Schema:** [`schema/service.schema.json`](./schema/service.schema.json)
>
> **[Read in English](./IMPLEMENTING.en.md)**

---

## Qué significa "compatible"

Para aparecer como implementación de Servicialo ([§16](./PROTOCOL.md#16-implementations)), tu plataforma DEBE:

1. Modelar servicios usando las **8 dimensiones** (§5)
2. Implementar los **9 estados del ciclo de vida** (§6)
3. Manejar al menos **3 flujos de excepción** (§7)
4. Exponer una API a la que un **servidor MCP pueda conectarse**

Todo lo demás — Órdenes de Servicio, Agencia Delegada, Perfiles de Proveedor, Inteligencia de Red — es opcional.

---

## Modelo de Acceso de Tres Niveles

Antes de empezar, entiende cómo se organiza el acceso al protocolo ([§2.1](./PROTOCOL.md#21-three-tier-access-model)):

| Nivel | Nombre | Alcance | Auth | Lo que expone |
|:-----:|--------|---------|------|---------------|
| **0** | **Resolver** | Global — sin contexto de org | Ninguna | `resolve.lookup`, `resolve.search`, `trust.get_score` — ¿dónde está el endpoint de esta organización? |
| **1** | **Descubrimiento** | Org-scoped | Ninguna | `registry.*`, `services.list`, `scheduling.check_availability`, `a2a.get_agent_card` — ¿qué ofrece y cuándo? |
| **2** | **Autenticado** | Org-scoped | API key + mandato para agentes | Todo lo demás — ciclo de vida, entrega, pagos, recursos |

**Para tu implementación:** Nivel 0 lo provee el resolver global de Servicialo — no necesitas implementarlo. Nivel 1 son los endpoints públicos que cualquier agente puede consultar sin credenciales. Nivel 2 requiere autenticación y es donde vive la lógica de negocio de tu plataforma.

Tu API (Paso 4) debe exponer endpoints para Nivel 1 y Nivel 2. El servidor MCP se encarga de mapear las herramientas a tus endpoints.

---

## Paso 1: Modelar un Servicio con 8 Dimensiones

**Tiempo:** ~20 minutos

Define tu objeto Service. Cada campo mapea a una de las 8 dimensiones del §5. Este es el Service mínimo viable en TypeScript:

```typescript
// El objeto Service mínimo viable de Servicialo
// Referencia: PROTOCOL.md §5

interface Service {
  // §5.1 — Identidad (Qué)
  id: string;
  type: string;                          // ej. "physical_therapy_session"
  vertical: string;                      // ej. "health"
  name: string;                          // ej. "Sesión de rehabilitación — 45 min"
  duration_minutes: number;              // DEBE ser >= 1
  visibility?: "public" | "unlisted" | "private";  // default: "public"

  // §5.2 — Proveedor (Quién entrega)
  provider: {
    id: string;
    organization_id: string;
    credentials?: string[];
    trust_score?: number;                // 0–100
  };

  // §5.3 — Cliente (Quién recibe)
  client: {
    id: string;
    payer_id?: string;                   // separado explícitamente del cliente
  };

  // §5.4 — Agenda (Cuándo)
  schedule: {
    requested_at: string;                // ISO 8601
    scheduled_for?: string;              // se asigna cuando state = "scheduled"
    duration_expected?: number;
  };

  // §5.5 — Ubicación (Dónde)
  location?: {
    type?: "in_person" | "virtual" | "home_visit";
    address?: string;
    room?: string;
    coordinates?: { lat: number; lng: number };
  };

  // §5.6 — Ciclo de vida (Estados)
  lifecycle: {
    current_state: ServiceState;
    transitions: Transition[];
    exceptions: Exception[];
  };

  // §5.7 — Evidencia de entrega
  proof?: {
    checkin?: string;                    // ISO 8601
    checkout?: string;
    duration_actual?: number;
    evidence?: Evidence[];
  };

  // §5.8 — Cobro (Pago)
  billing: {
    amount: { value: number; currency: string };  // moneda = ISO 4217
    payer?: string;
    status?: "pending" | "charged" | "invoiced" | "paid" | "disputed";
    charged_at?: string;
    payment_id?: string;
    tax_document?: string;
  };
}
```

**Listo cuando:** Puedes crear un objeto Service en tu sistema y cada campo mapea a una de las 8 dimensiones. Valida contra [`schema/service.schema.json`](./schema/service.schema.json).

---

## Paso 2: Implementar los 9 Estados del Ciclo de Vida

Los 9 estados son estrictamente ordenados. No se pueden saltar (§6.1).

```
requested → scheduled → confirmed → in_progress → completed → documented → invoiced → collected → verified
```

```typescript
type ServiceState =
  | "requested"     // 1. El cliente define lo que necesita
  | "scheduled"     // 2. Hora + proveedor + ubicación asignados
  | "confirmed"     // 3. Ambas partes confirman
  | "in_progress"   // 4. Check-in detectado, servicio en curso
  | "completed"     // 5. El proveedor marca entrega completada
  | "documented"    // 6. Evidencia/registro generado
  | "invoiced"      // 7. Documento tributario emitido
  | "collected"     // 8. Pago recibido
  | "verified"      // 9. El cliente confirma — ciclo cerrado
  // Estados de excepción (§7)
  | "cancelled"
  | "disputed"
  | "reassigning"
  | "rescheduling"
  | "partial";

// Transiciones válidas del camino feliz (§6.1)
const VALID_TRANSITIONS: Record<ServiceState, ServiceState[]> = {
  requested:    ["scheduled", "cancelled"],
  scheduled:    ["confirmed", "cancelled", "rescheduling"],
  confirmed:    ["in_progress", "cancelled", "rescheduling", "reassigning"],
  in_progress:  ["completed", "partial"],
  completed:    ["documented", "disputed"],
  documented:   ["invoiced"],
  invoiced:     ["collected"],
  collected:    ["verified"],
  verified:     [],
  // Estados de excepción
  cancelled:    [],
  disputed:     ["collected", "cancelled"],  // proveedor gana o cliente gana
  reassigning:  ["scheduled"],
  rescheduling: ["scheduled"],
  partial:      ["documented"],
};

interface Transition {
  from: string | null;   // null para el estado inicial
  to: string;
  at: string;            // ISO 8601
  by: string;            // ID del cliente, proveedor, "system", o agente
  method?: "auto" | "manual" | "agent";
  metadata?: Record<string, unknown>;
}

function transitionService(service: Service, to: ServiceState, by: string, method: "auto" | "manual" | "agent" = "manual"): Service {
  const current = service.lifecycle.current_state;
  const allowed = VALID_TRANSITIONS[current];

  if (!allowed?.includes(to)) {
    throw new Error(`Transición inválida: ${current} → ${to}`);
  }

  const transition: Transition = {
    from: current,
    to,
    at: new Date().toISOString(),
    by,
    method,
  };

  return {
    ...service,
    lifecycle: {
      ...service.lifecycle,
      current_state: to,
      transitions: [...service.lifecycle.transitions, transition],
    },
  };
}
```

**Listo cuando:** Tu sistema valida las reglas de transición — transiciones inválidas lanzan errores, cada transición queda registrada en la traza de auditoría.

---

## Paso 3: Manejar 3 Flujos de Excepción

Las excepciones ocurren en el 15–30% de las citas (§7). Necesitas al menos 3. Estas son las tres más simples:

### 3a. Cancelación (§7.3)

```
Cualquier estado pre-entrega → cancelled
```

```typescript
interface CancellationPolicy {
  free_before_hours: number;      // cancelar gratis si faltan estas horas
  penalty_within_hours: number;   // ventana de penalización parcial
  penalty_rate: number;           // 0–1, fracción del precio del servicio
}

function cancelService(
  service: Service,
  by: string,
  policy: CancellationPolicy,
  now: Date = new Date()
): { service: Service; penalty: number } {
  const preDeliveryStates: ServiceState[] = ["requested", "scheduled", "confirmed"];
  if (!preDeliveryStates.includes(service.lifecycle.current_state)) {
    throw new Error(`No se puede cancelar desde el estado: ${service.lifecycle.current_state}`);
  }

  const scheduledFor = service.schedule.scheduled_for
    ? new Date(service.schedule.scheduled_for)
    : null;

  let penalty = 0;
  if (scheduledFor) {
    const hoursUntil = (scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil < policy.penalty_within_hours) {
      penalty = service.billing.amount.value * policy.penalty_rate;
    }
  }

  const updated = transitionService(service, "cancelled", by);
  updated.lifecycle.exceptions.push({
    type: "cancellation",
    at: now.toISOString(),
    initiated_by: by,
    resolution: penalty > 0 ? `penalty_applied:${penalty}` : "free_cancellation",
  });

  return { service: updated, penalty };
}
```

### 3b. No-show del Cliente (§7.1)

```
confirmed → cancelled (no_show)
```

```typescript
function handleClientNoShow(service: Service, graceMinutes: number = 15): Service {
  if (service.lifecycle.current_state !== "confirmed") {
    throw new Error("No-show solo aplica a servicios confirmados");
  }

  const updated = transitionService(service, "cancelled", "system", "auto");
  updated.lifecycle.exceptions.push({
    type: "no_show",
    at: new Date().toISOString(),
    initiated_by: "system",
    resolution: "client_no_show_penalty_applied",
  });

  // SHOULD: cobrar penalización según política de la organización (§7.1)
  // SHOULD: liberar el horario del proveedor
  // SHOULD: incrementar el contador de no-shows del cliente

  return updated;
}
```

### 3c. Reagendamiento (§7.5)

```
scheduled/confirmed → rescheduling → scheduled (nueva hora)
```

```typescript
function rescheduleService(
  service: Service,
  newTime: string,          // ISO 8601
  by: string
): Service {
  const rescheduleableStates: ServiceState[] = ["scheduled", "confirmed"];
  if (!rescheduleableStates.includes(service.lifecycle.current_state)) {
    throw new Error(`No se puede reagendar desde el estado: ${service.lifecycle.current_state}`);
  }

  // Entrar al estado transitorio
  let updated = transitionService(service, "rescheduling", by);
  updated.lifecycle.exceptions.push({
    type: "reschedule",
    at: new Date().toISOString(),
    initiated_by: by,
  });

  // Resolver a la nueva hora agendada
  updated = transitionService(updated, "scheduled", "system", "auto");
  updated.schedule.scheduled_for = newTime;

  return updated;
}
```

**Listo cuando:** Los tres flujos de excepción producen transiciones de estado correctas y registran excepciones en `lifecycle.exceptions`.

---

## Paso 4: Construir tu API

Expón endpoints HTTP que cubran las fases de agente del §13. La Fase 0 (resolución DNS) la provee el resolver global — no la implementas tú. Como mínimo, necesitas endpoints para:

| Fase | Endpoint | Mapea a herramienta MCP |
|------|----------|------------------------|
| 0. Resolver | (provisto por el resolver global) | `resolve.lookup`, `resolve.search` |
| 1. Descubrir | `GET /services` | `services.list` |
| 1. Descubrir | `GET /availability?service_id=X&date_from=Y&date_to=Z` | `scheduling.check_availability` |
| 3. Comprometer | `POST /bookings` | `scheduling.book` |
| 3. Comprometer | `POST /bookings/:id/confirm` | `scheduling.confirm` |
| 4. Gestionar | `POST /bookings/:id/transition` | `lifecycle.transition` |
| 5. Verificar | `POST /bookings/:id/checkin` | `delivery.checkin` |

[SPEC GAP] El protocolo define firmas de herramientas MCP (§13) pero no prescribe rutas HTTP ni convenciones REST. Cada implementación elige su propia superficie de API — el servidor MCP se adapta a ella.

Para un walkthrough completo con ejemplos de request/response, ver [`examples/minimal-implementation.md`](./examples/minimal-implementation.md) ([English](./examples/minimal-implementation.en.md)).

**Listo cuando:** Un cliente HTTP puede crear un servicio, avanzarlo por los 9 estados, y disparar cada uno de tus 3 flujos de excepción.

---

## Paso 5: Conectar un Servidor MCP

El servidor MCP es el puente entre agentes AI y tu API. Tienes dos opciones:

**Opción A: Usar el servidor MCP de referencia** y configurarlo para apuntar a tu API:

```json
{
  "mcpServers": {
    "tu-plataforma": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_API_KEY": "tu_api_key",
        "SERVICIALO_API_BASE": "https://tu-api.com/v1",
        "SERVICIALO_ORG_ID": "tu_org_id"
      }
    }
  }
}
```

[SPEC GAP] El servidor MCP de referencia (`@servicialo/mcp-server`) actualmente apunta a la API de Coordinalo. Para usarlo con otro backend, necesitarías implementar el mismo contrato de API o hacer un fork del servidor. Una capa de adaptadores pluggable aún no está especificada.

**Opción B: Construir tu propio servidor MCP** que envuelva tu API. El paquete `@modelcontextprotocol/sdk` maneja el protocolo MCP — tú solo implementas los handlers de herramientas:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "tu-plataforma", version: "1.0.0" });

server.tool(
  "services.list",
  "Listar servicios disponibles de esta organización",
  { org_slug: z.string().optional() },
  async ({ org_slug }) => {
    const services = await tuApi.listServices(org_slug);
    return { content: [{ type: "text", text: JSON.stringify(services) }] };
  }
);

// ... repetir para cada herramienta que soportes
```

**Transporte:** El servidor MCP soporta dos transportes (§13.8): **stdio** para agentes locales y desarrollo, y **Streamable HTTP** para agentes remotos y servidores en producción. Si tu implementación será accesible por agentes remotos (no solo locales), Streamable HTTP es el transporte recomendado — permite conexiones HTTP sin requerir un proceso local.

**Listo cuando:** Un agente AI (Claude, GPT, etc.) puede conectarse a tu servidor MCP y llamar al menos `services.list` y `scheduling.check_availability`.

---

## Paso 6: Registrar Evidencia

La evidencia es lo que separa una plataforma de servicios de un calendario. Sin prueba de entrega, el protocolo no puede resolver disputas (§7.4) ni calcular puntajes de confianza.

Para cada vertical, define qué constituye evidencia válida (§5.7):

| Vertical | Evidencia mínima | Captura |
|----------|-----------------|---------|
| Salud | GPS check-in/out + notas clínicas firmadas | auto + manual |
| Hogar | Fotos antes/después + checklist de tareas + firma del cliente | manual |
| Legal | Minutas de reunión + registro de horas | manual |
| Educación | Registro de asistencia + entrega de material | auto + manual |

```typescript
interface Evidence {
  type: "gps" | "signature" | "photo" | "document" | "duration" | "notes";
  captured_at: string;   // ISO 8601
  data: Record<string, unknown>;  // payload específico por tipo
}
```

Tu implementación DEBE almacenar evidencia de forma inmutable — una vez registrada, la evidencia no puede ser modificada. Esto es lo que habilita la resolución algorítmica de disputas.

**Listo cuando:** Tu sistema registra al menos un tipo de evidencia por servicio y lo asocia con `proof.evidence[]`.

---

## Paso 7: Validar y Aparecer en el Listado

### Checklist de auto-validación

| # | Requisito | Ref. spec | Verificar |
|---|-----------|-----------|-----------|
| 1 | El servicio tiene las 8 dimensiones | §5 | Validar contra `schema/service.schema.json` |
| 2 | Los 9 estados están implementados | §6 | Crear un servicio y avanzarlo por los 9 estados |
| 3 | Los estados son estrictamente ordenados (sin saltos) | §6.1 | Intentar una transición inválida — debe fallar |
| 4 | Cada transición registra `from`, `to`, `at`, `by` | §6.1 | Inspeccionar el array de transiciones después de un ciclo completo |
| 5 | 3+ flujos de excepción funcionan | §7 | Disparar cada uno y verificar la máquina de estados |
| 6 | El servidor MCP se conecta y las herramientas responden | §13 | Conectar un agente y ejecutar una consulta de descubrimiento |
| 7 | La evidencia se registra | §5.7 | Completar un servicio e inspeccionar `proof.evidence` |

### Validación de schema

```bash
# Validar un objeto service contra el JSON Schema
npx ajv-cli validate -s schema/service.schema.json -d tu-servicio.json
```

### Aparecer en el listado

Una vez que tu implementación pasa el checklist:

1. [Abre un issue](https://github.com/servicialo/mcp-server/issues) con:
   - Nombre de tu plataforma y vertical
   - Cobertura: dimensiones / estados / flujos de excepción
   - Endpoint de API o paquete de servidor MCP
2. Un maintainer verificará y te agregará a la [tabla de Implementaciones](./README.md#implementations).

**Listo cuando:** Tu implementación pasa las 7 verificaciones y aparece en el README.

---

## Qué es opcional (pero vale la pena conocer)

Esto no es requerido para compliance pero está definido en el spec:

| Feature | Sección | Cuándo adoptar |
|---------|---------|---------------|
| Service Orders | §8 | Cuando vendes paquetes, planes o acuerdos multi-sesión |
| Agencia Delegada | §10 | Cuando agentes AI actúan en nombre de usuarios (mandatos, scopes, auditoría) |
| Perfiles de Proveedor | §12 | Cuando necesitas descubrimiento de proveedores estructurado y machine-readable |
| Modelo de Pago | §12.8 | Cuando necesitas prepago/checkout además del flujo post-servicio por defecto |
| Resolución DNS | §13.0 | Cuando quieres registrar tu organización en el resolver global para ser descubierta |
| Interoperabilidad A2A | §13.7 | Cuando agentes externos (Google ADK, Salesforce, etc.) necesitan interactuar sin MCP |
| Inteligencia de Red | §14 | Cuando quieres contribuir/recibir benchmarks agregados |

---

## Referencia

- **Especificación completa:** [`PROTOCOL.md`](./PROTOCOL.md)
- **JSON Schema:** [`schema/service.schema.json`](./schema/service.schema.json)
- **Ejemplo funcional:** [`examples/minimal-implementation.md`](./examples/minimal-implementation.md) ([English](./examples/minimal-implementation.en.md))
- **Servidor MCP de referencia:** [`packages/mcp-server/`](./packages/mcp-server/)
- **Implementación de referencia:** [Coordinalo](https://coordinalo.com) (vertical salud)
