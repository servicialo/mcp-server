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

Get your API key and Organization ID from [digitalo.app](https://digitalo.app).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SERVICIALO_API_KEY` | Yes | Bearer token for the Coordinalo API |
| `SERVICIALO_ORG_ID` | Yes | Organization slug (e.g., `mamapro`) |
| `SERVICIALO_BASE_URL` | No | API base URL (default: `https://coordinalo.com`) |

## Available Tools (19)

### Scheduling (5)

| Tool | Description |
|---|---|
| `scheduling.check_availability` | Check available slots for a provider/service in a date range |
| `scheduling.list_sessions` | List sessions filtered by date, provider, client, or status |
| `scheduling.book` | Book a new session for a client with a provider |
| `scheduling.reschedule` | Reschedule an existing session to a new datetime |
| `scheduling.cancel` | Cancel a session |

### Clients (4)

| Tool | Description |
|---|---|
| `clients.list` | List clients with search and pagination |
| `clients.get` | Get client details including history and pending payments |
| `clients.create` | Create a new client |
| `clients.history` | Get client activity history: past sessions, payments |

### Payments (4)

| Tool | Description |
|---|---|
| `payments.list_sales` | List sales filtered by client, provider, service, or status |
| `payments.create_sale` | Create a sale/charge for a client |
| `payments.record_payment` | Record a payment received against a sale |
| `payments.client_balance` | Get client account balance and session availability |

### Providers (3)

| Tool | Description |
|---|---|
| `providers.list` | List organization providers/professionals |
| `providers.get` | Get provider details including services and commissions |
| `providers.get_commission` | Get provider commission configuration |

### Payroll (5)

| Tool | Description |
|---|---|
| `payroll.calculate` | Calculate salary settlement for a provider in a period |
| `payroll.history` | Query payroll settlement history |
| `payroll.settlement_detail` | Get monthly settlement breakdown (earnings and deductions) |
| `payroll.vacations` | Query vacation requests |
| `payroll.request_vacation` | Create a vacation request for a provider |

### Notifications (2)

| Tool | Description |
|---|---|
| `notifications.send_session_reminder` | Send a reminder notification for a session |
| `notifications.send_payment_reminder` | Send a payment reminder for a pending sale |

## API Modules

The server connects to three Coordinalo platform modules:

- **Coordinalo** — Scheduling and session management
- **Relacionalo** — Client CRM and relationship management
- **Planificalo** — Finance, payments, payroll, and provider management

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
