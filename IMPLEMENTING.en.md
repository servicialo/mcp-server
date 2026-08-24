# Implementing Servicialo

A step-by-step guide for building a Servicialo-compatible platform. You don't need to implement everything — just the core that makes your service data interoperable.

> **Protocol version:** 0.10 · **Spec:** [`PROTOCOL.md`](./PROTOCOL.md) · **Schema:** [`schema/service.schema.json`](./schema/service.schema.json)

---

## What "compatible" means

To be listed as a Servicialo implementation ([§16](./PROTOCOL.md#16-implementations)), your platform MUST:

1. Model services using the **8 dimensions** (§5)
2. Implement the **6 core lifecycle states** (§6) — `requested → scheduled → confirmed → in_progress → completed → documented`. The states `invoiced → collected → verified` are an OPTIONAL extension: bundle them into the session lifecycle or manage them independently. Transitions are **strictly ordered within the sequence you implement**, and no total order is imposed across delivery, evidence, acceptance and settlement ([§6.0](./PROTOCOL.md#60-happy-path-milestones-and-orthogonal-dimensions))
3. Handle at least **3 exception flows** (§7)
4. Expose **at least one machine-to-machine binding** exposing the 6 CORE operations and declaring supported profiles and versions — HTTP (normative), MCP (reference, recommended for agents), A2A, or an equivalent. A purely HTTP implementation is conformant without MCP

### The 6 CORE operations

The canonical, machine-readable list is in
[`protocol/manifest.yaml`](./protocol/manifest.yaml) under
`conformance.core.required_operations`; this table restates it and
`scripts/verify-conformance-parity.mjs` fails CI if they disagree. Each satisfies
one clause of the CORE sentence in
[`certification.md`](./public/spec/certification.md): *a consumer MUST be able to
discover an offer, know its availability before committing it, create the
commitment, manage that commitment's lifecycle, and record evidence of delivery.*

| Operation | Clause it satisfies |
|---|---|
| `registry.manifest` | the node declares itself (protocol version + endpoints) |
| `services.list` | discover an offer |
| `scheduling.check_availability` | know availability before committing it |
| `scheduling.book` | create the commitment |
| `lifecycle.transition` | manage the lifecycle |
| `delivery.record_evidence` | record evidence of delivery |

Not required: `registry.search` (a resolver concern — you are discoverable by
registering); `scheduling.confirm`, `delivery.checkin` and `delivery.checkout`
(conveniences, expressible through `lifecycle.transition` and
`delivery.record_evidence`); `payments.create_sale` (settlement — OPTIONAL / FULL).

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

## Step 2: Implement the 6+3 Lifecycle States

Transitions are strictly ordered within the sequence you implement — no skipping (§6.1). The first 6 (`requested` → `documented`) are the required core. States 7–9 are an optional extension covering settlement and acceptance: `invoiced` and `collected` are settlement, `verified` is acceptance/verification — not a financial state. Implement them if your platform covers close-out.

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

| Phase | Endpoint | MCP tool | Level |
|-------|----------|----------|-------|
| 1. Discover | `GET /v1/manifest` | `registry.manifest` | REQUIRED |
| 1. Discover | `GET /v1/organizations/{org_slug}/services` | `services.list` | REQUIRED |
| 1. Discover | `GET /v1/organizations/{org_slug}/availability?from=&to=` | `scheduling.check_availability` | REQUIRED |
| 3. Commit | `POST /v1/sessions` | `scheduling.book` | REQUIRED |
| 3. Commit | `POST /v1/sessions/{id}/confirm` | `scheduling.confirm` | OPTIONAL |
| 4. Manage | `POST /v1/sessions/{id}/lifecycle/transition` | `lifecycle.transition` | REQUIRED |
| 5. Verify | `POST /v1/sessions/{id}/evidence` | `delivery.record_evidence` | REQUIRED |
| 5. Verify | `POST /v1/sessions/{id}/checkin` | `delivery.checkin` | OPTIONAL |

These are the paths the reference client actually calls. They are documented in
[`spec/HTTP_PROFILE.md`](./spec/HTTP_PROFILE.md) 1.1.0 and checked against the
tool sources in CI. If you expose different paths, the reference MCP server
cannot talk to your backend without an adapter of your own.

For a complete walkthrough with request/response examples, see [`examples/minimal-implementation.md`](./examples/minimal-implementation.md).

**Done when:** An HTTP client can create a service, advance it through the 6 core states (plus the financial states if you implement them), and trigger each of your 3 exception flows.

---

## Step 5: Connect an MCP Server

The MCP server is the bridge between AI agents and your API. You have two options:

**Option A: Use the reference MCP server** with the `http` adapter, pointed at your backend:

```json
{
  "mcpServers": {
    "your-platform": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_ADAPTER": "http",
        "SERVICIALO_BASE_URL": "https://your-backend.com",
        "SERVICIALO_API_KEY": "your_api_key",
        "SERVICIALO_ORG_ID": "your_org_id"
      }
    }
  }
}
```

The reference server ships a pluggable adapter layer (`SERVICIALO_ADAPTER`): `coordinalo` (default, Coordinalo-style backend) and `http`, which translates every tool handler to the canonical `/v1/*` endpoints of [`spec/HTTP_PROFILE.md`](./spec/HTTP_PROFILE.md). If your backend exposes the HTTP profile, no fork or modification is needed — see [Step 8](#step-8--verify-http-compatibility).

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
| 2 | The 6 core states are implemented | §6 | Create a service and advance it through the 6 core states (`invoiced/collected/verified` are an optional extension) |
| 3 | Strictly ordered within the implemented sequence | §6.1, §6.0 | Attempt an invalid transition — it should fail. No total order is required across delivery, evidence, acceptance and settlement |
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

The listing process is single and defined in [IMPLEMENTORS.md](./IMPLEMENTORS.md):

1. Run the HTTP compatibility suite (Step 8) and save the output.
2. Open a **PR** adding your row to the IMPLEMENTORS.md table, including the
   suite output and evidence for the checklist above (dimensions / states /
   exception flows).
3. The team reviews against the [conformance matrix](./public/spec/certification.md)
   and assigns a CORE or FULL level before merging.

**Done when:** Your implementation passes all 7 checks and your IMPLEMENTORS.md PR is merged.

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

---

## Step 8 — Verify HTTP compatibility

Before requesting a listing in the official registry, verify that your implementation
passes the HTTP compatibility suite:

```bash
SERVICIALO_BASE_URL=https://your-backend.com \
SERVICIALO_API_KEY=your_api_key \
SERVICIALO_ORG_ID=your_org_id \
npm run test:http-compat --prefix packages/mcp-server
```

The suite invokes the **real tool handlers** through the HTTP adapter, so it
exercises the same codepath an agent uses. It reports two levels separately:

- **(a) Binding** — `CORE required operations: n/n` and `optional: m/k`. The
  verdict `HTTP-COMPATIBLE` means exactly that: **the required CORE operations
  respond.**
- **(b) Certification** — *not evaluated by this suite.* Every run prints the
  CORE requirements still needing additional or manual verification:
  invalid-transition rejection, the remaining exception flows, schema
  conformance and the agent card.

**What this suite certifies and what it does not:** it verifies that your HTTP
surface exposes the [HTTP profile](./spec/HTTP_PROFILE.md) endpoints and that they
respond with plausible shapes. It does **not** certify protocol conformance: the
normative requirements (8 dimensions, strict lifecycle ordering, exception flows,
schema validity) are verified by manual review against the
[requirement → verification matrix](./public/spec/certification.md#requirement--verification-matrix),
which assigns the **CORE** or **FULL** level.

Save the suite output — you will need it when opening the PR in [IMPLEMENTORS.md](./IMPLEMENTORS.md).
