# Delegated Agency Model

> **Servicialo Protocol v0.8 — Section 10**
> **Status:** Draft
> **Supersedes:** Section 10 (Agent Decision Model) of v0.7, which becomes §10.6 within this section.

---

## 10.1 Motivation and Principles

Professional services operate in a trust economy. A patient trusts their kinesiologist. A client trusts their attorney. When an AI agent enters this relationship — scheduling appointments, reading clinical history, processing payments — the trust does not transfer automatically. It must be explicitly delegated, bounded, and auditable.

The Delegated Agency Model solves a fundamental problem: **how does a protocol that treats AI agents as first-class citizens (Principle 6) ensure that those agents never exceed the authority granted to them by the humans they serve?**

Existing approaches fall into two failure modes:

1. **API keys as identity.** The agent authenticates as the organization, inheriting all permissions. There is no record of _who_ authorized _what_, no scope limitation, and no way to revoke a specific delegation without rotating the entire key.

2. **Role-based proxying.** The agent acts "as" a user via impersonation. The audit trail becomes unreliable — did the human act, or the agent? Accountability collapses.

The Delegated Agency Model introduces a third path: **explicit mandates**. A human principal issues a `ServiceMandate` that grants an agent specific capabilities, within a defined context, for a bounded duration. Every action taken under a mandate is signed with the mandate's identity. The mandate can be revoked instantly, and revocation propagates to all pending actions.

### Design principles

1. **No self-issuance.** An agent cannot create its own mandate. Authority always flows from a human principal — a professional, patient, or organizational administrator.

2. **Deny by default.** An agent with no valid mandate has zero capabilities beyond public discovery (Phase 1 tools). Scopes are additive: you grant what is needed, nothing more.

3. **Conflict-of-interest transparency.** The `acting_for` field declares whose interests the agent serves in a given transaction. An agent cannot act for the professional and the patient simultaneously within the same service interaction. This is not a technical limitation — it is a protocol rule that prevents structural conflicts.

4. **Audit immutability.** Every action taken under a mandate produces an audit entry: mandate ID, agent ID, action, timestamp, and result. The audit log is append-only and cannot be retroactively modified.

5. **Graceful degradation.** When a mandate expires or is revoked mid-operation, the agent must halt, preserve state, and surface the situation to the principal. It must not attempt to complete partial operations or cache credentials for later use.

6. **Stack agnosticism.** The mandate model defines contracts and validation rules. It does not prescribe storage, transport, or cryptographic mechanisms. Implementations may use JWTs, database records, or blockchain entries — the protocol only requires that the fields, lifecycle, and validation rules are honored.

---

## 10.2 The ServiceMandate

A `ServiceMandate` is a first-class protocol object that represents the explicit delegation of capability from a human principal to an agent.

