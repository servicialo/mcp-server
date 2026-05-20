# A2A Interoperability — Servicialo

**[Read in English below](#english)**

---

## Qué es A2A

[A2A (Agent-to-Agent)](https://a2a-protocol.org/) es un protocolo abierto creado por Google y mantenido por la Linux Foundation. Permite que agentes AI de distintas plataformas se comuniquen entre sí sin compartir memoria, herramientas ni lógica interna.

Servicialo soporta A2A v0.3 como **extensión opcional**.

---

## MCP vs A2A — capas complementarias

| Capa | Protocolo | Relación | Ejemplo |
|------|-----------|----------|---------|
| **Agente ↔ Herramienta** | MCP | El agente invoca tools del servidor Servicialo | Claude usa `scheduling.book` para reservar |
| **Agente ↔ Agente** | A2A | Un agente externo habla con el agente Servicialo directamente | Salesforce Agentforce descubre y reserva sin pasar por Claude |

MCP es cómo un agente **usa** herramientas. A2A es cómo dos agentes **colaboran**.

---

## Flujo de descubrimiento y reserva (A2A)

```
Agente externo (ej. Google ADK, Salesforce Agentforce)
        │
        ▼
GET /.well-known/agent.json          ← Descubrimiento A2A
        │
        ▼
    Agent Card                        ← Capabilities, skills, auth
        │
        ▼
POST /{orgSlug}/a2a                  ← JSON-RPC: message/send
        │
        ▼
    A2ATask persistida                ← state machine en DB
        │
        ▼
    Task (completed / input-required) ← Confirmación o continuación
```

El agente externo **no necesita MCP, Claude ni credenciales internas**. Solo necesita hablar A2A.

---

## Endpoints A2A

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/.well-known/agents.json` | GET | Directorio de todos los agentes del nodo |
| `/{orgSlug}/.well-known/agent.json` | GET | Agent Card de una organización |
| `/{orgSlug}/a2a` | POST | Endpoint JSON-RPC 2.0 para tareas A2A |

Estos endpoints son **opcionales** para implementaciones básicas de Servicialo. Son **requeridos** para la certificación "Servicialo A2A Ready".

---

## Métodos JSON-RPC soportados

| Método | Descripción |
|--------|-------------|
| `message/send` | Envía un mensaje de usuario. Crea una nueva task o avanza una existente (si `taskId` está presente en `message`). |
| `tasks/get` | Recupera el estado actual de una task persistida. Params: `{ id }`. |
| `tasks/cancel` | Cancela una task no-terminal. No-op idempotente sobre tasks ya terminales. Params: `{ id }`. |

### Intents reconocidos

Detección por reglas (sin LLM) — orden de prioridad:

| Intent | Disparadores típicos | Acción del handler |
|--------|---------------------|---------------------|
| `services` | "servicios", "catálogo", "qué ofrecen", "lista", "menu" | Proxy a `/services` → task `completed` con artifact JSON |
| `booking` | "reservar", "agendar", "cita", "pedir hora" | Inicia conversación multi-turno hasta tener `name/email/service/datetime` |
| `availability` | "disponibilidad", "horario", "cuándo", "free slot" | Proxy a `/availability` → task `completed` con artifact JSON |
| `unknown` | Cualquier otra cosa | Task `input-required` con menú de opciones |

### Estados de task

```
pending → input-required → completed
                       ↘ failed
                       ↘ canceled
```

`input-required` es el único estado no-terminal que acepta `message/send` con `taskId` para avanzar.

---

## Ejemplo: booking conversacional

**Turno 1** — usuario inicia con intent ambiguo:

```json
POST /api/servicialo/coordinalo/a2a
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "quiero reservar una hora" }]
    }
  }
}
```

Respuesta:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "id": "ckxyz...",
    "contextId": "uuid-...",
    "status": {
      "state": "input-required",
      "message": {
        "role": "agent",
        "parts": [{ "kind": "text", "text": "Para completar tu reserva en Coordinalo, aún necesito:\n- tu nombre completo\n- tu email\n- fecha y hora ..." }]
      }
    },
    "artifacts": []
  }
}
```

**Turno 2** — usuario provee datos (referenciando `taskId`):

```json
POST /api/servicialo/coordinalo/a2a
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "taskId": "ckxyz...",
      "contextId": "uuid-...",
      "parts": [{ "kind": "text", "text": "Juan Pérez, juan@example.com, kinesiología, 2026-05-20T10:00" }]
    }
  }
}
```

