# Conformance & Certification

**Version 0.10 (Draft)**

## Overview

This document defines the conformance levels for Servicialo implementations,
the verification process **as it works today**, and the automated
certification program **planned for the future**.

> **Honest status.** Verification is manual today: listing works by pull
> request and review by the Servicialo team (see
> [IMPLEMENTORS.md](https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTORS.md)).
> The automated certification suite described at the end of this document is
> a roadmap item — it does not exist yet, and no weekly re-testing runs today.

> **Binding-neutral.** Core conformance (Level 1) requires at least one
> machine-readable binding implementing the required profiles — HTTP, MCP,
> A2A, or an equivalent. A purely HTTP implementation is conformant without
> MCP; exposing an MCP server is part of Level 3 (network participation) and
> the RECOMMENDED path for agentic integrations.

## Conformance Levels

Levels are named **CORE**, **FULL** and **NETWORK**. `CONFORMANT` is
reserved for an implementation whose normative requirements have been
verified — at minimum every CORE requirement. The HTTP compatibility suite
that ships with the reference MCP server (`npm run test:http-compat`) does
**not** grant conformance by itself: it verifies the HTTP binding surface
only. See the [requirement → verification matrix](#requirement--verification-matrix)
for what each check covers today.

### CORE (Level 1)

Minimum viable Servicialo implementation. Required for listing in the
meta-registry. An implementation that satisfies all five CORE requirements
is CONFORMANT at level CORE.

**What CORE guarantees a consumer.** One sentence scopes the level:

> A consumer MUST be able to discover an offer, know its availability before
> committing it, create the commitment, manage that commitment's lifecycle,
> and record evidence of delivery.

Each clause is satisfied by exactly one required operation. The canonical,
machine-readable list lives in
[`protocol/manifest.yaml`](https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml)
under `conformance.core.required_operations` — this document says *which
capabilities* CORE requires and why; the manifest says *which operations*
express them. `scripts/verify-conformance-parity.mjs` fails CI if the two, or
any document derived from them, disagree.

| Clause of the sentence | Required operation |
|---|---|
| (the node declares itself) | `registry.manifest` |
| discover an offer | `services.list` |
| know availability before committing it | `scheduling.check_availability` |
| create the commitment | `scheduling.book` |
| manage the lifecycle | `lifecycle.transition` |
| record evidence of delivery | `delivery.record_evidence` |

Two notes on what is deliberately *not* in that list:

- **`registry.search` is not a node requirement.** Discovery across nodes is
  the resolver's job; a node is discoverable because it is registered, not
  because it implements search.
- **`scheduling.confirm`, `delivery.checkin` and `delivery.checkout` are
  OPTIONAL conveniences.** Their effects are expressible through the required
  operations — `confirmed`, `in_progress` and `delivered` are all valid
  `lifecycle.transition` targets, and GPS and duration are
  `delivery.record_evidence` types. Requiring them would inflate CORE without
  adding a capability. (One convenience is not reproducible that way: the
  reference implementation computes real duration automatically on checkout.
  That is reference behaviour, not a protocol requirement.)

**Requirements:**

1. **8 Dimensions** — Model services using all 8 canonical dimensions
   (identity, provider, client, schedule, location, lifecycle, evidence,
   billing)

2. **Core Lifecycle (6 states)** — Implement the 6 core lifecycle states with
   valid transitions:
   ```
   requested → scheduled → confirmed → in_progress → completed → documented
   ```
   The 3 close-out states (`invoiced → collected → verified`) are OPTIONAL
   extensions — implementations MAY bundle them into the session lifecycle or
   manage them independently (PROTOCOL.md §6). No total order is imposed
   across delivery, evidence, acceptance, and settlement (§6.0).

3. **3+ Exception Flows** — Handle at least 3 of the 6 standard exception
   flows:
   - Client no-show
   - Cancellation
   - Rescheduling
   - Provider no-show
   - Quality dispute
   - Partial delivery

4. **JSON Schema Conformance** — API responses conform to the protocol's
   JSON Schema for services, transitions, and evidence

5. **Discovery Endpoint** — Expose a Level 2 agent card at
   `/.well-known/agent.json`

### FULL (Level 2)

Complete Servicialo implementation including advanced features. An
implementation that satisfies requirements 1–10 is CONFORMANT at level FULL.

**Additional requirements beyond CORE:**

6. **All 6 Exception Flows** — Handle all standard exception flows
7. **Service Orders** — Support bilateral agreements with computed ledger
8. **Physical Resources** — Model resources as first-class entities with
   tripartite scheduling
9. **Evidence by Vertical** — Support configurable evidence types per
   vertical
10. **Pre-Agreed Contracts** — Expose service contracts via `contract.get`

### NETWORK (Level 3)

Full protocol plus network participation (entirely OPTIONAL — an
implementation is conformant without it).

**Additional requirements beyond FULL:**

11. **MCP Server** — Expose tools via MCP with both discovery and
    authenticated modes
12. **Resolver Registration** — Register in the global resolver with
    heartbeat
13. **Network Telemetry** — Contribute anonymous, aggregate operational data
14. **A2A Support** — Expose A2A Agent Card and task router

## Requirement → verification matrix

What actually verifies each normative requirement **today**. "Automated"
means the HTTP compatibility suite (`test:http-compat`) exercises it;
"manual review" means the Servicialo team checks it during the listing PR.
Anything not covered by either column is currently taken on the
implementer's word — listed here so nobody mistakes a green suite run for
certified conformance.

| # | Requirement | `test:http-compat` (automated) | Manual review |
|:-:|-------------|--------------------------------|---------------|
| 1 | 8 dimensions modeled | Partial — checks `id`, `name`, `duration_minutes` on one service read | Yes — service payloads validated against `schema/service.schema.json` |
| 2 | 6 core lifecycle states, strictly ordered | Partial — exercises book → confirm → transition through the real tool handlers, in canonical vocabulary; does **not** attempt invalid transitions | Yes — reviewer requests an invalid-transition rejection (e.g. `requested → in_progress`) |
| 3 | 3+ exception flows | Partial — cancellation only | Yes — remaining flows demonstrated with request/response evidence |
| 4 | JSON Schema conformance | No | Yes — `ajv` validation of submitted payloads |
| 5 | Discovery endpoint (agent card) | No — the suite checks `/v1/manifest`, not `/.well-known/agent.json` | Yes — card fetched and inspected |
| 6–10 | FULL requirements (all exception flows, Service Orders, resources, evidence by vertical, contracts) | No | Yes — when FULL is claimed |
| 11–14 | NETWORK requirements (MCP server, resolver registration, telemetry, A2A) | No | Yes — when NETWORK is claimed |

The suite's value is real but narrow: it proves the required CORE operations
answer on the paths the reference tools actually call. Because it drives the
tool handlers rather than a parallel set of requests, "the suite passes" and
"an agent can talk to this node" are the same statement — but neither is
conformance. The normative substance is verified by review until the automated
certification suite ships.

`scripts/verify-conformance-parity.mjs` keeps this document, the manifest, the
HTTP Profile, `openapi.yaml`, the implementer guides and the suite from
disagreeing about which operations are required.

## Verification Process (today)

1. **Self-test:** Run the HTTP compatibility suite that ships with the
   reference MCP server against your backend:
   ```bash
   cd packages/mcp-server
   SERVICIALO_BASE_URL=https://your-platform.com \
   SERVICIALO_API_KEY=your-test-key \
   SERVICIALO_ORG_ID=your-test-org \
   npm run test:http-compat
   ```
   The suite invokes the **reference tool handlers** through the HTTP
   adapter, so it exercises the same codepath an agent uses. It reports two
   levels separately:

   - **(a) Binding** — `CORE required operations: n/n` and `optional: m/k`.
     The verdict `HTTP-COMPATIBLE` is defined as exactly this: **the required
     CORE operations respond**. It is a prerequisite for listing, not a
     conformance verdict.
   - **(b) Certification** — *not evaluated by this suite.* Every run prints
     the CORE requirements that still need additional or manual verification
     (rows 1–5 of the matrix above: invalid-transition rejection, the
     remaining exception flows, schema conformance, the agent card).
2. **Submit:** Open a pull request to the
   [repository](https://github.com/servicialo/mcp-server) with your suite
   output and implementation details, following
   [IMPLEMENTORS.md](https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTORS.md).
3. **Manual review:** The Servicialo team reviews the submission against the
   requirement matrix above and assigns a conformance level (CORE or FULL).
   Listed implementations are verified — self-declared claims without
   evidence are not accepted.
4. **Listing:** Accepted implementations are added to
   `servicialo.com/.well-known/registries.json` and shown at
   [servicialo.com/implementors](https://servicialo.com/implementors).

## Planned Automation (roadmap)

The goal is for certification to become objective and automated — pass the
suite, get certified, with no discretionary approval. The planned design:

- A standalone `@servicialo/certification-suite` package runnable against any
  implementation (`--level core|full|network`), covering: schema validation,
  lifecycle transitions, exception flows, discovery, Service Orders, resource
  scheduling, evidence, all 40 MCP tools, resolver, and A2A. When it ships,
  `CONFORMANT` becomes an automated verdict; until then it is a manual one.
- CI re-runs the suite against listed public endpoints on a schedule;
  sustained failure degrades and eventually delists an implementation.
- Revocation only by automated test failure — no manual gatekeeping.

None of the above is operative today. Until it ships, the manual process in
the previous section is the only verification path, and any "certified" badge
refers to that manual review.