### 10.2.1 Formal definition

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mandate_id` | string (UUID v4) | ✅ | Unique identifier for this mandate. |
| `principal_id` | string | ✅ | The human or organization that issues the mandate. Must reference a valid entity in the protocol (provider, patient, or organization administrator). |
| `principal_type` | enum | ✅ | `professional` \| `patient` \| `organization` — the role of the issuing entity. |
| `agent_id` | string | ✅ | The agent that receives the delegation. Opaque identifier; the protocol does not define agent registration (that is an implementation concern). |
| `agent_name` | string | | Human-readable label for the agent (e.g., `"Coordinalo Scheduling Agent"`). For audit readability. |
| `acting_for` | enum | ✅ | `professional` \| `patient` \| `organization` — whose interests this agent serves in actions taken under this mandate. |
| `context` | string | ✅ | Scope boundary. Format: `{context_type}:{context_id}`. Examples: `org:mamapro`, `personal:barbara`, `order:so_abc123`. Limits the mandate's applicability to a specific organizational or personal context. |
| `scopes` | string[] | ✅ | List of granted capabilities. See §10.2.2. Minimum one scope required. |
| `constraints` | object | | Optional additional restrictions. See §10.2.3. |
| `issued_at` | datetime (ISO 8601) | ✅ | When the mandate was created. |
| `expires_at` | datetime (ISO 8601) | ✅ | When the mandate ceases to be valid. Maximum duration is an implementation decision, but the protocol recommends ≤ 90 days with renewal. |
| `revoked_at` | datetime (ISO 8601) | | Set when the principal explicitly revokes the mandate before expiration. |
| `revocation_reason` | string | | Human-readable reason for revocation. |
| `status` | enum | ✅ | `active` \| `expired` \| `revoked` \| `suspended` — computed from `expires_at`, `revoked_at`, and suspension state. |
| `metadata` | object | | Implementation-specific data. The protocol does not interpret this field. |

### 10.2.2 Scopes

Scopes follow the pattern `{resource}:{action}` and are additive (deny-by-default). An agent may only perform actions for which it holds an explicit scope in a valid, active mandate.

**Protocol-defined scopes:**

| Scope | Description | Typical mandate |
|-------|-------------|-----------------|
| `schedule:read` | View availability and scheduled services | Scheduling agent |
| `schedule:write` | Book, reschedule, cancel services | Scheduling agent |
| `patient:read` | Read patient/client records | Clinical agent |
| `patient:write` | Create or update patient/client records | Intake agent |
| `service:read` | View service details and lifecycle state | Any operational agent |
| `service:write` | Transition service lifecycle states | Lifecycle agent |
| `payment:read` | View billing status and payment history | Reconciliation agent |
| `payment:write` | Create invoices and record payments | Billing agent |
| `document:read` | Read clinical notes and documentation | Documentation agent |
| `document:write` | Create or update documentation | Documentation agent |
| `order:read` | View Service Order details and ledger | Account management agent |
| `order:write` | Create, propose, or modify Service Orders | Sales agent |
| `evidence:write` | Submit proof-of-delivery evidence | Delivery verification agent |
| `mandate:read` | View mandates issued by this principal | Administrative agent |
| `mandate:admin` | Suspend mandates (not issue — only principals issue) | Organizational admin agent |

**Scope hierarchy:** There is no implicit hierarchy. `patient:write` does NOT imply `patient:read`. Both must be explicitly granted if both are needed.

**Custom scopes:** Implementations may define additional scopes prefixed with `x-` (e.g., `x-clinical:prescribe`). The protocol does not validate custom scopes but requires they follow the `{resource}:{action}` pattern.

### 10.2.3 Constraints

Optional additional restrictions that narrow a mandate beyond its scopes:

| Constraint | Type | Description |
|------------|------|-------------|
| `max_actions_per_day` | integer | Maximum number of actions the agent may perform per calendar day under this mandate. |
| `allowed_hours` | object | Time window restriction: `{ start: "08:00", end: "20:00", timezone: "America/Santiago" }`. Actions outside this window are rejected. |
| `ip_allowlist` | string[] | Network-level restriction. Implementation-specific. |
| `require_confirmation_above` | object | Financial threshold: `{ amount: 100000, currency: "CLP" }`. Actions involving amounts above this require human confirmation regardless of scope. |
| `service_types` | string[] | Restrict to specific service types (e.g., `["physical_therapy_session"]`). |

Constraints are optional but, when present, are enforced conjunctively (all constraints must be satisfied).

---

## 10.3 Mandate Lifecycle

```
                    ┌─────────────────────────────────┐
                    │                                  │
   Principal        │         ┌──────────┐             │
   issues      ─────┤────────►│  active  │             │
   mandate          │         └────┬─────┘             │
                    │              │                    │
                    │         ┌────┴─────────────┐      │
                    │         │                  │      │
                    │    time passes        principal   │
                    │    (expires_at)       revokes     │
                    │         │                  │      │
                    │         ▼                  ▼      │
                    │    ┌─────────┐      ┌─────────┐  │
                    │    │ expired │      │ revoked │  │
                    │    └─────────┘      └─────────┘  │
                    │                                  │
                    │    ┌───────────┐                  │
                    │    │ suspended │◄── org admin     │
                    │    └─────┬─────┘   or system      │
                    │          │                        │
                    │     reactivate                    │
                    │     or expire                     │
                    │          │                        │
                    │          ▼                        │
                    │    active / expired               │
                    └─────────────────────────────────┘
