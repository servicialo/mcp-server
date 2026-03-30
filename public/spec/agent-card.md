# Agent Card Specification

**Version 1.0.0**

## Overview

An Agent Card is a JSON document that describes an organization's capabilities, services, and access points in a format that any AI agent can parse and act on. It serves as the Level 2 endpoint in the [discovery hierarchy](./discovery.md).

## URL Pattern

```
https://{platform}/api/servicialo/{orgSlug}/.well-known/agent.json
```

## Schema

See [schemas/agent-card.json](./schemas/agent-card.json) for the formal JSON Schema.

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Servicialo protocol version |
| `organization` | object | Yes | Organization identity and metadata |
| `capabilities` | object | Yes | Which protocol features are implemented |
| `services` | array | Yes | Catalog of bookable services |
| `providers` | array | No | Available professionals |
| `endpoints` | object | Yes | MCP, REST, and A2A access points |
| `authentication` | object | Yes | How to obtain credentials |

## Organization Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | Unique identifier within the implementation |
| `name` | string | Yes | Display name |
| `description` | string | No | Brief description |
| `vertical` | string | Yes | Primary vertical (e.g., `health`, `legal`, `education`) |
| `country` | string | Yes | Country code (ISO 3166-1 alpha-2) |
| `timezone` | string | Yes | IANA timezone |
| `trust_score` | number | No | Network trust score (0-100) |
| `verified_deliveries` | integer | No | Total verified service deliveries |
| `active_since` | date | No | Date organization joined the network |

## Capabilities Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lifecycle_states` | string[] | Yes | Implemented lifecycle states (minimum 9) |
| `exception_flows` | string[] | Yes | Implemented exception flows (minimum 3) |
| `evidence_types` | string[] | Yes | Supported evidence types |
| `service_orders` | boolean | No | Whether Service Orders are supported |
| `resources` | boolean | No | Whether physical resource management is supported |
| `a2a` | boolean | No | Whether A2A inter-agent communication is supported |
| `mandates` | boolean | No | Whether delegated agency mandates are supported |

## Service Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Service identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Service description |
| `vertical` | string | Yes | Service vertical |
| `duration_minutes` | integer | Yes | Expected duration |
| `price` | object | Yes | Price information |
| `price.amount` | number | Yes | Base price |
| `price.currency` | string | Yes | ISO 4217 currency code |
| `modality` | enum | Yes | `in_person`, `virtual`, `at_home` |
| `requires_resource` | boolean | No | Whether a physical resource is needed |
| `required_evidence` | string[] | No | Evidence types required for delivery verification |

## Provider Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Provider identifier |
| `name` | string | Yes | Display name |
| `specializations` | string[] | No | Areas of expertise |
| `trust_score` | number | No | Provider trust score (0-100) |
| `services` | string[] | No | Service IDs this provider can deliver |

## Endpoints Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mcp` | URL | Yes | MCP server endpoint |
| `rest` | URL | No | REST API base URL |
| `a2a` | URL | No | A2A task router endpoint |
| `booking` | URL | No | Human-facing booking page |

## Authentication Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | Yes | `api_key`, `oauth2`, `none` |
| `registration_url` | URL | No | Where to register for credentials |
| `scopes` | string[] | No | Available authentication scopes |
| `public_tools_count` | integer | No | Number of tools available without auth |
| `authenticated_tools_count` | integer | No | Number of tools available with auth |

## Example Agent Card

```json
{
  "version": "1.0.0",
  "organization": {
    "slug": "clinica-kinesia",
    "name": "Clínica Kinesia",
    "description": "Centro de rehabilitación y kinesiología",
    "vertical": "health",
    "country": "cl",
    "timezone": "America/Santiago",
    "trust_score": 92,
    "verified_deliveries": 1847,
    "active_since": "2026-03-31"
  },
  "capabilities": {
    "lifecycle_states": [
      "requested", "scheduled", "confirmed", "in_progress",
      "completed", "documented", "invoiced", "charged", "verified"
    ],
    "exception_flows": [
      "cancellation", "no_show", "rescheduling", "dispute", "partial_delivery"
    ],
    "evidence_types": ["gps", "signature", "document", "duration"],
    "service_orders": true,
    "resources": true,
    "a2a": true,
    "mandates": true
  },
  "services": [
    {
      "id": "srv_rehab_pelvica",
      "name": "Rehabilitación de Piso Pélvico",
      "vertical": "health",
      "duration_minutes": 45,
      "price": { "amount": 35000, "currency": "CLP" },
      "modality": "in_person",
      "requires_resource": true,
      "required_evidence": ["gps_checkin", "gps_checkout", "clinical_record"]
    }
  ],
  "providers": [
    {
      "id": "prov_111",
      "name": "Dra. Bárbara Sánchez",
      "specializations": ["pelvic_floor", "rehabilitation"],
      "trust_score": 94,
      "services": ["srv_rehab_pelvica"]
    }
  ],
  "endpoints": {
    "mcp": "https://coordinalo.com/api/mcp",
    "rest": "https://coordinalo.com/api/v1",
    "a2a": "https://coordinalo.com/api/a2a",
    "booking": "https://coordinalo.com/clinica-kinesia/book"
  },
  "authentication": {
    "type": "api_key",
    "registration_url": "https://coordinalo.com/signup",
    "scopes": [
      "service:read", "service:write", "schedule:read", "schedule:write",
      "patient:read", "patient:write", "evidence:read", "evidence:write",
      "payment:read", "payment:write", "document:read", "document:write"
    ],
    "public_tools_count": 9,
    "authenticated_tools_count": 34
  }
}
```
