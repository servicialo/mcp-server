# Changelog — @servicialo/mcp-server

This file tracks the **`@servicialo/mcp-server` npm package**: tool surface, code changes, env vars, README. It bumps on every npm publish, independent of the underlying protocol version.

For protocol-level changes (new schemas, new endpoints, governance), see the [root CHANGELOG](../../CHANGELOG.md). A protocol release usually maps to one or more package releases — the relationship is annotated in each entry where it matters.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning is independent of the protocol's SemVer.

## [0.9.12] - 2026-05-20

Docs-only patch. No code or tool surface changes. The `0.9.11` release added 5 tools and the operational-telemetry hook but shipped with a stale README — readers on npmjs.com saw "37 tools / 10 public" and zero mention of `SERVICIALO_VERTICAL`, `SERVICIALO_REGION`, `SERVICIALO_NODE_TOKEN`, `SERVICIALO_OPERATIONAL_TELEMETRY`. This release fixes that.

### Docs

- README (ES + EN): tool counts corrected (40 / 15 public / 25 authenticated). Added the two new tool families that were missing from the navigation: **Inteligencia de Red / Network Intelligence** (`market.list_segments`, `market.get_benchmark`) and **Discovery de Taxonomía / Cold-start Discovery** (`registry.list_verticals`, `registry.list_regions`, `registry.list_event_types`).
- README (ES + EN): new "Operational telemetry + benchmarks" subsection under Credentials with the 6 env vars that govern emission and tier-2 access (`SERVICIALO_VERTICAL`, `SERVICIALO_REGION`, `SERVICIALO_NODE_TOKEN`, `SERVICIALO_OPERATIONAL_TELEMETRY`, `SERVICIALO_PROTOCOL_VERSION`, `SERVICIALO_TELEMETRY_BASE_URL`), with explicit links to GOVERNANCE.md and docs/telemetry-operational.md.
- `.env.example`: documented the 4 user-relevant operational-telemetry vars with comments explaining each.

### Why a docs-only patch instead of waiting

The runtime `serverInstructions` (what an AI agent sees when the server loads) was already correct in 0.9.11. The README in the npm registry was not. A human reading docs on npmjs.com couldn't discover the network-intelligence surface without spelunking through GitHub. Shipping the fix now avoids a window where readers infer the wrong contract.

## [0.9.11] - 2026-05-20

Sigue en `0.9.x` por la cadencia de patches hacia 1.0, pero esta versión SÍ introduce nuevas tools al surface. Tres áreas:

### Added — Network intelligence (Promise 2)

- `market.list_segments` (public) — lista los segmentos `(event_type × vertical × region)` con k-anonimato ≥ 5 sobre los últimos 90 días.
- `market.get_benchmark` (public) — distribución de buckets de un segmento (price bands, lead times, outcomes). Política de tiers 0/1/2 (contribuir-para-acceder) aplicada en el endpoint.
- Telemetría operacional emitida automáticamente al backend tras llamadas exitosas a `scheduling.book`, `delivery.checkout`, `lifecycle.transition` (Cancelado / Inasistencia_*), y `payments.record_payment`. Bucketing (precio en bandas, duración en rangos, región a país, fingerprint por org) hecho client-side antes de transmitir.
- `SERVICIALO_OPERATIONAL_TELEMETRY=false` para opt-out.
- `SERVICIALO_VERTICAL`, `SERVICIALO_REGION` para tipear los eventos. `SERVICIALO_ORG_ID` se reutiliza para derivar el `org_fingerprint`.
- `SERVICIALO_NODE_TOKEN` se propaga automáticamente como header `X-Servicialo-Node-Token` en los calls `market.*` para identificar tier (incluyendo tier 2 = real-time).

### Added — Cold-start discovery

- `registry.list_verticals` (public) — lista verticals presentes en la red (declarados o observados en telemetría 30d). Sin necesidad de conocer la taxonomía previamente.
- `registry.list_regions` (public) — lista regiones ISO 3166-1 alpha-2.
- `registry.list_event_types` (public) — catálogo estático de los 4 tipos de eventos de telemetría operacional con sus `payload_fields`.

### Tool count

- v0.9.10: 35 tools (10 public + 25 authenticated) — *el CHANGELOG previo decía 37 por un fix de docs aplicado retroactivamente; lo real era 35.*
- v0.9.11: **40 tools** (15 public + 25 authenticated). Diff: +5 públicas, 0 breaking.

