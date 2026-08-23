---
name: "[settlement] Conditional holdback (hold → release)"
about: "Stress test v0.10 — Q6. A retention released by the absence of events in a window has no representation in the settlement track."
title: "[settlement] Support conditional holdback (hold → release) in the Settlement extension"
labels: [protocol-evolution, rfc]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 2 — industrial repair by milestones** (question 6 of 12).

The Order retains 10% of each milestone. The retention is released 60 days later
**if no warranty claim is filed**. This is an extremely common B2B construction and
industrial term, and it is the first settlement condition in the case set that is
triggered by the *absence* of an event rather than its occurrence.

## What the spec says today

Verified against `main`: nothing. Zero occurrences of holdback, retention (in the
financial sense), or escrow across `PROTOCOL.md`, `spec/`, `schema/` and
`public/spec/`.

The full settlement vocabulary available today is:

- `PROTOCOL.md §12.8.1`: `pending → charged → invoiced → paid ↘ disputed`
  (also `schema/service.schema.json`, `billing.status`).
- The draft extensions add `not_required`, `partially_paid`, `refunded`,
  `charged_back`, `written_off`
  ([state-dimensions §2.4](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/state-dimensions.md),
  [proof-of-service §3.3](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/proof-of-service.md)).

None of them expresses "settled, but a declared portion is not yet releasable".

## Two mechanics, not one

The design has to separate these before choosing a representation, because they
are different movements of money and only one of them is a complete payment:

**(i) Withholding** — the common form in LatAm B2B. The payer transfers **90** and
retains **10**. There is no movement of 100 anywhere: the retained amount never
leaves the payer. If the condition is met, a second transfer of 10 follows; if it
is not, the 10 is simply never transferred.

**(ii) Escrow** — 100 moves, and 10 sits in a recoverable position (an escrow
account, a platform balance, a reserve held by the acquirer). The full amount left
the payer; what is conditional is whether the provider keeps it or it returns.

The distinction is not accounting pedantry — it decides what a truthful ledger
says. Under withholding, `amount_collected` is 90. Any representation that reports
100 collected with an annotation is asserting a movement that did not happen, and
`§8.2.5` is explicit that the ledger is *"derived from recorded events"* and that
collection fields follow settlement events. Under escrow, 100 collected is exactly
right and the conditionality is a property of that payment.

`partially_paid` is wrong for both: under withholding the payment is complete on
its own terms (90 of a 90 obligation, for now), and under escrow the payer paid in
full. In neither case is anyone late.

The cost of getting this wrong is concrete: `§6.5` requires payroll to read only
`collected` sessions, so overstating collection pays out against money that has
not arrived, and understating it withholds pay that has.

## The question

Should the Settlement extension define a conditional holdback, and what releases
it?

Sub-questions the design has to answer:

1. Which of the two mechanics above is being represented, and can one
   representation serve both?
2. How is a *negative* condition ("no dispute was opened in 60 days") expressed
   without the protocol having to evaluate it? The protocol models states and
   references movements — it does not run business rules (`§1.2`).
3. Who can release early, and does release require counterparty attestation?
4. What happens if the condition fails — is the outcome `written_off`,
   `refunded`, or a settlement event of its own?

## Options considered

| Option | Shape | Fits |
|---|---|---|
| **A. Annotation on a settlement event** | The event recording the payment carries `{ held_amount, release_condition, release_at }`. `financial` stays `paid`; the releasable amount is derived. | **Escrow (ii).** Truthful when 100 really moved. Asserts a false movement under withholding. |
| **B. New settlement state** | A value between `paid` and terminal, e.g. `partially_released`. | Either, in principle — but see cost below. |
| **C. Decomposition into events** | `collected(90)` — complete on its own terms — plus a conditional/scheduled settlement event for the 10, resolving to release or forfeit. | **Withholding (i)**, natively. Also expresses escrow, with the 10 recorded as held rather than untransferred. |

**Why B is disfavoured.** The `financial` enum is kept bit-exact between two draft
extensions and `protocol/manifest.yaml` cross-checks that
(`scripts/verify-doc-claims.mjs` compares `proof_of_service.settlement_states`
against the `financial` dimension of state-dimensions). Widening it is a
three-surface change plus a CI guardrail update, paid for information that A and C
carry additively. A new state is also the least informative of the three: it says
*that* something is held, not how much, until when, or on what condition.

## Recommended direction

**C as the primary representation, A as the escrow variant, and they compose.**

C is the only option that keeps the ledger truthful under withholding, and it is
the most native to the protocol's own framing: *"the settlement event references
the movement; the movement happens outside the protocol"* (`§1.2`). A conditional
settlement event that has not resolved is precisely a movement the protocol
expects and has not observed — which the protocol already knows how to represent
for every other pending settlement.

A remains correct for escrow, where a real movement of 100 needs its conditional
portion described. And the two compose rather than compete: the annotation on the
escrowed payment can reference the conditional event that will resolve it, so a
consumer reads one linked structure in both mechanics instead of two unrelated
patterns.

On sub-question 2, the recommendation is that the protocol record the condition as
a **declared reference, not an evaluable rule**: a human-readable condition plus an
optional structured trigger (`no_event_of_type` + `window`). Evaluation stays at
the node, consistent with `§1.2`.

Leaving this to implementations is not a fourth option worth taking: a retention
that two nodes report differently makes the Order ledger (`§8.2.5`) incomparable
across implementations, which is the specific failure the ledger projection exists
to prevent.

## Related

- Depends on the Settlement extension gaining a specification document. It is
  registered `experimental` in `protocol/manifest.yaml` with
  `doc: PROTOCOL.md#128-payment-model` — i.e. the extension has no document of its
  own, only the core payment-model section.
- Sibling settlement questions from the same stress test: allocation of
  Order-level amounts across deliveries (Case 7), and the absence of an
  unconsented-reversal terminal state in core `billing.status` (Case 7). The
  latter constrains this one: a forfeited holdback under withholding (i) is money
  that never moved and is now never going to — and neither the core enum nor
  RFC-003's `credited` describes that outcome.

## Labels

`protocol-evolution`, `rfc`
