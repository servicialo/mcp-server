# Implementing Servicialo

A step-by-step guide for building a Servicialo-compatible platform. You don't need to implement everything — just the core that makes your service data interoperable.

> **Protocol version:** 0.8 · **Spec:** [`PROTOCOL.md`](./PROTOCOL.md) · **Schema:** [`schema/service.schema.json`](./schema/service.schema.json)

---

## What "compatible" means

To be listed as a Servicialo implementation ([§16](./PROTOCOL.md#16-implementations)), your platform MUST:

1. Model services using the **8 dimensions** (§5)
2. Implement the **9 lifecycle states** (§6)
3. Handle at least **3 exception flows** (§7)
4. Expose an API that an **MCP server can connect to**

Everything else — Service Orders, Delegated Agency, Provider Profiles, Network Intelligence — is optional.

---

## Step 1: Model a Service with 8 Dimensions

**Time:** ~20 minutes

Define your Service object. Every field maps to one of the 8 dimensions from §5. Here's the minimum viable Service in TypeScript:

```typescript
// The minimum viable Servicialo Service object
// Reference: PROTOCOL.md §5

interface Service {
  // §5.1 — Identity (What)
  id: string;
  type: string;                          // e.g. "physical_therapy_session"
  vertical: string;                      // e.g. "health"
  name: string;                          // e.g. "Rehabilitation session — 45 min"
  duration_minutes: number;              // MUST be >= 1
  visibility?: "public" | "unlisted" | "private";  // default: "public"

  // §5.2 — Provider (Who Delivers)
  provider: {
    id: string;
    organization_id: string;
    credentials?: string[];
    trust_score?: number;                // 0–100
  };

  // §5.3 — Client (Who Receives)
  client: {
    id: string;
    payer_id?: string;                   // explicitly separated from client
  };

  // §5.4 — Schedule (When)
  schedule: {
    requested_at: string;                // ISO 8601
    scheduled_for?: string;              // set when state = "scheduled"
    duration_expected?: number;
  };

  // §5.5 — Location (Where)
  location?: {
    type?: "in_person" | "virtual" | "home_visit";
    address?: string;
    room?: string;
    coordinates?: { lat: number; lng: number };
  };

  // §5.6 — Lifecycle (States)
  lifecycle: {
    current_state: ServiceState;
    transitions: Transition[];
    exceptions: Exception[];
  };

  // §5.7 — Proof of Delivery (Evidence)
  proof?: {
    checkin?: string;                    // ISO 8601
    checkout?: string;
    duration_actual?: number;
    evidence?: Evidence[];
  };

  // §5.8 — Billing (Payment)
  billing: {
    amount: { value: number; currency: string };  // currency = ISO 4217
    payer?: string;
    status?: "pending" | "charged" | "invoiced" | "paid" | "disputed";
    charged_at?: string;
    payment_id?: string;
    tax_document?: string;
  };
}
```

**Done when:** You can create a Service object in your system and every field maps to one of the 8 dimensions. Validate against [`schema/service.schema.json`](./schema/service.schema.json).

---

## Step 2: Implement the 9 Lifecycle States

The 9 states are strictly ordered. No skipping (§6.1).

```
requested → scheduled → confirmed → in_progress → completed → documented → invoiced → collected → verified
```

```typescript
type ServiceState =
  | "requested"     // 1. Client defines what they need
  | "scheduled"     // 2. Time + provider + location assigned
  | "confirmed"     // 3. Both parties acknowledge
  | "in_progress"   // 4. Check-in detected, service being delivered
  | "completed"     // 5. Provider marks delivery complete
  | "documented"    // 6. Evidence/record generated
  | "invoiced"      // 7. Tax document issued
  | "collected"     // 8. Payment received
  | "verified"      // 9. Client confirms — cycle closed
  // Exception states (§7)
  | "cancelled"
  | "disputed"
  | "reassigning"
  | "rescheduling"
  | "partial";

// Valid happy-path transitions (§6.1)
const VALID_TRANSITIONS: Record<ServiceState, ServiceState[]> = {
  requested:    ["scheduled", "cancelled"],
  scheduled:    ["confirmed", "cancelled", "rescheduling"],
  confirmed:    ["in_progress", "cancelled", "rescheduling", "reassigning"],
  in_progress:  ["completed", "partial"],
  completed:    ["documented", "disputed"],
  documented:   ["invoiced"],
  invoiced:     ["collected"],
  collected:    ["verified"],
  verified:     [],
  // Exception states
  cancelled:    [],
  disputed:     ["collected", "cancelled"],  // provider wins or client wins
  reassigning:  ["scheduled"],
  rescheduling: ["scheduled"],
  partial:      ["documented"],
};

interface Transition {
  from: string | null;   // null for initial state
  to: string;
  at: string;            // ISO 8601
  by: string;            // client ID, provider ID, "system", or agent ID
  method?: "auto" | "manual" | "agent";
  metadata?: Record<string, unknown>;
}

function transitionService(service: Service, to: ServiceState, by: string, method: "auto" | "manual" | "agent" = "manual"): Service {
  const current = service.lifecycle.current_state;
  const allowed = VALID_TRANSITIONS[current];

  if (!allowed?.includes(to)) {
    throw new Error(`Invalid transition: ${current} → ${to}`);
  }

  const transition: Transition = {
    from: current,
    to,
    at: new Date().toISOString(),
    by,
    method,
  };

  return {
    ...service,
    lifecycle: {
      ...service.lifecycle,
      current_state: to,
      transitions: [...service.lifecycle.transitions, transition],
    },
  };
}
```

**Done when:** Your system enforces the transition rules — invalid transitions throw errors, every transition is recorded in the audit trail.

---

## Step 3: Handle 3 Exception Flows

Exceptions happen in 15–30% of appointments (§7). You need at least 3. Here are the three simplest to implement:

### 3a. Cancellation (§7.3)

```
Any pre-delivery state → cancelled
```

```typescript
interface CancellationPolicy {
  free_before_hours: number;      // cancel for free if this far out
  penalty_within_hours: number;   // partial penalty window
  penalty_rate: number;           // 0–1, fraction of service price
}

function cancelService(
  service: Service,
  by: string,
  policy: CancellationPolicy,
  now: Date = new Date()
): { service: Service; penalty: number } {
  const preDeliveryStates: ServiceState[] = ["requested", "scheduled", "confirmed"];
  if (!preDeliveryStates.includes(service.lifecycle.current_state)) {
    throw new Error(`Cannot cancel from state: ${service.lifecycle.current_state}`);
  }

  const scheduledFor = service.schedule.scheduled_for
    ? new Date(service.schedule.scheduled_for)
    : null;

  let penalty = 0;
  if (scheduledFor) {
    const hoursUntil = (scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil < policy.penalty_within_hours) {
      penalty = service.billing.amount.value * policy.penalty_rate;
    }
    // Free cancellation if hoursUntil >= free_before_hours
  }

  const updated = transitionService(service, "cancelled", by);
  updated.lifecycle.exceptions.push({
    type: "cancellation",
    at: now.toISOString(),
    initiated_by: by,
    resolution: penalty > 0 ? `penalty_applied:${penalty}` : "free_cancellation",
  });

  return { service: updated, penalty };
}
```

### 3b. Client No-Show (§7.1)

```
confirmed → cancelled (no_show)
```

```typescript
function handleClientNoShow(service: Service, graceMinutes: number = 15): Service {
  if (service.lifecycle.current_state !== "confirmed") {
    throw new Error("No-show only applies to confirmed services");
  }

  const updated = transitionService(service, "cancelled", "system", "auto");
  updated.lifecycle.exceptions.push({
    type: "no_show",
    at: new Date().toISOString(),
    initiated_by: "system",
    resolution: "client_no_show_penalty_applied",
  });

  // SHOULD: charge penalty per org policy (§7.1)
  // SHOULD: free the provider's time slot
  // SHOULD: increment client's no-show counter

  return updated;
}
```

### 3c. Rescheduling (§7.5)

```
scheduled/confirmed → rescheduling → scheduled (new time)
```

```typescript
function rescheduleService(
  service: Service,
  newTime: string,          // ISO 8601
  by: string
): Service {
  const rescheduleableStates: ServiceState[] = ["scheduled", "confirmed"];
  if (!rescheduleableStates.includes(service.lifecycle.current_state)) {
    throw new Error(`Cannot reschedule from state: ${service.lifecycle.current_state}`);
  }

  // Enter transitory state
  let updated = transitionService(service, "rescheduling", by);
  updated.lifecycle.exceptions.push({
    type: "reschedule",
    at: new Date().toISOString(),
    initiated_by: by,
  });

  // Resolve to new scheduled time
  updated = transitionService(updated, "scheduled", "system", "auto");
  updated.schedule.scheduled_for = newTime;

  return updated;
}
```

**Done when:** All three exception flows produce correct state transitions and record exceptions in `lifecycle.exceptions`.

---

## Step 4: Build Your API

Expose HTTP endpoints that cover the 6 agent phases from §13. At minimum, you need endpoints for:

| Phase | Endpoint | Maps to MCP tool |
|-------|----------|-----------------|
| 1. Discover | `GET /services` | `services.list` |
| 1. Discover | `GET /availability?service_id=X&date_from=Y&date_to=Z` | `scheduling.check_availability` |
| 3. Commit | `POST /bookings` | `scheduling.book` |
| 3. Commit | `POST /bookings/:id/confirm` | `scheduling.confirm` |
| 4. Manage | `POST /bookings/:id/transition` | `lifecycle.transition` |
| 5. Verify | `POST /bookings/:id/checkin` | `delivery.checkin` |

[SPEC GAP] The protocol defines MCP tool signatures (§13) but does not prescribe HTTP endpoint paths or REST conventions. Each implementation chooses its own API surface — the MCP server adapts to it.

For a complete walkthrough with request/response examples, see [`examples/minimal-implementation.md`](./examples/minimal-implementation.md).

**Done when:** An HTTP client can create a service, advance it through all 9 states, and trigger each of your 3 exception flows.

---

## Step 5: Connect an MCP Server

The MCP server is the bridge between AI agents and your API. You have two options:

**Option A: Use the reference MCP server** and configure it to point at your API:

```json
{
  "mcpServers": {
    "your-platform": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_API_KEY": "your_api_key",
        "SERVICIALO_API_BASE": "https://your-api.com/v1",
        "SERVICIALO_ORG_ID": "your_org_id"
      }
    }
  }
}
```

[SPEC GAP] The reference MCP server (`@servicialo/mcp-server`) currently targets the Coordinalo API. To use it with a different backend, you'd need to implement the same API contract or fork the server. A pluggable adapter layer is not yet specified.

**Option B: Build your own MCP server** that wraps your API. The `@modelcontextprotocol/sdk` package handles the MCP protocol — you just implement the tool handlers:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "your-platform", version: "1.0.0" });

