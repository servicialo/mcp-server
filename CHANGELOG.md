# Changelog

All notable changes to the Servicialo open protocol and its reference tooling will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Protocol v0.10 / MCP Server v0.9.10] - 2026-05-20

Closes the two protocol-level promises: discovery-and-routing (Promise 1) and network intelligence (Promise 2). Both are now functionally complete.

### Added — A2A endpoint

- `POST /{orgSlug}/a2a` JSON-RPC 2.0 endpoint with `message/send`, `tasks/get`, `tasks/cancel`. Multi-turn booking conversation persisted via the new `A2ATask` model. HTTP authentication scheme declared in the Agent Card. Detailed in [`docs/a2a-interoperability.md`](./docs/a2a-interoperability.md).
- `apiKey` scheme advertised in `/.well-known/agent.json` — optional `X-Servicialo-API-Key` header validated when `SERVICIALO_A2A_API_KEY` is set.
- `scripts/verify-a2a.mjs` — 9-check E2E smoke test.

### Added — Operational telemetry

- `schema/telemetry/operational-event.schema.json` — anonymized, bucketed event contract for `booking_created`, `service_completed`, `dispute_opened`, `payment_settled`.
- `POST /api/telemetry/operational` — receiver with Zod validation + Supabase persistence into `telemetry_events`.
- `packages/mcp-server/src/telemetry/{operational,dispatch}.ts` — bucketing helpers (`bucketPriceCLP`, `bucketDurationMinutes`, `bucketSlotHour`, …) and a tool dispatch wrapper that emits events after successful `scheduling.book`, `delivery.checkout`, `lifecycle.transition`, and `payments.record_payment` calls.
- `SERVICIALO_OPERATIONAL_TELEMETRY=false` opt-out env var.

### Added — Benchmarks API

- `GET /api/benchmarks` — distribution of bucketed payload fields per `(event_type, vertical, region)` segment with k-anonymity ≥ 5 enforced.
- `GET /api/benchmarks/segments` — discoverability endpoint backed by the `list_telemetry_segments(from_ts, to_ts)` Postgres RPC.
- MCP tools `market.list_segments` and `market.get_benchmark` (public, no auth needed).
- `docs/benchmarks.md` with response shape, k-anon rule, and curl examples.

### Added — Contribute-to-access gating