```

### 10.3.1 Issuance

A mandate is created when a human principal explicitly delegates capability to an agent. Issuance rules:

1. The `principal_id` must reference a verified entity in the system.
2. The principal must have the authority to grant the requested scopes. A professional can grant `schedule:write` for their own calendar; they cannot grant `payment:write` for the organization unless they hold an organizational role that permits it.
3. The `acting_for` field must be consistent with the principal's role. A patient can issue a mandate with `acting_for: "patient"`. A patient cannot issue a mandate with `acting_for: "professional"`.
4. `issued_at` is set to the current timestamp. `expires_at` must be in the future.
5. `status` is set to `active`.

**An agent cannot issue a mandate for itself or for another agent.** The issuance chain always terminates at a human.

### 10.3.2 Validation on use

Every time an agent presents a mandate to perform an action, the implementation must validate:

1. **Existence:** The `mandate_id` references a known mandate.
2. **Status:** The mandate's `status` is `active`.
3. **Temporal validity:** `issued_at ≤ now < expires_at` and `revoked_at` is null.
4. **Agent identity:** The requesting `agent_id` matches the mandate's `agent_id`.
5. **Scope coverage:** The requested action falls within the mandate's `scopes`.
6. **Context match:** The action's context (organization, patient, order) matches the mandate's `context`.
7. **Conflict-of-interest check:** The `acting_for` does not conflict with the other party in the transaction (see §10.4, Rule 4).
8. **Constraints satisfaction:** If `constraints` are defined, all applicable constraints are met (time window, daily limit, financial threshold).

If any check fails, the action is rejected. The rejection is logged in the audit trail with the specific validation failure.

### 10.3.3 Expiration

When the current time exceeds `expires_at`, the mandate transitions to `expired`. This is a passive transition — no explicit action is required. Implementations should check temporal validity on every use rather than relying on background expiration jobs.

Active operations initiated before expiration may complete if they are atomic. Multi-step operations (e.g., a booking that requires confirmation) must re-validate the mandate at each step.

### 10.3.4 Revocation

A principal may revoke a mandate at any time by setting `revoked_at` to the current timestamp and `status` to `revoked`.

**Revocation propagation:** When a mandate is revoked:
- All pending (non-completed) actions initiated under this mandate must be halted.
- The agent must be notified (mechanism is implementation-specific: webhook, polling, event stream).
- Actions already completed are not rolled back — they remain in the audit trail with their mandate reference.
- The agent must surface the revocation to the user and request a new mandate if continued operation is needed.

### 10.3.5 Suspension

An organizational administrator or system process may temporarily suspend a mandate without revoking it. Suspension is reversible:
- `status` transitions to `suspended`.
- While suspended, the mandate fails validation (same as revoked) but can be reactivated.
- If `expires_at` passes during suspension, the mandate transitions to `expired` and cannot be reactivated.

Suspension is useful for: security incidents, investigation periods, and temporary access freezes.

---

## 10.4 Validation Rules

The following rules are normative. Any implementation claiming Servicialo v0.8 compliance must enforce them.

**Rule 1: No self-issuance.** `principal_id` must reference a human entity. The `agent_id` in a mandate must not equal the `principal_id`. An agent cannot issue, modify, extend, or renew its own mandate.

**Rule 2: Scope minimality.** Implementations should warn (not block) when a mandate is issued with scopes that exceed the agent's known tool requirements. The protocol defines this as a SHOULD, not a MUST, to avoid over-constraining novel agent architectures.

**Rule 3: Temporal boundedness.** Every mandate must have a finite `expires_at`. Perpetual mandates are not valid. The protocol recommends a maximum of 90 days, renewable by the principal.

**Rule 4: Conflict-of-interest isolation.** Within a single service interaction (identified by `service.id`), an agent cannot hold active mandates with conflicting `acting_for` values. Concretely: if Agent A holds a mandate with `acting_for: "professional"` and attempts to act on a service where it also holds a mandate with `acting_for: "patient"`, the second action must be rejected.

**Rule 5: Context confinement.** A mandate with `context: "org:mamapro"` cannot be used to perform actions on entities belonging to `org:other_clinic`. Context is a hard boundary, not a suggestion.

**Rule 6: Revocation immediacy.** Revocation takes effect immediately. There is no grace period. Implementations must not cache mandate validity beyond the duration of a single atomic operation.

**Rule 7: Audit completeness.** Every action taken under a mandate produces an audit entry. Every rejection produces an audit entry. The audit trail for a mandate must be complete — there must be no action attributable to a mandate that lacks a corresponding audit record.

**Rule 8: Graceful degradation on mandate loss.** When an agent's mandate expires or is revoked during a multi-step operation, the agent must: (a) halt further actions, (b) preserve any in-progress state without data loss, and (c) surface the mandate loss to the relevant human. It must not retry, escalate its own permissions, or fall back to a different mandate without explicit authorization.

---

## 10.5 Audit Model

The audit model ensures that every action taken within the protocol can be attributed to a specific agent, authorized by a specific principal, at a specific time.

### 10.5.1 Audit entry structure

| Field | Type | Description |
|-------|------|-------------|
| `audit_id` | string (UUID v4) | Unique identifier for this audit entry. |
| `mandate_id` | string | Reference to the ServiceMandate under which the action was performed. |
| `agent_id` | string | The agent that performed the action. |
| `principal_id` | string | The human principal who authorized the mandate. |
| `acting_for` | enum | Inherited from the mandate: `professional` \| `patient` \| `organization`. |
| `action` | string | The action performed. Format: `{tool_name}` or `{resource}.{operation}` (e.g., `scheduling.book`, `lifecycle.transition`). |
| `action_input` | object | Sanitized input parameters. Implementations must redact sensitive fields (e.g., patient clinical data) according to their data classification policy. |
| `action_result` | enum | `success` \| `failure` \| `rejected` \| `halted`. |
| `failure_reason` | string | If `action_result` is `failure` or `rejected`, the reason. |
| `resource_id` | string | The primary resource affected (service ID, patient ID, etc.). |
| `context` | string | Inherited from the mandate. |
| `timestamp` | datetime (ISO 8601) | When the action was performed. |
| `ip_address` | string | Source IP of the request. Implementation-specific. |
| `request_id` | string | Correlation ID for distributed tracing. Implementation-specific. |

### 10.5.2 Audit requirements

1. **Append-only.** Audit entries cannot be modified or deleted. Implementations may archive entries to cold storage after a retention period but must not purge them.

2. **Complete attribution.** Every mutating action in the protocol (state transitions, record creation, payment processing) must produce an audit entry when performed by an agent. Actions performed directly by humans through a UI may optionally produce audit entries — the protocol does not mandate it but recommends it.

3. **Queryable by mandate.** Implementations must support querying all audit entries for a given `mandate_id`. This enables principals to review everything an agent has done under a specific delegation.

4. **Queryable by principal.** Implementations must support querying all audit entries across all mandates for a given `principal_id`. This enables a professional or organization to see all agent activity authorized by them.

5. **Retention.** The protocol does not define a minimum retention period. Implementations should follow applicable regulations (e.g., healthcare record retention requirements in their jurisdiction).

### 10.5.3 Integration with existing audit trail

The `transition` object in the service lifecycle (§5) already includes `by` and `method` fields. Under v0.8, when `method` is `agent`:

- The `by` field must contain the `agent_id`.
- The transition `metadata` must include `mandate_id`.
- A corresponding audit entry must exist in the mandate audit trail.

This creates a dual audit path: the service's lifecycle transitions record _what happened_, and the mandate audit trail records _who authorized it and under what delegation_.

---

## 10.6 Agent Decision Model (Updated)

> This section updates the Agent Decision Model from v0.7 to integrate with the Delegated Agency Model.

The autonomy matrix from v0.7 (§10 in the previous version) remains valid. The v0.8 update adds one requirement: **every agent action — whether autonomous or requiring human confirmation — must be performed under a valid ServiceMandate.**

The autonomy level determines _whether_ the agent can act without confirmation. The mandate determines _whether_ the agent is authorized to act at all.

| Dimension | Determined by |
|-----------|--------------|
| **Can the agent act?** | ServiceMandate (scopes, context, constraints) |
| **Can the agent act autonomously?** | Agent Decision Model (autonomy matrix from v0.7) |
| **Is the action recorded?** | Audit Model (always yes for agent actions) |

When a transition falls in the "requires human confirmation" category AND the agent holds the appropriate scope, the agent must:
1. Validate its mandate (§10.3.2).
2. Surface the decision to the human principal identified in the mandate.
3. Wait for explicit confirmation.
4. Record both the request-for-confirmation and the confirmation/rejection in the audit trail.

---

## 10.7 Reference Use Cases

### 10.7.1 Scheduling agent

**Scenario:** Clínica Mamá Pro uses a scheduling agent to manage appointment bookings for Dra. Bárbara (kinesiologist).

**Mandate:**
```json
{
  "mandate_id": "mdt_01JAXYZ...",
  "principal_id": "provider_barbara",
  "principal_type": "professional",
  "agent_id": "agent_coordinalo_scheduler",
  "agent_name": "Coordinalo Scheduling Agent",
  "acting_for": "professional",
  "context": "org:mamapro",
  "scopes": [
    "schedule:read",
    "schedule:write",
    "patient:read",
    "service:read"
  ],
  "constraints": {
    "allowed_hours": {
      "start": "07:00",
      "end": "21:00",
      "timezone": "America/Santiago"
    },
    "service_types": ["physical_therapy_session", "evaluation"]
  },
  "issued_at": "2026-03-01T10:00:00-03:00",
  "expires_at": "2026-05-31T23:59:59-03:00",
  "status": "active"
}
```

**Flow:**
1. Patient requests appointment via WhatsApp.
2. Agent checks availability (`schedule:read`) — mandate valid, scope covered.
3. Agent books slot (`schedule:write`) — mandate valid, scope covered, service type matches constraint.
4. Agent reads patient record to confirm requirements (`patient:read`) — mandate valid, scope covered.
5. Service transitions to `scheduled` → `confirmed`. Each transition's `metadata` includes `mandate_id`.
6. At month end, Dra. Bárbara queries audit trail for `mandate_id: mdt_01JAXYZ...` and reviews all 47 bookings the agent made.

### 10.7.2 Reconciliation agent

**Scenario:** Mamá Pro's administrative assistant authorizes an agent to reconcile payments at end of month.

**Mandate:**
```json
{
  "mandate_id": "mdt_02JBXYZ...",
  "principal_id": "admin_carolina",
  "principal_type": "organization",
  "agent_id": "agent_compensalo_reconciler",
  "agent_name": "Compensalo Reconciliation Agent",
  "acting_for": "organization",
  "context": "org:mamapro",
  "scopes": [
    "payment:read",
    "payment:write",
    "service:read",
    "order:read"
  ],
  "constraints": {
    "require_confirmation_above": {
      "amount": 500000,
      "currency": "CLP"
    }
  },
  "issued_at": "2026-03-01T00:00:00-03:00",
  "expires_at": "2026-03-31T23:59:59-03:00",
  "status": "active"
}
```

**Flow:**
1. Agent reads all services in `completed` or `documented` state for the month (`service:read`).
2. Agent cross-references with payment records (`payment:read`) and Service Order ledgers (`order:read`).
3. For standard-amount invoices, agent creates sales records (`payment:write`) — mandate valid, within financial threshold.
4. For a package worth CLP 600,000, agent hits `require_confirmation_above` constraint → pauses, surfaces to Carolina for approval.
5. Carolina confirms → agent records payment → audit entry includes both the request and the confirmation.

### 10.7.3 Patient-side agent

**Scenario:** Patient María uses a personal health agent to manage her appointments across multiple clinics.

**Mandate:**
```json
{
  "mandate_id": "mdt_03JCXYZ...",
  "principal_id": "patient_maria",
  "principal_type": "patient",
  "agent_id": "agent_health_assistant",
  "agent_name": "María's Health Assistant",
  "acting_for": "patient",
  "context": "personal:maria",
  "scopes": [
    "schedule:read",
    "schedule:write",
    "service:read"
  ],
  "issued_at": "2026-03-01T00:00:00-03:00",
  "expires_at": "2026-06-01T00:00:00-03:00",
  "status": "active"
}
```

**Conflict-of-interest enforcement:** When María's agent contacts Mamá Pro to book an appointment, two agents participate in the transaction:
- Coordinalo Scheduling Agent (`acting_for: "professional"`)
- María's Health Assistant (`acting_for: "patient"`)

Both are authorized. Neither can claim to act for the other party. The protocol ensures transparent multi-agent coordination without conflict.

---

## 10.8 Security Considerations

### 10.8.1 Mandate theft

If a `mandate_id` is leaked, an attacker could impersonate the authorized agent. Mitigations:
- Mandate validation must verify `agent_id`, not just `mandate_id`. A stolen mandate is useless without the agent's authentication credentials.
- Implementations should bind mandates to agent authentication tokens (e.g., a mandate is only valid when presented alongside a valid agent API key).
- Short expiration windows limit the blast radius of credential compromise.

### 10.8.2 Scope escalation

An agent might attempt to perform actions beyond its granted scopes by crafting requests that bypass scope checks. Mitigations:
- Scope validation is mandatory at the protocol level (Rule 5 in §10.4) — implementations cannot make it optional.
- Scopes are evaluated against the specific action, not against a role or group.
- No implicit scope hierarchy — `patient:write` does not imply `patient:read`.

### 10.8.3 Principal impersonation

An agent might attempt to issue a mandate on behalf of a principal. Mitigations:
- Rule 1 (no self-issuance) is absolute.
- Mandate issuance must occur through an authenticated channel where the principal's identity is verified by the implementation (e.g., authenticated web session, verified OAuth flow).
- Agents cannot call the mandate issuance endpoint.

### 10.8.4 Audit tampering

An attacker might attempt to modify or delete audit entries to hide unauthorized actions. Mitigations:
- Append-only storage is a protocol requirement.
- Implementations should consider write-once storage, hash chains, or external audit witnesses for high-security verticals (healthcare, legal).
- Audit entries should be written before the action is executed (write-ahead audit), not after.

### 10.8.5 Revocation race conditions

A mandate might be revoked while an agent is mid-operation. Mitigations:
- Re-validation at each step of multi-step operations (§10.3.3).
- Atomic operations (single API call) that begin before revocation may complete — this is acceptable because the revocation timestamp will show the action began before revocation.
- The audit trail records both the action and the revocation, enabling post-hoc review.

### 10.8.6 Cross-context leakage

An agent with mandates in multiple contexts (e.g., two different clinics) might inadvertently or intentionally cross data between contexts. Mitigations:
- Context confinement (Rule 5) is enforced at every action.
- Implementations should isolate agent sessions by context — an agent should not be able to hold active sessions across multiple contexts simultaneously.

---

## 10.9 Integration with Service Manifest and Discovery

The Delegated Agency Model integrates with the existing service manifest through the `visibility` field (introduced in v0.7) and extends the discovery flow.

### 10.9.1 Visibility and mandate interaction

| Visibility | Discovery | Mandate required to act? |
|------------|-----------|--------------------------|
| `public` | Indexed in catalogs, searchable | ✅ Yes — discovery is open, but actions always require a mandate |
| `unlisted` | Accessible by direct ID only | ✅ Yes — knowing the ID is not authorization to act |
| `private` | Only authorized parties | ✅ Yes — and the agent must hold a mandate whose `context` matches the service's organization |

**Key design decision:** Visibility controls _discoverability_, not _authorization_. Even for `public` services, performing any action beyond reading the service catalog requires a valid mandate. This separates the "phone book" (who exists and what they offer) from the "authority" (who can act on whose behalf).

### 10.9.2 Agent identification in transitions

The service schema's `transition.by` field and `transition.method` field gain precise semantics under v0.8:

```yaml
transition:
  from: "requested"
  to: "scheduled"
  at: "2026-03-10T14:30:00-03:00"
  by: "agent_coordinalo_scheduler"      # agent_id from mandate
  method: "agent"                        # indicates agent-mediated action
  metadata:
    mandate_id: "mdt_01JAXYZ..."         # required when method = agent
    acting_for: "professional"           # from mandate, for quick reference
    principal_id: "provider_barbara"     # from mandate, for quick reference
