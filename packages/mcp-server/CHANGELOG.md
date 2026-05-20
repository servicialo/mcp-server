# Changelog — @servicialo/mcp-server

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
