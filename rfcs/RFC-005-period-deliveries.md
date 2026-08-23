# RFC-005: Period Deliveries

| Field | Value |
|-------|-------|
| RFC number | 005 |
| Title | Period Deliveries (availability obligations satisfied over a window) |
| Author(s) | Servicialo SpA — Franco Danioni ([@danioni](https://github.com/danioni)), acting maintainer |
| Status | Draft |
| Category | Minor (additive OPTIONAL field) — 2 wks comment + 1 wk FCP per [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) §3.2 |
| Type | Protocol Semantics |
| Discussion | To be linked when the RFC enters Open for Comment |
| Created | 2026-08-23 |
| Last updated | 2026-08-23 |
| Target version | Servicialo Protocol v1.0 |
| Motivating analysis | [`docs/servicialo-stress-test-casos.md`](../docs/servicialo-stress-test-casos.md) — Case 3 |
| Related | [#6](https://github.com/servicialo/mcp-server/issues/6) (`cac_resolved`); [state-dimensions](../public/spec/extensions/state-dimensions.md); [proof-of-service](../public/spec/extensions/proof-of-service.md) |
| License | Apache-2.0 |

> **Directory note.** `rfcs/` and RFC-001 arrive with
> [PR #13](https://github.com/servicialo/mcp-server/pull/13), which is open at the
> time of writing. Links to `RFC-001-…` in this document resolve once that merges;
> the index row for RFC-005 in [`rfcs/README.md`](README.md) is a merge task, not
> an edit made here, so the two branches do not collide on the same file.

> **ES:** Un retainer, una iguala o un contrato de mantención se cobran todos los
> meses, incluso en los meses sin ningún acto discreto. Hoy el protocolo no puede
> representar el mes vacío: no hay instancia ejecutada, y el invariante "todo
> cobro traza a una entrega" se rompe. Este RFC agrega `kind: occurrence | period`
> a la Delivery, con ventana temporal obligatoria para `period`.
>
> **EN:** A retainer, a stand-by agreement or a maintenance contract bill every
> month, including the months with no discrete act. The protocol cannot represent
> the empty month today: there is no executed instance, and the invariant that
> every charge traces to a delivery breaks. This RFC adds
> `kind: occurrence | period` to the Delivery, with a mandatory temporal window
> for `period`.

---

## 1. Summary / Resumen

**ES:** Se agrega el atributo `kind` a la Delivery (objeto wire `Service`), con
valores `occurrence` (default) y `period`. Una delivery `period` representa una
obligación de disponibilidad o continua cumplida a lo largo de una ventana
`{start, end}`, no un acto ejecutado en un instante. La evidencia mínima es la
confirmación bilateral al cierre de la ventana; los perfiles más ricos por
vertical viven en Evidence Profiles. La terminación anticipada exige prorrateo
declarado. Un guardarraíl normativo impide modelar actos discretos separables como
un período. El consumo por encima del retainer (horas extra, sesiones) son
deliveries `occurrence` adicionales bajo la misma Order. El cambio es puramente
aditivo y resuelve, de paso, la contradicción hoy existente entre §8.2.5 y
§5.8/§12.8.1.

**EN:** This RFC adds a `kind` attribute to the Delivery (wire object `Service`),
with values `occurrence` (default) and `period`. A `period` delivery represents an
availability or continuous obligation satisfied across a `{start, end}` window
rather than an act executed at an instant. Minimum evidence is bilateral
confirmation at window close; richer per-vertical profiles live in Evidence
Profiles. Early termination requires declared proration. A normative guardrail
prevents modeling separable discrete acts as a period. Consumption above the
retainer (overage hours, extra sessions) are additional `occurrence` deliveries
under the same Order. The change is purely additive, and it resolves the existing
contradiction between §8.2.5 and §5.8/§12.8.1 as a side effect.

---

## 2. Motivation / Motivación

**ES:** El caso 3 del
[stress test de casos v0.10](../docs/servicialo-stress-test-casos.md) — iguala
mensual de abogado, $X/mes por hasta 10 horas más disponibilidad prioritaria —
produce dos meses que el protocolo modela mal:

- **Marzo: cero horas consumidas.** Se factura y se paga igual. No hay instancia
  ejecutada, pero el servicio *sí se prestó*: la disponibilidad estuvo disponible.
- **Abril: 14 horas.** Diez dentro del alcance, cuatro a tarifa marginal.

El análisis lo marcó como el único de nueve casos donde **dos implementadores
conformes producirían modelos incompatibles**: uno inventaría deliveries fantasma
de duración cero para colgar el cobro, el otro emitiría un settlement huérfano sin
delivery. Y no es una esquina exótica — igualas, retainers y contratos de
mantención son una porción grande del mercado de servicios profesionales.

**EN:** Two salvage routes exist today and the protocol blesses neither, which is
the problem:

- **(a) Settlement bound only to the Order, with no delivery.** Preserves
  "delivery = executed instance", but weakens the invariant that a charge is
  linked to a delivery — the heart of the Proof of Service. Orphan settlements are
  a class of charge that is *structurally* unverifiable: there is nothing to
  present, because nothing was recorded as delivered.
- **(b) Bless the period delivery.** Preserves the charge↔delivery invariant, at
  the cost of stretching "executed" into "obligation satisfied during T".

This RFC takes (b). The decision turns on what the protocol treats as its unit of
value: the *act*, or the *obligation fulfilled*. Accounting standards resolved the
same question the same way — IFRS 15 distinguishes performance obligations
satisfied at a point in time from those satisfied over time, and treats a
stand-ready obligation as satisfied continuously across the period. A retainer
month is not an absence of service; it is a service whose delivery has the shape
of an interval.

There is a second motivation the stress test surfaced only on verification: **the
core specification already contradicts itself on this point.**

- `§8.2.5` states that *"Invoicing is NOT a function of verified deliveries alone
  — a prepaid or periodic Order invoices on its own schedule"*, and lists
  "Periodic billing" as a valid ledger scenario whose billing advances
  *"independent of individual deliveries"*.
- `§5.8` states that `charged` *"always happens 1:1 with a completed session"*,
  and `§12.8.1` repeats *"Occurs 1:1 with a completed session"*.

Both cannot be true for a retainer month with no session. §4.9 below resolves this
in a way that keeps both texts and restores the invariant.

---

## 3. Scope

**In scope.** The `kind` attribute and its temporal window; duration and schedule
semantics for period deliveries; their lifecycle path, minimum evidence, and early
termination; the guardrail separating period obligations from discrete acts; the
relationship to overage consumption; and the narrowing of §5.8/§12.8.1 that makes
the core self-consistent.

**Out of scope.** Pricing structure for retainers and overage rates — that is a
separate open question about `pricing.rate_card` units and tiers, filed
independently. Holdbacks, allocation, and settlement origin — separate settlement
questions from the same analysis. The `cac_resolved` aggregation primitive
proposed in [#6](https://github.com/servicialo/mcp-server/issues/6) — §5 draws the
boundary but proposes no change to it.

---

## 4. Specification

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, MAY and OPTIONAL are
to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

### 4.1 The `kind` attribute

A Delivery gains one OPTIONAL attribute:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | enum | OPTIONAL | `occurrence` \| `period`. Default: `occurrence`. |

- `occurrence` — the delivery is an act executed at a point in time. This is every
  delivery the protocol models today, and the default when the field is absent.
- `period` — the delivery is an availability or continuous obligation satisfied
  across a declared window.

Implementations MUST treat an absent `kind` as `occurrence`. Implementations MUST
NOT infer `kind` from any other field.

### 4.2 The temporal window

A delivery with `kind: period` MUST declare a window:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schedule.window.start` | datetime | REQUIRED when `kind = period` | ISO 8601. Instant the obligation enters force. |
| `schedule.window.end` | datetime | REQUIRED when `kind = period` | ISO 8601. Instant the obligation ceases. MUST be strictly after `start`. |

`schedule.window` MUST NOT be present when `kind` is `occurrence`.

**`scheduled_for` is complemented, not replaced.** When `kind` is `period`,
`schedule.scheduled_for` MUST be present and MUST equal `schedule.window.start`.
This is deliberate redundancy: every existing consumer that sorts, filters or
paginates on `scheduled_for` keeps working against period deliveries without
knowing the field exists. A consumer that understands windows reads the window; a
consumer that does not reads a start time that is correct.

### 4.3 Duration semantics

`duration_minutes` is REQUIRED at the root of `schema/service.schema.json` with
`minimum: 1`, and this RFC does **not** relax it. Relaxing a REQUIRED field is a
compatibility hazard in the consumer direction: a strict consumer that reads
`duration_minutes` unconditionally today would begin to receive documents without
it.

Instead, its meaning is defined for the new kind:

- When `kind` is `period`, `duration_minutes` MUST equal the length of
  `schedule.window` in whole minutes, rounded down. It is derived, not
  independently chosen, and implementations MUST reject a document where the two
  disagree.
- `schedule.duration_expected`, when present, follows the same rule.
- `proof.duration_actual` carries the length in minutes during which the
  obligation was actually in force. For a window that ran to completion this
  equals `duration_minutes`; for an early termination (§4.6) it is smaller, and
  the difference is the proration signal.

**Scheduling guardrail (normative).** A period delivery is not a booking.
Implementations MUST NOT treat a `kind: period` delivery as an occupancy of
provider, client or Resource availability, and `§6.2` (three-way resource
commitment in the `scheduled` state) does not apply to it. A scheduler that
blocked a provider's calendar for the length of a retainer window would be
conformant with the letter of `duration_minutes` and useless in practice; this
rule closes that reading.

### 4.4 Lifecycle

A period delivery traverses the same six core states, with no new state and no new
transition:

| State | Meaning for `kind: period` |
|---|---|
| `requested` | The period obligation has been asked for. |
| `scheduled` | The window is fixed. |
| `confirmed` | Both parties acknowledge the commitment for that window. |
| `in_progress` | The window is open — the obligation is in force. |
| `completed` | `window.end` was reached with the obligation held. |
| `documented` | The evidence for the window is filed (§4.5). |

Mapping onto the [state-dimensions](../public/spec/extensions/state-dimensions.md)
projection, `fulfillment: in_progress` holds for the whole window and
`fulfillment: completed` at its close. No new dimension value is needed.

`§6.3.1` (verification deadline) applies unchanged, measured from the transition
to `completed` — i.e. from window close, not from window start.

### 4.5 Minimum evidence

The evidence floor for a period delivery is **bilateral confirmation at window
close**: provider and recipient present compatible attestations that the
obligation was held for the window. On the Proof of Service certainty gradient
this is **L2 `bilateral`**
([proof-of-service §3.1](../public/spec/extensions/proof-of-service.md)).

> **Note on level numbering.** The decision that motivated this RFC described this
> floor as "L1". That matches Proof of Service **0.1.0**, where L1 was "Bilateral
> verification". The extension renumbered at 0.2.0 and bilateral attestation is now
> L2; 0.2.0's L1 is `asserted` (a single party). The requirement is unchanged —
> bilateral confirmation at window close — only the label is current.

Richer floors are a per-vertical matter and belong to Evidence Profiles, not here.
What this RFC asks of that extension is one thing: a period profile needs to
express evidence that accrues *across* a window (stand-by logs, response-time
records, periodic check-ins) rather than at a single capture instant. The existing
`x-resolution-rule` structure in `schema/evidence/*.json` already expresses
"required for resolution" as a set of evidence types; a period profile needs the
same with a window qualifier.

A period delivery MAY be accredited at L2 without ever reaching L3 or L4. Per
[proof-of-service §3.2](../public/spec/extensions/proof-of-service.md),
accreditation is policy-based and can occur at any level; nothing here makes a
retainer month less accreditable than a session.

### 4.6 Early termination and proration

When a period obligation ends before `window.end`:

- The delivery MUST transition to `partial` (the existing exception state, `§7.6`),
  not `completed`.
- `proof.duration_actual` MUST carry the minutes the obligation was actually in
  force.
- The proration MUST be **declared, not inferred**: the settlement adjustment
  states the prorated amount and the basis on which it was computed. An
  implementation MUST NOT leave the reader to divide `duration_actual` by
  `duration_minutes` and assume that is the commercial answer — a retainer
  terminated mid-month is frequently not prorated by elapsed time, and the
  protocol should record what the parties agreed rather than a ratio that looks
  like it.

`§7.6` already requires that what was delivered be documented and that the invoice
SHOULD be adjusted proportionally. This RFC tightens only the *declaration* of the
basis, not the adjustment itself.

### 4.7 Guardrail: when `period` is the wrong answer

`kind: period` is for **availability or continuous obligations**. When a service
consists of discrete separable acts, each act is an `occurrence` delivery, even
when they are sold together and billed on a schedule.

Implementations MUST NOT use `kind: period` to collapse a countable set of
separable acts into one record. Ten physiotherapy sessions sold as a package are
ten `occurrence` deliveries under one Order — not one three-month period.

The test, stated so it can be applied mechanically: **if the parties can point at
an act and ask "was this one delivered?", it is an occurrence.** A retainer month
does not survive that question — there is no act to point at, and that is exactly
what makes it a period. A twelve-session package does survive it, once per session.

A single Order MAY contain deliveries of both kinds. That is the normal shape of a
maintenance contract (Annex B, Example 2).

### 4.8 Consumption above a period obligation

Overage — the hours, sessions or call-outs consumed beyond what the period
obligation includes — are **additional `occurrence` deliveries under the same
Order**. They are not a property of the period delivery and MUST NOT be recorded as
one.

This falls out of §4.7 rather than being a separate rule: overage hours are
discrete separable acts, so they are occurrences. It is stated explicitly because
it is the first thing an implementer gets wrong (Annex B, Example 1, April).

Pricing those occurrences at a marginal rate is a pricing-structure question and
is out of scope here; `pricing.model: mixed` is the current escape hatch.

### 4.9 Resolving the §8.2.5 ⟷ §5.8 / §12.8.1 contradiction

The contradiction stated in §2 is resolved by keeping the semantics of §8.2.5 and
**re-anchoring** them, and by **scoping** the 1:1 language of §5.8 and §12.8.1.

**What stands.** A prepaid or periodic Order invoices on its own schedule. Nothing
in §8.2.5 changes.

**What is re-anchored.** Those invoices trace to deliveries of `kind: period`.
Periodic billing is not billing detached from delivery; it is billing against a
delivery whose shape is an interval. The invariant is restored in full: **every
charge traces to a delivery.**

**What is scoped.** The "1:1 with a completed session" language applies to
`kind: occurrence`. Proposed replacement text:

> **§5.8, `charged` vs `paid` paragraph.** `charged` means the amount was debited
> from the client's balance or added to their debt. For a delivery of
> `kind: occurrence` it happens 1:1 with a completed delivery; for a delivery of
> `kind: period` it happens against the completed window on the Order's billing
> schedule. `paid` means cash was received, and MAY have occurred upstream
> (prepaid package) or downstream (insurance reimbursement).

> **§12.8.1, `charged` row.** Amount debited from client balance or added to their
> debt. Occurs 1:1 with a completed delivery — a session for
> `kind: occurrence`, a closed window for `kind: period`.

Neither edit changes the behavior of any conforming implementation: no
implementation could have been relying on both readings, because they contradict
each other. In effect these two are editorial; they are included in this RFC
rather than filed as errata because patching them separately would decide this
RFC's central question by accident.

---

## 5. Period deliveries and CAC are different things

The glossary already contains a period-shaped primitive, and
[#6](https://github.com/servicialo/mcp-server/issues/6) proposes promoting its
event to the spec. Without an explicit boundary, the divergence this RFC closes
would immediately reopen through that door.

**CAC — Ciclo Agregado Coordinado** ([`GLOSSARY.md`](../GLOSSARY.md) §2) is a
*coordination event over an aggregate*: *"unidad de coordinación resuelta sobre una
cartera o período consolidado. Existe cuando la coordinación se evalúa a nivel de
conjunto, no por evento aislado"*, with `correlationId = clientId + periodo`. Issue
#6 proposes `cac_resolved` as its emission contract, and reports it implemented in
the reference implementation (`cac-cobranza-resolver.ts`, persisted as
`cobranzaResueltaAt`) alongside the per-session `sc_resolved`.

A **period delivery** is not an aggregate. It is one obligation, under one Order,
recorded as one delivery, satisfied over a window.

| | Period delivery | CAC |
|---|---|---|
| What it is | A delivery | A resolution event over a set |
| Unit | One obligation under one Order | A client's portfolio in a period |
| Correlation | The delivery's own id | `clientId + periodo` |
| Layer | Object model — it is a thing that was delivered | Event layer — it is a fact about a set of things |
| Exists without the other? | Yes | Yes |

**The distinguishing test:** does removing the aggregation change what was owed?
For a period delivery, no — the retainer obligation exists and is owed whether or
not anyone rolls it up. For a CAC, the aggregation *is* the unit; there is nothing
underneath it that was independently owed as a whole.

They compose without conflict. A CAC for a client-month may aggregate a period
delivery, several occurrence deliveries, or both. A period delivery emits
`sc_resolved` on its own terms when delivery and payment are both verified for its
`correlationId`, exactly as an occurrence delivery does — the window is the
delivery, so there is no special case.

**What would be wrong** is modeling the retainer month *as* a CAC. That would put
the obligation in the event layer, leave the object layer with nothing to present
in a Proof of Service, and re-create route (a) from §2 under a different name.

---

## 6. Protocol changes

| Surface | Change | Class |
|---|---|---|
| `schema/service.schema.json` | Add `kind`; add `schedule.window`; add conditional requirements. Annex A. | Additive |
| `PROTOCOL.md §5.1` | Add `kind` to the Identity dimension table. | Additive |
| `PROTOCOL.md §5.4` | Add `schedule.window` to the Schedule dimension table. | Additive |
| `PROTOCOL.md §5.8` | Scope the 1:1 sentence by kind (§4.9). | Editorial in effect |
| `PROTOCOL.md §12.8.1` | Scope the `charged` row by kind (§4.9). | Editorial in effect |
| `PROTOCOL.md §6.2` | Note that three-way resource commitment does not apply to period deliveries. | Additive |
| `PROTOCOL.md §4` / Appendix A | Glossary entries for period delivery and occurrence delivery; boundary against CAC. | Additive |
| `spec/HTTP_PROFILE.md` | No new operation. `service.get` and lifecycle responses carry the new fields. | Additive |
| `protocol/manifest.yaml` | No new object, no new profile. | None |

No new entity, no new state, no new tool, no new extension.

---

## 7. Backward compatibility

**This change is additive.** Under `§15.5`:

- No REQUIRED field is removed. `duration_minutes` stays REQUIRED and stays
  `minimum: 1` (§4.3).
- No new REQUIRED field is added to an existing object unconditionally. `kind` is
  OPTIONAL with a default; `schedule.window` is REQUIRED only for documents that
  opt into the new kind.
- Consumers MUST ignore unrecognized fields, so a v0.10 consumer reading a period
  delivery sees a delivery with a start time, a duration, a lifecycle state and a
  billing amount — all correct, none of it misleading.

**Nothing existing breaks:**

| Existing behavior | After this RFC |
|---|---|
| Every delivery in existence | `kind` absent → `occurrence` → unchanged semantics |
| Consumers reading `scheduled_for` | Still populated on period deliveries (§4.2) |
| Consumers reading `duration_minutes` | Still present, still ≥ 1 (§4.3) |
| Schema validation of existing documents | Passes unchanged — the new constraints are conditional on `kind: period` |
| The six core states and their ordering | Unchanged; no new state (§4.4) |
| The `financial` / `acceptance` / `evidence` dimensions | Unchanged |
| The Order ledger projection (§8.2.5) | Unchanged in fields and semantics; §4.9 only names what periodic invoices trace to |

**Version negotiation.** Per RFC-001 §3.7 a v0.9/v0.10 client that does not
understand `kind` needs no special handling, because ignoring it yields the
correct legacy interpretation for every document that does not use it, and a
defensible one for documents that do. No `Servicialo-Deprecated-Behavior` header
and no downgrade mapping are required.

**Deprecations.** None.

---

## 8. Security, privacy, and compliance considerations

Small surface. Three notes:

- **No new PII.** `kind` and `window` are structural. A period delivery's evidence
  inherits `data_sensitivity` from its evidence types exactly as an occurrence
  delivery does (`§9.8`).
- **A longer exposure window.** A period delivery is readable for as long as its
  window plus retention, where an occurrence delivery is a point. For `restricted`
  verticals this lengthens the interval in which per-access audit logging (`§9.8`)
  is exercised. It changes no requirement, but implementations should not be
  surprised by the volume.
- **Availability claims are attestations, not observations.** "The obligation was
  held for March" cannot be observed the way a check-in can. That is precisely why
  the evidence floor is bilateral (§4.5) rather than a single party's assertion:
  the recipient's counter-attestation is what makes an unobservable claim
  accreditable.

---

## 9. Reference implementation impact

Neutral description of the surface; adoption is each implementer's call.

- Schema: two new fields and three conditional constraints (Annex A).
- Lifecycle: no new transitions. A period delivery reaches `completed` on a
  window-close trigger rather than a provider action — a scheduled job, not new
  protocol machinery.
- Scheduling: the guardrail in §4.3 must be honored, i.e. period deliveries
  excluded from availability computation.
- Billing: periodic Orders must attach their invoice to the period delivery for
  the billed window (§4.9), which is where the invariant is actually enforced.
- Evidence: a window-close bilateral confirmation prompt. The existing
  confirmation surfaces (`delivery.record_evidence`, the client-portal
  confirmation flow) already carry this shape.

---

## 10. Alternatives considered

### 10.1 Settlement bound only to the Order, no delivery — REJECTED

Route (a) from §2. Rejected because it creates a class of charges with nothing to
present: no delivery record, therefore no Proof of Service, therefore no way for a
third party to evaluate the charge. The invariant that every charge traces to a
delivery is not bookkeeping tidiness — it is the property that makes the dossier
worth anything to a relying party.

### 10.2 Relax `duration_minutes` to conditionally-required — REJECTED

Cleaner semantically: a stand-ready obligation has no meaningful duration in
minutes. Rejected on compatibility grounds (§4.3): relaxing a REQUIRED field
breaks consumers that read it unconditionally, and the compatibility rules in
§15.5 protect exactly that direction. Deriving it from the window costs one
validation rule and breaks nobody.

### 10.3 A new lifecycle state for "in force" — REJECTED

Add a state between `confirmed` and `completed` for the open window. Rejected
because `in_progress` already means it, and `§6.1` requires core states to be
strictly ordered with no skipping — a new core state is a major change for
vocabulary the model already has.

### 10.4 Model the retainer as a Service Order property, not a delivery — REJECTED

Put the recurrence on the Order (`term.type: monthly` plus
`payment_schedule.type: periodic`) and emit no delivery. Rejected because it is
route (a) wearing a hat: the Order fields describe *when money moves*, not *what
was delivered*, and Principle 6 keeps those separate on purpose. It also cannot
represent a month that was *not* held — a suspended retainer and a fulfilled one
would look identical.

### 10.5 Model it as CAC — REJECTED

Covered in §5. Wrong layer.

---

## 11. Open questions

1. **Overlapping period deliveries under one Order.** Two stand-by obligations
   with overlapping windows (e.g. a general retainer plus a project-specific
   availability) are expressible today and probably legitimate. Should the RFC say
   so explicitly, or stay silent?
2. **Renewal.** An auto-renewing retainer produces a new period delivery per cycle.
   Should consecutive windows be linkable (`previous_delivery_id`, or a series
   identifier), or is the shared `service_order_id` enough? The stress test's Case
   8 raised a related need — deliveries that reference each other ("corrects") —
   which suggests a general delivery-to-delivery relation rather than a
   renewal-specific field.
3. **Window granularity and time zones.** `{start, end}` are instants, so a
   "calendar month" is expressed as instants in some zone. Should the RFC require
   an IANA zone alongside the window when the obligation is expressed in calendar
   terms, or leave it to the parties?
4. **Zero-consumption disclosure.** Should a period delivery carry an explicit
   count of the occurrence deliveries recorded against the same Order within its
   window, so a Proof of Service can state "held, zero call-outs" without the
   reader joining? Derivable, but the dossier is exactly where derivation is
   inconvenient.
5. **Promotion criteria.** What evidence of adoption should gate this from Draft
   to Accepted — one implementation emitting period deliveries, or two?

---

## 12. Decision

*Populated by the maintainer at acceptance. Empty while the RFC is in Draft, Open
for Comment, or Final Comment Period.*

---

## Annex A — Proposed schema diff

Against `schema/service.schema.json` at protocol v0.10. **Proposed, not applied.**

### A.1 New `kind` property

```diff
     "vertical": {
       "type": "string",
       "description": "Industry vertical.",
       "examples": ["health", "legal", "home", "education"]
     },
+    "kind": {
+      "type": "string",
+      "enum": ["occurrence", "period"],
+      "default": "occurrence",
+      "description": "Shape of the delivery. 'occurrence' (default) is an act executed at a point in time. 'period' is an availability or continuous obligation satisfied across schedule.window. Absent means 'occurrence'. See RFC-005."
+    },
```

`kind` is NOT added to the root `required` array. Line 7 is unchanged:

```
"required": ["id", "type", "vertical", "name", "duration_minutes", "provider", "client", "schedule", "lifecycle", "billing"]
```

### A.2 New `schedule.window`

```diff
     "schedule": {
       "type": "object",
       "description": "Dimension 4 — When the service occurs.",
       "required": ["requested_at"],
       "properties": {
         "requested_at": {
           "type": "string",
           "format": "date-time",
           "description": "When the service was originally requested."
         },
         "scheduled_for": {
           "type": "string",
           "format": "date-time",
-          "description": "Agreed start time. Set when the service transitions to 'scheduled'."
+          "description": "Agreed start time. Set when the service transitions to 'scheduled'. When kind is 'period', MUST equal schedule.window.start."
         },
         "duration_expected": {
           "type": "integer",
           "minimum": 1,
           "description": "Expected duration in minutes."
+        },
+        "window": {
+          "type": "object",
+          "description": "Temporal window of a period delivery. REQUIRED when kind is 'period'; MUST NOT be present otherwise. See RFC-005 §4.2.",
+          "required": ["start", "end"],
+          "properties": {
+            "start": {
+              "type": "string",
+              "format": "date-time",
+              "description": "Instant the obligation enters force."
+            },
+            "end": {
+              "type": "string",
+              "format": "date-time",
+              "description": "Instant the obligation ceases. MUST be strictly after start."
+            }
+          }
         }
       }
     },
```

### A.3 Conditional constraints

Added at the root of the schema, after `properties`. JSON Schema cannot express
"`end` is strictly after `start`" or "`duration_minutes` equals the window length";
those two remain implementation-enforced and are stated normatively in §4.2 and
§4.3.

```diff
+  "allOf": [
+    {
+      "$comment": "RFC-005 §4.2 — a period delivery MUST declare its window and MUST set scheduled_for.",
+      "if": {
+        "properties": { "kind": { "const": "period" } },
+        "required": ["kind"]
+      },
+      "then": {
+        "properties": {
+          "schedule": { "required": ["requested_at", "scheduled_for", "window"] }
+        }
+      }
+    },
+    {
+      "$comment": "RFC-005 §4.2 — window is meaningless for an occurrence delivery.",
+      "if": {
+        "anyOf": [
+          { "properties": { "kind": { "const": "occurrence" } }, "required": ["kind"] },
+          { "not": { "required": ["kind"] } }
+        ]
+      },
+      "then": {
+        "properties": {
+          "schedule": { "not": { "required": ["window"] } }
+        }
+      }
+    }
+  ],
```

**Why the second constraint is written with `anyOf`.** The default value of `kind`
is `occurrence`, but JSON Schema `default` is annotation, not behavior — a
validator does not inject it. The absent case therefore has to be matched
explicitly, or a document with no `kind` and a stray `window` would validate.

### A.4 What is deliberately not changed

| Not changed | Why |
|---|---|
| Root `required` array | `kind` is OPTIONAL (§4.1) |
| `duration_minutes` `minimum: 1` | Not relaxed (§4.3); derived for periods |
| `lifecycle.current_state` enum | No new state (§4.4) |
| `billing.status` enum | Settlement position is unaffected by delivery shape |
| `$defs.evidence` | Evidence structure is unchanged; only profiles differ (§4.5) |
| `schema/service-order.schema.json` | The Order is untouched by this RFC |

---

## Annex B — Worked examples

Illustrative, non-normative. Identifiers are fictional.

The March document in B.1 is complete and was validated against the schema
produced by applying Annex A — it passes, as do the conditional constraints in
both directions (a `period` without a window is rejected; an `occurrence` with one
is rejected; a document with no `kind` at all validates unchanged against both the
current and the proposed schema). The remaining documents elide fields that are
required but irrelevant to the point being made, and are illustrative only.

### B.1 Monthly legal retainer (stress test Case 3)

`$800/month for up to 10 hours plus priority availability.` One Order, term
`monthly`, auto-renewing.

**March — zero hours consumed. Billed and paid all the same.**

One period delivery, no occurrence deliveries.

```json
{
  "id": "svc_mar_retainer",
  "service_order_id": "so_retainer_2026",
  "kind": "period",
  "type": "legal_retainer",
  "vertical": "legal",
  "name": "Priority availability retainer — March 2026",
  "duration_minutes": 44640,
  "provider": { "id": "prv_estudio", "organization_id": "org_estudio" },
  "client": { "id": "cli_acme", "payer_id": "cli_acme" },
  "schedule": {
    "requested_at": "2026-02-25T10:00:00-03:00",
    "scheduled_for": "2026-03-01T00:00:00-03:00",
    "window": {
      "start": "2026-03-01T00:00:00-03:00",
      "end":   "2026-04-01T00:00:00-03:00"
    }
  },
  "lifecycle": { "current_state": "documented" },
  "proof": {
    "duration_actual": 44640,
    "evidence": [
      { "type": "notes", "captured_at": "2026-04-01T09:12:00-03:00",
        "actor": { "type": "provider", "id": "prv_estudio" },
        "data": { "text": "Retainer held for March 2026. 0 of 10 included hours consumed.", "language": "es" } },
      { "type": "signature", "captured_at": "2026-04-01T16:40:00-03:00",
        "actor": { "type": "client", "id": "cli_acme" },
        "data": { "signer_role": "client", "format": "image/png", "uri": "https://…/conf_mar.png" } }
    ]
  },
  "billing": { "amount": { "value": 800, "currency": "USD" }, "status": "invoiced" }
}
```

Reading of the four dimensions: fulfillment `completed`, evidence `sufficient`
(L2 `bilateral` — provider attestation plus client confirmation at window close),
acceptance `pending` until the §6.3.1 window closes, financial `invoiced`. **The
March invoice traces to `svc_mar_retainer`.** There is no orphan settlement, and
nothing had to be invented to hang the charge on.

`duration_minutes: 44640` is March in minutes (31 × 1440), derived from the window
per §4.3. Per the guardrail in the same section, no scheduler treats this as 31
days of occupied calendar.

**April — 14 hours. Ten included, four at the marginal rate.**

One period delivery for the month, plus occurrence deliveries for the overage
(§4.8). The included hours are consumption *of* the retainer and need no separate
delivery unless the parties want each session recorded; the overage hours are
separable acts and are occurrences.

```json
[
  {
    "id": "svc_apr_retainer",
    "service_order_id": "so_retainer_2026",
    "kind": "period",
    "name": "Priority availability retainer — April 2026",
    "duration_minutes": 43200,
    "schedule": {
      "requested_at": "2026-02-25T10:00:00-03:00",
      "scheduled_for": "2026-04-01T00:00:00-03:00",
      "window": { "start": "2026-04-01T00:00:00-03:00", "end": "2026-05-01T00:00:00-03:00" }
    },
    "lifecycle": { "current_state": "documented" },
    "billing": { "amount": { "value": 800, "currency": "USD" }, "status": "invoiced" }
  },
  {
    "id": "svc_apr_overage_1",
    "service_order_id": "so_retainer_2026",
    "kind": "occurrence",
    "name": "Overage counsel — contract review",
    "duration_minutes": 120,
    "schedule": { "requested_at": "2026-04-18T08:00:00-03:00", "scheduled_for": "2026-04-18T14:00:00-03:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-18T14:02:00-03:00", "checkout": "2026-04-18T16:00:00-03:00", "duration_actual": 118 },
    "billing": { "amount": { "value": 300, "currency": "USD" }, "status": "invoiced" }
  },
  {
    "id": "svc_apr_overage_2",
    "service_order_id": "so_retainer_2026",
    "kind": "occurrence",
    "name": "Overage counsel — supplier dispute",
    "duration_minutes": 120,
    "schedule": { "requested_at": "2026-04-24T09:30:00-03:00", "scheduled_for": "2026-04-24T11:00:00-03:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-24T11:00:00-03:00", "checkout": "2026-04-24T13:05:00-03:00", "duration_actual": 125 },
    "billing": { "amount": { "value": 300, "currency": "USD" }, "status": "invoiced" }
  }
]
```

The April invoice of $1,400 decomposes into $800 against the period delivery and
$600 against two occurrence deliveries. Every line traces to a delivery, and the
two overage deliveries carry ordinary check-in/check-out evidence because they are
ordinary acts.

Note what is *not* modeled: the ten included hours are not a quantity on the period
delivery. They are the Order's `scope.hours_limit`, which already exists, and the
ledger's `hours_consumed` already projects consumption against it (§8.2.5).

### B.2 Elevator maintenance contract — both kinds under one Order

Annual contract: quarterly preventive visits, plus 4-hour-response corrective
call-outs, unlimited, for the year. This is the case the §4.7 guardrail exists for.

| What | Kind | Why |
|---|---|---|
| The 4-hour response commitment, all year | **`period`**, window = the contract year | Nothing to point at. The obligation is to *be available*, and it is held on days when nothing breaks. |
| Each quarterly preventive visit | **`occurrence`** ×4 | Discrete separable acts. "Was the Q2 visit delivered?" is answerable. |
| Each corrective call-out | **`occurrence`** ×N | Same test. |

```json
[
  { "id": "svc_sla_2026", "kind": "period",
    "name": "4-hour response commitment — 2026",
    "duration_minutes": 525600,
    "schedule": { "requested_at": "2025-12-10T09:00:00-03:00",
                  "scheduled_for": "2026-01-01T00:00:00-03:00",
                  "window": { "start": "2026-01-01T00:00:00-03:00", "end": "2027-01-01T00:00:00-03:00" } },
    "lifecycle": { "current_state": "in_progress" },
    "billing": { "amount": { "value": 2400000, "currency": "CLP" }, "status": "invoiced" } },

  { "id": "svc_prev_q1", "kind": "occurrence",
    "name": "Preventive maintenance — Q1",
    "duration_minutes": 180,
    "schedule": { "requested_at": "2025-12-10T09:00:00-03:00", "scheduled_for": "2026-03-12T09:00:00-03:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-03-12T09:04:00-03:00", "checkout": "2026-03-12T11:50:00-03:00", "duration_actual": 166 },
    "billing": { "amount": { "value": 0, "currency": "CLP" }, "status": "pending" } },

  { "id": "svc_call_0417", "kind": "occurrence",
    "name": "Corrective call-out — door sensor",
    "duration_minutes": 90,
    "schedule": { "requested_at": "2026-04-17T06:41:00-04:00", "scheduled_for": "2026-04-17T08:10:00-04:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-17T08:12:00-04:00", "checkout": "2026-04-17T09:35:00-04:00", "duration_actual": 83 },
    "billing": { "amount": { "value": 0, "currency": "CLP" }, "status": "pending" } }
]
```

The preventive visits and call-outs carry `billing.amount: 0` because their
economic value is in the period delivery — the contract price buys the commitment,
and the visits are its consumption. This is `§4` doing its job: within an Order the
`billing` dimension of an individual delivery is informative, not transactional.

**What would be wrong here** is one period delivery for the whole contract with the
visits folded into its evidence. Then "was the Q3 preventive visit performed?" — the
question the building administrator actually asks, and the one a regulator asks
after an incident — has no record to answer it.

**Early termination (§4.6).** If the contract is cancelled on 2026-06-30:

```diff
   { "id": "svc_sla_2026", "kind": "period",
     "duration_minutes": 525600,
-    "lifecycle": { "current_state": "in_progress" },
+    "lifecycle": { "current_state": "partial",
+                   "exceptions": [ { "type": "cancellation", "at": "2026-06-30T23:59:59-04:00",
+                                     "initiated_by": "cli_edificio",
+                                     "resolution": "Terminated by client with 30 days notice per clause 8." } ] },
-    "billing": { "amount": { "value": 2400000, "currency": "CLP" }, "status": "invoiced" } }
+    "proof": { "duration_actual": 260640 },
+    "billing": { "amount": { "value": 1200000, "currency": "CLP" }, "status": "invoiced" } }
```

`duration_actual` is 181 days in minutes. The prorated amount is declared as half
the annual price — which the parties agreed as "by completed calendar half", not
as `260640 / 525600 = 49.6%`. That difference is exactly why §4.6 requires the
proration to be declared rather than inferred.

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../GOVERNANCE.md).
