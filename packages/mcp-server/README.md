# @servicialo/mcp-server

MCP server for the [Servicialo](https://servicialo.com) protocol. Connects AI agents to professional services via any Servicialo-compatible platform.

**Protocol version:** 0.6 · **Package version:** 0.6.0

> **Status:** Early-stage protocol with a live reference implementation in healthcare (Chile). The protocol spec is stable. The MCP server implements discovery + scheduling + basic lifecycle. Advanced tools (delivery evidence, payments, documentation) are specified but not yet fully wired to backend endpoints. We're onboarding pilot implementations — [get in touch](https://servicialo.com) if you're building for professional services.

20 tools organized by the 6 lifecycle phases of a service — not by database table.

## Two Modes of Operation

### Discovery Mode (no configuration)

```bash
npx -y @servicialo/mcp-server
```

No credentials needed. 4 public tools for discovering organizations, services, and availability.

### Authenticated Mode

```bash
SERVICIALO_API_KEY=your_key SERVICIALO_ORG_ID=your_org npx -y @servicialo/mcp-server
```

Requires `SERVICIALO_API_KEY` and `SERVICIALO_ORG_ID`. Enables all 20 tools across the full service lifecycle.

### Claude Desktop Configuration

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

Omit the `env` block entirely for discovery-only mode.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SERVICIALO_API_KEY` | No | Bearer token — enables authenticated mode |
| `SERVICIALO_ORG_ID` | No | Organization slug — enables authenticated mode |
| `SERVICIALO_BASE_URL` | No | API base URL of the Servicialo-compatible platform |

## Agent Flow (6 Lifecycle Phases)

```
1. DESCUBRIR    → registry.*, check_availability, services.list
2. ENTENDER     → service.get, contract.get
3. COMPROMETER  → clients.get_or_create, scheduling.book, scheduling.confirm
4. GESTIONAR    → lifecycle.get_state, lifecycle.transition, reschedule, cancel
5. VERIFICAR    → delivery.checkin, delivery.checkout, delivery.record_evidence
6. CERRAR       → documentation.create, payments.create_sale, record_payment, get_status
```

A well-designed agent follows this order. Each phase has its tools. The standard guarantees any agent can complete the full cycle with any compatible implementation.

## Phase 1 — Descubrimiento (4 public tools)

| Tool | Description |
|---|---|
| `registry.search` | Search organizations by vertical and location |
| `registry.get_organization` | Get public details of an organization |
| `scheduling.check_availability` | Check available slots without authentication. If the service has `resource_id` in its location, also verifies physical resource availability (3-variable scheduler: provider ∧ client ∧ resource) |
| `services.list` | List the public service catalog |

## Phase 2 — Entender (2 tools)

| Tool | Description |
|---|---|
| `service.get` | Get the 8 dimensions of a service: what, who delivers, who receives (with separate payer), when, where, lifecycle, evidence, billing |
| `contract.get` | Get the pre-agreed service contract: required evidence, cancellation policy, no-show policy, dispute terms |

## Phase 3 — Comprometer (3 tools)

| Tool | Description |
|---|---|
| `clients.get_or_create` | Find a client by email/phone or create if new. Single call to resolve client identity before booking |
| `scheduling.book` | Book a new session → state "Solicitado". Accepts optional `resource_id` to reserve a physical resource (3-variable scheduler). Requires contract.get first |
| `scheduling.confirm` | Confirm a booked session → state "Confirmado" |

## Phase 4 — Ciclo de Vida (4 tools)

| Tool | Description |
|---|---|
| `lifecycle.get_state` | Get current lifecycle state, available transitions, and transition history |
| `lifecycle.transition` | Execute a state transition with evidence. Valid: requested→scheduled, scheduled→confirmed, confirmed→in_progress, in_progress→delivered, delivered→documented, documented→charged, charged→verified, any→cancelled |
| `scheduling.reschedule` | Exception flow: reschedule to new datetime. Contract rescheduling policy may apply |
| `scheduling.cancel` | Exception flow: cancel with contract cancellation policy applied |

## Phase 5 — Verificar Entrega (3 tools)

| Tool | Description |
|---|---|
| `delivery.checkin` | Provider/client check-in with GPS + timestamp → state "En Curso" |
| `delivery.checkout` | Check-out with GPS + timestamp → state "Entregado". Duration auto-calculated |
| `delivery.record_evidence` | Record delivery evidence per vertical: GPS, signature, photo, document, duration, notes |

## Phase 6 — Cerrar (4 tools)

| Tool | Description |
|---|---|
| `documentation.create` | Generate service record (clinical note, inspection report, class minutes, etc.) → state "Documentado" |
| `payments.create_sale` | Create a sale/charge for the documented service → state "Cobrado" |
| `payments.record_payment` | Record payment received. Payment is independent from lifecycle — billing.status transitions from charged → invoiced → paid |
| `payments.get_status` | Get payment status for a sale or client account balance |

## End-to-End Example

```
registry.search({ vertical: "kinesiologia", location: "santiago" })
  → find org "clinica-kinesia"

registry.get_organization({ org_slug: "clinica-kinesia" })
  → list services, providers

scheduling.check_availability({ org_slug: "clinica-kinesia", date_from: "2026-03-01", date_to: "2026-03-07" })
  → available slots

service.get({ service_id: "srv_123" })
  → 8 dimensions: duration 45min, location presencial, billing, etc.

contract.get({ service_id: "srv_123", org_id: "org_456" })
  → evidence: check_in + check_out + clinical_record
  → cancellation: 0% if >24h, 50% if 2-24h, 100% if <2h
  → dispute window: 48 hours

clients.get_or_create({ email: "paciente@mail.com", name: "Maria", last_name: "Lopez", actor: { type: "agent", id: "agent_1" } })
  → client_id: "cli_789"

scheduling.book({ service_id: "srv_123", provider_id: "prov_111", client_id: "cli_789", starts_at: "2026-03-03T10:00:00", actor: { type: "agent", id: "agent_1" } })
  → session_id: "ses_001", state: "requested"

scheduling.confirm({ session_id: "ses_001", actor: { type: "client", id: "cli_789" } })
  → state: "confirmed"

delivery.checkin({ session_id: "ses_001", actor: { type: "provider", id: "prov_111" }, location: { lat: -33.45, lng: -70.66 } })
  → state: "in_progress"

delivery.checkout({ session_id: "ses_001", actor: { type: "provider", id: "prov_111" }, location: { lat: -33.45, lng: -70.66 } })
  → state: "delivered", duration: 42min

delivery.record_evidence({ session_id: "ses_001", evidence_type: "document", data: { type: "clinical_record", signed_by: ["prov_111", "cli_789"] }, actor: { type: "provider", id: "prov_111" } })
  → evidence recorded

documentation.create({ session_id: "ses_001", content: "Sesion de rehabilitacion...", actor: { type: "provider", id: "prov_111" } })
  → state: "documented"

payments.create_sale({ client_id: "cli_789", service_id: "srv_123", provider_id: "prov_111", unit_price: 35000 })
  → sale_id: "sale_001", state: "charged"

lifecycle.transition({ session_id: "ses_001", to_state: "verified", actor: { type: "client", id: "cli_789" } })
  → state: "verified"
```

## Changelog

### Package 0.6.0 (current)

Protocol v0.6.0 — Resource as first-class dimension (3.5b).

| Change | Detail |
|---|---|
| `scheduling.check_availability` | Now accepts optional `resource_id` — verifies physical resource availability alongside provider (3-variable scheduler: provider ∧ client ∧ resource) |
| `scheduling.book` | Now accepts optional `resource_id` — reserves physical resource alongside session |
| New types | `ResourceSchema`, `ResourceAvailabilitySchema`, `ServiceLocationSchema` with `resource_id` |
| New exception flow | 5.7 Resource Conflict — when a resource is double-booked or unavailable |

### Package 0.5.0

Consolidated from 38 tools to 20. Tools are now organized by lifecycle phase instead of database entity.

| Removed Tool | Replacement |
|---|---|
| `scheduling.list_sessions` | `lifecycle.get_state` |
| `clients.list` | `clients.get_or_create` |
| `clients.get` | `clients.get_or_create` |
| `clients.create` | `clients.get_or_create` |
| `clients.history` | `lifecycle.get_state` |
| `payments.list_sales` | `payments.get_status` |
| `payments.client_balance` | `payments.get_status` |
| `notifications.send_session_reminder` | `lifecycle.transition` |
| `notifications.send_payment_reminder` | `lifecycle.transition` |
| `providers.list` | Removed (not part of service lifecycle) |
| `providers.get` | Removed (not part of service lifecycle) |
| `providers.get_commission` | Removed (not part of service lifecycle) |
| `payroll.*` (5 tools) | Removed (not part of service lifecycle) |

### Protocol 0.6 (current)

Resource as a first-class sub-dimension of Location (3.5b). `resource_id` optional in Location. New exception flow: Resource Conflict (5.7). Scheduler becomes 3-variable: provider ∧ client ∧ resource.

### Protocol 0.3

Lifecycle state order changed. Verified moved from position 6 to position 8 (final). Verification is the closure of the cycle — the client needs the full picture (documentation + charge) before confirming.

| Previous State | Current State | Notes |
|---|---|---|
| Completed | Delivered | Renamed — provider marks delivery, not completion |
| Documented | Documented | Unchanged — comes after Delivered |
| Invoiced | — | Removed from lifecycle — tracked in billing.status |
| Collected | — | Removed from lifecycle — tracked in billing.status |
| — | Charged | New — charge applied 1:1 with delivered + documented session |
| Verified (pos 6) | Verified (pos 8) | Moved to final — client confirms or auto-verified after silence window |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## License

MIT