```

### 10.9.3 MCP server integration

The MCP server (§11) must be updated to:

1. **Accept a mandate reference** in every authenticated tool call. The `actor` parameter in existing tools is extended:

```typescript
actor: {
  type: "agent",
  id: "agent_coordinalo_scheduler",
  mandate_id: "mdt_01JAXYZ...",          // new in v0.8
  on_behalf_of: {
    type: "professional",
    id: "provider_barbara"
  }
}
```

2. **Validate the mandate** before executing any tool. The validation middleware checks the 8 validation points from §10.3.2.

3. **Produce audit entries** for every tool execution, regardless of success or failure.

4. **Reject tool calls** where `actor.type === "agent"` and no valid `mandate_id` is provided.

### 10.9.4 Service Order mandate requirements

Service Orders involve financial commitments and contractual obligations. The mandate model adds specific requirements:

- **Creating a Service Order** (`order:write`): Requires a mandate from the organization.
- **Proposing a Service Order** (`order:write`): Requires human confirmation regardless of mandate (irreversibility rule from §10.6).
- **Activating a Service Order** (`order:write`): Requires client acceptance — the agent acting for the organization cannot accept on behalf of the client.
- **Ledger updates**: Automatic, triggered by service verification. The agent's mandate must include `order:read` to view the ledger.

---

## 10.10 Schema

**Machine-readable JSON Schema:** [`schema/service-mandate.schema.json`](./schema/service-mandate.schema.json)

The canonical YAML representation:

```yaml
service_mandate:
  mandate_id: string*          # UUID v4
  principal_id: string*        # Who delegates
  principal_type: enum*        # professional | patient | organization
  agent_id: string*            # Who acts
  agent_name: string           # Human-readable agent label
  acting_for: enum*            # professional | patient | organization
  context: string*             # {type}:{id} — org:mamapro, personal:maria
  scopes: string[]*            # Resource:action pairs
  constraints:
    max_actions_per_day: integer
    allowed_hours:
      start: string            # HH:mm
      end: string              # HH:mm
      timezone: string         # IANA timezone
    ip_allowlist: string[]
    require_confirmation_above:
      amount: number
      currency: string         # ISO 4217
    service_types: string[]
  issued_at: datetime*
  expires_at: datetime*
  revoked_at: datetime
  revocation_reason: string
  status: enum*                # active | expired | revoked | suspended
  metadata: object
```

Fields marked with `*` are required.
