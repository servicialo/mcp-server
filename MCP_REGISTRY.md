# MCP Registry Submission

Target: [MCP Registry](https://github.com/modelcontextprotocol/servers)

## Server Info

```yaml
name: servicialo
description: Open protocol for AI agents to coordinate professional services — scheduling, verified delivery, and billing across any platform that implements the spec.
url: https://github.com/servicialo/mcp-server
npm: "@servicialo/mcp-server"
command: npx -y @servicialo/mcp-server
category: business
tags:
  - professional-services
  - scheduling
  - billing
  - delivery-verification
  - latam
  - lifecycle-management
authentication:
  discovery: none
  authenticated: api_key
```

## Summary

MCP server that lets AI agents operate professional service businesses through a standardized protocol. Two modes:

- **Discovery mode** (no auth): 15 public tools — discovery resolver (DNS-analog), search organizations, check availability, list services, A2A discovery, market benchmarks
- **Authenticated mode** (API key + org ID): 40 tools total across 7 lifecycle phases (0–6) plus resource management, resolver administration, and network-intelligence (`market.list_segments`, `market.get_benchmark`)

## Lifecycle Phases

1. Descubrimiento — search, availability, catalog
2. Entender — service details, contract terms
3. Comprometer — create client, book, confirm
4. Ciclo de vida — state transitions, reschedule, cancel
5. Verificar entrega — checkin, checkout, evidence
6. Cerrar — documentation, billing, payment

## Links

- Protocol spec: https://servicialo.com
- npm: https://www.npmjs.com/package/@servicialo/mcp-server
- GitHub: https://github.com/servicialo/mcp-server
- Reference implementation: https://coordinalo.com
