# @servicialo/mcp-server

MCP server for the [Servicialo](https://servicialo.com) protocol. Connects AI agents to professional services via the [Coordinalo](https://coordinalo.com) REST API.

## Quick Start

```bash
npx -y @servicialo/mcp-server
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

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

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SERVICIALO_API_KEY` | Yes | Bearer token for the Coordinalo API |
| `SERVICIALO_ORG_ID` | Yes | Organization slug (e.g., `mamapro`) |
| `SERVICIALO_BASE_URL` | No | API base URL (default: `https://coordinalo.com`) |

## Available Tools (11)

### Scheduling (4)

| Tool | Description |
|---|---|
| `scheduling.check_availability` | Check available slots for a provider/service in a date range |
| `scheduling.book` | Book a new session |
| `scheduling.reschedule` | Reschedule an existing session |
| `scheduling.cancel` | Cancel a session |

### Clients (3)

| Tool | Description |
|---|---|
| `clients.list` | List clients with search and pagination |
| `clients.get` | Get client details with stats |
| `clients.create` | Create a new client |

### Payments (3)

| Tool | Description |
|---|---|
| `payments.get_balance` | Get client balance (available sessions, pending amount) |
| `payments.charge` | Create a sale/charge for a service |
| `payments.record` | Record a payment received against a sale |

### Notifications (1)

| Tool | Description |
|---|---|
| `notifications.send` | Send a notification to a client (reminder, confirmation, etc.) |

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
