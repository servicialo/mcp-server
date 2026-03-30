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
    Agent Card                        ← Capacidades, skills, auth
        │
        ▼
POST /{orgSlug}/a2a                  ← JSON-RPC: message/send
  { method: "message/send",
    params: {
      message: { role: "user",
        parts: [{ kind: "text",
          text: "Reservar kinesiología mañana 10am" }]
    }}
  }
        │
        ▼
    Servicialo booking engine         ← Procesa la reserva
        │
        ▼
    A2A Task (completed)              ← Confirmación con artifacts
```

El agente externo **no necesita MCP, Claude ni credenciales internas**. Solo necesita hablar A2A.

---

## Endpoints A2A

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/.well-known/agents.json` | GET | Directorio de todos los agentes del nodo |
| `/{orgSlug}/.well-known/agent.json` | GET | Agent Card de una organización |
| `/{orgSlug}/a2a` | POST | Endpoint JSON-RPC para tareas A2A |

Estos endpoints son **opcionales** para implementaciones básicas de Servicialo. Son **requeridos** para la certificación "Servicialo A2A Ready".

---

## Usando `a2a.get_agent_card` desde MCP

El MCP server incluye el tool `a2a.get_agent_card` como puente entre capas. Un agente MCP puede usarlo para descubrir las capacidades A2A de una organización:

```
Agente MCP
    │
    ▼
a2a.get_agent_card({ org_slug: "clinica-sur" })
    │
    ▼
Agent Card JSON                      ← skills, capabilities, auth
    │
    ▼
El agente decide: usar MCP tools     ← Si quiere control granular
                  o hablar A2A       ← Si quiere delegación completa
```

---

## Certificación "Servicialo A2A Ready"

Una implementación obtiene la certificación A2A Ready cuando:

1. Expone `/.well-known/agent.json` con un Agent Card válido
2. Implementa `POST /{orgSlug}/a2a` con soporte para `message/send`
3. El Agent Card declara al menos un skill de tipo `booking`
4. Soporta al menos un esquema de autenticación estándar (apiKey, http, oauth2)

---

<a id="english"></a>

## English

### What is A2A

[A2A (Agent-to-Agent)](https://a2a-protocol.org/) is an open protocol created by Google and maintained by the Linux Foundation. It enables AI agents from different platforms to communicate without sharing memory, tools, or internal logic.

Servicialo supports A2A v0.3 as an **optional extension**.

### MCP vs A2A — complementary layers

| Layer | Protocol | Relationship | Example |
|-------|----------|-------------|---------|
| **Agent ↔ Tool** | MCP | Agent invokes Servicialo server tools | Claude uses `scheduling.book` to book |
| **Agent ↔ Agent** | A2A | External agent talks to Servicialo agent directly | Salesforce Agentforce discovers and books without Claude |

MCP is how an agent **uses** tools. A2A is how two agents **collaborate**.

### A2A Discovery and Booking Flow

```
External agent (e.g. Google ADK, Salesforce Agentforce)
        │
        ▼
GET /.well-known/agent.json          ← A2A Discovery
        │
        ▼
    Agent Card                        ← Capabilities, skills, auth
        │
        ▼
POST /{orgSlug}/a2a                  ← JSON-RPC: message/send
        │
        ▼
    Servicialo booking engine         ← Processes the booking
        │
        ▼
    A2A Task (completed)              ← Confirmation with artifacts
```

The external agent **does not need MCP, Claude, or internal credentials**. It only needs to speak A2A.

### "Servicialo A2A Ready" Certification

An implementation earns A2A Ready certification when:

1. It exposes `/.well-known/agent.json` with a valid Agent Card
2. It implements `POST /{orgSlug}/a2a` supporting `message/send`
3. The Agent Card declares at least one `booking` skill
4. It supports at least one standard authentication scheme (apiKey, http, oauth2)
