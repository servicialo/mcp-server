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

### Level 1 — Core

Minimum viable Servicialo implementation. Required for listing in the
meta-registry.

**Requirements:**

1. **8 Dimensions** — Model services using all 8 canonical dimensions
   (identity, provider, client, schedule, location, lifecycle, evidence,
   billing)

2. **Core Lifecycle (6 states)** — Implement the 6 core lifecycle states with
   valid transitions:
   ```
   requested → scheduled → confirmed → in_progress → completed → documented
   ```
   The 3 financial states (`invoiced → collected → verified`) are OPTIONAL
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

### Level 2 — Full Protocol

Complete Servicialo implementation including advanced features.

**Additional requirements beyond Level 1:**

6. **All 6 Exception Flows** — Handle all standard exception flows
7. **Service Orders** — Support bilateral agreements with computed ledger
8. **Physical Resources** — Model resources as first-class entities with
   tripartite scheduling
9. **Evidence by Vertical** — Support configurable evidence types per
   vertical
10. **Pre-Agreed Contracts** — Expose service contracts via `contract.get`

### Level 3 — Network Participant

Full protocol plus network participation (entirely OPTIONAL — an
implementation is conformant without it).

**Additional requirements beyond Level 2:**

11. **MCP Server** — Expose tools via MCP with both discovery and
    authenticated modes
12. **Resolver Registration** — Register in the global resolver with
    heartbeat
13. **Network Telemetry** — Contribute anonymous, aggregate operational data
14. **A2A Support** — Expose A2A Agent Card and task router

## Verification Process (today)

1. **Self-test:** Run the portable conformance tests that ship with the
   reference MCP server against your backend:
   ```bash
   cd packages/mcp-server
   SERVICIALO_BASE_URL=https://your-platform.com \
   SERVICIALO_API_KEY=your-test-key \
   SERVICIALO_ORG_ID=your-test-org \
   npm run test:conformance
   ```
2. **Submit:** Open a pull request to the
   [repository](https://github.com/servicialo/mcp-server) with your test
   output and implementation details, following
   [IMPLEMENTORS.md](https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTORS.md).
3. **Manual review:** The Servicialo team reviews the submission against the
   conformance checklist. Listed implementations are verified — self-declared
   claims without conformance evidence are not accepted.
4. **Listing:** Accepted implementations are added to
   `servicialo.com/.well-known/registries.json` and shown at
   [servicialo.com/implementors](https://servicialo.com/implementors).

## Planned Automation (roadmap)

The goal is for certification to become objective and automated — pass the
suite, get certified, with no discretionary approval. The planned design:

- A standalone `@servicialo/certification-suite` package runnable against any
  implementation (`--level 1|2|3`), covering: schema validation, lifecycle
  transitions, exception flows, discovery, Service Orders, resource
  scheduling, evidence, all 40 MCP tools, resolver, and A2A.
- CI re-runs the suite against listed public endpoints on a schedule;
  sustained failure degrades and eventually delists an implementation.
- Revocation only by automated test failure — no manual gatekeeping.

None of the above is operative today. Until it ships, the manual process in
the previous section is the only verification path, and any "certified" badge
refers to that manual review.