- `lib/servicialo/contribution.ts` — tier resolver based on `org_fingerprint` (SHA-256(slug ‖ salt)) and last-30-days event count.
- Tier 0 (anonymous) & tier 1 (identified, no contribution) → window clamped to `[now-180d, now-90d]`. Tier 2 (≥50 events in 30 days) → real-time window.
- Tier policy documented in [`GOVERNANCE.md`](./GOVERNANCE.md#contribute-to-access-policy-v01).
- `MCP server` propagates `X-Servicialo-Node-Token` (from `SERVICIALO_NODE_TOKEN` env) on every `market.*` call.

### Added — Webhooks (v0.2)

- `webhook_subscriptions` and `webhook_deliveries` tables with RLS; only the service role writes.
- Full subscription API: `POST/GET /api/webhooks/subscriptions`, `PATCH/DELETE /[id]`, `POST /[id]/rotate-secret` (rate-limited 1/min), `POST /[id]/reactivate`, `POST /[id]/test`, `GET /api/webhooks/deliveries/[id]`.
- HMAC-SHA256 signing (`X-Servicialo-Signature: sha256=<hex>`) + standard `X-Servicialo-Event-Id` / `Event-Type` / `Delivery-Id` / `Timestamp` headers.
- Retry schedule 1m → 5m → 30m, max 3 attempts, then `abandoned`. After 3 consecutive abandoned deliveries → auto-deactivate.
- HTTP semantics: 2xx delivered · 410 Gone abandons + auto-deactivates · other 4xx fails without retry · 5xx/timeout/network retries.
- Vercel Cron jobs in `vercel.json`: `/api/cron/webhook-retries` every 5 min, `/api/cron/benchmark-weekly-snapshot` Mondays 00:00 UTC.
- `WEBHOOKS.md` rewritten as v0.2 with the full live contract.

### Added — Supabase schema migrations

- `add_a2a_task` (Prisma) for the A2A task store.
- `add_telemetry_events_operational`, `add_telemetry_segments_view`, `add_list_telemetry_segments_rpc` (Supabase) for telemetry storage & rollup.
- `add_webhook_subscriptions_and_deliveries`, `align_webhook_subscriptions_schema_with_h5_spec`, `webhook_url_allow_loopback_http` (Supabase) for the webhook tables.
- `silence_registry_alert_for_test_fixtures` (Supabase) — the registry alert trigger skips slugs matching `\_%` so seed scripts don't spam the admin inbox.

### Added — Verification scripts

- `verify-a2a.mjs`, `verify-operational-telemetry.mjs`, `verify-benchmarks.mjs`, `verify-benchmarks-gating.mjs`, `verify-webhooks-api.mjs`, `verify-webhooks-delivery.mjs` (with embedded HTTP mock receiver), and idempotent `seed-test-*.sql` + `cleanup-test-*.sql` for each.

### Changed

- README — tool count corrected from 34 to 37; "DNS resolution" reframed as "resolver de descubrimiento (análogo a DNS, sobre HTTP)" to stop overselling the metaphor; new "Inteligencia de red" section.
- SPEC.md — same tool-count correction + analogy note in §5.
- ROADMAP.md — Network Intelligence and Webhooks moved from Mid Term to Done.

### Fixed

- The `notify_registry_alert()` Postgres trigger formerly emailed the admin on every fixture row; now skips slugs prefixed `_` (convention enforced in all seed scripts).

## [MCP Server v0.9.8] - 2026-04-08

### Fixed
- Telemetry endpoint URL corrected (`/api/telemetry/instance`) — pings were silently 404ing since v0.8
- Added first-run opt-out notice to stderr with sentinel file

## [Protocol v0.9 / MCP Server v0.9.0] - 2026-03-23

### Added

- **Evidence sensitivity classification** — `data_sensitivity` field (`public | internal | confidential | restricted`) on the base evidence envelope (§9.8).
- Per-vertical default sensitivity annotations on all 5 vertical schemas (health, legal, home, education, consulting).
- Non-downgrade rule: `clinical_record` evidence in the health vertical cannot be classified below `restricted`.
- `sanitizeEvidence()` helper in MCP server — redacts `data` payload of `restricted` evidence before audit logging.
- Non-blocking `RESTRICTED_EVIDENCE_STORED` warning in `delivery.record_evidence` when evidence is `restricted`.
- New PROTOCOL.md §9.8 with implementation obligations per sensitivity level and jurisdiction reference table.
- New "Implementando la Vertical de Salud" section in IMPLEMENTING.md.

### Changed

- `SPEC.md` dimension 7 updated to include `data_sensitivity`.
- MCP server version bumped to 0.9.0.
The **protocol** follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The **MCP server** (`@servicialo/mcp-server`) is versioned independently.

## [Protocol v0.8 / MCP Server v0.8.0] - 2026-03-17

### Added
- **A2A v0.3 interoperability** — Agent-to-Agent protocol support as optional extension.
- `a2a.get_agent_card` tool in MCP server for A2A agent discovery.
- A2A Extension endpoints in `spec/openapi.yaml`: Agent Card, JSON-RPC task endpoint, agent directory.
- "Servicialo A2A Ready" certification criteria.
- `docs/a2a-interoperability.md` — A2A integration guide.

### Changed
- MCP server version bumped to 0.8.0.

## [Protocol v0.7] - 2026-03-10

### Added
- **Visibility field** (`public` | `unlisted` | `private`) on Service and Service Order — controls discoverability in the network.

### Changed
- License changed from MIT to Apache-2.0.

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

[Protocol v0.7]: https://github.com/servicialo/mcp-server/compare/v0.3...v0.7
[Protocol v0.3]: https://github.com/servicialo/mcp-server/compare/v0.2...v0.3
[Protocol v0.2]: https://github.com/servicialo/mcp-server/compare/v0.1...v0.2
[Protocol v0.1]: https://github.com/servicialo/mcp-server/releases/tag/v0.1
