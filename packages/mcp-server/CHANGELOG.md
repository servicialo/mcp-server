# Changelog — @servicialo/mcp-server

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