### Notes

- El surface autenticado (lifecycle + delivery + payments + resources) no cambió — `0.9.10` clients siguen funcionando idénticos contra el mismo backend.
- El backend HTTP que el package consume agrega los endpoints `/api/benchmarks*`, `/api/registry/{verticals,regions,event_types}`, `/api/telemetry/operational`, y `/api/webhooks/*`. Los clientes que sólo usan tools existentes no notan nada nuevo.

## [0.9.10] - 2026-05-19

### Road to 1.0

El protocolo Servicialo entra en **fase de estabilización** hacia 1.0. El primer cohort formal de RFCs está abierto a comentarios — ventana mínima de 4 semanas antes de Final Comment Period.

- **RFC cohort (PR #13):** https://github.com/servicialo/mcp-server/pull/13
- **Proceso 1.0 / Discusión:** https://github.com/servicialo/mcp-server/discussions/14

Esta versión **no introduce cambios al protocolo** ni al surface area de las 37 tools MCP. Mantiene compatibilidad total con `0.9.9`. Hasta 1.0, los releases siguen siendo `0.9.x` patch.

### Added
- Identidad opcional del implementor en telemetría — los operadores pueden setear `SERVICIALO_IMPL_NAME`, `SERVICIALO_IMPL_URL`, `SERVICIALO_IMPL_CONTACT` para postular al estatus de *verified implementor*. Si no se setean, el nodo permanece completamente anónimo (sin cambio de comportamiento).
- `.env.example` documenta las nuevas variables de entorno.

### Changed
- `server.json`: `SERVICIALO_API_KEY` y `SERVICIALO_ORG_ID` declarados explícitamente como `required: false` para el MCP Registry (ya eran opcionales en runtime).

### Docs
- README (ES + EN): nueva sección **Road to 1.0** con tabla de hitos pendientes y links al cohort de RFCs y la discusión.
- README (ES + EN): removido el badge `live_network`. Los conteos hardcodeados envejecen mal entre releases y la página renderizada en npm exponía números obsoletos por semanas. La métrica vive ahora solamente en [servicialo.com/network](https://servicialo.com/network).
- README EN: removido el bloque "Canonical MCP Registry entry / io.github.danioni deprecated" — la transición ya está consumada y la nota agregaba ruido al lector que llega vía npm.
- README (ES + EN): removidos los cross-links `[English version]` / `[Versión en español]` (rutas relativas que no resuelven cuando el README se renderiza en la página de npm).

## [0.9.9] - 2026-04-XX

> Entrada faltante en el changelog original. Diff vs 0.9.8 disponible en GitHub: [`13112b9`](https://github.com/servicialo/mcp-server/commit/13112b9).

## [0.9.8] - 2026-04-08

### Fixed
- Telemetry POST target corrected to `/api/telemetry/instance` (was silently 404ing)
- First-run stderr notice with opt-out instructions (sentinel: `~/.servicialo/.telemetry-notice-shown`)
- README telemetry docs updated: corrected payload fields, added `node_id`, removed misleading "opt-in" language

## [0.8.0] - 2026-03-17

### Added
- DNS-like Resolver (public): `resolve.lookup`, `resolve.search`, `trust.get_score`
- Authenticated Resolver: `resolve.register`, `resolve.update_endpoint`, `telemetry.heartbeat`
- A2A Discovery: `a2a.get_agent_card` — interoperabilidad con agentes A2A v0.3
- Physical Resource Management: `resource.list`, `resource.get`, `resource.create`,
  `resource.update`, `resource.delete`, `resource.get_availability`
- Server Manifest: `registry.manifest`
- Pluggable Adapter Layer: interfaz `ServicialoAdapter` + `ServicialoHttpAdapter`
- Delegated Agency Model: mandatos, scopes, audit logging, middleware
- Provider Profile & Matching: schemas de atributos, perfiles, scoring
- `server.json` para MCP Registry Schema 2025-12
- `README.en.md` — documentacion bilingue

### Changed
- Todos los tool handlers migrados de `CoordinaloClient` → `ServicialoAdapter`
- `index.ts` reestructurado para 7 modulos de tools
- README reescrito con formato bilingue y capacidades v0.8.0

## [0.7.0] - 2026-02-XX

- Ver releases anteriores en GitHub
