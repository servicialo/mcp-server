# Implementing Servicialo

> **Start here:** Read [`SPEC.md`](./SPEC.md) first — a self-contained quick reference covering the 8 dimensions, the 6+3 lifecycle states, exception flows, all 40 MCP tools, and minimum requirements. Then come back here for the step-by-step build guide.

## Cómo listar tu implementación

1. Corre la suite de compatibilidad HTTP contra tu backend (ver [IMPLEMENTING.md paso 8](./IMPLEMENTING.md#paso-8--verificar-compatibilidad-http)). El resultado esperado es `HTTP-COMPATIBLE`, que significa exactamente una cosa: **binding — las operaciones CORE requeridas responden**. No es conformance: la suite imprime en cada corrida qué requisitos CORE *no* evalúa.
2. Abre un PR que agregue tu fila a la tabla de abajo.
3. Incluye en la descripción del PR el output completo de la suite y evidencia de los requisitos normativos (checklist de IMPLEMENTING.md paso 7).
4. El equipo de Servicialo revisa contra la [matriz requisito → prueba](./public/spec/certification.md#requirement--verification-matrix), asigna nivel **CORE** o **FULL**, y mergea si el nivel es ≥ CORE.

Las implementaciones listadas son verificadas — no aceptamos auto-declaraciones
sin evidencia de conformance. **La verificación es manual hoy** (revisión del
equipo sobre el PR); una suite de certificación automatizada y ejecutada
periódicamente es parte del roadmap, no una capacidad actual.

---

## What you're building on

Servicialo is an open protocol for professional service orchestration — scheduling, identity, delivery verification, and financial settlement. There is one production implementation today: [Coordinalo](https://coordinalo.com), which covers healthcare. The protocol is designed for multiple independent nodes across verticals and geographies, but that network does not exist yet. You would be the second.

## Minimum viable implementation

To be listed as a Servicialo-compatible implementation, your platform MUST satisfy 4 requirements (from [PROTOCOL.md §16](./PROTOCOL.md#16-implementations)):

| # | Requirement | Spec reference | What it means |
|:-:|-------------|:--------------:|---------------|
| 1 | **Model services using the 8 dimensions** | §5 | Every service has: identity (what), provider (who delivers), client (who receives), schedule (when), location (where), lifecycle (cycle), evidence (proof), billing (settlement). Your data model must capture all 8. |
| 2 | **Implement the 6 core lifecycle states** | §6 | `requested → scheduled → confirmed → in_progress → completed → documented`. The 3 close-out states (`invoiced → collected → verified` — the first two settlement, `verified` acceptance/verification) are OPTIONAL extensions — you may bundle them into the session lifecycle or manage them independently. Transitions within your implemented sequence are strictly ordered and each records `from`, `to`, `at`, `by`. Delivery, evidence, acceptance and settlement have no total order across them (§6.0). |
| 3 | **Handle at least 3 exception flows** | §7 | Pick 3 of: cancellation, client no-show, provider no-show, rescheduling, quality dispute, partial delivery. The easiest starting set is cancellation + client no-show + rescheduling. |
| 4 | **Expose at least one machine-to-machine binding** | §13 + [`spec/HTTP_PROFILE.md`](./spec/HTTP_PROFILE.md) | The 6 CORE operations listed below — exposed through the HTTP binding, MCP, A2A, or an equivalent, declaring supported profiles and versions. A purely HTTP implementation is conformant without MCP. Connecting the reference MCP server to your API is the fastest path and the recommended agentic integration. |

**The 6 CORE operations.** The canonical, machine-readable list lives in
[`protocol/manifest.yaml`](./protocol/manifest.yaml) under
`conformance.core.required_operations`; this table restates it, and
`scripts/verify-conformance-parity.mjs` fails CI if the two disagree. Each
satisfies one clause of the CORE sentence in
[`certification.md`](./public/spec/certification.md): *a consumer MUST be able to
discover an offer, know its availability before committing it, create the
commitment, manage that commitment's lifecycle, and record evidence of delivery.*

<!-- conformance:required:start -->

| Operation | Clause it satisfies |
|---|---|
| `registry.manifest` | the node declares itself (protocol version + endpoints) |
| `services.list` | discover an offer |
| `scheduling.check_availability` | know availability before committing it |
| `scheduling.book` | create the commitment |
| `lifecycle.transition` | manage the lifecycle |
| `delivery.record_evidence` | record evidence of delivery |

<!-- conformance:required:end -->

Not required, and why:

- **`registry.search`** belongs to the resolver, not to your node. You become
  discoverable by registering, not by implementing search.
- **`scheduling.confirm`, `delivery.checkin`, `delivery.checkout`** are
  conveniences. Their effect is reachable through the required operations —
  `confirmed`, `in_progress` and `delivered` are all valid `lifecycle.transition`
  targets, and `gps`/`duration` are `delivery.record_evidence` types. Implement
  them if they fit your product; they are not conformance conditions.
- **`payments.create_sale`** is settlement — OPTIONAL / FULL. A free or
  externally-billed service is conformant without it.

**Optional** (enhances compliance, not required for listing):

- Service Orders — commercial agreements grouping multiple services (§8)
- Delegated Agency Model — ServiceMandate for AI agent authorization (§10)
- Provider Profiles — typed, origin-tracked attributes (§12)
- **Network Intelligence** — contribute-to-access operational telemetry (§14). To participate:
  1. Set `SERVICIALO_VERTICAL`, `SERVICIALO_REGION`, `SERVICIALO_ORG_ID` on the `@servicialo/mcp-server` process so events carry the right segment metadata.
  2. The MCP server hooks `scheduling.book`, `delivery.checkout`, `lifecycle.transition`, and `payments.record_payment` to emit bucketed events automatically (POST to `https://servicialo.com/api/telemetry/operational`). Opt-out with `SERVICIALO_OPERATIONAL_TELEMETRY=false`.
  3. Once your node emits ≥ 50 events per 30 days you reach tier 2 and `market.get_benchmark` returns real-time data instead of the 90-day-delayed view. Policy in [`GOVERNANCE.md`](./GOVERNANCE.md#contribute-to-access-policy-v01).
- **Webhook subscriptions** — register an HTTPS endpoint to receive `benchmark.weekly_snapshot` and verify deliveries with HMAC-SHA256. Contract: [`WEBHOOKS.md`](./WEBHOOKS.md).
- **Catalog discoverability** — when you register, declare your verticals in `registry_entries.verticals` and keep your `services.list` endpoint public. The protocol exposes a network-wide taxonomy via `registry.list_verticals` / `registry.list_regions` / `registry.list_event_types` so cold-start agents can learn what exists. Full-text search across catalogs is a roadmap item (see ROADMAP.md "Federated catalog discovery") — once the second active implementer goes live, the protocol can wire in `tsvector` over service names so "kinesio" matches "kinesiología" without the agent having to guess.

For a step-by-step build guide (8 steps, the first takes ~20 minutes), see [`IMPLEMENTING.md`](./IMPLEMENTING.md).

## Effort estimate

This is calibrated for a team that already has a working service platform (appointments, providers, clients) and needs to make it Servicialo-compatible.

| Area | Effort | What's involved |
|------|:------:|-----------------|
| **8 dimensions** | Low | Data model mapping. You likely already have most fields — the work is ensuring all 8 are present and named consistently. Validate against `schema/service.schema.json`. |
| **6+3 lifecycle states** | Low–Medium | An ordered enum with transition rules. If you already have appointment statuses, it's a mapping exercise. The key constraint is strict ordering within your implemented sequence — no skipping from `requested` to `in_progress`. Financial states are optional. |
| **3 exception flows** | Medium | State machine branching. Cancellation is straightforward (pre-delivery → cancelled with policy). No-show requires a detection trigger and penalty logic. Rescheduling requires finding a new compatible slot while preserving provider/resource. |
| **Machine-to-machine binding** | Medium–High | The 6 CORE operations exposed via your REST surface (HTTP binding) or by connecting the reference MCP server to it. The protocol defines the contract; you implement the logic. The hardest part is `scheduling.check_availability` (multi-party intersection: provider × client × resource). |
| **Service Orders** | Medium | A parent object that groups services under scope + pricing + payment schedule, with a computed ledger. If you already have packages or plans, it's an evolution of that concept. |

**Rough timeline**: A senior developer with an existing platform can reach minimum compliance (4 mandatory requirements) in 2–4 weeks. Service Orders add another 1–2 weeks. Full compliance with all optional features is a longer investment that depends on your existing architecture.

## How to get listed

Checklist:

- [ ] Services validate against [`schema/service.schema.json`](./schema/service.schema.json)
- [ ] Create a service and advance it through the 6 core states (plus the financial states if you implement them) — each transition records `from`, `to`, `at`, `by`
- [ ] Attempt an invalid transition (e.g. `requested → in_progress`) — it must fail
- [ ] Trigger at least 3 exception flows and verify the state machine handles them
- [ ] Execute every CORE operation through your machine-to-machine binding — e.g. your HTTP surface directly, or the reference MCP server connected to your API
- [ ] Evidence is recorded on service completion (`proof.evidence` array is populated)

When you pass these, open a PR adding your platform to the table below.

## Compatible implementations

| Plataforma | Vertical | Cobertura de perfiles | Conformance | Estado |
|------------|----------|----------------------|:-----------:|:------:|
| [**Coordinalo**](https://coordinalo.com) | Healthcare | Core estable completo (Discovery, Coordination, Delivery); Evidence completo (candidate); Ordering parcial (`service_orders.*` y `mandates.*` especificadas sin implementar); Settlement y Network experimentales — ver [`protocol/manifest.yaml`](./protocol/manifest.yaml) | CORE — revisión manual (2026-06) | Live |

## What the second implementor gets

The protocol is pre-1.0. That means the second implementor is not just adopting a spec — they're shaping it.

- **Early positioning** — Listed on [servicialo.com](https://servicialo.com) and in this repo as a founding implementation.
- **Direct protocol input** — Design decisions are still being made. A second production implementation has real weight in those conversations.
- **Benchmark data** — As the network grows, implementations that contribute operational telemetry receive aggregate benchmarks segmented by vertical, region, and scale. Early nodes get this from day one.
- **MCP server compatibility** — Your platform becomes accessible to any AI agent that speaks MCP, without building your own agent integrations.

## Questions

Open an issue: [github.com/servicialo/mcp-server/issues](https://github.com/servicialo/mcp-server/issues)
