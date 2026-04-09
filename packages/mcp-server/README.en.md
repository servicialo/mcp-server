# @servicialo/mcp-server

> **Canonical MCP Registry entry:** `com.servicialo/mcp-server`
> The entry `io.github.danioni/servicialo` has been deprecated since March 2026.

> **[Versión en español](./README.md)**

**The missing protocol layer for AI agents that coordinate professional services.**

[![Live network](https://img.shields.io/badge/live_network-9_nodes_across_4_countries-brightgreen)](https://servicialo.com/network)

There is no standard way for an AI agent to book, verify, and settle a professional service. Servicialo is an open protocol that fixes this — and this MCP server is its reference implementation. Think HTTP for service coordination: any agent, any platform, one protocol.

---

**Running a service business?**
You need a Servicialo-compatible platform, not this package directly. [Coordinalo](https://coordinalo.com) is the reference implementation — it implements this protocol so your services become discoverable and bookable by AI agents. As the protocol matures, we expect many more compatible platforms to emerge.

**Building a platform for service businesses?**
This is for you. Implement the protocol and any Servicialo-compatible agent connects to your backend automatically. See [Connecting to a custom implementation](#connecting-to-a-custom-implementation) and [`HTTP_PROFILE.md`](../../HTTP_PROFILE.md).

---

## The Problem

AI agents can browse the web, write code, and hold conversations. But ask one to book a physiotherapy session, verify it happened, and process the payment — and it falls apart.

Today, every platform is a silo. There's no standard for:

- **Discovery** — which provider, in which organization, offers what I need?
- **Identity** — who is this agent acting for, and what is it authorized to do?
- **Lifecycle** — what state is this service in? Who confirmed? Who showed up?
- **Proof of delivery** — did the session actually happen? For how long? Where?
- **Settlement** — how much, to whom, under what contract terms?

Without a shared protocol, every integration is bespoke. Every agent-to-platform connection is a custom API. This doesn't scale.

## What is Servicialo

Servicialo is an **open protocol**, not a platform. It defines how professional services move through their lifecycle — from discovery to payment — in a way any AI agent or platform can implement.

The relationship is like HTTP to Apache, or SMTP to Gmail: Servicialo defines the rules, implementations bring them to life.

The protocol models every service across **8 dimensions**, **9 lifecycle states**, **6 exception flows**, and **7 core principles** that are universal across verticals — healthcare, legal, education, home services:

```
Requested → Scheduled → Confirmed → In Progress → Completed → Documented → Invoiced → Collected → Verified
```

Any service, in any vertical, follows this sequence. Vertical-specific logic lives *within* each state, but the state machine is invariant.

## What This MCP Server Does

This package exposes the Servicialo protocol as 34 MCP tools organized by the **7 lifecycle phases** (0–6, including DNS resolution), plus resource management and resolver administration tools. An agent doesn't call endpoints by database entity — it follows the natural flow of coordinating a service.

### Phase 0 — DNS Resolution (3 public tools, no auth required)

| Tool | Description |
|---|---|
| `resolve.lookup` | Resolve an orgSlug to its MCP/REST endpoint and trust level (equivalent to DNS lookup) |
| `resolve.search` | Search organizations registered in the global resolver by country and vertical |
| `trust.get_score` | Get trust score for an organization (score 0-100, level, last activity) |

### Phase 1 — Discovery (6 public tools, no auth required)

| Tool | Description |
|---|---|
| `registry.search` | Search organizations by vertical, location, country |
| `registry.get_organization` | Get public details: services, providers, booking config |
| `registry.manifest` | Get server manifest: capabilities, protocol version, organization metadata |
| `scheduling.check_availability` | Check available slots (3-variable: provider ∧ client ∧ resource) |
| `services.list` | List the public service catalog of an organization |
| `a2a.get_agent_card` | Get an organization's A2A Agent Card for inter-agent discovery |

### Phase 2 — Understand (2 tools)

| Tool | Description | Scopes |
|---|---|---|
| `service.get` | Get the 8 dimensions of a service | `service:read` |
| `contract.get` | Get contract terms: required evidence, cancellation policy, dispute window | `service:read` `order:read` |

### Phase 3 — Commit (3 tools)

| Tool | Description | Scopes |
|---|---|---|
| `clients.get_or_create` | Resolve client identity by email/phone — find or create in one call | `patient:write` |
| `scheduling.book` | Book a session → state `requested`. Optional `resource_id` for physical resources | `schedule:write` |
| `scheduling.confirm` | Confirm a booked session → state `confirmed` | `schedule:write` |

### Phase 4 — Lifecycle (4 tools)

| Tool | Description | Scopes |
|---|---|---|
| `lifecycle.get_state` | Get current state, available transitions, and history | `service:read` |
| `lifecycle.transition` | Execute a state transition with evidence | `service:write` |
| `scheduling.reschedule` | Reschedule to new datetime (contract policy may apply) | `schedule:write` |
| `scheduling.cancel` | Cancel session (contract cancellation policy applied) | `schedule:write` |

### Phase 5 — Verify Delivery (3 tools)

| Tool | Description | Scopes |
|---|---|---|
| `delivery.checkin` | Check-in with GPS + timestamp → state `in_progress` | `evidence:write` |
| `delivery.checkout` | Check-out with GPS + timestamp → state `delivered` (duration auto-calculated) | `evidence:write` |
| `delivery.record_evidence` | Record evidence: `gps`, `signature`, `photo`, `document`, `duration`, `notes` | `evidence:write` |

### Phase 6 — Close (4 tools)

| Tool | Description | Scopes |
|---|---|---|
| `documentation.create` | Generate service record (clinical note, inspection report, etc.) → state `documented` | `document:write` |
| `payments.create_sale` | Create charge for documented service → state `charged` | `payment:write` |
| `payments.record_payment` | Record payment received against a sale | `payment:write` |
| `payments.get_status` | Get payment status for a sale or client account balance | `payment:read` |

### Resource Management (6 tools)

| Tool | Description | Scopes |
|---|---|---|
| `resource.list` | List physical resources by organization | `resource:read` |
| `resource.get` | Get resource details with availability slots | `resource:read` |
| `resource.create` | Create a physical resource (room, box, equipment) | `resource:write` |
| `resource.update` | Update resource (patch semantics) | `resource:write` |
| `resource.delete` | Deactivate resource (soft delete: `is_active = false`) | `resource:write` |
| `resource.get_availability` | Check resource availability by date range | `resource:read` |

### Resolver Administration (3 tools)

| Tool | Description | Scopes |
|---|---|---|
| `resolve.register` | Register organization in the global resolver with MCP/REST endpoints | `resolve:write` |
| `resolve.update_endpoint` | Update registered endpoints (portability between backends) | `resolve:write` |
| `telemetry.heartbeat` | Send heartbeat to the resolver indicating the node is active | `telemetry:write` |

## Installation & Quickstart

### Option 1: Discovery mode (zero config)

```bash
npx -y @servicialo/mcp-server
```

No API key. No org ID. 9 public tools available immediately (resolver + discovery). Try it:

```json
{
  "tool": "registry.search",
  "arguments": {
    "vertical": "kinesiologia",
    "location": "santiago"
  }
}
```

### Option 2: Full mode (authenticated)

```bash
SERVICIALO_API_KEY=your_key SERVICIALO_ORG_ID=your_org npx -y @servicialo/mcp-server
```

All 34 tools unlocked.

### Claude Desktop / Cursor / any MCP client

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "servicialo": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_API_KEY": "your_api_key",
        "SERVICIALO_ORG_ID": "your_org_id"
      }
    }
  }
}
```

Omit the `env` block for discovery-only mode.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SERVICIALO_API_KEY` | No | — | Bearer token. Enables authenticated mode |
| `SERVICIALO_ORG_ID` | No | — | Organization slug. Enables authenticated mode |
| `SERVICIALO_BASE_URL` | No | `http://localhost:3000` | API endpoint of the Servicialo-compatible platform |
| `SERVICIALO_ADAPTER` | No | `coordinalo` | Backend adapter: `coordinalo` or `http` |
| `SERVICIALO_TELEMETRY` | No | `true` | Set to `false` to disable anonymous telemetry |

