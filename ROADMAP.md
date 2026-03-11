# Roadmap

This roadmap reflects the current direction of the **Servicialo open protocol** and its reference tooling. Priorities may shift based on community feedback and RFC outcomes.

> Servicialo is a community-driven protocol. If you want to influence the roadmap, open a [feature request](https://github.com/servicialo/mcp-server/issues/new?template=feature_request.md) or submit an [RFC](./CONTRIBUTING.md).

---

## Done — v0.1 → v0.7

What's already shipped:

- [x] **Core specification** — 8 dimensions, 9 universal states, 6 exception flows, 8 principles ([PROTOCOL.md](./PROTOCOL.md)).
- [x] **JSON Schemas** — `service.schema.json` and `service-order.schema.json` with lifecycle states, exception types, and evidence definitions (`schema/`).
- [x] **MCP server** — `@servicialo/mcp-server` v0.5.3 published on npm. 20 tools across 6 agent phases (Discovery, Booking, Execution, Documentation, Billing, Support).
- [x] **Test suite** — Vitest tests for the MCP server (`packages/mcp-server/src/__tests__/`).
- [x] **Website** — servicialo.com live with full protocol narrative (Next.js 14, Tailwind v3).
- [x] **Agent examples** — two complete multi-turn conversations: kinesiology session and home repair (`examples/`).
- [x] **Governance** — CONTRIBUTING.md with RFC process, SECURITY.md, CODE_OF_CONDUCT.md, CHANGELOG.md, issue/PR templates, CI/CD auto-publish to npm.
- [x] **Evidence verticals** — 4 defined: Health, Home, Legal, Education.
- [x] **Layered architecture** — Core (stable), Finance (design), Disputes (design).
- [x] **Governance** — GOVERNANCE.md with network narrative, data governance principles, and protocol neutrality framework.

---

## Short Term — Solidify the Foundation

_Target: Protocol v0.4_

- [ ] **Conformance test suite** — portable tests any implementation can run to verify protocol compliance (separate from MCP server unit tests).
- [ ] **Expand evidence verticals** — add at least 2 new verticals beyond Health, Home, Legal, and Education (community-proposed).
- [ ] **MCP server hardening** — improve error handling, input validation, and edge-case coverage.
- [ ] **OpenAPI specification** — publish a formal API description for the HTTP endpoints consumed by the MCP server.
- [ ] **Multilingual documentation** — English translation of the core specification (PROTOCOL.md and README).
- [ ] **Página /protocolo en el sitio** — ruta dedicada con la especificación técnica formal, schema interactivo, y diagrama de estados.

## Mid Term — Grow the Ecosystem

_Target: Protocol v0.5 – v0.8_

- [ ] **Finance extension** — move billing and payment lifecycle from "design" to "stable" status with full schema support.
- [ ] **Dispute resolution extension** — formalize the 3-phase dispute model into a stable, implementable specification.
- [ ] **Network Intelligence** — activate contribute-to-access telemetry when ecosystem reaches 10+ nodes.
- [ ] **Multi-implementation interoperability** — define and test cross-platform compatibility between independent Servicialo implementations.
- [ ] **Agent SDK / client libraries** — reference libraries (TypeScript, Python) for building Servicialo-aware AI agents.
- [ ] **Webhook / event specification** — standardize real-time notifications for state transitions.
- [ ] **Governance expansion** — establish a contributors group and formalize the RFC review process with multiple reviewers.

## Long Term — Standard Maturity

_Target: Protocol v1.0_

- [ ] **Protocol v1.0** — declare Core (8 dimensions, 9 states, 8 principles) as stable with backwards-compatibility guarantees.
- [ ] **Formal governance body** — transition from single-maintainer to a multi-stakeholder steering committee (see [GOVERNANCE.md](./GOVERNANCE.md)).
- [ ] **Certification program** — optional conformance certification for platforms implementing Servicialo.
- [ ] **Industry adoption** — at least 3 independent implementations beyond [Coordinalo](https://coordinalo.com).
- [ ] **Localization** — specification available in Spanish, English, and Portuguese; tooling supports i18n service metadata.

---

## Repo Housekeeping

- [x] Add `mcp-publisher`, `mcp-publisher.exe`, `.mcpregistry_*` tokens to `.gitignore`.
- [x] Remove `PLAN.md` (outdated — superseded by this roadmap and PROTOCOL.md).
- [x] Remove `plan_motor_entrega.docx` from root.

---

## How to Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the RFC process, vertical proposals, and code contribution guidelines.
