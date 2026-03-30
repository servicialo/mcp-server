# A2A Task Router Specification

**Version 1.0.0**

## Overview

The Servicialo A2A Task Router enables inter-agent coordination using Google's Agent-to-Agent (A2A) protocol. While MCP provides the primary interface for agent-to-tool communication, A2A enables agents to delegate tasks to other agents — for example, a personal assistant agent delegating appointment booking to a clinic's scheduling agent.

## Architecture

```
┌──────────────────┐     A2A      ┌──────────────────┐
│ Requesting Agent │ ──────────── │ Servicialo Agent  │
│ (e.g., personal  │  Task/Result │ (per organization)│
│  assistant)      │              │                   │
└──────────────────┘              └────────┬──────────┘
                                           │ MCP
                                           ▼
                                  ┌──────────────────┐
                                  │ Servicialo Backend│
                                  │ (Coordinalo, etc.)│
                                  └──────────────────┘
```

## Agent Card (A2A Format)

Each Servicialo organization exposes an A2A-compliant Agent Card alongside its Servicialo Agent Card. The A2A card is accessible via the MCP tool `a2a.get_agent_card` or directly at the organization's A2A endpoint.

### A2A Agent Card Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Organization name |
| `description` | string | What this agent can do |
| `url` | URL | A2A task router endpoint |
| `version` | string | A2A protocol version |
| `capabilities` | object | Supported A2A features |
| `skills` | array | Supported task types with schemas |
| `authentication` | object | How to authenticate for task submission |

### Example A2A Agent Card

```json
{
  "name": "Clínica Kinesia — Booking Agent",
  "description": "Handles appointment scheduling, availability queries, and service coordination for Clínica Kinesia",
  "url": "https://coordinalo.com/api/a2a/clinica-kinesia",
  "version": "0.1.0",
  "capabilities": {
    "streaming": false,
    "pushNotifications": true,
    "stateTransitionHistory": true
  },
  "skills": [
    {
      "id": "check_availability",
      "name": "Check Availability",
      "description": "Query available time slots for a service and provider",
      "inputSchema": {
        "type": "object",
        "properties": {
          "service_id": { "type": "string" },
          "provider_id": { "type": "string" },
          "date_from": { "type": "string", "format": "date" },
          "date_to": { "type": "string", "format": "date" }
        },
        "required": ["date_from", "date_to"]
      }
    },
    {
      "id": "book_session",
      "name": "Book Session",
      "description": "Book an appointment for a client",
      "inputSchema": {
        "type": "object",
        "properties": {
          "service_id": { "type": "string" },
          "provider_id": { "type": "string" },
          "client_email": { "type": "string" },
          "client_name": { "type": "string" },
          "starts_at": { "type": "string", "format": "date-time" }
        },
        "required": ["service_id", "provider_id", "client_email", "starts_at"]
      }
    },
    {
      "id": "manage_session",
      "name": "Manage Session",
      "description": "Reschedule, cancel, or check status of an existing session",
      "inputSchema": {
        "type": "object",
        "properties": {
          "session_id": { "type": "string" },
          "action": {
            "type": "string",
            "enum": ["reschedule", "cancel", "get_status"]
          },
          "new_starts_at": { "type": "string", "format": "date-time" },
          "reason": { "type": "string" }
        },
        "required": ["session_id", "action"]
      }
    }
  ],
  "authentication": {
    "schemes": ["bearer"],
    "credentials_url": "https://coordinalo.com/signup"
  }
}
```

## Task Lifecycle

A2A tasks submitted to a Servicialo agent follow this lifecycle:

```
submitted → working → completed
                   → failed
                   → requires_input (needs human confirmation)
```

### Task States

| State | Description |
|-------|-------------|
| `submitted` | Task received, queued for processing |
| `working` | Agent is processing the task |
| `completed` | Task finished successfully, result available |
| `failed` | Task failed, error details available |
| `requires_input` | Agent needs additional information or human confirmation |

## Supported Task Types

### `check_availability`

Returns available time slots. No authentication required.

### `book_session`

Books an appointment. Requires authentication. Maps internally to MCP tools: `clients.get_or_create` → `scheduling.book` → `scheduling.confirm`.

### `manage_session`

Manages an existing session (reschedule, cancel, status check). Requires authentication. Maps to corresponding MCP lifecycle tools.

### `verify_delivery`

Submits delivery evidence. Requires authentication. Maps to `delivery.checkin`, `delivery.checkout`, `delivery.record_evidence`.

## Security

- All A2A endpoints MUST be served over HTTPS
- Task submission for authenticated operations requires a valid bearer token
- The Servicialo agent validates the requesting agent's mandate before executing tasks that affect service state
- Each task execution produces an audit trail entry
- Rate limiting: 100 tasks/minute per authenticated agent

## Relationship to MCP

A2A and MCP are complementary, not competing:

| Aspect | MCP | A2A |
|--------|-----|-----|
| **Who communicates** | Agent ↔ Tools | Agent ↔ Agent |
| **Granularity** | Individual tool calls | Complete tasks |
| **Control** | Agent drives each step | Delegated to receiving agent |
| **Use case** | Direct service coordination | Cross-agent delegation |

An agent can use MCP for fine-grained control (calling individual tools in sequence) or A2A for high-level delegation (submitting a "book_session" task and letting the Servicialo agent handle the details).
