# Standard Intent Catalog

**Version 1.0.0**

## Overview

Intents are the standard operations that any Servicialo-compliant implementation must support. They map directly to MCP tools and A2A tasks, providing a unified vocabulary for service coordination.

## Lifecycle States

Every service traverses these 9 states in order. No state can be skipped.

```
requested → scheduled → confirmed → in_progress → completed → documented → invoiced → charged → verified
```

Exception states (can be entered from specific states):
- `cancelled` — from any pre-delivery state, or post-delivery via dispute
- `disputed` — from completed state within dispute window
- `rescheduling` — from scheduled or confirmed
- `reassigning` — from confirmed (provider or resource change)
- `partial` — from in_progress

## Discovery Intents

These intents are always public, require no authentication.

### `resolve.lookup`

Resolve an organization slug to its endpoint and trust level.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `org_slug` | string | Yes | Organization identifier |

**Output:** Endpoint URLs (MCP, REST, A2A), trust score, last heartbeat.

### `resolve.search`

Search the global resolver for organizations.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `country` | string | No | ISO 3166-1 alpha-2 country code |
| `vertical` | string | No | Service vertical |

**Output:** Array of matching organizations with trust scores.

### `registry.search`

Search organizations on a specific implementation by vertical and location.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vertical` | string | No | Service vertical (e.g., `kinesiologia`) |
| `location` | string | No | City or region |
| `country` | string | No | Country code |

**Output:** Array of matching organizations with services and providers.

### `registry.get_organization`

Get public details of a specific organization.

**Input:** `org_slug` (string)

**Output:** Organization profile, service catalog, provider list, booking configuration.

### `services.list`

List an organization's public service catalog.

**Input:** `org_slug` (string)

**Output:** Array of services with name, price, duration, modality, and evidence requirements.

### `scheduling.check_availability`

Check available time slots using the 3-variable scheduler.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `org_slug` | string | Yes | Organization identifier |
| `service_id` | string | No | Filter by service |
| `provider_id` | string | No | Filter by provider |
| `date_from` | date | Yes | Start of date range |
| `date_to` | date | Yes | End of date range |

**Output:** Array of available slots where `provider_free ∧ client_free ∧ resource_free`.

### `a2a.get_agent_card`

Get the A2A Agent Card for inter-agent discovery.

**Input:** `org_slug` (string)

**Output:** A2A-compliant Agent Card with capabilities and task router endpoint.

## Understanding Intents

These require authentication with `service:read` scope.

### `service.get`

Get the 8 dimensions of a specific service.

**Input:** `service_id` (string)

**Output:** Complete service object with all 8 dimensions populated.

### `contract.get`

Get the pre-agreed service contract. **Must** be called before any booking or lifecycle action.

**Input:** `service_id` (string), `organization_id` (string)

**Output:** Evidence requirements, cancellation policy, no-show policy, dispute window, arbitration configuration.

## Commitment Intents

### `clients.get_or_create`

Resolve client identity by email or phone. Creates if not found.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Conditional | Client email |
| `phone` | string | Conditional | Client phone |
| `name` | string | Conditional | First name (required for creation) |
| `last_name` | string | Conditional | Last name (required for creation) |

**Scope:** `patient:write`

### `scheduling.book`

Book a new session. Creates in `requested` state.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service_id` | string | Yes | Service to book |
| `provider_id` | string | Yes | Provider to book with |
| `client_id` | string | Yes | Client identifier |
| `starts_at` | datetime | Yes | Session start time (ISO 8601) |
| `resource_id` | string | No | Physical resource to reserve |

**Scope:** `schedule:write`

### `scheduling.confirm`

Confirm a booked session. Transitions to `confirmed` state.

**Input:** `session_id` (string)

**Scope:** `schedule:write`

## Lifecycle Intents

### `lifecycle.get_state`

Get current state, available transitions, and transition history.

**Input:** `session_id` (string)

**Scope:** `service:read`

### `lifecycle.transition`

Execute a state transition with evidence.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | Yes | Session identifier |
| `to_state` | string | Yes | Target state |
| `evidence` | object | No | Supporting evidence |
| `actor` | object | Yes | Who is performing the transition |

**Scope:** `service:write`

### `scheduling.reschedule`

Reschedule to a new time. Cancellation policy may apply.

**Input:** `session_id` (string), `new_starts_at` (datetime)

**Scope:** `schedule:write`

### `scheduling.cancel`

Cancel a session. Cancellation policy from contract is applied.

**Input:** `session_id` (string), `reason` (string)

**Scope:** `schedule:write`

## Delivery Verification Intents

### `delivery.checkin`

Record check-in with GPS and timestamp. Transitions to `in_progress`.

**Input:** `session_id` (string), `location` (object: lat, lng)

**Scope:** `evidence:write`

### `delivery.checkout`

Record check-out with GPS and timestamp. Transitions to `completed`. Duration auto-calculated.

**Input:** `session_id` (string), `location` (object: lat, lng)

**Scope:** `evidence:write`

### `delivery.record_evidence`

Record delivery evidence by vertical.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | string | Yes | Session identifier |
| `type` | enum | Yes | `gps`, `signature`, `photo`, `document`, `duration`, `notes` |
| `data` | object | Yes | Type-specific payload |

**Scope:** `evidence:write`

## Closing Intents

### `documentation.create`

Generate formal service record. Transitions to `documented`.

**Input:** `session_id` (string), `type` (string), `content` (string)

**Scope:** `document:write`

### `payments.create_sale`

Create a charge for a documented service. Transitions to `charged`.

**Input:** `client_id` (string), `service_id` (string), `unit_price` (number)

**Scope:** `payment:write`

### `payments.record_payment`

Record payment received against a sale.

**Input:** `sale_id` (string), `amount` (number), `method` (string)

**Scope:** `payment:write`

### `payments.get_status`

Query payment status or client account balance.

**Input:** `session_id` (string) or `client_id` (string)

**Scope:** `payment:read`
