# @servicialo/mcp-server

> **Entrada canónica en el registro MCP:** `com.servicialo/mcp-server`
> La entrada `io.github.danioni/servicialo` está deprecated desde marzo 2026.

> **[English version](./README.en.md)**

**La interfaz MCP a nivel de protocolo para el estándar Servicialo — la capa de destino para servicios humanos en la era de agentes de IA.**

[![Live network](https://img.shields.io/badge/live_network-9_nodes_across_4_countries-brightgreen)](https://servicialo.com/network)

HTTP hizo los documentos direccionables. Servicialo hace los servicios direccionables. MCP y A2A son el transporte. Servicialo es el destino al que los agentes llegan.

Este paquete es la interfaz MCP a nivel de protocolo para **cualquier backend compatible con Servicialo** — no un conector a una plataforma específica. Coordinalo es la implementación de referencia (y el default), pero puedes conectar tu propio backend.

## Arquitectura

```
@servicialo/mcp-server  →  interfaz MCP a nivel de protocolo
        ↓ se conecta a cualquier backend compatible con Servicialo
Coordinalo              →  implementación de referencia (default)
Tu implementación       →  trae tu propio backend
```

## El Problema

Los agentes de IA pueden navegar la web, escribir código y mantener conversaciones. Pero pídele a uno que reserve una sesión de kinesiología, verifique que ocurrió, y procese el pago — y se desmorona.

Hoy, cada plataforma es un silo. No hay estándar para:

- **Descubrimiento** — qué prestador, en qué organización, ofrece lo que necesito?
- **Identidad** — en nombre de quién actúa este agente, y qué está autorizado a hacer?
- **Ciclo de vida** — en qué estado está este servicio? Quién confirmó? Quién asistió?
- **Prueba de entrega** — ocurrió realmente la sesión? Por cuánto tiempo? Dónde?
- **Liquidación** — cuánto, a quién, bajo qué términos contractuales?

Sin un protocolo compartido, cada integración es artesanal. Cada conexión agente-plataforma es un API custom. Esto no escala.

## Qué es Servicialo

Servicialo es un **protocolo abierto**, no una plataforma. Define cómo los servicios profesionales se mueven a través de su ciclo de vida — desde el descubrimiento hasta el pago — de una forma que cualquier agente de IA o plataforma puede implementar.

La relación es como HTTP con Apache, o SMTP con Gmail: Servicialo define las reglas, las implementaciones les dan vida.

El protocolo modela cada servicio a través de **8 dimensiones**, **9 estados del ciclo de vida**, **6 flujos de excepción** y **7 principios fundamentales** — universales entre verticales (salud, legal, educación, servicios domiciliarios):

```
Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → Facturado → Cobrado → Verificado
```

Cualquier servicio, en cualquier vertical, sigue esta secuencia. La lógica específica del vertical vive *dentro* de cada estado, pero la máquina de estados es invariante.

## Qué Hace Este MCP Server

Este paquete expone el protocolo Servicialo como 34 herramientas MCP organizadas por las **7 fases** del ciclo de vida de un servicio (0–6, incluyendo resolución DNS), más herramientas de gestión de recursos y administración del resolver. Un agente no llama endpoints por entidad de base de datos — sigue el flujo natural de coordinar un servicio.

### Fase 0 — Resolución DNS (3 herramientas públicas, sin autenticación)

| Herramienta | Descripción |
|---|---|
| `resolve.lookup` | Resolver un orgSlug a su endpoint MCP/REST y nivel de confianza (equivalente a DNS lookup) |
| `resolve.search` | Buscar organizaciones registradas por país y vertical en el resolver global |
| `trust.get_score` | Obtener puntaje de confianza de una organización (score 0-100, nivel, última actividad) |

### Fase 1 — Descubrimiento (6 herramientas públicas, sin autenticación)

| Herramienta | Descripción |
|---|---|
| `registry.search` | Buscar organizaciones por vertical, ubicación, país |
| `registry.get_organization` | Obtener detalles públicos: servicios, prestadores, configuración de reservas |
| `registry.manifest` | Obtener manifiesto del servidor: capacidades, versión del protocolo, metadata de organización |
| `scheduling.check_availability` | Consultar disponibilidad (3 variables: prestador ∧ cliente ∧ recurso) |
| `services.list` | Listar el catálogo público de servicios de una organización |
| `a2a.get_agent_card` | Obtener la Agent Card A2A de una organización para descubrimiento inter-agente |

### Fase 2 — Entender (2 herramientas)

| Herramienta | Descripción | Scopes |
|---|---|---|
| `service.get` | Obtener las 8 dimensiones de un servicio | `service:read` |
| `contract.get` | Obtener términos del contrato: evidencia requerida, política de cancelación, ventana de disputa | `service:read` `order:read` |

### Fase 3 — Comprometer (3 herramientas)

| Herramienta | Descripción | Scopes |
|---|---|---|
| `clients.get_or_create` | Resolver identidad del cliente por email/teléfono — buscar o crear en una sola llamada | `patient:write` |
| `scheduling.book` | Reservar sesión → estado `solicitado`. `resource_id` opcional para recursos físicos | `schedule:write` |
| `scheduling.confirm` | Confirmar sesión reservada → estado `confirmado` | `schedule:write` |

### Fase 4 — Ciclo de Vida (4 herramientas)

| Herramienta | Descripción | Scopes |
|---|---|---|
| `lifecycle.get_state` | Obtener estado actual, transiciones disponibles e historial | `service:read` |
| `lifecycle.transition` | Ejecutar transición de estado con evidencia | `service:write` |
| `scheduling.reschedule` | Reagendar a nueva fecha/hora (política contractual puede aplicar) | `schedule:write` |
| `scheduling.cancel` | Cancelar sesión (se aplica política de cancelación del contrato) | `schedule:write` |

### Fase 5 — Verificar Entrega (3 herramientas)

| Herramienta | Descripción | Scopes |
|---|---|---|
| `delivery.checkin` | Check-in con GPS + timestamp → estado `en_curso` | `evidence:write` |
| `delivery.checkout` | Check-out con GPS + timestamp → estado `entregado` (duración auto-calculada) | `evidence:write` |
| `delivery.record_evidence` | Registrar evidencia: `gps`, `firma`, `foto`, `documento`, `duración`, `notas` | `evidence:write` |

### Fase 6 — Cerrar (4 herramientas)

| Herramienta | Descripción | Scopes |
|---|---|---|
| `documentation.create` | Generar registro del servicio (nota clínica, informe de inspección, etc.) → estado `documentado` | `document:write` |
| `payments.create_sale` | Crear cargo por servicio documentado → estado `cobrado` | `payment:write` |
| `payments.record_payment` | Registrar pago recibido contra una venta | `payment:write` |
| `payments.get_status` | Obtener estado de pago de una venta o saldo de cuenta del cliente | `payment:read` |

### Gestión de Recursos (6 herramientas)

| Herramienta | Descripción | Scopes |
|---|---|---|
| `resource.list` | Listar recursos físicos de una organización | `resource:read` |
| `resource.get` | Obtener detalles de un recurso con sus slots de disponibilidad | `resource:read` |
| `resource.create` | Crear un nuevo recurso físico (sala, box, equipamiento) | `resource:write` |
| `resource.update` | Actualizar recurso (patch semántico) | `resource:write` |
| `resource.delete` | Desactivar recurso (soft delete: `is_active = false`) | `resource:write` |
| `resource.get_availability` | Consultar disponibilidad de un recurso por rango de fechas | `resource:read` |

### Administración del Resolver (3 herramientas)

| Herramienta | Descripción | Scopes |
|---|---|---|
| `resolve.register` | Registrar organización en el resolver global con endpoints MCP/REST | `resolve:write` |
| `resolve.update_endpoint` | Actualizar endpoints registrados (portabilidad entre backends) | `resolve:write` |
| `telemetry.heartbeat` | Enviar heartbeat al resolver indicando que el nodo está activo | `telemetry:write` |

## Quickstart — 5 pasos para estar en la red

### Paso 1. Instalar el servidor MCP

```bash
npx -y @servicialo/mcp-server
```

Modo descubrimiento — 10 herramientas públicas, sin credenciales. Pruébalo de inmediato:

```json
{
  "tool": "registry.search",
  "arguments": { "vertical": "kinesiologia", "location": "santiago" }
}
```

### Paso 2. Crear tu organización

Registra tu organización en [coordinalo.com/signup](https://coordinalo.com/signup). Coordinalo es la implementación de referencia del protocolo Servicialo.

### Paso 3. Obtener credenciales MCP

En Coordinalo: **Settings → Servicialo → Generar credenciales MCP**. Obtendrás dos valores:

- `SERVICIALO_ORG_ID` — slug de tu organización (ej: `clinica-dental-sur`)
- `SERVICIALO_API_KEY` — bearer token para autenticación

### Paso 4. Configurar el cliente MCP

Agregar a la configuración de Claude Desktop, Cursor o cualquier cliente MCP:

```json
{
  "mcpServers": {
    "servicialo": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_API_KEY": "<tu_api_key>",
        "SERVICIALO_ORG_ID": "<tu_org_slug>"
      }
    }
  }
}
```

Omitir el bloque `env` para modo solo-descubrimiento (10 herramientas públicas).

### Paso 5. Publicar en la red Servicialo

En Coordinalo: **Settings → Servicialo → Publicar**. Tu organización aparece en [servicialo.com/network](https://servicialo.com/network) y es descubrible por otros agentes.

> **Tip:** Un agente puede obtener estos 5 pasos como JSON estructurado llamando la herramienta `docs.quickstart`.

## Red / Network

La red Servicialo es el registro global de organizaciones que implementan el protocolo. Cada nodo autenticado envía un heartbeat periódico, y cualquier agente puede descubrir organizaciones por país, vertical y puntaje de confianza.

- **Explorar la red:** [servicialo.com/network](https://servicialo.com/network)
- **Buscar por vertical:** `registry.search({ vertical: "kinesiologia", country: "cl" })`
- **Resolver un org:** `resolve.lookup({ org_slug: "clinica-dental-sur" })`

## Credenciales

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `SERVICIALO_API_KEY` | No | — | Bearer token. Habilita modo autenticado (35 herramientas) |
| `SERVICIALO_ORG_ID` | No | — | Slug de organización. Habilita modo autenticado |
| `SERVICIALO_BASE_URL` | No | `http://localhost:3000` | Endpoint del API de la plataforma compatible con Servicialo |
| `SERVICIALO_ADAPTER` | No | `coordinalo` | Adapter de backend: `coordinalo` o `http` |
| `SERVICIALO_TELEMETRY` | No | `true` | Setear a `false` para desactivar telemetría anónima |

`SERVICIALO_API_KEY` y `SERVICIALO_ORG_ID` deben configurarse juntas. Si solo una está presente, el servidor cae a modo descubrimiento con un warning.

Las credenciales se obtienen en [coordinalo.com](https://coordinalo.com) → Settings → Servicialo → Generar credenciales MCP.

## Conectar una implementación propia

Este MCP server soporta cualquier backend compatible con Servicialo a través de la capa de adaptadores pluggable. Dos adaptadores están incluidos:

- **`coordinalo`** (default) — se conecta a un backend Coordinalo/Digitalo con rutas org-scoped bajo `/api/organizations/{orgId}`.
- **`http`** — se conecta a cualquier implementación que exponga los endpoints canónicos de `HTTP_PROFILE.md` bajo `/v1/*`.

### 3 pasos para conectar tu implementación

**Paso 1.** Implementar los endpoints REST definidos en [`HTTP_PROFILE.md`](../../HTTP_PROFILE.md) en tu plataforma.

**Paso 2.** Configurar el MCP server para usar el adaptador HTTP:

```bash
SERVICIALO_ADAPTER=http \
SERVICIALO_BASE_URL=https://tu-plataforma.com \
SERVICIALO_API_KEY=tu_key \
npx -y @servicialo/mcp-server
```

**Paso 3.** Agregar a la configuración de tu cliente MCP:

```json
{
  "mcpServers": {
    "servicialo": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_ADAPTER": "http",
        "SERVICIALO_BASE_URL": "https://tu-plataforma.com",
        "SERVICIALO_API_KEY": "tu_api_key",
        "SERVICIALO_ORG_ID": "tu_org_id"
      }
    }
  }
}
```

El adaptador HTTP traduce las rutas internas a endpoints canónicos `/v1/*` y envía el contexto de organización via el header `X-Servicialo-Org`. Consulta `HTTP_PROFILE.md` para el contrato REST completo.

## Modelo de Agencia Delegada

El protocolo trata a los agentes de IA como actores de primera clase — pero nunca confía en ellos implícitamente. Cada acción de agente requiere un **ServiceMandate**: una delegación explícita de capacidad de un humano principal a un agente.

### Cómo funciona

1. Un humano (profesional, paciente u organización) emite un mandato a un agente
2. El mandato especifica **para quién** actúa el agente, **qué** puede hacer (scopes), y **por cuánto tiempo**
3. En cada tool call, el MCP server valida el mandato contra 8 checks antes de ejecutar
4. Cada acción produce una entrada de auditoría — éxito o fallo

### Ejemplo de mandato

```json
{
  "mandate_id": "550e8400-e29b-41d4-a716-446655440000",
  "principal_id": "dra_barbara",
  "principal_type": "professional",
  "agent_id": "agent_booking_bot",
  "agent_name": "Asistente de Agendamiento",
  "acting_for": "professional",
  "context": "org:clinica-kinesia",
  "scopes": ["schedule:read", "schedule:write", "patient:write"],
  "constraints": {
    "max_actions_per_day": 50,
    "allowed_hours": {
      "start": "08:00",
      "end": "20:00",
      "timezone": "America/Santiago"
    },
    "require_confirmation_above": {
      "amount": 100000,
      "currency": "CLP"
    }
  },
  "issued_at": "2026-03-01T00:00:00Z",
  "expires_at": "2026-06-01T00:00:00Z",
  "status": "active"
}
```

### Uso de mandatos en tool calls

Cuando `actor.type` es `"agent"`, incluir el `mandate_id`:

```json
{
  "tool": "scheduling.book",
  "arguments": {
    "service_id": "srv_123",
    "provider_id": "prov_111",
    "client_id": "cli_789",
    "starts_at": "2026-03-03T10:00:00",
    "actor": {
      "type": "agent",
      "id": "agent_booking_bot",
      "mandate_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### Los 8 checks de validación

Cada tool call de un agente se valida contra:

| # | Check | Qué previene |
|---|---|---|
| 1 | **Estado** — mandato debe ser `active` | Uso de mandatos revocados o expirados |
| 2 | **Validez temporal** — `issued_at ≤ now < expires_at` | Ataques basados en tiempo |
| 3 | **Identidad del agente** — `mandate.agent_id === agente solicitante` | Suplantación de agente |
| 4 | **Cobertura de scopes** — scopes del mandato cubren los requisitos de la herramienta | Escalación de privilegios |
| 5 | **Contexto** — contexto del mandato coincide con la solicitud | Acceso cross-org a datos |
| 6 | **Conflicto de interés** — agente no puede actuar para ambas partes | Violaciones de doble agencia |
| 7 | **Restricciones** — horarios permitidos, límites diarios, umbrales financieros | Agentes sobre-autónomos |
| 8 | **Auditoría** — cada acción registrada con inputs sanitizados | No repudio |

Actores no-agente (`client`, `provider`, `organization`) no pasan por validación de mandato.

## Descubrimiento de Prestadores

Los agentes pueden buscar en el registro y hacer matching de prestadores con las necesidades de un paciente usando consultas estructuradas.

### Buscar en el registro

```json
{
  "tool": "registry.search",
  "arguments": {
    "vertical": "kinesiologia",
    "location": "santiago",
    "country": "cl"
  }
}
```

Retorna organizaciones que coinciden con sus servicios y prestadores.

### Consultar disponibilidad

```json
{
  "tool": "scheduling.check_availability",
  "arguments": {
    "org_slug": "clinica-kinesia",
    "service_id": "srv_rehab_pelvica",
    "provider_id": "prov_111",
    "date_from": "2026-03-10",
    "date_to": "2026-03-14"
  }
}
```

El scheduler de 3 variables verifica disponibilidad de prestador, cliente y recurso físico simultáneamente.

### Ejemplo de punta a punta

```
1. registry.search({ vertical: "kinesiologia", location: "santiago" })
   → encuentra org "clinica-kinesia"

2. services.list({ org_slug: "clinica-kinesia" })
   → lista servicios disponibles

3. scheduling.check_availability({ org_slug: "clinica-kinesia", date_from: "2026-03-10", date_to: "2026-03-14" })
   → retorna slots disponibles

4. contract.get({ service_id: "srv_123", org_id: "org_456" })
   → cancelación: 0% si >24h, 50% si 2-24h, 100% si <2h
   → evidencia requerida: check_in + check_out + registro_clinico

5. clients.get_or_create({ email: "maria@mail.com", name: "Maria", last_name: "Lopez" })
   → client_id: "cli_789"

6. scheduling.book({ service_id: "srv_123", provider_id: "prov_111", client_id: "cli_789", starts_at: "2026-03-12T10:00:00" })
   → session_id: "ses_001", estado: "solicitado"

7. scheduling.confirm({ session_id: "ses_001" })
   → estado: "confirmado"

8. delivery.checkin({ session_id: "ses_001", location: { lat: -33.45, lng: -70.66 } })
   → estado: "en_curso"

9. delivery.checkout({ session_id: "ses_001", location: { lat: -33.45, lng: -70.66 } })
   → estado: "entregado", duración: 42min

10. documentation.create({ session_id: "ses_001", content: "Sesión de rehabilitación de piso pélvico..." })
    → estado: "documentado"

11. payments.create_sale({ client_id: "cli_789", service_id: "srv_123", unit_price: 35000 })
    → sale_id: "sale_001", estado: "cobrado"

12. lifecycle.transition({ session_id: "ses_001", to_state: "verified" })
    → estado: "verificado" ✓
```

## Especificación del Protocolo

La especificación completa del protocolo Servicialo está disponible en:

- **Repositorio:** [github.com/servicialo/protocol](https://github.com/servicialo/protocol)
- **Sitio web:** [servicialo.com](https://servicialo.com)
- **Versión estable actual:** 0.9
- **JSON Schemas:** [`service.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/service.schema.json), [`service-order.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/service-order.schema.json), [`service-mandate.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/service-mandate.schema.json), [`resolution.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/resolution.schema.json), [`servicialo-config.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/servicialo-config.schema.json)

La spec cubre las 8 dimensiones del servicio, 9 estados de ciclo de vida, 6 flujos de excepción, 7 principios fundamentales, la arquitectura de dos entidades (Servicio atómico + Orden de Servicio), el Modelo de Agencia Delegada, resolución DNS, e interoperabilidad A2A.

## Implementación de Referencia

**Digitalo** es la primera implementación en producción del protocolo Servicialo, operando en salud en Chile. Implementa el ciclo de vida completo — desde descubrimiento de prestadores hasta liquidación de pagos — y sirve como terreno de validación para la evolución del protocolo.

Este MCP server se conecta a cualquier backend compatible con Servicialo a través de `SERVICIALO_BASE_URL`. Digitalo es uno de esos backends. El protocolo está diseñado para que cualquier CRM, HIS, o plataforma lo implemente como un nodo soberano.

## Contribuir al Protocolo

Servicialo sigue versionado semántico para la especificación del protocolo:

- **Patch** (0.7.x) — clarificaciones, correcciones de typos, adiciones no-breaking
- **Minor** (0.x.0) — nuevos campos opcionales, nuevas definiciones de herramientas, nuevos flujos de excepción
- **Major** (x.0.0) — cambios breaking a schemas, máquina de estados, o semántica core

### Cómo proponer cambios

1. Abrir un issue describiendo el problema y la solución propuesta
2. Para cambios significativos, escribir un RFC en `spec/` con el número de sección que afecta
3. Los cambios al protocolo requieren al menos una implementación de referencia antes de merge
4. Los cambios a schemas deben incluir JSON Schema actualizado y tipos Zod en el MCP server

### Áreas buscando input activamente

- Requisitos de evidencia específicos por vertical (más allá de salud)
- Soporte multi-idioma para nombres de estados del ciclo de vida
- Federación inter-nodo (cómo dos implementaciones Servicialo interoperan)
- Patrones de Agent SDK para Python y TypeScript

## Telemetría

Al iniciar, el MCP server envía un único POST anónimo a `https://servicialo.com/api/telemetry/instance` con:

```json
{
  "event": "node_initialized",
  "version": "0.9.7",
  "node_id": "a1b2c3d4-...",
  "ts": 1711300000000
}
```

| Campo | Descripción |
|---|---|
| `event` | Siempre `"node_initialized"` |
| `version` | Versión del paquete |
| `node_id` | UUID persistente almacenado en `~/.servicialo/node_id` |
| `ts` | Timestamp en milisegundos |

**Esto es todo lo que se envía.** No se transmite información de organización, API keys, datos de pacientes ni ningún identificador personal. La IP se hashea (SHA-256) en el servidor antes de almacenarse. El ping es fire-and-forget: si falla, el error se descarta silenciosamente y nunca bloquea la operación del servidor.

La primera vez que se ejecuta con telemetría activa, el servidor imprime un aviso en stderr indicando qué se envía y cómo desactivarlo.

### Desactivar telemetría

```bash
SERVICIALO_TELEMETRY=false npx -y @servicialo/mcp-server
```

O en la configuración MCP:

```json
{
  "env": {
    "SERVICIALO_TELEMETRY": "false"
  }
}
```

Más detalles: [servicialo.com/docs/telemetry](https://servicialo.com/docs/telemetry)

## Únete a la red

Al instalar `@servicialo/mcp-server`, tu nodo se registra automáticamente en la [telemetría de la red](https://servicialo.com/network). Esto ayuda al ecosistema a medir adopción real del protocolo — sin recopilar datos personales ni de tus clientes.

La telemetría reporta únicamente: versión del paquete, un UUID de nodo persistente, y un hash de IP (para geolocalización aproximada — no almacenamos IPs). Puedes desactivarla en cualquier momento con `SERVICIALO_TELEMETRY=false`.

## Licencia

Apache-2.0 — cualquier implementación, comercial o no, es bienvenida. Ver [LICENSE](./LICENSE).
