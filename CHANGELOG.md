# Changelog

All notable changes to the Servicialo open protocol and its reference tooling will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The **protocol** follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The **MCP server** (`@servicialo/mcp-server`) is versioned independently.

## [Protocol v0.3] - 2025-02-23

### Added
- **JSON Schemas** for `Service` and `ServiceOrder` objects (`schema/service.schema.json`, `schema/service-order.schema.json`), enabling machine-readable validation.
- **MCP server test suite** using Vitest for the `@servicialo/mcp-server` package.
- **Agent conversation examples** demonstrating real multi-turn interactions (`examples/home-repair.md`, `examples/kinesiology-session.md`).
- **Registry search tool** — `registry.search` now calls the live `/api/servicialo/registry` endpoint.
- **20 MCP tools** across 6 agent phases: Discovery, Booking, Execution, Documentation, Billing, and Support.

### Changed
- Canonical homepage consolidated to `servicialo.com`.
- README rewritten as the public-facing specification narrative — the 8 dimensions, 9 universal states, 6 exception flows, and 7 principles are now documented transparently.
- Protocol version aligned to v0.3 across all documentation.

### Fixed
- MCP server API paths corrected (`/api/servicialo/*`).
- Service Order examples corrected on the website.

## [Protocol v0.2] - 2025-02-23

### Added
- Initial public specification of the 8 dimensions of a service.
- 9 universal lifecycle states: Solicitado, Agendado, Confirmado, En Curso, Completado, Documentado, Facturado, Cobrado, Verificado.
- 6 exception flows (cancellation, rescheduling, no-show, dispute, partial completion, expiration).
- Evidence-per-vertical framework for Health, Home, Legal, and Education.
- 3-phase dispute resolution model (80/20 algorithmic resolution target).
- MCP server (`@servicialo/mcp-server`) first published to npm.
- Modular architecture: Core (stable), Finance (design), Disputes (design).

## [Protocol v0.1] - 2025-02-22

### Added
- Initial protocol concept and Next.js website at `servicialo.com`.
- Core service model and lifecycle definition.
- CONTRIBUTING.md with RFC process for standard changes.
- Dual license structure (Apache-2.0 for code/spec, CC-BY-4.0 for docs).

[Protocol v0.3]: https://github.com/servicialo/mcp-server/compare/v0.2...v0.3
[Protocol v0.2]: https://github.com/servicialo/mcp-server/compare/v0.1...v0.2
[Protocol v0.1]: https://github.com/servicialo/mcp-server/releases/tag/v0.1
