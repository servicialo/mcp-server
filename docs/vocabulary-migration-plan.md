# Vocabulary migration plan — `delivered`/`charged` → `completed`/`invoiced`/`collected`

| | |
|---|---|
| **Status** | **Plan only.** Nothing here is implemented, scheduled, or announced. |
| **Created** | 2026-08-23 |
| **Protocol version at time of writing** | 0.10 (draft) · `@servicialo/mcp-server` 0.9.13 |
| **Governs** | The reference MCP binding's divergent lifecycle vocabulary |
| **Depends on** | [RFC-001](https://github.com/servicialo/mcp-server/pull/13) §3.2 (categories), §3.5 (versioning), §3.6 (deprecation), §3.7 (version coexistence), §3.8–§3.9 (communication) |

The divergence is recorded today in `protocol/manifest.yaml` under
`state_machines.service_lifecycle.reference_implementation_divergence`, with the
note *"Known divergence — do not change without a coordinated migration."* This
document is that coordinated migration, as a plan. Implementation is a separate
session and a separate approval.

---

## 1. What is actually diverging

Three different things in this repository use the words `delivered` and `charged`.
Only one of them is the divergence. Getting this wrong is the single largest risk
in the migration, so it comes first.

### 1.1 The divergence — migrate

The reference MCP binding's **lifecycle** vocabulary:

```
reference MCP:  requested → scheduled → confirmed → in_progress → delivered → documented → charged → verified
canonical:      requested → scheduled → confirmed → in_progress → completed → documented → invoiced → collected → verified
```

Source of truth for the canonical set: `schema/service.schema.json`
(`lifecycle.current_state`), `PROTOCOL.md` §6.

### 1.2 `billing.status.charged` — canonical, do NOT touch

`billing.status` is a **different axis** with its own track, and `charged` is a
legitimate, canonical value in it:

```
pending → charged → invoiced → paid ↘ disputed
```

`PROTOCOL.md` §5.8, §12.8.1, and `schema/service.schema.json` `billing.status`.
Here `charged` means *"the amount was debited from the client's balance or added
to their debt"* — an accrual. It is not the lifecycle state of the same name, and
it is not going anywhere.

**The word `charged` is doing two unrelated jobs in this codebase.** One is being
removed and one is being kept. Any migration note that says "`charged` is
deprecated" without saying which one will cause someone to delete the wrong one.

### 1.3 Webhook delivery status — unrelated domain

`lib/webhooks/dispatch.ts` defines
`DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'abandoned'`, describing
whether an HTTP webhook reached its subscriber. Same word, different universe.
`WEBHOOKS.md` and `lib/webhooks/storage.ts` likewise. **Out of scope entirely.**

### 1.4 Prose

English usage of "delivered" in narrative text where no state is meant. No action.

---

## 2. The mapping is not a bijection

This is why the migration is not a rename.

| Direction | Mapping | Property |
|---|---|---|
| `delivered` → `completed` | 1:1 | Clean. A pure rename. |
| `charged` → `invoiced` \| `collected` | **1:2** | **Ambiguous forward.** One legacy state covers two canonical ones. |
| `invoiced` → `charged`, `collected` → `charged` | 2:1 | **Lossy backward,** but deterministic. |

Legacy `charged` does not carry enough information to say whether a tax document
was issued or money was received. Those are different facts, and `PROTOCOL.md`
§6.5 makes the difference load-bearing: *"Implementations that calculate provider
compensation MUST read only sessions in `collected` state."* Guessing here pays
people against money that has not arrived, or withholds pay that has.

### 2.1 Proposed resolution

**Legacy `charged` maps forward to `invoiced`, never to `collected`.**

Rationale: Coordinalo's `charged` records the economic fact (an accrual), which is
semantically nearer `invoiced` than `collected`; and the error directions are not
symmetric. Mapping to `invoiced` under-recognizes — payroll waits for an explicit
`collected`. Mapping to `collected` over-recognizes — payroll pays out against
unreceived money. When one error is recoverable and the other is a cash loss, the
mapping goes toward the recoverable one.

**Reaching `collected` therefore requires an explicit new transition** that the
legacy vocabulary had no way to express. That is not a defect of the mapping; it
is the information the legacy vocabulary never carried, surfacing.

---

## 3. Coordinate with the settlement enum change — one window, not two

An implementer facing two serialized breaking changes to adjacent enums abandons.
Two enum changes are in flight for v1.0 and MUST ship as **one deprecation
cycle**:

| Change | Enum | Source |
|---|---|---|
| Lifecycle rename + split | `lifecycle.current_state` | this plan |
| `credited`, `partial_credit` | `billing.status` | [RFC-003](https://github.com/servicialo/mcp-server/pull/13) §3.9 |
| `charged_back` (unconsented reversal) | `billing.status` | [`q12b-chargeback-terminal-state.md`](issue-templates/stress-test-v0.10/q12b-chargeback-terminal-state.md) |

The interaction is not merely scheduling convenience. All three touch `charged`
or the enum containing it. Shipping them separately means announcing *"`charged`
is being removed"* in one release and *"`charged` is staying"* in the next, about
two different enums, to the same audience. One window lets a single note lead with
§1's disambiguation and then state every change against it.

Consolidated table for the announcement:

| Enum | Value | v1.0 | v1.2 (removal target) |
|---|---|---|---|
| lifecycle | `delivered` | deprecated, accepted | removed |
| lifecycle | `charged` | deprecated, accepted, maps to `invoiced` | removed |
| lifecycle | `completed` | canonical | canonical |
| lifecycle | `invoiced` | canonical | canonical |
| lifecycle | `collected` | canonical | canonical |
| `billing.status` | `charged` | **canonical, unchanged, not deprecated** | canonical |
| `billing.status` | `credited`, `partial_credit` | added (RFC-003) | canonical |
| `billing.status` | `charged_back` | added, if accepted | canonical |

---

## 4. Impact inventory

### 4.1 MCP tools — 3 of 40 affected, 1 protected

| Tool | Surface | Class |
|---|---|---|
| `lifecycle.transition` | `to_state` Zod enum **and** the transition chain in its description — `packages/mcp-server/src/tools/authenticated/lifecycle.ts:19,24` | **Contract.** The only tool whose declared wire contract carries the divergence. |
| `lifecycle.get_state` | Response only. Pass-through `GET .../lifecycle`; no enum is declared anywhere in the MCP layer — `lifecycle.ts:12–14` | **Contract, undeclared.** Returns upstream vocabulary that nothing in this repository enumerates. |
| `docs.quickstart` | Catalog strings — `delivery.checkout` described as *"→ delivered"*, `payments.create_sale` as *"→ charged state"* — `packages/mcp-server/src/tools/public/docs-quickstart.ts:83,86` | Documentation payload served to agents. |
| `payments.record_payment` | Description states `billing.status` goes `charged → invoiced → paid` — `cerrar.ts:47` | **NOT affected — protect.** This is §1.2's canonical billing axis and is correct as written. |

`lifecycle.get_state` is the one to watch. Because no enum is declared on the
response side, a change to `lifecycle.transition` alone produces a server that
**accepts `completed` and returns `delivered`** — asymmetric, and silently so.

Note also that `delivery.checkout`'s own tool description is clean; only the
`docs.quickstart` catalog entry *describing* it is wrong.

### 4.2 The blocking structural finding: there is no mapping layer

`packages/mcp-server/src/adapter.ts` contains no translation. `lifecycle.transition`
forwards the caller's value straight through:

```ts
return client.post(`/coordinalo/sessions/${args.session_id}/lifecycle/transition`, {
  toState: args.to_state,   // caller's value, unmapped
  ...
});
```

So the MCP enum value **is** the upstream API's wire value. The migration is
therefore not "rename strings in a tool definition" — it is **"introduce a
translation boundary that does not exist today"**, in both directions, for both
requests and responses. That is the bulk of the implementation work and it should
be scoped as such before any date is committed.

### 4.3 HTTP binding — already canonical, no change

| Surface | State |
|---|---|
| `spec/HTTP_PROFILE.md` §7.2 `lifecycle.transition` | `to_state` documented as `scheduled, confirmed, in_progress, completed, documented, invoiced, collected, verified, cancelled` — **already correct** |
| `spec/openapi.yaml` | Zero occurrences of `delivered`/`charged` as lifecycle states — **already correct** |

The divergence is confined to the MCP binding. The HTTP binding, which is the
normative one, never had it. Worth saying out loud in the announcement: an
implementer on HTTP has nothing to do.

### 4.4 Schemas — canonical, no change

`schema/service.schema.json` carries the canonical `lifecycle.current_state` enum
and the canonical `billing.status` enum. Neither changes for the rename. (Both
`billing.status` additions in §3 do change it, in the same window.)

### 4.5 Discovery and mirrored artifacts

| Surface | Action |
|---|---|
| `public/spec/schemas/agent-card.json` | `lifecycle_states` currently accepts `charged` alongside the canonical set, with a `$comment` explaining it is a compatibility allowance for the divergent MCP enum. The allowance is removed at the removal milestone, not at deprecation. Note it never accepted `delivered`. |
| `packages/mcp-server/.smithery/shttp/manifest.json` | Committed mirror of the tool surface; carries the `lifecycle.transition` description and enum verbatim. Must be regenerated in the same change or it becomes the stalest public copy. |
| `protocol/manifest.yaml` | `reference_implementation_divergence` block is deleted at removal, and amended at deprecation to point at this plan. |

### 4.6 Documentation

| Surface | Action |
|---|---|
| `public/spec/intents.md:940` | **Existing bug.** The lifecycle table maps wire value `cobrado` → canonical `charged`; the canonical value is `collected`. Fix in the deprecation release, not before — fixing it alone leaves the table right and the tool enum wrong, which is worse than a consistent error. |
| `packages/mcp-server/README.md` / `.en.md` | Lifecycle chain shown in prose. |
| `IMPLEMENTING.md` / `.en.md`, `SPEC.md`, `README.md` / `.en.md` | Prose occurrences; audit at deprecation. |
| `docs/whitepaper.md` | 39 occurrences, but it is an **archived v0.9 snapshot** and explicitly excluded from `verify-doc-claims`. Leave it. |

### 4.7 Not affected — protect against over-eager find-and-replace

- `billing.status.charged` everywhere (§1.2)
- `lib/webhooks/*` and `WEBHOOKS.md` delivery statuses (§1.3)
- `ledger.amount_collected` on the Service Order — unrelated field that happens to
  share a root with `collected`
- A2A task states (`spec/openapi.yaml:2897`: `submitted | working | input-required |
  completed | failed | canceled`) — a different state machine that already uses
  `completed`

A blanket `sed` over this repository breaks the second and third of these. The
migration must be per-surface, and the diff must be read.

---

## 5. Migration design

### 5.1 Translate at the boundary; do not migrate upstream data

The protocol vocabulary is a property of the **interface**, not of the reference
implementation's store. The migration introduces mapping in the adapter (§4.2) and
leaves Coordinalo's internal states alone.

This matters for §2.1: mapping legacy `charged` to `invoiced` at the boundary has
no effect on upstream payroll, which reads upstream states. Had this been a data
migration, every session sitting in `charged` would have become `invoiced` and
none `collected`, and payroll would have seen zero eligible sessions the morning
after.

### 5.2 Dual behavior during the window

Per RFC-001 §3.6, a behavior change ships with **dual-behavior support**:

- **Requests.** `lifecycle.transition` accepts both vocabularies. Legacy values are
  accepted, mapped per §2, and answered with a deprecation marker.
- **Responses.** Vocabulary is selected by the negotiated version (§5.3), not by
  what the request used. A client on the new version gets canonical values even
  if it sent a legacy one.
- **Idempotence.** `transition(to: "delivered")` and `transition(to: "completed")`
  MUST be the same operation, not two.

### 5.3 Version gate

Per RFC-001 §3.7, negotiated through `registry.manifest`:

```json
{
  "protocol_version": "1.0",
  "supported_versions": ["0.10", "1.0"],
  "minimum_client_version": "0.10"
}
```

| Negotiated version | Request vocabulary | Response vocabulary |
|---|---|---|
| ≤ 0.10 | both accepted | legacy |
| 1.0, 1.1 | both accepted | canonical |
| ≥ 1.2 | canonical only (legacy → validation error) | canonical |

Clients that send no version header get `protocol_version`, per §3.7 rule 4.

---

## 6. Deprecation window and classification

**Not an editorial rename.** RFC-001 §3.6 offers "editorial deprecation
(terminology rename): 1 minor version", and `delivered` → `completed` alone would
qualify. `charged` does not: it is a 1:2 semantic split (§2), and it changes an
enum in a tool's input schema. Two rows of §3.6 apply, and the stricter governs:

| §3.6 class | Window | Applies because |
|---|---|---|
| Behavior change (semantic shift, no signature change) | **2 minor versions, dual-behavior** | the `charged` split |
| Tool / endpoint / field (OPTIONAL) | 2 minor versions | enum values removed from a tool schema |

**Window: 2 minor versions with dual-behavior support.** Concretely — deprecate at
**v1.0**, remove at **v1.2**. Category per §3.2: **Major** (removal of accepted
enum values), so 4 weeks comment + 1 week FCP, and reference-implementation
evidence plus one external implementation willing to commit.

Deprecation signals required by §3.6, all four:

1. Spec callout: `> **Deprecated in v1.0, removal target v1.2.**` on every affected
   surface.
2. HTTP responses touching the deprecated surface carry `Deprecation: true` and
   `Sunset: <date>` per RFC 8594.
3. MCP responses carry a `deprecation` object with `since`, `removal_target`,
   `replacement`.
4. The `announce` channel publishes within 7 days of RFC acceptance.

Signal 3 is the one with no precedent in this codebase — no MCP tool returns a
`deprecation` envelope today. It needs designing once, here, for reuse.

---

## 7. Sequencing

| # | Step | Gate |
|:-:|---|---|
| 1 | RFC for the migration, covering the rename, the §2.1 mapping, and the §3 enum additions as one change | RFC-001 §3.2 Major: 4 wks + 1 wk FCP |
| 2 | Build the translation boundary in the adapter (§4.2), both directions, requests and responses | Unit tests over the §2 mapping table, both directions |
| 3 | Add version negotiation to `registry.manifest` (§5.3) | Needed by step 4; nothing else can gate on version until it exists |
| 4 | Ship v1.0: dual behavior, all four deprecation signals, `intents.md:940` fixed, smithery mirror regenerated | Announcement per §8 |
| 5 | v1.1: no change. The window running is the point. | — |
| 6 | Ship v1.2: legacy values rejected; `agent-card.json` allowance and the manifest divergence block removed | Removal RFC per §3.6, referencing the deprecating RFC |

Step 3 is a hidden prerequisite worth naming: **the version gate does not exist
today**. `registry.manifest` returns a protocol version but there is no
`supported_versions`, no negotiation, and no `426`. Dual behavior cannot be
selected by version until it does.

---

## 8. Communication plan

A migration plan without an announcement plan is not a plan. The audience is the
already-installed hosts — who are also the go-to-market — and they will experience
this as either a well-run standard or a reason to pin a version forever.

### 8.1 Audience

Per RFC-001 §3.9, an **active external node** is one that appears in the public
resolver, has sent a heartbeat in the last 90 days, and has a registered contact
email. That set defines direct outreach. Two tiers beyond it: the opt-in
`announce` list, and everyone reading CHANGELOG.

### 8.2 Artifacts

**(a) CHANGELOG.md entry.** House format is `## [Protocol vX]` (checked by
`verify-versions.mjs`). The entry leads with the disambiguation, not the rename:

```markdown
## [Protocol v1.0]

### Deprecated — lifecycle vocabulary in the MCP binding

`lifecycle.transition` accepted `delivered` and `charged`. Both are deprecated
in v1.0 and removed in v1.2. Both continue to work throughout.

**Read this first: there are two different `charged` values in this protocol.**

| Where | Value | What happens |
|---|---|---|
| `lifecycle.current_state` | `charged` | **Deprecated.** Maps to `invoiced`. Removed v1.2. |
| `billing.status` | `charged` | **Unchanged. Canonical. Not deprecated.** |

| Old lifecycle value | New value | Note |
|---|---|---|
| `delivered` | `completed` | Direct rename. |
| `charged` | `invoiced` | Legacy `charged` did not distinguish invoiced from collected. It maps to `invoiced`; reaching `collected` is now an explicit transition. |

If you implement the HTTP binding, nothing changes — it was always canonical.
```

**(b) Deprecation notice** (the `announce` post and the email). One page:
what changed, the two-`charged` warning, the mapping table, the dates
(deprecated v1.0 / removed v1.2), what to do, what happens if you do nothing
(it keeps working until v1.2, then requests fail validation), and where to ask.

**(c) In-band signals.** §6 items 2 and 3 — headers and the MCP `deprecation`
envelope — so an implementer who reads no announcement still finds out from the
wire, which is the only channel with full reach.

**(d) A worked before/after diff** in `IMPLEMENTING.md`, showing one
`lifecycle.transition` call migrated. Most integrations are one call.

### 8.3 Timeline

Per RFC-001 §3.9, from RFC acceptance: spec published with callout within 7 days;
Discussions and `announce` within 7 days; email within 14; direct outreach to
active external nodes within 28 (best-effort, where contact info is public).

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Someone deletes `billing.status.charged` | §1.2 leads every artifact; the CHANGELOG table is two rows before the mapping table |
| Blanket find-and-replace hits webhooks or `amount_collected` | §4.7; per-surface migration, diff reviewed |
| Asymmetric server — accepts canonical, returns legacy | §4.2; responses are in scope from the start, and `lifecycle.get_state` has no declared enum to catch it |
| Forward mapping guesses wrong on `collected` | §2.1 maps to `invoiced` — the recoverable error |
| Two serialized breaking changes | §3, one window |
| Deprecation shipped without the version gate | §7 step 3, called out as a prerequisite |
| Smithery mirror left stale | §4.5, regenerated in the same change |

## 10. Open decisions

1. **Does the removal need one external implementation to commit?** RFC-001 §3.2
   requires it for Major RFCs. With one implementation live, the requirement is
   either waived, or the removal waits for a second implementor — which may be the
   honest answer, and would push v1.2 out.
2. **Should `delivered` → `completed` split off as an editorial change** with a
   1-minor window, leaving only `charged` on the 2-minor track? Cheaper on paper,
   and it reintroduces exactly the serialized-changes problem §3 exists to avoid.
   Recommended: no.
3. **Does the MCP `deprecation` envelope belong in this plan or its own RFC?** It
   is reusable infrastructure with no precedent here (§6 signal 3). Arguably its
   own small RFC, so the next deprecation does not redesign it.
4. **What happens to sessions sitting in legacy states at removal?** §5.1 says the
   boundary translates and upstream data is untouched, so the answer should be
   "nothing" — but it needs confirming against the reference implementation before
   it is stated publicly.