server.tool(
  "services.list",
  "List available services for this organization",
  { org_slug: z.string().optional() },
  async ({ org_slug }) => {
    const services = await yourApi.listServices(org_slug);
    return { content: [{ type: "text", text: JSON.stringify(services) }] };
  }
);

// ... repeat for each tool you support
```

**Done when:** An AI agent (Claude, GPT, etc.) can connect to your MCP server and call at least `services.list` and `scheduling.check_availability`.

---

## Step 6: Record Evidence

Evidence is what separates a service platform from a calendar. Without proof of delivery, the protocol can't resolve disputes (§7.4) or compute trust scores.

For each vertical, define what constitutes valid evidence (§5.7):

| Vertical | Minimum evidence | Capture |
|----------|-----------------|---------|
| Healthcare | GPS check-in/out + signed clinical notes | auto + manual |
| Home | Before/after photos + task checklist + client signature | manual |
| Legal | Meeting minutes + time log | manual |
| Education | Attendance record + material delivery | auto + manual |

```typescript
interface Evidence {
  type: "gps" | "signature" | "photo" | "document" | "duration" | "notes";
  captured_at: string;   // ISO 8601
  data: Record<string, unknown>;  // type-specific payload
}
```

Your implementation MUST store evidence immutably — once recorded, evidence cannot be modified. This is what enables algorithmic dispute resolution.

**Done when:** Your system records at least one evidence type per service and associates it with `proof.evidence[]`.

---

## Step 7: Validate and Get Listed

### Self-validation checklist

| # | Requirement | Spec reference | Check |
|---|-------------|---------------|-------|
| 1 | Service has all 8 dimensions | §5 | Validate against `schema/service.schema.json` |
| 2 | All 9 states are implemented | §6 | Create a service and advance it through all 9 states |
| 3 | States are strictly ordered (no skipping) | §6.1 | Attempt an invalid transition — it should fail |
| 4 | Every transition records `from`, `to`, `at`, `by` | §6.1 | Inspect the transitions array after a full cycle |
| 5 | 3+ exception flows work | §7 | Trigger each one and verify the state machine |
| 6 | MCP server connects and tools respond | §13 | Connect an agent and run a discovery query |
| 7 | Evidence is recorded | §5.7 | Complete a service and inspect `proof.evidence` |

### Schema validation

```bash
# Validate a service object against the JSON Schema
npx ajv-cli validate -s schema/service.schema.json -d your-service.json
```

### Get listed

Once your implementation passes the checklist:

1. [Open an issue](https://github.com/servicialo/mcp-server/issues) with:
   - Your platform name and vertical
   - Coverage: dimensions / states / exception flows
   - API endpoint or MCP server package
2. A maintainer will verify and add you to the [Implementations table](./README.md#implementations).

**Done when:** Your implementation passes all 7 checks and is listed in the README.

---

## What's optional (but worth knowing about)

These are not required for compliance but are defined in the spec:

| Feature | Spec section | When to adopt |
|---------|-------------|--------------|
| Service Orders | §8 | When you sell packages, plans, or multi-session agreements |
| Delegated Agency Model | §10 | When AI agents act on behalf of users (mandates, scopes, audit) |
| Provider Profiles | §12 | When you need structured, machine-readable provider discovery |
| Network Intelligence | §14 | When you want to contribute/receive aggregate benchmarks |

---

## Reference

- **Full specification:** [`PROTOCOL.md`](./PROTOCOL.md)
- **JSON Schema:** [`schema/service.schema.json`](./schema/service.schema.json)
- **Working example:** [`examples/minimal-implementation.md`](./examples/minimal-implementation.md)
- **Reference MCP server:** [`packages/mcp-server/`](./packages/mcp-server/)
- **Reference implementation:** [Coordinalo](https://coordinalo.com) (healthcare vertical)
