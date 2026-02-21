# @servicialo/mcp-server

MCP server for the [Servicialo](https://servicialo.com) protocol. Connects AI agents to professional services via any Servicialo-compatible platform.

## Two Modes of Operation

### Discovery Mode (no configuration)

```bash
npx -y @servicialo/mcp-server
```

No credentials needed. The server exposes 4 public tools for discovering organizations, services, and availability across any Servicialo-compatible platform.

Useful for: agents that help users find and evaluate professional services.

### Authenticated Mode

```bash
SERVICIALO_API_KEY=your_key SERVICIALO_ORG_ID=your_org npx -y @servicialo/mcp-server
```

Requires `SERVICIALO_API_KEY` and `SERVICIALO_ORG_ID` obtained from the Servicialo-compatible platform your organization uses.

Enables: scheduling, client management, payments, providers, payroll, and notifications — all 23 tools.

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

## Public Tools (4) — Always Available

| Tool | Description |
|---|---|
| `registry.search` | Search Servicialo-compatible organizations by vertical and location |
| `registry.get_organization` | Get public details of an organization (services, providers, booking) |
| `scheduling.check_availability` | Check available slots without authentication |
| `services.list` | List the public service catalog of an organization |

## Authenticated Tools (19) — Require Credentials

### Scheduling (4)

| Tool | Description |
|---|---|
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

The server connects to three platform modules:

- **Scheduling** — Session management and calendar coordination
- **CRM** — Client relationship management
- **Finance** — Payments, payroll, and provider management

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
