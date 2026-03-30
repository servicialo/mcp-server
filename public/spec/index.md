# Servicialo Protocol Specification

**Version 1.0.0 | March 2026**

Servicialo is an open protocol that makes human services discoverable, bookable, and verifiable by any software agent or human client. It is the destination layer for professional services, built on top of MCP and A2A.

## Quick Start

### For AI Agent Developers

```bash
npx -y @servicialo/mcp-server
```

9 public tools available immediately, no authentication required. Your agent can search organizations, list services, and check availability.

### For Platform Implementers

1. Model services using the [8 dimensions](./agent-card.md#service-dimensions)
2. Implement the [9 lifecycle states](./intents.md#lifecycle-states)
3. Expose a [/.well-known/agent.json](./agent-card.md) endpoint
4. Register in the [discovery hierarchy](./discovery.md)
5. Pass the [certification test suite](./certification.md)

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
| [Certification](./certification.md) | How to become a Servicialo-certified implementation |

## JSON Schemas

| Schema | Description |
|--------|-------------|
| [agent-card.json](./schemas/agent-card.json) | JSON Schema for agent cards |
| [org-card.json](./schemas/org-card.json) | JSON Schema for per-org cards |
| [registries.json](./schemas/registries.json) | JSON Schema for the meta-registry |

## Core Concepts

### The HTTP Analogy

HTTP made documents addressable. Servicialo makes services addressable. MCP and A2A are the transport. Servicialo is what they transport *to*.

### Protocol Stack

- **MCP** (Anthropic, Nov 2024) — how agents access tools and data
- **A2A** (Google, April 2025) — how agents talk to each other
- **Servicialo** — the domain protocol that gives agents a destination in the world of professional services

### Key Design Decisions

1. **9 lifecycle states** — the minimum viable set for complete service verification
2. **8 service dimensions** — the canonical fields any agent needs to coordinate a service
3. **3-level discovery** — hierarchical `/.well-known/` from meta-registry to org agent card
4. **Delegated agency** — every agent action requires an explicit human mandate
5. **Evidence by vertical** — proof of delivery varies by profession, not one-size-fits-all

## Links

- **Protocol website:** https://servicialo.com
- **Whitepaper:** https://servicialo.com/whitepaper
- **npm package:** [@servicialo/mcp-server](https://www.npmjs.com/package/@servicialo/mcp-server)
- **GitHub:** https://github.com/servicialo/mcp-server
- **Reference implementation:** https://coordinalo.com
- **Network explorer:** https://servicialo.com/network

## License

MIT — Use, implement, extend.
