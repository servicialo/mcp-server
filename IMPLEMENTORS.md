# Implementing Servicialo

> **Start here:** Read [`SPEC.md`](./SPEC.md) first — a self-contained quick reference covering the 8 dimensions, 9 states, exception flows, all 34 MCP tools, and minimum requirements. Then come back here for the step-by-step build guide.

## What you're building on

Servicialo is an open protocol for professional service orchestration — scheduling, identity, delivery verification, and financial settlement. There is one production implementation today: [Coordinalo](https://coordinalo.com), which covers healthcare. The protocol is designed for multiple independent nodes across verticals and geographies, but that network does not exist yet. You would be the second.

## Minimum viable implementation

To be listed as a Servicialo-compatible implementation, your platform MUST satisfy 4 requirements (from [PROTOCOL.md §16](./PROTOCOL.md#16-implementations)):

| # | Requirement | Spec reference | What it means |
|:-:|-------------|:--------------:|---------------|
| 1 | **Model services using the 8 dimensions** | §5 | Every service has: identity (what), provider (who delivers), client (who receives), schedule (when), location (where), lifecycle (cycle), evidence (proof), billing (settlement). Your data model must capture all 8. |
| 2 | **Implement the 9 lifecycle states** | §6 | `requested → scheduled → confirmed → in_progress → completed → documented → invoiced → collected → verified`. Transitions must be strictly ordered — no skipping states. Each transition records `from`, `to`, `at`, `by`. |
| 3 | **Handle at least 3 exception flows** | §7 | Pick 3 of: cancellation, client no-show, provider no-show, rescheduling, quality dispute, partial delivery. The easiest starting set is cancellation + client no-show + rescheduling. |
| 4 | **Expose an API the MCP server can connect to** | §13 | Minimum 6 endpoints: `services.list`, `scheduling.check_availability`, `scheduling.book`, `scheduling.confirm`, `lifecycle.transition`, `delivery.checkin`. The MCP server translates these into tool calls for AI agents. |

**Optional** (enhances compliance, not required for listing):

- Service Orders — commercial agreements grouping multiple services (§8)
- Delegated Agency Model — ServiceMandate for AI agent authorization (§10)
- Provider Profiles — typed, origin-tracked attributes (§12)
- Network Intelligence — contribute-to-access operational telemetry (§14)

For a step-by-step build guide (7 steps, the first takes ~20 minutes), see [`IMPLEMENTING.md`](./IMPLEMENTING.md).

## Effort estimate

This is calibrated for a team that already has a working service platform (appointments, providers, clients) and needs to make it Servicialo-compatible.

| Area | Effort | What's involved |
|------|:------:|-----------------|
| **8 dimensions** | Low | Data model mapping. You likely already have most fields — the work is ensuring all 8 are present and named consistently. Validate against `schema/service.schema.json`. |
| **9 lifecycle states** | Low–Medium | An ordered enum with transition rules. If you already have appointment statuses, it's a mapping exercise. The key constraint is strict ordering — no skipping from `requested` to `in_progress`. |
| **3 exception flows** | Medium | State machine branching. Cancellation is straightforward (pre-delivery → cancelled with policy). No-show requires a detection trigger and penalty logic. Rescheduling requires finding a new compatible slot while preserving provider/resource. |
| **MCP-connectable API** | Medium–High | 6 REST endpoints that the MCP server can call. The protocol defines the contract; you implement the logic. The hardest part is `scheduling.check_availability` (multi-party intersection: provider × client × resource). |
| **Service Orders** | Medium | A parent object that groups services under scope + pricing + payment schedule, with a computed ledger. If you already have packages or plans, it's an evolution of that concept. |

**Rough timeline**: A senior developer with an existing platform can reach minimum compliance (4 mandatory requirements) in 2–4 weeks. Service Orders add another 1–2 weeks. Full compliance with all optional features is a longer investment that depends on your existing architecture.

## How to get listed

Checklist:

- [ ] Services validate against [`schema/service.schema.json`](./schema/service.schema.json)
- [ ] Create a service and advance it through all 9 states — each transition records `from`, `to`, `at`, `by`
- [ ] Attempt an invalid transition (e.g. `requested → in_progress`) — it must fail
- [ ] Trigger at least 3 exception flows and verify the state machine handles them
- [ ] Connect the MCP server to your API and execute a discovery query (`services.list` or `scheduling.check_availability`)
- [ ] Evidence is recorded on service completion (`proof.evidence` array is populated)

When you pass these, open a PR adding your platform to the table below.

## Compatible implementations

| Platform | Vertical | Coverage | Status |
|----------|----------|----------|:------:|
| [**Coordinalo**](https://coordinalo.com) | Healthcare | 8/8 dimensions · 9/9 states · 6/6 exceptions | Production |

## What the second implementor gets

The protocol is pre-1.0. That means the second implementor is not just adopting a spec — they're shaping it.

- **Early positioning** — Listed on [servicialo.com](https://servicialo.com) and in this repo as a founding implementation.
- **Direct protocol input** — Design decisions are still being made. A second production implementation has real weight in those conversations.
- **Benchmark data** — As the network grows, implementations that contribute operational telemetry receive aggregate benchmarks segmented by vertical, region, and scale. Early nodes get this from day one.
- **MCP server compatibility** — Your platform becomes accessible to any AI agent that speaks MCP, without building your own agent integrations.

## Questions

Open an issue: [github.com/servicialo/mcp-server/issues](https://github.com/servicialo/mcp-server/issues)
