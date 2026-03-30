# Discovery — /.well-known/ Hierarchy Specification

**Version 1.0.0**

## Overview

Servicialo uses a three-level `/.well-known/` hierarchy that enables any agent to navigate from zero context to a completed booking. This follows the same convention as `/.well-known/openid-configuration`, `/.well-known/apple-app-site-association`, and other web standards (RFC 8615).

## The Three Levels

```
Level 0 — Meta-Registry (protocol level)
  servicialo.com/.well-known/registries.json
  → Lists all known Servicialo-compliant implementations

Level 1 — Implementation Registry (platform level)
  {platform}/.well-known/agents.json
  → All discoverable organizations on this implementation

Level 2 — Organization Agent Card (org level)
  {platform}/api/servicialo/{orgSlug}/.well-known/agent.json
  → Capabilities, services, availability for one organization
```

## Level 0 — Meta-Registry

**URL:** `https://servicialo.com/.well-known/registries.json`

**Purpose:** Entry point for any agent with no prior context. Lists all known Servicialo-compliant implementations.

**Schema:** See [schemas/registries.json](./schemas/registries.json)

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version (semver) |
| `description` | string | Yes | Human-readable description |
| `registries` | array | Yes | List of known implementations |

### Registry Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Implementation name |
| `description` | string | Yes | Human-readable description |
| `registry` | URL | Yes | URL to the implementation's Level 1 registry |
| `platform` | URL | Yes | URL to the implementation's main site |
| `status` | enum | Yes | `production`, `beta`, `development` |
| `since` | date | Yes | Date the implementation went live (ISO 8601) |
| `verticals` | string[] | No | Supported verticals |
| `countries` | string[] | No | Operating countries (ISO 3166-1 alpha-2) |

### Example

```json
{
  "version": "1.0.0",
  "description": "Known Servicialo-compliant implementation registries",
  "registries": [
    {
      "name": "Coordinalo",
      "description": "Reference implementation — multi-tenant SaaS for professional services",
      "registry": "https://coordinalo.com/.well-known/agents.json",
      "platform": "https://coordinalo.com",
      "status": "production",
      "since": "2026-03-31"
    }
  ]
}
```

## Level 1 — Implementation Registry

**URL:** `https://{platform}/.well-known/agents.json`

**Purpose:** Lists all discoverable organizations on a specific Servicialo implementation. Equivalent to a DNS zone file.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version |
| `implementation` | object | Yes | Implementation metadata |
| `implementation.name` | string | Yes | Implementation name |
| `implementation.protocol_version` | string | Yes | Servicialo protocol version |
| `implementation.platform` | URL | Yes | Platform URL |
| `organizations` | array | Yes | List of discoverable organizations |

### Organization Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | Organization slug (unique within implementation) |
| `name` | string | Yes | Display name |
| `vertical` | string | Yes | Primary vertical |
| `country` | string | Yes | Country code (ISO 3166-1 alpha-2) |
| `trust_score` | number | No | Trust score 0-100 |
| `agent_card` | URL | Yes | URL to Level 2 agent card |
| `services_count` | integer | No | Number of active services |
| `providers_count` | integer | No | Number of active providers |

## Level 2 — Organization Agent Card

**URL:** `https://{platform}/api/servicialo/{orgSlug}/.well-known/agent.json`

**Purpose:** Complete description of one organization's capabilities, services, and access points.

**Schema:** See [schemas/agent-card.json](./schemas/agent-card.json)

See [Agent Card specification](./agent-card.md) for full details.

## Navigation Flow

An agent starting from zero context follows these steps:

```
Step 1: Fetch meta-registry
  GET https://servicialo.com/.well-known/registries.json
  → Discovers implementations (e.g., Coordinalo)

Step 2: Fetch implementation registry
  GET https://coordinalo.com/.well-known/agents.json
  → Discovers organizations, filters by vertical/country

Step 3: Fetch organization agent card
  GET https://coordinalo.com/api/servicialo/clinica-kinesia/.well-known/agent.json
  → Gets full capabilities: services, providers, MCP endpoint

Step 4: Connect to MCP server
  Connect to MCP endpoint from agent card
  → 9 public tools available without authentication

Step 5: Discover and book
  Use MCP tools to search, check availability, and book
  → Full service lifecycle begins
```

## Caching

| Level | Recommended Cache TTL | Rationale |
|-------|----------------------|-----------|
| Level 0 | 24 hours | Implementations change rarely |
| Level 1 | 1 hour | Organizations join/leave more frequently |
| Level 2 | 5 minutes | Services and availability change continuously |

## Security Considerations

- Level 0 and Level 1 are public, read-only endpoints
- Level 2 may include sensitive information (provider names, service prices) and implementations may choose to require authentication
- All endpoints MUST be served over HTTPS
- Rate limiting is recommended: 100 requests/minute for Level 0, 1000/minute for Level 1, 10000/minute for Level 2
