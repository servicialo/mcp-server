# @coordinalo/mcp-server

Coordinalo is the reference implementation of the [Servicialo protocol](https://servicialo.com) — an open standard for professional service delivery. It provides scheduling, lifecycle management, billing, and communications for service organizations.

Production endpoint: `https://coordinalo.com/api/mcp` (Streamable HTTP transport, 41 tools)

## Top 10 Tools

| Tool | Description |
|------|-------------|
| `booking_create` | Create a session/appointment for a client with a provider |
| `booking_list` | List sessions with filters by date, provider, client, status |
| `availability_get_slots` | Query available time slots for a provider or service |
| `client_create` | Register a new client in the organization |
| `client_list` | Search and list clients with pagination |
| `finance_create_cobro` | Create a charge (cobro) for a client |
| `finance_register_payment` | Register a payment against an existing charge |
| `report_dashboard` | Executive summary: today's sessions, revenue, alerts |
| `comms_send_message` | Send WhatsApp or email to a client |
| `admin_set_availability` | Set weekly availability schedule for a provider |

## Getting Credentials

1. Go to [coordinalo.com](https://coordinalo.com) and create an organization
2. Your **API key** is provided on organization creation
3. Your **org slug** is the URL-friendly identifier you chose (e.g. `mamapro`)

## Configuration

```json
{
  "mcpServers": {
    "coordinalo": {
      "url": "https://coordinalo.com/api/mcp",
      "headers": {
        "X-Org-Api-Key": "YOUR_API_KEY"
      }
    }
  }
}
```

## Protocol

Coordinalo implements the [Servicialo protocol](https://servicialo.com) (v0.6) — 8 dimensions, 9 lifecycle states, 6 exception states, 7 design principles. See the [whitepaper](https://servicialo.com/docs/servicialo-whitepaper.pdf) for the full specification.

## License

Apache-2.0