Both `SERVICIALO_API_KEY` and `SERVICIALO_ORG_ID` must be set together. If only one is present, the server falls back to discovery mode with a warning.

## Connecting to a custom implementation

This MCP server supports any Servicialo-compatible backend through its pluggable adapter layer. Two adapters are included:

- **`coordinalo`** (default) — connects to a Coordinalo/Digitalo backend with org-scoped routes under `/api/organizations/{orgId}`.
- **`http`** — connects to any implementation that exposes the canonical `HTTP_PROFILE.md` endpoints under `/v1/*`.

### 3 steps to connect your implementation

**Step 1.** Implement the REST endpoints defined in [`HTTP_PROFILE.md`](../../HTTP_PROFILE.md) in your platform.

**Step 2.** Configure the MCP server to use the HTTP adapter:

```bash
SERVICIALO_ADAPTER=http \
SERVICIALO_BASE_URL=https://your-platform.com \
SERVICIALO_API_KEY=your_key \
npx -y @servicialo/mcp-server
```

**Step 3.** Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "servicialo": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_ADAPTER": "http",
        "SERVICIALO_BASE_URL": "https://your-platform.com",
        "SERVICIALO_API_KEY": "your_api_key",
        "SERVICIALO_ORG_ID": "your_org_id"
      }
    }
  }
}
```

The HTTP adapter translates internal paths to canonical `/v1/*` endpoints and sends the organization context via the `X-Servicialo-Org` header. See `HTTP_PROFILE.md` for the full REST contract.

## Delegated Agency Model

The protocol treats AI agents as first-class actors — but never trusts them implicitly. Every agent action requires a **ServiceMandate**: an explicit delegation of capability from a human principal to an agent.

### How it works

1. A human (professional, patient, or organization) issues a mandate to an agent
2. The mandate specifies **who** the agent acts for, **what** it can do (scopes), and **for how long**
3. On every tool call, the MCP server validates the mandate against 8 checks before executing
4. Every action produces an audit entry — success or failure

### Mandate example

```json
{
  "mandate_id": "550e8400-e29b-41d4-a716-446655440000",
  "principal_id": "dr_barbara",
  "principal_type": "professional",
  "agent_id": "agent_scheduling_bot",
  "agent_name": "Booking Assistant",
  "acting_for": "professional",
  "context": "org:clinica-kinesia",
  "scopes": ["schedule:read", "schedule:write", "patient:write"],
  "constraints": {
    "max_actions_per_day": 50,
    "allowed_hours": {
      "start": "08:00",
      "end": "20:00",
      "timezone": "America/Santiago"
    },
    "require_confirmation_above": {
      "amount": 100000,
      "currency": "CLP"
    }
  },
  "issued_at": "2026-03-01T00:00:00Z",
  "expires_at": "2026-06-01T00:00:00Z",
  "status": "active"
}
```

### Using mandates in tool calls

When `actor.type` is `"agent"`, include the `mandate_id`:

```json
{
  "tool": "scheduling.book",
  "arguments": {
    "service_id": "srv_123",
    "provider_id": "prov_111",
    "client_id": "cli_789",
    "starts_at": "2026-03-03T10:00:00",
    "actor": {
      "type": "agent",
      "id": "agent_scheduling_bot",
      "mandate_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### The 8 validation checks

Every agent tool call is validated against:

| # | Check | What it prevents |
|---|---|---|
| 1 | **Status** — mandate must be `active` | Using revoked or expired mandates |
| 2 | **Temporal validity** — `issued_at ≤ now < expires_at` | Time-based attacks |
| 3 | **Agent identity** — `mandate.agent_id === requesting agent` | Agent impersonation |
| 4 | **Scope coverage** — mandate scopes cover the tool's requirements | Privilege escalation |
| 5 | **Context match** — mandate context matches the request | Cross-org data access |
| 6 | **Conflict of interest** — agent can't act for both sides | Dual-agency violations |
| 7 | **Constraints** — allowed hours, daily limits, financial thresholds | Over-autonomous agents |
| 8 | **Audit** — every action logged with sanitized inputs | Non-repudiation |

Non-agent actors (`client`, `provider`, `organization`) bypass mandate validation entirely.

## Provider Discovery

Agents can search the registry and match providers to a patient's needs using structured queries.

### Search the registry

```json
{
  "tool": "registry.search",
  "arguments": {
    "vertical": "kinesiologia",
    "location": "santiago",
    "country": "cl"
  }
}
```

Returns matching organizations with their services and providers.

### Check availability

```json
{
  "tool": "scheduling.check_availability",
  "arguments": {
    "org_slug": "clinica-kinesia",
    "service_id": "srv_pelvic_rehab",
    "provider_id": "prov_111",
    "date_from": "2026-03-10",
    "date_to": "2026-03-14"
  }
}
```

The 3-variable scheduler checks availability across provider, client, and physical resource simultaneously.

### End-to-end example

```
1. registry.search({ vertical: "kinesiologia", location: "santiago" })
   → finds org "clinica-kinesia"

2. services.list({ org_slug: "clinica-kinesia" })
   → lists available services

3. scheduling.check_availability({ org_slug: "clinica-kinesia", date_from: "2026-03-10", date_to: "2026-03-14" })
   → returns available slots

4. contract.get({ service_id: "srv_123", org_id: "org_456" })
   → cancellation: 0% if >24h, 50% if 2-24h, 100% if <2h
   → required evidence: check_in + check_out + clinical_record

5. clients.get_or_create({ email: "maria@mail.com", name: "Maria", last_name: "Lopez" })
   → client_id: "cli_789"

6. scheduling.book({ service_id: "srv_123", provider_id: "prov_111", client_id: "cli_789", starts_at: "2026-03-12T10:00:00" })
   → session_id: "ses_001", state: "requested"

7. scheduling.confirm({ session_id: "ses_001" })
   → state: "confirmed"

8. delivery.checkin({ session_id: "ses_001", location: { lat: -33.45, lng: -70.66 } })
   → state: "in_progress"

9. delivery.checkout({ session_id: "ses_001", location: { lat: -33.45, lng: -70.66 } })
   → state: "delivered", duration: 42min

10. documentation.create({ session_id: "ses_001", content: "Pelvic floor rehabilitation session..." })
    → state: "documented"

11. payments.create_sale({ client_id: "cli_789", service_id: "srv_123", unit_price: 35000 })
    → sale_id: "sale_001", state: "charged"

12. lifecycle.transition({ session_id: "ses_001", to_state: "verified" })
    → state: "verified" ✓
```

## Protocol Specification

The full Servicialo protocol specification is available at:

- **Repository:** [github.com/servicialo/protocol](https://github.com/servicialo/protocol)
- **Website:** [servicialo.com](https://servicialo.com)
- **Current stable version:** 0.9
- **JSON Schemas:** [`service.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/service.schema.json), [`service-order.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/service-order.schema.json), [`service-mandate.schema.json`](https://github.com/servicialo/protocol/blob/main/schema/service-mandate.schema.json)

The spec covers the 8 dimensions, 9 lifecycle states, 6 exception flows (no-show, cancellation, dispute, reschedule, partial delivery), 7 core principles, the two-entity architecture (atomic Service + Service Order), the Delegated Agency Model, DNS resolution, and A2A interoperability.

## Reference Implementation

**Digitalo** is the first production implementation of the Servicialo protocol, operating in healthcare in Chile. It implements the full lifecycle — from provider discovery through payment settlement — and serves as the validation ground for protocol evolution.

This MCP server connects to any Servicialo-compatible backend via `SERVICIALO_BASE_URL`. Digitalo is one such backend. The protocol is designed so that any CRM, EHR, or platform can implement it as a sovereign node.

## Contributing to the Protocol

Servicialo follows semantic versioning for the protocol specification:

- **Patch** (0.7.x) — clarifications, typo fixes, non-breaking additions
- **Minor** (0.x.0) — new optional fields, new tool definitions, new exception flows
- **Major** (x.0.0) — breaking changes to schemas, state machine, or core semantics

### How to propose changes

1. Open an issue describing the problem and your proposed solution
2. For significant changes, write an RFC in `spec/` with the section number it affects
3. Protocol changes require at least one reference implementation before merging
4. Schema changes must include updated JSON Schema files and Zod types in the MCP server

### Areas actively seeking input

- Vertical-specific evidence requirements (beyond healthcare)
- Multi-language support for lifecycle state names
- Inter-node federation (how two Servicialo implementations interoperate)
- Agent SDK patterns for Python and TypeScript

## Telemetry

On startup, the MCP server sends a single anonymous POST to `https://servicialo.com/api/telemetry/instance` with:

```json
{
  "event": "node_initialized",
  "version": "0.9.8",
  "node_id": "a1b2c3d4-...",
  "ts": 1711300000000
}
```

| Field | Description |
|---|---|
| `event` | Always `"node_initialized"` |
| `version` | Package version |
| `node_id` | Persistent UUID stored at `~/.servicialo/node_id` |
| `ts` | Timestamp in milliseconds |

**That is everything that gets sent.** No organization info, API keys, patient data, or personal identifiers are transmitted. The IP is hashed (SHA-256) server-side before storage. The ping is fire-and-forget: if it fails, the error is silently discarded and never blocks server operation.

On first run with telemetry enabled, the server prints a notice to stderr explaining what is sent and how to opt out.

### Disable telemetry

```bash
SERVICIALO_TELEMETRY=false npx -y @servicialo/mcp-server
```

Or in MCP configuration:

```json
{
  "env": {
    "SERVICIALO_TELEMETRY": "false"
  }
}
```

More details: [servicialo.com/docs/telemetry](https://servicialo.com/docs/telemetry)

## Join the network

When you install `@servicialo/mcp-server`, your node automatically registers with the [network telemetry](https://servicialo.com/network). This helps the ecosystem measure real protocol adoption — without collecting personal or client data.

Telemetry reports only: package version, a persistent node UUID, and an IP hash (for approximate geolocation — IPs are not stored). You can disable it at any time with `SERVICIALO_TELEMETRY=false`.

## Verified implementor

If you operate your own implementation of the protocol, you can identify your node and apply for **verified implementor** status. Set these optional environment variables:

```bash
SERVICIALO_IMPL_NAME="My Platform"         # Name of your implementation
SERVICIALO_IMPL_URL="https://example.com"  # Your website or repository
SERVICIALO_IMPL_CONTACT="admin@example.com" # Contact email (hashed, never displayed)
```

When a new `IMPL_NAME` appears for the first time, the Servicialo team is notified and reviews manually. Once verified, your implementation appears at [servicialo.com/implementors](https://servicialo.com/implementors) with a verified badge.

If you don't set these variables, your node remains fully anonymous — no change in behavior.

## License

Apache-2.0 — any implementation, commercial or otherwise, is welcome. See [LICENSE](./LICENSE).
