# RFC-006: Dual Cycle — Session and Financial Obligation

| Field | Value |
|-------|-------|
| RFC number | 006 |
| Title | Dual Cycle (the financial obligation as an object with its own identity and cardinality) |
| Author(s) | Servicialo SpA — Franco Danioni ([@danioni](https://github.com/danioni)), acting maintainer |
| Status | Draft — Open for Comment (window opened 2026-08-29) |
| Category | **Major** (new entity + semantic shift of two core states) — 4 wks comment + 1 wk FCP per [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) §3.2 |
| Type | Protocol Semantics |
| Discussion | PR #48 |
| Created | 2026-08-29 |
| Last updated | 2026-08-29 |
| Target version | Servicialo Protocol v1.0 |
| Motivating analysis | Production audit of the reference implementation (Coordinalo), 2026-08-29 — figures reproduced in §3.1 |
| Related | [state-dimensions](../public/spec/extensions/state-dimensions.md) §6 open question 3 (this RFC answers it); [#36](https://github.com/servicialo/mcp-server/issues/36) (obligations: projection or object?); [#31](https://github.com/servicialo/mcp-server/issues/31) (allocation across deliveries); [#32](https://github.com/servicialo/mcp-server/issues/32) (chargeback); [RFC-005](RFC-005-period-deliveries.md) (period deliveries) |
| License | Apache-2.0 |

> **Directory note.** `rfcs/` and RFC-001 arrive with
> [PR #13](https://github.com/servicialo/mcp-server/pull/13), which is open at the
> time of writing; [RFC-005](https://github.com/servicialo/mcp-server/pull/21) is
> open on the same basis. Links to `RFC-001-…` and `RFC-005-…` resolve once those
> merge. The index row for RFC-006 in [`rfcs/README.md`](README.md) is a merge
> task, not an edit made here, so the branches do not collide on the same file.

> **ES:** `invoiced` y `collected` son los estados 7 y 8 del ciclo de vida de una
> sesión. Ser estados de la sesión presupone tres cosas: que una sesión
> corresponde a una factura, que corresponde a un cobro, y que ambos ocurren
> después de la entrega y en ese orden. Las tres son falsas contra la única
> implementación real. Este RFC propone separar el ciclo operacional de la sesión
> del ciclo de la obligación financiera, y darle a la obligación identidad propia
> y cardinalidad 1..N sobre sesiones.
>
> **EN:** `invoiced` and `collected` are states 7 and 8 of a *session's* lifecycle.
> Making them session states presupposes three things: that one session
> corresponds to one invoice, that it corresponds to one collection, and that both
> happen after delivery and in that order. All three are false against the only
> real implementation. This RFC proposes separating the operational cycle of the
> session from the cycle of the financial obligation, and giving the obligation
> its own identity and a 1..N cardinality over sessions.

---

## 1. Summary / Resumen

**ES:** Se propone modelar dos ciclos de vida independientes:

- **Sesión (operacional):** `solicitada → agendada → confirmada → en curso → completada → documentada → verificada`. Es el ciclo de un acto de servicio.
- **Obligación financiera:** `emitida → parcial → saldada`. Es el ciclo de un derecho de cobro, con identidad propia y una referencia a **1..N** sesiones.

Los estados 7 (`invoiced`) y 8 (`collected`) dejan de ser estados de la sesión y
pasan a ser **proyecciones derivables** de la obligación que la referencia. El
cambio no obliga a ninguna implementación a cambiar su wire: §5 define el mapeo
que deriva `invoiced`/`collected` desde la obligación, de modo que un consumidor
que solo entiende el enum actual sigue leyendo lo mismo.

Este RFC **no** propone un modelo nuevo de dimensiones ortogonales — eso ya existe
como [state-dimensions](../public/spec/extensions/state-dimensions.md) (draft).
Propone lo único que una proyección por sesión no puede expresar: que la
obligación es **un objeto**, no un atributo, porque una sola obligación cubre
varias sesiones. Es la respuesta, con evidencia de producción, a la pregunta
abierta 3 de esa extensión.

**EN:** This RFC proposes two independent lifecycles:

- **Session (operational):** `requested → scheduled → confirmed → in_progress → completed → documented → verified`. The lifecycle of an act of service.
- **Financial obligation:** `issued → partial → settled`. The lifecycle of a claim to payment, with its own identity and a reference to **1..N** sessions.

States 7 (`invoiced`) and 8 (`collected`) stop being session states and become
**derivable projections** of the obligation that references the session. The
change forces no implementation to change its wire: §5 defines the mapping that
derives `invoiced`/`collected` from the obligation, so a consumer that only
understands today's enum keeps reading the same values.

This RFC does **not** propose a new orthogonal-dimension model — that already
exists as [state-dimensions](../public/spec/extensions/state-dimensions.md)
(draft). It proposes the one thing a per-session projection cannot express: that
the obligation is **an object**, not an attribute, because a single obligation
covers several sessions. It is the evidence-backed answer to open question 3 of
that extension.

---

## 2. Motivation / Motivación

**ES:** El protocolo define `invoiced` y `collected` como estados 7 y 8 del ciclo
de vida de la sesión ([PROTOCOL.md §6](../PROTOCOL.md), "Financial Extension").
Un estado de la sesión es una afirmación sobre *esa* sesión. Ponerlos ahí
presupone:

1. **Una sesión ⇒ una factura.** Falso: el cobro consolidado mensual emite una
   obligación por N sesiones.
2. **Una sesión ⇒ un cobro.** Falso: el cobro parcial deja la obligación viva
   entre dos montos, y ninguna sesión individual puede sostener ese estado.
3. **Orden fijo entrega → factura → cobro.** Falso: el prepago cobra antes de que
   la sesión exista como acto.

No son casos de borde hipotéticos. Son los tres modos de cobro de la única
implementación en producción, y §3.1 los cuenta.

**EN:** The protocol defines `invoiced` and `collected` as states 7 and 8 of the
*session* lifecycle ([PROTOCOL.md §6](../PROTOCOL.md), "Financial Extension"). A
session state is an assertion about *that* session. Placing them there
presupposes:

1. **One session ⇒ one invoice.** False: consolidated monthly billing issues one obligation for N sessions.
2. **One session ⇒ one collection.** False: partial collection leaves the obligation alive between two amounts, and no individual session can hold that state.
3. **A fixed order delivery → invoice → collection.** False: prepayment collects before the session exists as an act.

These are not hypothetical edge cases. They are the three billing modes of the
only implementation in production, and §3.1 counts them.

---

## 3. Detailed Design

### 3.1 Evidence: what the reference implementation actually does

Figures from a direct audit of the Coordinalo production database on 2026-08-29.
Aggregate counts only; no client, provider or session-level data is reproduced.
Queries are given in §9 so any reviewer with access can re-run them.

| # | Presupposition of states 7–8 | What production shows | Count |
|---|---|---|---|
| 1 | one session ⇒ one invoice | monthly closes (`cierres_cliente`) covering **more than one** session — one financial close, N sessions | **1,276 of 1,685** (75.7%), max **13** sessions in one close, across 16 monthly periods |
| 2 | one session ⇒ one collection | collections in state `parcial` — the obligation is neither open nor settled | **39**; of those, **33** have `0 < paid < amount` |
| 3 | delivery precedes collection | collections settled **before** the session's scheduled time (prepayment) | **85** distinct collections settled pre-schedule; **552** created before the session was scheduled (of 9,190 collection↔session pairs) |

A secondary figure decides the question more sharply than any of the three:

> **Of 16,712 sessions carrying a status, exactly `0` are in `invoiced` or `collected`.**

The two states this RFC proposes to relocate have **zero occupancy** in the only
implementation that exists. The financial facts are all there — 10,767 collection
records, 10,262 payments, 1,685 monthly closes — they simply do not live on the
session. 33 sessions carry an `invoicedAt` timestamp and 21 a `paidAt` timestamp,
but never as a *state*: as a stamp pointing at a financial fact recorded
elsewhere.

The vocabulary is not being violated by a careless implementer. It is being
routed around because it cannot express what the implementation does.

### 3.2 The spec already contradicts itself here

[PROTOCOL.md §6.4](../PROTOCOL.md) states:

> What triggers the transition from `completed` to the financial cycle depends on
> the **revenue recognition method**, which is an attribute of the service or
> package — **not of the session**.

The section immediately above it lists `invoiced` and `collected` as states 7 and
8 **of the session**. §6.4 says revenue recognition is not an attribute of the
session; §6 encodes it as two of the session's own states. Both sentences are
normative and they cannot both be right.

The same contradiction appears a second time, in the Order ledger.
[§8.2.5](../PROTOCOL.md) already models settlement as independent:

> Invoicing is NOT a function of verified deliveries alone — a prepaid or periodic
> Order invoices on its own schedule.
>
> A payment MAY be recorded before any delivery is accredited
> (`amount_collected > 0` with `services_verified = 0` is a valid ledger state).

So the protocol already knows that settlement runs on its own clock. It knows it
at the Order level and states it plainly. The session lifecycle is the one place
that still encodes the opposite. This RFC does not introduce a new idea into the
protocol — it removes the last place where the protocol still says the old one.

### 3.3 The proposal

Two independent state machines.

**Session (operational)** — unchanged from today's core, minus the financial states:

```
requested → scheduled → confirmed → in_progress → completed → documented → verified
```

**Financial obligation (new entity)** — its own object, its own identity:

```
issued → partial → settled
```

| State | Meaning |
|---|---|
| `issued` | The claim to payment exists and is quantified. Nothing has been received against it. |
| `partial` | Received amount is strictly between zero and the obligation's total. |
| `settled` | The obligation is discharged. |

Minimum shape of the entity:

```yaml
obligation:
  id: string                # Own identity. Not derived from any session.
  amount: { value, currency }
  state: issued | partial | settled
  covers: [session_id]      # 1..N. THIS is the field the model is missing.
  issued_at: datetime
  settled_at: datetime?     # null until settled
```

The load-bearing field is `covers`. Everything else in this RFC follows from it.
`covers` is a set of cardinality 1..N, and **that cardinality is the whole
argument**: a per-session attribute cannot represent a set that spans sessions,
no matter how many dimensions it is projected into.

The obligation's state machine is ordered *within itself* — an obligation cannot
go from `settled` back to `issued` without a distinct reversal event
([#32](https://github.com/servicialo/mcp-server/issues/32) owns that question).
No ordering constraint exists between the obligation's cycle and the session's.
That is the point: they are different clocks.

### 3.4 The three impossible cases, expressed

**Case 1 — consolidated monthly billing.** Twelve sessions in a month, one
invoice at month close.

```yaml
# Today: impossible. 12 sessions must each claim `invoiced`, asserting
# 12 invoices where 1 exists. Or none does, and the invoice is unrepresentable.

obligation:
  id: obl_2026_08_client_x
  amount: { value: 480000, currency: CLP }
  state: issued
  covers: [ses_01, ses_02, ses_03, ses_04, ses_05, ses_06,
           ses_07, ses_08, ses_09, ses_10, ses_11, ses_12]
  issued_at: 2026-08-31T23:59:00Z

# The 12 sessions are all `verified`. They say nothing about invoicing,
# because invoicing is not a fact about any one of them.
```

**Case 2 — partial collection.** An obligation of 240,000 with 90,000 applied.

```yaml
# Today: impossible. `collected` is binary. The session is either collected
# or not; there is no state for "the obligation is alive between two amounts".

obligation:
  id: obl_7742
  amount: { value: 240000, currency: CLP }
  state: partial          # 90,000 received; 150,000 outstanding
  covers: [ses_88]
```

`partial` is a state of the *obligation*, which is the only thing that has an
amount. This is what the 39 rows in §3.1 are, and why they have no canonical
translation today.

**Case 3 — prepayment.** Paid on the 1st, delivered on the 15th.

```yaml
# Today: impossible without lying about order. `collected` is state 8, after
# `completed` (5) and `documented` (6). A session collected before it is
# delivered must either skip states — forbidden by §6.1 — or misreport its state.

obligation:
  id: obl_9001
  amount: { value: 60000, currency: CLP }
  state: settled           # 2026-08-01
  covers: [ses_120]
  settled_at: 2026-08-01T14:02:00Z

session ses_120:
  state: scheduled         # 2026-08-15. Not yet delivered.
```

Settled obligation, undelivered session, both true at the same instant, neither
contradicting the other. Under today's model this state is unrepresentable, and
§6.1's forward-only rule makes it a conformance violation to try.

### 3.5 Relationship to state-dimensions (what is and is not new here)

The [state-dimensions](../public/spec/extensions/state-dimensions.md) draft
extension already establishes the orthogonality and already carries a `financial`
dimension (`not_required | pending | invoiced | partially_paid | paid | refunded |
charged_back | written_off`). Its motivation section already names prepayment,
monthly invoicing and partial charges. **None of that is new in this RFC, and
this RFC does not restate it.**

What state-dimensions does *not* do is give the obligation an identity. Its
`financial` value is projected **per session**, delivered as an
`x-state-dimensions` object inside that session's `lifecycle.get_state` response.
Project Case 1 into it and each of the 12 sessions independently reports
`financial: invoiced`. That is twelve assertions where the world holds one fact.
Nothing in the response says *which* invoice, or that the twelve share it, or
what its amount is.

The extension is aware of this. §6, open question 3:

> Should multi-delivery orders aggregate dimension states, or expose one tuple per
> delivery only?

**This RFC answers that question: neither.** An aggregate is lossy and a per-
delivery tuple is a repetition. The obligation needs to be an object that both the
session and the Order can reference, because 75.7% of the monthly closes in
production have cardinality > 1, and cardinality is not a property a projection
can carry.

This also narrows [#36](https://github.com/servicialo/mcp-server/issues/36),
which asks whether obligations are projections or first-class objects using
assignment and set-off as the test. That issue reaches the question through a
hypothetical construction case. This RFC reaches the same question through the
production data of the only implementation, and answers the weaker form of it:
whatever assignment and set-off eventually require, the obligation must at minimum
be an object, because a projection already cannot count.

---

## 4. Drawbacks

1. **It is a new entity.** Under [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) §3.2 that makes this **Major**: 4 weeks of comment, and implementation evidence of *reference impl + one external implementation willing to commit*. This RFC cannot be Accepted under its own process until a second implementation exists. See §8.
2. **Two objects to keep coherent.** Today an implementer reads one enum. Under this proposal the obligation can be stale, orphaned, or double-counted with respect to its sessions. The compatibility mapping in §5 is what keeps that from leaking to consumers, but it is real cost inside a node.
3. **It reopens allocation.** Once one obligation covers N sessions, "how much of this obligation belongs to that session" becomes askable — which is exactly [#31](https://github.com/servicialo/mcp-server/issues/31). This RFC deliberately does not answer it (§8), but it does make the question unavoidable rather than hypothetical.
4. **`partial` is coarse.** It says an obligation is between zero and its total, not how far. That is deliberate — amounts belong to the ledger (§8.2.5), not to a state name — but implementers wanting a percentage will not find it here.

---

## 5. Compatibility Path

**The correction does not require touching Coordinalo, or any other node.**

`invoiced` and `collected` remain readable as **derived projections** of the
obligation that covers a session. A node keeps emitting today's enum; a consumer
that only understands today's enum keeps reading exactly what it read before.

Derivation rule, for a session `S` covered by obligation `O`:

| `O.state` | projected `S.lifecycle.current_state` |
|---|---|
| `issued` | `invoiced` |
| `partial` | `invoiced` |
| `settled` | `collected` |
| *(no obligation covers S)* | unchanged — the session's own operational state |

The projection is lossy **in exactly one direction and by design**: it discards
cardinality and amount. That loss is what today's model suffers permanently; here
it is confined to the compatibility surface, and the unprojected truth stays
available to consumers that ask for the obligation.

**Worked example — Case 1, twelve sessions under one invoice:**

```yaml
# What the node stores (the correction):
obligation obl_2026_08_client_x:
  amount: { value: 480000, currency: CLP }
  state: issued
  covers: [ses_01 … ses_12]

# What a legacy consumer sees, per session, unchanged from today:
GET lifecycle.get_state(ses_07)
  → { "current_state": "invoiced" }        # derived from obl.state = issued

# After the client pays in full:
obligation obl_2026_08_client_x: state = settled
GET lifecycle.get_state(ses_07)
  → { "current_state": "collected" }       # derived from obl.state = settled

# What a consumer that understands this RFC can additionally ask, and
# which no projection can answer today:
GET obligations.get(obl_2026_08_client_x)
  → { "amount": 480000, "state": "settled", "covers": [12 session ids] }
```

The legacy consumer's view never changes. The difference is that the node is no
longer required to assert twelve invoices to describe one, and a consumer that
wants the truth can now get it.

For nodes that decouple financial state today, PROTOCOL.md §6 already directs
them to expose it via `payments.get_status` rather than `lifecycle.get_state`.
This RFC is consistent with that instruction and gives the object that call
should return.

---

## 6. The `closed` case

Production carries **6 sessions in state `closed`**. `closed` is not in the
canonical enum (`schema/service.schema.json`: `requested, scheduled, confirmed,
in_progress, completed, documented, invoiced, collected, verified, cancelled,
disputed, reassigning, rescheduling, partial`). It has no canonical translation.
Nothing maps to it and it maps to nothing.

Two neighbours share the property: `in_review` (1 row) and `pending_scheduling`
(25 rows) are likewise absent from the enum.

It would be easy to treat these 32 rows as dirty data and normalize them. That
would be the wrong reading, and the audit is the reason: they sit alongside
**zero** rows in `invoiced` and **zero** in `collected`. The implementation is not
drifting from the vocabulary at random. It is not using the two states the
vocabulary offers, and it has minted states the vocabulary does not offer.

`closed` is small — six rows — and this RFC does not propose adopting it, naming
it, or blessing it. It is cited as **evidence of the same failure this RFC
addresses**: a vocabulary is already too short for its only implementation. Six
rows are not a mandate. They are a measurement, and the measurement points the
same direction as the 1,276 and the 39 and the 85.

Where the six rows *should* land is left open (§8): most plausibly they are an
operational closure that the session cycle ends at `verified` without naming, and
that is a question about the session cycle, not the obligation.

---

## 7. Alternatives Considered

**A. Do nothing; states 7–8 are OPTIONAL.** They are, and an implementation may
skip them. But "optional" resolves conformance, not meaning: §6.4 and §6 still
contradict each other, and a node that *does* implement them must still assert
one invoice per session. Optionality lets implementers avoid the error; it does
not remove it from the spec.

**B. Add `partially_collected` as state 8.5.** Fixes Case 2 only, and by making
the model worse: it puts an amount-derived state on the object that has no amount.
Cases 1 and 3 are untouched, since neither is about partiality.

**C. Rely on state-dimensions alone.** The nearest alternative and the reason §3.5
exists. It solves ordering (Case 3) and partiality (Case 2, via `partially_paid`)
and does so already. It cannot solve Case 1, because per-session projection has no
place to put cardinality. Since Case 1 is 75.7% of the monthly closes in
production, this RFC treats it as the load-bearing case rather than the exotic one.

**D. Relax §6.1's forward-only rule for states 7–9.** Permits the prepayment
ordering without new entities. It legalizes Case 3 while leaving the model saying
that a session gets invoiced — the presupposition, not the ordering, is the defect.

**E. Model the obligation only at the Order level (§8.2.5).** The ledger already
tracks `amount_billed` / `amount_collected` per Order and already states that
settlement runs independently. But an Order is not an obligation: one Order can
produce twelve monthly invoices, and the ledger holds totals, not the twelve
claims. This is the closest existing structure and the reason §5's compatibility
path is cheap — but totals cannot answer "which claim, covering which sessions,
in what state".

---

## 8. Limits of this proposal / Unresolved Questions

**This RFC generalizes from N=1.** Every figure in §3.1 comes from a single
production implementation, in a single vertical (health), under a single
jurisdiction's billing customs, operated by the same organization that maintains
this protocol. That is the weakest possible evidence base for a protocol change,
and it is stated here rather than in a footnote.

What the evidence does support is narrower than it may appear. It supports:
*today's vocabulary cannot express what its only implementation does.* That is a
falsification, and one implementation is enough to falsify a universal claim.
It does **not** support: *the dual cycle is the right shape for implementations
that do not exist yet.* Falsifying the current model and validating the proposed
one are different burdens of proof, and only the first is met.

**What would validate it.** A second independent implementation with a *different
billing policy* from Coordinalo's — ideally per-delivery invoicing, or milestone
billing, or a jurisdiction where the tax document and the collection are bound
more tightly than they are here. Three specific questions it would answer:

1. Does `issued → partial → settled` survive contact with a policy that issues
   tax documents per delivery? (If a second node never has cardinality > 1, Case 1
   is a Coordinalo artifact and this RFC is over-general.)
2. Is `covers` sufficient, or does the obligation also need to reference the Order
   directly? Coordinalo cannot answer this — its Order adoption is 43 rows.
3. Do three obligation states suffice, or does a real dunning/collections flow
   need more? Coordinalo has no dunning; a node that does may find `issued` hiding
   several distinct positions.

RFC-001 §3.2 already requires, for a Major RFC, *reference implementation + one
external implementation willing to commit*. **This RFC therefore cannot be
Accepted before a second node exists.** That is the correct outcome, not an
obstacle to route around: the comment window is for testing the diagnosis, and
acceptance should wait for the evidence the process already demands. If the window
closes without a second implementation, the honest disposition is to hold it in
`Open for Comment` or return it to `Draft` — not to accept it on the strength of
N=1.

**What this RFC explicitly does NOT propose, for lack of that second case:**

- **No allocation rule.** How much of a multi-session obligation belongs to one session is [#31](https://github.com/servicialo/mcp-server/issues/31)'s question. With N=1 there is no basis to choose proportional, ordered, or declared allocation.
- **No reversal semantics.** Refunds, chargebacks and write-offs are not given obligation states here. state-dimensions already names them in `financial` and [#32](https://github.com/servicialo/mcp-server/issues/32) owns the chargeback question.
- **No assignment or set-off.** [#36](https://github.com/servicialo/mcp-server/issues/36)'s construction case needs both. This RFC establishes only that the obligation is an object — a precondition for assignment, not a design for it.
- **No wire schema.** No JSON Schema, no `obligations.*` tool surface, no enum edits are proposed. Freezing a wire format on one implementation's shape is how N=1 becomes permanent.
- **No deprecation of `invoiced` / `collected`.** §5 keeps them derivable indefinitely. Whether they are ever deprecated is a separate decision requiring a deprecation window per RFC-001 §3.6.
- **No change to the six `closed` rows** (§6), which are cited as evidence and not as a proposal.

Open questions for the comment window:

1. Does the session cycle need a terminal operational state after `verified` — the thing `closed` may be reaching for?
2. Should `covers` reference sessions, deliveries, or both? RFC-005 introduces `period` deliveries with no session-like instance.
3. Should the obligation reference the Order, and if so is it required or optional?
4. Is `partial` a state or a derived predicate over the ledger (`0 < collected < billed`)? If derived, the obligation has two states and the ledger carries the rest.

---

## 9. Reproducibility

The §3.1 figures come from these queries against the Coordinalo production
database (2026-08-29). Aggregate only; no row-level data leaves the node.

```sql
-- Occupancy of the canonical states, and the non-canonical residue
SELECT status, count(*) FROM sessions GROUP BY status ORDER BY 2 DESC;
-- → completed 13399, cancelled 1601, no_show 1028, scheduled 477,
--   pending_confirmation 150, pending_scheduling 25, documented 24,
--   closed 6, verified 1, in_review 1
-- → invoiced 0, collected 0   (absent from the result set entirely)

-- Presupposition 1: one session ⇒ one invoice
SELECT count(*) FILTER (WHERE "sesionesCount" > 1) AS multi,
       count(*)                                    AS total,
       max("sesionesCount")                        AS max_sessions,
       count(DISTINCT periodo)                     AS periods
FROM cierres_cliente;
-- → 1276 / 1685, max 13, 16 periods

-- Presupposition 2: one session ⇒ one collection
SELECT estado, count(*) FROM cobros GROUP BY estado;
-- → pagado 9964, pendiente 423, parcial 39, anulado 1

-- Presupposition 3: delivery precedes collection
SELECT count(DISTINCT c.id) FILTER (WHERE c."fechaPago" < s."scheduledAt")
FROM cobros c JOIN sessions s ON s."ventaId" = c."ventaId"
WHERE c."ventaId" IS NOT NULL AND s."scheduledAt" IS NOT NULL;
-- → 85
```

---

## 10. Migration Path

None is required by this RFC, and that is the design intent.

Adoption is opt-in and additive. A node that adopts the dual cycle exposes the
obligation object; a node that does not keeps emitting today's enum. Consumers of
today's enum are unaffected in both cases, because §5's derivation is total over
the states they can already see.

If the obligation object is later made REQUIRED — a decision this RFC does not
ask for — that would be a separate Major RFC with its own window, plus a
deprecation window for `invoiced` / `collected` per RFC-001 §3.6.

---

*Registered in [`rfcs/README.md`](README.md). Comment window per RFC-001 §3.2:
opened 2026-08-29, minimum four weeks (closes 2026-09-26), followed by a one-week
Final Comment Period (through 2026-10-03).*
