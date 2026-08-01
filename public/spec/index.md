# Servicialo Protocol Specification

**Version 0.10 (Draft) | August 2026**

Servicialo is the open domain protocol for coordinating services. It defines machine-readable objects and events so platforms, people, and agents can publish an offer, establish a Service Order, coordinate a delivery, record evidence of what happened, and connect that delivery to its invoicing and settlement. The protocol is transport-independent: MCP, HTTP, and A2A are bindings.

> The normative specification is [`PROTOCOL.md`](https://github.com/servicialo/mcp-server/blob/main/PROTOCOL.md) (v0.10). The machine-readable surface (version, tools, state machines, extensions) is [`protocol/manifest.yaml`](https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml).

## Quick Start

### For AI Agent Developers

```bash
npx -y @servicialo/mcp-server
```

15 public tools available immediately, no authentication required. Your agent can search organizations, list services, check availability, and read aggregate benchmarks.

### For Platform Implementers

1. Model services using the [8 dimensions](./agent-card.md#service-dimensions)
2. Implement the [6 core lifecycle states](./intents.md#lifecycle-states) (the 3 financial states are optional extensions)
3. Expose a [/.well-known/agent.json](./agent-card.md) endpoint
4. Register in the [discovery hierarchy](./discovery.md)
5. Complete the [conformance checklist](./certification.md) (manual review today; an automated suite is on the roadmap)

### For Service Providers

Adopt the protocol through any [Servicialo-compliant implementation](https://servicialo.com/.well-known/registries.json). The reference implementation is [Coordinalo](https://coordinalo.com).

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ AI Agent (Claude, GPT, custom)                  │
└────────────┬───────────────────┬────────────────┘
             │ MCP               │ A2A
             ▼                   ▼
┌────────────────────┐  ┌────────────────────┐
│ @servicialo/       │  │ A2A Task Router    │
│ mcp-server         │  │ (agent-to-agent)   │
└────────┬───────────┘  └────────┬───────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────┐
│ Servicialo Protocol Layer                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │Discovery│ │Lifecycle│ │Evidence │ ...        │
│ └─────────┘ └─────────┘ └─────────┘           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Implementation Backend                          │
│ (Coordinalo, your platform, any compliant impl) │
└─────────────────────────────────────────────────┘
```

## Specification Documents

| Document | Description |
|----------|-------------|
| [Discovery](./discovery.md) | The `/.well-known/` hierarchy specification — how agents navigate from zero context to a specific provider |
| [Agent Card](./agent-card.md) | JSON schema and fields for organization agent cards |
| [Intents](./intents.md) | Standard intent catalog — `check_availability`, `book_session`, lifecycle transitions, etc. |
| [Task Router](./task-router.md) | A2A task router specification for inter-agent coordination |
| [Certification](./certification.md) | Conformance checklist and the (roadmap) certification program |
| [State Dimensions](./extensions/state-dimensions.md) | **Draft extension** — orthogonal fulfillment / evidence / acceptance / financial state machines |
| [Proof of Service](./extensions/proof-of-service.md) | **Draft extension** — the verifiable dossier linking agreement, delivery, evidence and settlement |

## JSON Schemas

| Schema | Description |
|--------|-------------|
| [agent-card.json](./schemas/agent-card.json) | JSON Schema for agent cards |
| [org-card.json](./schemas/org-card.json) | JSON Schema for per-org cards |
| [registries.json](./schemas/registries.json) | JSON Schema for the meta-registry |

## Core Concepts

### Position in the Stack

- **MCP** (Anthropic, Nov 2024) — how agents access tools and data
- **A2A** (Google, April 2025) — how agents talk to each other
- **Servicialo** — the domain protocol that defines *what it means to coordinate a service*. MCP and A2A define how agents connect; Servicialo defines the shared semantics they exchange.

### Key Design Decisions

1. **Separated concerns** — the protocol explicitly separates what was agreed, what was delivered, the available evidence, and the financial movements. Each retains its own lifecycle; no total order is imposed across them.
2. **6 + 3 lifecycle milestones** — 6 core states are required; 3 financial states are optional extensions. The 9-milestone sequence is the happy-path view, not a universal mandatory machine.
3. **8 service dimensions** — the canonical fields any agent needs to coordinate a service
4. **3-level discovery** — hierarchical `/.well-known/` from meta-registry to org agent card
5. **Delegated agency** — explicit mandates for agent actions (advisory in the reference implementation today; boundary enforcement is on the roadmap)
6. **Evidence by vertical** — proof of delivery varies by profession, not one-size-fits-all

## Links

- **Protocol website:** https://servicialo.com
- **Whitepaper:** https://servicialo.com/whitepaper
- **npm package:** [@servicialo/mcp-server](https://www.npmjs.com/package/@servicialo/mcp-server)
- **GitHub:** https://github.com/servicialo/mcp-server
- **Reference implementation:** https://coordinalo.com
- **Network telemetry (MCP-server installations, optional):** https://servicialo.com/network

## License

Apache License 2.0 — Use, implement, extend.
