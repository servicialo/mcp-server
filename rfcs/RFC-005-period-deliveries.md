# RFC-005: Period Deliveries

| Field | Value |
|-------|-------|
| RFC number | 005 |
| Title | Period Deliveries (availability obligations satisfied over a window) |
| Author(s) | Servicialo SpA — Franco Danioni ([@danioni](https://github.com/danioni)), acting maintainer |
| Status | Draft — Open for Comment (window opened 2026-08-23) |
| Category | Minor (additive OPTIONAL field) — 2 wks comment + 1 wk FCP per [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) §3.2 |
| Type | Protocol Semantics |
| Discussion | [PR #21](https://github.com/servicialo/mcp-server/pull/21) |
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
  `schedule.window` computed per §4.3.1. It is derived, not independently chosen,
  and implementations MUST reject a document where the two disagree.
- `schedule.duration_expected`, when present, follows the same rule.
- `proof.duration_actual` carries the length in minutes during which the
  obligation was actually in force, computed the same way. For a window that ran
  to completion this equals `duration_minutes`; for an early termination (§4.6) it
  is smaller, and the difference is the proration signal.

#### 4.3.1 How the window length is computed (normative)

The MUST above needs an arithmetic, and the obvious one is wrong. The length of
`schedule.window` is:

> the number of whole minutes elapsed between `window.start` and `window.end`
> **as instants on the timeline** — that is, after normalizing both to UTC —
> truncated toward zero.

Two consequences that are not optional readings:

- **It is not `days × 1440`.** A window expressed in local calendar terms that
  crosses a daylight-saving transition is longer or shorter than the day count
  suggests. April 2026 in `America/Santiago` runs from `2026-04-01T00:00:00-03:00`
  to `2026-05-01T00:00:00-04:00`; that is 30 calendar days but **43,260** minutes,
  not 43,200, because the zone leaves DST inside the window. An implementation
  that multiplies days by 1440 produces a document that fails its own MUST.
- **Same-zone subtraction is not the same thing.** Several standard date libraries
  subtract two zone-aware timestamps by wall clock when both carry the same zone,
  returning the calendar difference rather than the elapsed one. Normalizing to
  UTC first is the operation being specified; reaching for the library's default
  subtraction is the bug this paragraph exists to prevent.

Sub-minute components are truncated, so `window` boundaries SHOULD be
minute-aligned. Implementations MUST NOT round to the nearest minute — truncation
is specified so that two implementations computing the same window agree exactly.

**What remains open** is only how an obligation expressed in *calendar* terms
("the month of April") chooses the instants that go into `window`. That is
open question 3. The arithmetic over instants, once chosen, is fixed here.

#### 4.3.2 Guardrail: a period delivery is not an appointment (normative)

`duration_minutes` and `scheduled_for` are populated on a period delivery for
compatibility (§4.2, §4.3), and a consumer that reads them without checking `kind`
will mistake a year-long stand-by commitment for an appointment. The rule is
stated by category rather than by symptom, because the symptoms are several:

Implementations MUST NOT give a `kind: period` delivery **appointment-type
treatment**. A period delivery does not denote a punctual event, and therefore:

| Treatment | Why it is wrong for a period |
|---|---|
| Availability occupancy | `§6.2`'s three-way commitment of provider, client and Resource in the `scheduled` state does not apply. A scheduler that blocked a lawyer's calendar for 31 days would be honoring the letter of `duration_minutes` and useless in practice. |
| Appointment reminders | "Your appointment is tomorrow at 00:00" for a March retainer. |
| Pre-appointment confirmation prompts | There is no arrival to confirm. This is about reminder-style prompts, not the `confirmed` lifecycle state — a period delivery does traverse `confirmed`, where the parties acknowledge the commitment for the window (§4.4). |
| No-show detection | A detector watching for `scheduled_for` to pass without a check-in marks the provider a no-show on the first instant of the window. |

The list is illustrative of the category, not exhaustive. The test is whether the
behavior assumes someone shows up somewhere at a time.

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
that is the level keyed `bilateral` (currently numbered L2 —
[proof-of-service §3.1](../public/spec/extensions/proof-of-service.md)).

**The semantic key is the reference, not the number.** Where this document names a
certainty level it names the key and gives the number parenthetically, because the
numbers have already moved once.

> **Note on level numbering.** The decision that motivated this RFC described this
> floor as "L1". That matches Proof of Service **0.1.0**, where L1 was "Bilateral
> verification". The extension renumbered at 0.2.0: bilateral attestation is now
> L2, and 0.2.0's L1 is `asserted` (a single party). The requirement is unchanged —
> bilateral confirmation at window close — only the label is current.
>
> This RFC therefore depends on the numbering staying put. Any subsequent revision
> of the Proof of Service extension MUST treat the certainty levels as additive
> only and MUST NOT renumber them while this reference stands.

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

**Why this is editorial in effect.** The argument is one of scope, not of
intent: the re-anchoring bites only on documents with `kind: period`, and no such
document can exist before this RFC. For every delivery that exists today — all of
them `occurrence` by §4.1 — both corrected paragraphs say exactly what the current
text says and describe exactly the current behavior. No conforming implementation
changes what it does, because the clause that changed does not reach any document
it has ever produced or consumed.

They are included in this RFC rather than filed as errata because patching them
separately would decide this RFC's central question by accident: choosing which of
the two contradicting texts to keep *is* choosing between route (a) and route (b)
from §2.

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
readable one for documents that do. No `Servicialo-Deprecated-Behavior` header and
no downgrade mapping are required.

### 7.1 The cost this choice does buy, stated plainly

Deriving `duration_minutes` rather than relaxing it (§4.3) keeps every period
delivery a *valid, complete* document under the current schema — a legacy consumer
reads it rather than rejecting it. That is the reason for the choice, and it has a
price that this RFC does not hide:

**A legacy consumer that aggregates `duration_minutes` will poison its own
aggregates.** Utilization, capacity, average-session-length and provider-load
metrics that sum or average the field across deliveries will absorb 44,640 minutes
from a one-month retainer and 525,600 from an annual stand-by commitment. Nothing
errors. The number is simply wrong, quietly, in a dashboard.

Relaxing the field would have converted this into a loud failure (a missing
required field) instead of a silent one — that is the honest counter-argument for
alternative 10.2, and it is why the trade is stated here rather than buried. The
choice stands because a rejected document is worse than a skewed metric: the
rejection breaks the delivery record itself, which is the thing the Proof of
Service depends on, while the metric is recoverable by anyone who reads `kind`.

**Mitigation, and where it is enforced.** Every aggregate over `duration_minutes`
MUST be conditioned on `kind`. Asking politely is not a mitigation, so it is
anchored where it can be checked: the consumer conformance profile proposed for
v1.0 — see
[`docs/issue-templates/stress-test-v0.10/q11-consumer-conformance.md`](../docs/issue-templates/stress-test-v0.10/q11-consumer-conformance.md)
— **MUST include a period delivery in its fixture set**, so that a consumer cannot
claim the profile while treating `kind` as absent. That single fixture is what
turns this paragraph from a warning into a requirement.

Implementations SHOULD also expose period and occurrence deliveries as separately
filterable in any listing surface, so the conditioning is easy rather than
merely mandatory.

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
§15.5 protect exactly that direction. A period delivery would stop being a valid
complete document under the current schema, so a legacy consumer would reject it
outright rather than read it.

The counter-argument deserves its due: relaxation would make the legacy failure
*loud* (a missing required field) instead of silent (a skewed aggregate). §7.1
states that cost and takes the trade anyway — a rejected delivery record is worse
than a recoverable metric, because the record is what the Proof of Service is made
of.

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

## 11. Promotion criteria and open questions

### 11.1 Promotion from Draft to Accepted

Not an open question — the repository's own governance answers it, and
running-code-first is a criterion rather than a preference. This RFC is promoted
when all three hold:

1. **Process.** The comment window and Final Comment Period for a Minor RFC have
   run per [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) §3.2 (2 weeks
   + 1 week), and any formal objections under §3.10 are resolved.
2. **Running code.** The reference implementation emits and consumes period
   deliveries behind the version gate of RFC-001 §3.7 — declared in
   `registry.manifest`, not shipped ahead of negotiation.
3. **Verifiable.** A period delivery fixture is in the conformance corpus,
   covering the two invariants JSON Schema cannot express (Annex A.4) and the
   consumer-side conditioning required by §7.1.

Criterion 2 is the one that matters for a Minor RFC per RFC-001 §3.2, which asks
for reference-implementation evidence. Criterion 3 is what keeps the MUSTs in §4.2
and §4.3 from becoming the kind of unverified requirement this repository already
has one of (mandate scope enforcement, §10.5 — specified, unenforced, unchecked).

### 11.2 Open questions

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
3. **How a calendar obligation picks its instants.** Narrowed: the arithmetic over
   `{start, end}` is fixed in §4.3.1 and is not open. What is open is the step
   before it — when the parties agree on "the month of April", should the document
   carry the IANA zone that turned that phrase into two instants, so a reader can
   audit the conversion (and see why April 2026 in Santiago is 43,260 minutes),
   or is the resulting instant pair sufficient on its own?
4. **Zero-event disclosure.** Narrowed: for *consumption*, this answers itself —
   the occurrence deliveries exist as objects (§4.8, Annex B.1), so a count is
   derivable by anyone holding the Order. What remains open is the genuine
   zero-event case, where the honest statement is an absence: should a period
   delivery be able to assert "held, zero call-outs" explicitly, rather than
   leaving a reader to conclude it from finding nothing? An absence is the one
   thing a join cannot distinguish from a gap in the data.

---

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

### A.4 The two invariants the schema cannot carry

`§4.2` requires `scheduled_for == window.start`, and `§4.3` requires
`duration_minutes == length(window)` per the arithmetic in §4.3.1. **Neither is
expressible in JSON Schema 2020-12** (the draft these schemas declare): there is
no cross-property comparison, and no arithmetic over `date-time` values.

They are therefore not schema constraints, and this RFC does not pretend they are.
**Both are verified in the conformance suite**, with fixtures in both directions:

| Fixture | Expected |
|---|---|
| period, `scheduled_for == window.start` | accepted |
| period, `scheduled_for != window.start` | rejected |
| period, `duration_minutes` equal to the UTC-elapsed window length | accepted |
| period, `duration_minutes` computed as `days × 1440` across a DST transition | rejected — this is the §4.3.1 trap, and it is the fixture that catches it |
| period, `window.end` not after `window.start` | rejected |

This is stated explicitly because the same repository already carries a MUST that
nothing verifies (`§10.5` mandate scope enforcement, absent from the
`certification.md` requirement→verification matrix). A new MUST without a named
verification owner is how that happens; naming the owner here is the cost of
adding one.

### A.5 What is deliberately not changed

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

One period delivery for the month, **plus an occurrence delivery for every act**
— the included ones and the overage ones alike. The guardrail in §4.7 does not
have an exception for "already paid for": a call with counsel is a discrete
separable act, so it is an occurrence whether it falls inside the ten included
hours or beyond them. Folding the included hours into the period delivery's
evidence would leave them with no object to present, which is precisely the
criticism §5 makes of modeling a retainer as a CAC.

What distinguishes included from overage is not the object — it is the amount.

```json
[
  {
    "id": "svc_apr_retainer",
    "service_order_id": "so_retainer_2026",
    "kind": "period",
    "name": "Priority availability retainer — April 2026",
    "duration_minutes": 43260,
    "schedule": {
      "requested_at": "2026-02-25T10:00:00-03:00",
      "scheduled_for": "2026-04-01T00:00:00-03:00",
      "window": { "start": "2026-04-01T00:00:00-03:00", "end": "2026-05-01T00:00:00-04:00" }
    },
    "lifecycle": { "current_state": "documented" },
    "billing": { "amount": { "value": 800, "currency": "USD" }, "status": "invoiced" }
  },

  {
    "id": "svc_apr_incl_1",
    "service_order_id": "so_retainer_2026",
    "kind": "occurrence",
    "name": "Included counsel — employment policy review",
    "duration_minutes": 240,
    "schedule": { "requested_at": "2026-04-06T09:00:00-04:00", "scheduled_for": "2026-04-07T10:00:00-04:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-07T10:00:00-04:00", "checkout": "2026-04-07T14:00:00-04:00", "duration_actual": 240 },
    "billing": { "amount": { "value": 0, "currency": "USD" }, "status": "pending" }
  },
  {
    "id": "svc_apr_incl_2",
    "service_order_id": "so_retainer_2026",
    "kind": "occurrence",
    "name": "Included counsel — lease renegotiation call",
    "duration_minutes": 180,
    "schedule": { "requested_at": "2026-04-13T11:20:00-04:00", "scheduled_for": "2026-04-14T09:00:00-04:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-14T09:03:00-04:00", "checkout": "2026-04-14T12:00:00-04:00", "duration_actual": 177 },
    "billing": { "amount": { "value": 0, "currency": "USD" }, "status": "pending" }
  },
  {
    "id": "svc_apr_incl_3",
    "service_order_id": "so_retainer_2026",
    "kind": "occurrence",
    "name": "Included counsel — board minutes review",
    "duration_minutes": 180,
    "schedule": { "requested_at": "2026-04-20T15:00:00-04:00", "scheduled_for": "2026-04-21T15:00:00-04:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-21T15:00:00-04:00", "checkout": "2026-04-21T18:00:00-04:00", "duration_actual": 180 },
    "billing": { "amount": { "value": 0, "currency": "USD" }, "status": "pending" }
  },

  {
    "id": "svc_apr_over_1",
    "service_order_id": "so_retainer_2026",
    "kind": "occurrence",
    "name": "Overage counsel — supplier dispute",
    "duration_minutes": 120,
    "schedule": { "requested_at": "2026-04-24T09:30:00-04:00", "scheduled_for": "2026-04-24T11:00:00-04:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-24T11:00:00-04:00", "checkout": "2026-04-24T13:05:00-04:00", "duration_actual": 125 },
    "billing": { "amount": { "value": 300, "currency": "USD" }, "status": "invoiced" }
  },
  {
    "id": "svc_apr_over_2",
    "service_order_id": "so_retainer_2026",
    "kind": "occurrence",
    "name": "Overage counsel — supplier dispute follow-up",
    "duration_minutes": 120,
    "schedule": { "requested_at": "2026-04-28T08:15:00-04:00", "scheduled_for": "2026-04-28T16:00:00-04:00" },
    "lifecycle": { "current_state": "documented" },
    "proof": { "checkin": "2026-04-28T16:00:00-04:00", "checkout": "2026-04-28T18:02:00-04:00", "duration_actual": 122 },
    "billing": { "amount": { "value": 300, "currency": "USD" }, "status": "invoiced" }
  }
]
```

Ten included hours across three acts, four overage hours across two. The April
invoice of $1,400 decomposes into $800 against the period delivery and $600
against the two overage occurrences. The three included occurrences carry
`amount: 0` — their economic value is in the retainer, and per `§4` the `billing`
dimension of a delivery inside an Order is informative, not transactional. Every
line of the invoice traces to a delivery; every act has an object that can be
presented.

`scope.hours_limit: 10` on the Order is what makes three of these "included" and
two "overage", and `ledger.hours_consumed` projects the 14 consumed hours from the
five occurrence deliveries (§8.2.5) — the period delivery contributes none, since
availability is not consumption.

**Note the window.** April 2026 in `America/Santiago` ends at `-04:00`, not
`-03:00`, because the zone leaves DST on April 5. `duration_minutes` is therefore
**43,260**, not the 43,200 that `30 × 1440` would give. This is the §4.3.1 case,
and it is in the worked example on purpose: it is the arithmetic an implementer
gets wrong first.

**And note what this settles.** Open question 4 asks whether a period delivery
should declare how much happened inside its window. For consumption it does not
need to: the acts are objects, so the count and the hours are derivable by anyone
holding the Order. Only the genuine zero-event case — B.2's maintenance contract in
a quiet quarter — has nothing to derive from, which is why the question survives in
narrowed form.

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

**Early termination (§4.6).** The contract is cancelled effective the end of June:

```diff
   { "id": "svc_sla_2026", "kind": "period",
     "duration_minutes": 525600,
-    "lifecycle": { "current_state": "in_progress" },
+    "lifecycle": { "current_state": "partial",
+                   "exceptions": [ { "type": "cancellation", "at": "2026-07-01T00:00:00-04:00",
+                                     "initiated_by": "cli_edificio",
+                                     "resolution": "Terminated by client with 30 days notice per clause 8. Prorated to two completed calendar quarters." } ] },
-    "billing": { "amount": { "value": 2400000, "currency": "CLP" }, "status": "invoiced" } }
+    "proof": { "duration_actual": 260700 },
+    "billing": { "amount": { "value": 1200000, "currency": "CLP" }, "status": "invoiced" } }
```

Two things this small diff carries.

**The DST hour shows up again.** `duration_actual` is **260,700**, not the 260,640
that `181 × 1440` would give — the obligation was in force across the April
transition, so the elapsed minutes exceed the day count by 60. §4.3.1 governs
`duration_actual` exactly as it governs `duration_minutes`, and this is the second
place in one example where the naive multiplication is wrong.

**The proration is declared, not derived.** The amount is half the annual price,
because the parties agreed "by completed calendar quarter". The elapsed ratio is
`260700 / 525600 = 49.6%`, which is close enough to look like the same answer and
is not. §4.6 requires the declaration precisely so that a reader is never invited
to reverse-engineer a commercial term from a duration — and this example is
calibrated to show a case where doing so would land within half a percent of the
truth and still be the wrong method.

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../GOVERNANCE.md).
