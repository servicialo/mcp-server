# Roadmap

This roadmap reflects the current direction of the **Servicialo open protocol** and its reference tooling. Priorities may shift based on community feedback and RFC outcomes.

> Servicialo is a community-driven protocol. If you want to influence the roadmap, open a [feature request](https://github.com/servicialo/mcp-server/issues/new?template=feature_request.md) or submit an [RFC](./CONTRIBUTING.md).

---

## Done — v0.1 → v0.7

What's already shipped:

- [x] **Core specification** — 8 dimensions, 9 universal states, 6 exception flows, 7 principles ([PROTOCOL.md](./PROTOCOL.md)).
- [x] **JSON Schemas** — `service.schema.json` and `service-order.schema.json` with lifecycle states, exception types, and evidence definitions (`schema/`).
- [x] **MCP server** — `@servicialo/mcp-server` published on npm. 37 tools across 7 lifecycle phases (0–6), plus resource management, resolver administration, and network-intelligence (`market.list_segments`, `market.get_benchmark`).
- [x] **A2A v0.3 endpoint** — `POST /{orgSlug}/a2a` (JSON-RPC) with `message/send`, `tasks/get`, `tasks/cancel`. Multi-turn booking conversation via persisted `A2ATask`.
- [x] **Operational telemetry** — anonymized, bucketed events (`booking_created`, `service_completed`, `dispute_opened`, `payment_settled`) emitted by the MCP server, persisted in the registry's `telemetry_events` table. Schema: [`schema/telemetry/operational-event.schema.json`](./schema/telemetry/operational-event.schema.json).
- [x] **Benchmarks API** — `/api/benchmarks` + `/api/benchmarks/segments` with k-anonymity ≥ 5 enforced at query time. Distribution-of-buckets format (categorical, not numeric).
- [x] **Contribute-to-access gating** — tier 0/1/2 model. Non-contributing nodes see 90-day-delayed data; active contributors see real-time. Policy documented in [GOVERNANCE.md](./GOVERNANCE.md#contribute-to-access-policy-v01).
- [x] **Webhooks v0.2** — full subscription API (create / list / patch / delete / rotate-secret / reactivate / test), HMAC-signed delivery with retry (1m→5m→30m, max 3), auto-deactivation, `benchmark.weekly_snapshot` event delivered by Vercel Cron every Monday 00:00 UTC.
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
- [x] **Network Intelligence (phase 1)** — telemetry, benchmarks, gating and weekly snapshot are live. Phase 2 (cross-segment comparison, custom windows, implementer-emitted event relay at `/api/webhooks/emit`) is pending and unlocks when ecosystem reaches multiple active contributors.
- [ ] **Multi-implementation interoperability** — define and test cross-platform compatibility between independent Servicialo implementations.
- [ ] **Agent SDK / client libraries** — reference libraries (TypeScript, Python) for building Servicialo-aware AI agents.
- [x] **Webhook / event specification** — [`WEBHOOKS.md`](./WEBHOOKS.md) v0.2 defines registry-emitted events and the subscription contract. Implementer-emitted events (`service.state_changed`, `payment.received`, etc.) are spec-only — the registry relay is a phase-2 item.
- [ ] **Tiers de conformance: CORE vs FULL** — hoy un implementador puede ser CONFORMANT sin cubrir las fases 5–6 (delivery + cierre financiero), porque están marcadas como opcionales en v0.9. A medida que la red crezca, necesitaremos distinguir: CORE (fases 0–4: discovery, scheduling, lifecycle) vs FULL (fases 0–6: + delivery evidence + financial close). Esto afecta la tabla de IMPLEMENTORS.md, el conformance test suite, y potencialmente el `trust_score` del protocolo.
- [ ] **Governance expansion** — establish a contributors group and formalize the RFC review process with multiple reviewers.

## Long Term — Standard Maturity

_Target: Protocol v1.0_

- [ ] **Protocol v1.0** — declare Core (8 dimensions, 9 states, 6 exception flows, 7 principles) as stable with backwards-compatibility guarantees.
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
