# Roadmap

This roadmap reflects the current direction of the **Servicialo open protocol** and its reference tooling. Priorities may shift based on community feedback and RFC outcomes.

> Servicialo is a community-driven protocol. If you want to influence the roadmap, open a [feature request](https://github.com/servicialo/mcp-server/issues/new?template=feature_request.md) or submit an [RFC](./CONTRIBUTING.md).

---

## Done — v0.1 → v0.7

What's already shipped:

- [x] **Core specification** — 8 dimensions, 6 core + 3 optional financial states (the 9-milestone sequence is the happy-path view), 6 exception flows, 7 principles ([PROTOCOL.md](./PROTOCOL.md)).
- [x] **JSON Schemas** — `service.schema.json` and `service-order.schema.json` with lifecycle states, exception types, and evidence definitions (`schema/`).
- [x] **MCP server** — `@servicialo/mcp-server` published on npm. 40 tools (15 public + 25 authenticated) across 7 lifecycle phases (0–6), plus resource management, resolver administration, and network-intelligence (`market.list_segments`, `market.get_benchmark`).
- [x] **A2A v0.3 endpoint** — `POST /{orgSlug}/a2a` (JSON-RPC) with `message/send`, `tasks/get`, `tasks/cancel`. Multi-turn booking conversation via persisted `A2ATask`.
- [x] **Operational telemetry** — anonymized, bucketed events (`booking_created`, `service_completed`, `dispute_opened`, `payment_settled`) emitted by the MCP server, persisted in the registry's `telemetry_events` table. Schema: [`schema/telemetry/operational-event.schema.json`](./schema/telemetry/operational-event.schema.json).
- [x] **Benchmarks API** — `/api/benchmarks` + `/api/benchmarks/segments` with k-anonymity ≥ 5 enforced at query time. Distribution-of-buckets format (categorical, not numeric).
- [x] **Contribute-to-access gating** — tier 0/1/2 model. Non-contributing nodes see 90-day-delayed data; active contributors see real-time. Policy documented in [GOVERNANCE.md](./GOVERNANCE.md#contribute-to-access-policy-v01).
- [x] **Webhooks v0.2** — full subscription API (create / list / patch / delete / rotate-secret / reactivate / test), HMAC-signed delivery with retry (1m→5m→30m, max 3), auto-deactivation, `benchmark.weekly_snapshot` event delivered by Vercel Cron every Monday 00:00 UTC.
- [x] **Test suite** — Vitest tests for the MCP server (`packages/mcp-server/src/__tests__/`).
- [x] **Website** — servicialo.com live with full protocol narrative (Next.js 14, Tailwind v3).
- [x] **Agent examples** — two complete multi-turn conversations: kinesiology session and home repair (`examples/`).
- [x] **Governance** — CONTRIBUTING.md with RFC process, SECURITY.md, CODE_OF_CONDUCT.md, CHANGELOG.md, issue/PR templates, CI/CD auto-publish to npm.
- [x] **Evidence verticals** — 5 defined: Health, Home, Legal, Education, Consulting.
- [x] **Layered architecture** — Core (stable), Finance (design), Disputes (design).
- [x] **Governance** — GOVERNANCE.md with network narrative, data governance principles, and protocol neutrality framework.

---

## Short Term — Solidify the Foundation

_Target: Protocol v0.10 (current) → v1.0_

- [ ] **Conformance test suite** — portable tests any implementation can run to verify protocol compliance (separate from MCP server unit tests). What ships today is the **HTTP compatibility suite** (`test:http-compat`, portable, runs against any `SERVICIALO_BASE_URL`): it verifies the HTTP binding surface, not the normative requirements. The conformance suite proper (schema validity, invalid-transition rejection, exception flows — the manual-review column of the [matrix](./public/spec/certification.md#requirement--verification-matrix)) remains open.
- [ ] **Expand evidence verticals** — add at least 2 new verticals beyond Health, Home, Legal, and Education (community-proposed). Consulting was added (1 of 2).
- [ ] **MCP server hardening** — improve error handling, input validation, and edge-case coverage.
- [x] **OpenAPI specification** — published as [`spec/openapi.yaml`](./spec/openapi.yaml), the formal API description for the HTTP endpoints consumed by the MCP server.
- [x] **Multilingual documentation** — English translation of the core specification (PROTOCOL.md is in English; README.en.md exists).
- [x] **Página /protocolo en el sitio** — existe [servicialo.com/spec](https://servicialo.com/spec) con la especificación técnica formal.

## Mid Term — Grow the Ecosystem

_Target: Protocol v0.5 – v0.8_

- [ ] **Federated catalog discovery (search beyond taxonomy)** — today `registry.list_verticals` answers *what verticals exist*. It does not answer *which org offers physiotherapy*, because the registry only stores vertical declarations, not the per-service catalog of each node. To support natural-language search ("kinesio", "consulta de despido injusto"), the protocol needs:
  1. A canonical, public way for nodes to expose their service catalog to the registry (either a sync endpoint that mirrors `services.list` into `registry_entries.metadata`, or a federated fan-out where the registry queries each node on demand).
  2. Postgres full-text search (`tsvector` + GIN index) over the combined corpus, with the Spanish stemmer config so "kinesio → kinesiología" resolves.
  3. Optional: pgvector embeddings for cross-lingual / paraphrase matching ("consulta de despido injusto" → labor-law orgs).
  
  Deferred until ecosystem reaches ≥2 active contributors with non-trivial catalogs — full-text against the current 3 stub rows would have ~zero useful coverage and would prematurely freeze a contract.
- [ ] **Finance extension** — move billing and payment lifecycle from "design" to "stable" status with full schema support.
- [ ] **Dispute resolution extension** — formalize the 3-phase dispute model into a stable, implementable specification.
- [x] **Network Intelligence (phase 1)** — telemetry, benchmarks, gating and weekly snapshot are live. Phase 2 (cross-segment comparison, custom windows, implementer-emitted event relay at `/api/webhooks/emit`) is pending and unlocks when ecosystem reaches multiple active contributors.
- [ ] **Multi-implementation interoperability** — define and test cross-platform compatibility between independent Servicialo implementations. The test harness is ready ([`scripts/verify-interop.mjs`](./scripts/verify-interop.mjs): manifest parity, registry co-discovery, services/availability wire parity, lifecycle vocabulary vs spec enum, agent cards — one agent codepath against two backends). Execution blocked on the second backend existing; until it runs against a real node B, this item stays open.
- [ ] **Agent SDK / client libraries** — reference libraries (TypeScript, Python) for building Servicialo-aware AI agents.
- [x] **Webhook / event specification** — [`WEBHOOKS.md`](./WEBHOOKS.md) v0.2 defines registry-emitted events and the subscription contract. Implementer-emitted events (`service.state_changed`, `payment.received`, etc.) are spec-only — the registry relay is a phase-2 item.
- [x] **Tiers de conformance: CORE vs FULL** — definidos en [certification.md](./public/spec/certification.md): CORE (requisitos 1–5), FULL (1–10), NETWORK (opcional), con matriz requisito → prueba que declara qué verifica la suite automatizada y qué queda en revisión manual. La tabla de IMPLEMENTORS.md ya reporta el nivel. Pendiente (cubierto por "Conformance test suite" arriba): que el nivel sea un veredicto automatizado y su eventual efecto en `trust_score`.
- [ ] **Governance expansion** — establish a contributors group and formalize the RFC review process with multiple reviewers.

## Long Term — Standard Maturity

_Target: Protocol v1.0_

- [ ] **Protocol v1.0** — declare Core (8 dimensions, 6 core + 3 optional financial states, 6 exception flows, 7 principles) as stable with backwards-compatibility guarantees.
- [ ] **Formal governance body** — transition from single-maintainer to a multi-stakeholder steering committee (see [GOVERNANCE.md](./GOVERNANCE.md)).
- [ ] **Certification program** — optional conformance certification for platforms implementing Servicialo (verification is manual today — see [IMPLEMENTORS.md](./IMPLEMENTORS.md)).
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