Respuesta (si el upstream booking acepta):

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "id": "ckxyz...",
    "contextId": "uuid-...",
    "status": { "state": "completed" },
    "artifacts": [
      { "id": "art-ckxyz...", "parts": [{ "kind": "text", "text": "{ \"appointmentId\": \"...\", ... }" }] }
    ]
  }
}
```

---

## Códigos de error JSON-RPC

| Código | Significado |
|--------|-------------|
| -32700 | Parse error (body no es JSON válido) |
| -32600 | Invalid request (falta `id`, `jsonrpc`, etc.) |
| -32601 | Method not found |
| -32602 | Invalid params (falta `id` en tasks/get, no hay text part en message/send, etc.) |
| -32001 | Authentication failed |
| -32000 | Server error específico de Servicialo (org no encontrada, task ajena, etc.) |

---

## Autenticación

El Agent Card declara `authentication.schemes: [{ scheme: "apiKey", in: "header", name: "X-Servicialo-API-Key" }]`.

Comportamiento del handler:
- Si la organización **no** ha configurado `SERVICIALO_A2A_API_KEY` en su deploy: acceso anónimo permitido.
- Si la organización **sí** la ha configurado: la API key es **requerida** en el header `X-Servicialo-API-Key` y debe coincidir. De lo contrario, 401 con código `-32001`.

Esto permite que organizaciones progresen de "discovery público" a "acceso restringido" sin cambiar el contrato del Agent Card.

---

## Verificación E2E

El repo incluye un script de humo para validar que el endpoint cumple el contrato:

```bash
# Con el dev server corriendo (npm run dev) y la org coordinalo seedeada:
node scripts/verify-a2a.mjs --base http://localhost:3000 --org coordinalo
```

El script verifica:
1. Agent Card responde con protocolVersion 0.3.x, skills y auth scheme
2. `message/send` con intent desconocido devuelve `input-required`
3. `message/send` con intent `availability` y `services` llega a estado terminal
4. Booking multi-turno: turn 1 → `input-required`, turn 2 con datos → estado terminal
5. `tasks/get` por id devuelve la misma task
6. `tasks/cancel` deja la task en estado terminal
7. Método inválido devuelve -32601
8. Request sin `id` devuelve -32600

Exit code 0 = todo OK, 1 = al menos una falla.

---

## Certificación "Servicialo A2A Ready"

Una implementación obtiene la certificación A2A Ready cuando:

1. Expone `/.well-known/agent.json` con un Agent Card válido (protocolVersion 0.3.x, skills no vacío, auth scheme declarado)
2. Implementa `POST /{orgSlug}/a2a` con soporte para `message/send`, `tasks/get`, `tasks/cancel`
3. El Agent Card declara al menos un skill mapeable a un intent reconocido (`book-session`, `check-availability`, `list-services`)
4. `scripts/verify-a2a.mjs` pasa sin fallas contra el deploy

---

<a id="english"></a>

## English

### What is A2A

[A2A (Agent-to-Agent)](https://a2a-protocol.org/) is an open protocol created by Google and maintained by the Linux Foundation. It enables AI agents from different platforms to communicate without sharing memory, tools, or internal logic.

Servicialo supports A2A v0.3 as an **optional extension**.

### Supported JSON-RPC methods

| Method | Description |
|--------|-------------|
| `message/send` | Send a user message. Creates a new task or advances an existing one (when `taskId` is present in `message`). |
| `tasks/get` | Retrieve the current state of a persisted task. Params: `{ id }`. |
| `tasks/cancel` | Cancel a non-terminal task. Idempotent no-op on already-terminal tasks. Params: `{ id }`. |

### Recognized intents

Rule-based detection (no LLM), checked in this priority order:

| Intent | Triggers | Handler action |
|--------|----------|----------------|
| `services` | catalog, what do you offer, list, menu | Proxy to `/services` → task `completed` with JSON artifact |
| `booking` | reserve, book, schedule, appointment | Multi-turn conversation until `name/email/service/datetime` are captured |
| `availability` | when, slots, free, schedule | Proxy to `/availability` → task `completed` with JSON artifact |
| `unknown` | Anything else | Task `input-required` with menu of options |

### Task state machine

```
pending → input-required → completed
                       ↘ failed
                       ↘ canceled
```

Only `input-required` accepts follow-up `message/send` calls with `taskId`.

### Authentication

The Agent Card declares `apiKey` in header `X-Servicialo-API-Key`. If the org sets `SERVICIALO_A2A_API_KEY` in its deployment, the header is required; otherwise anonymous calls are accepted.

### "Servicialo A2A Ready" Certification

An implementation earns A2A Ready certification when:

1. It exposes `/.well-known/agent.json` with a valid Agent Card (protocolVersion 0.3.x, non-empty skills, declared auth scheme)
2. It implements `POST /{orgSlug}/a2a` supporting `message/send`, `tasks/get`, `tasks/cancel`
3. The Agent Card declares at least one skill mapping to a recognized intent (`book-session`, `check-availability`, `list-services`)
4. `scripts/verify-a2a.mjs` passes without failures against the deployment
