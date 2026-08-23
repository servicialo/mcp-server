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

None of them expresses "collected, but not yet releasable". `partially_paid` is
the closest and is wrong: it describes an incomplete payment, whereas a holdback is
a *complete* payment of which a declared portion is conditionally withheld. Today
an implementation must either report the retained portion as unpaid (understating
what the payer actually transferred) or as paid (overstating what the provider can
recognize). Both are false, and `§6.5` makes the second one expensive: payroll
reads only `collected`.

## The question

Should the Settlement extension define a conditional holdback, and what releases
it?

Sub-questions the design has to answer:

1. Is the holdback a **settlement state** (a ninth value alongside
   `partially_paid`) or an **annotation on an existing settlement event** (an
   amount, a condition, a release date)?
2. How is a *negative* condition ("no dispute was opened in 60 days") expressed
   without the protocol having to evaluate it? The protocol models states and
   references movements — it does not run business rules (`§1.2`).
3. Who can release early, and does release require counterparty attestation?
4. What happens to the holdback if the condition fails — does it become
   `written_off`, `refunded`, or a new settlement event of its own?

## Options considered

| Option | Shape |
|---|---|
| **A. Holdback as annotation** | The settlement event that records the payment carries `{ held_amount, release_condition, release_at }`. `financial` stays `paid`; a derived "releasable amount" is computed by the consumer. |
| **B. Holdback as settlement state** | New state between `paid` and terminal, e.g. `partially_released`. Explicit on the wire, but it widens an enum that two draft extensions keep bit-exact with each other, and `protocol/manifest.yaml` cross-checks that. |
| **C. Two settlement events** | The retained portion is simply not settled yet; release is a second settlement event referencing the first. Zero new vocabulary. |
| **D. Out of scope** | Declare holdbacks an implementation concern. |

## Recommended direction

**A over C over B.** The condition and the deadline are the information a Proof of
Service consumer actually needs ("this delivery is paid, 10% is held until
2026-10-01 pending the warranty window"), and only A carries them. C loses the
declared condition; B pays a high price — the `financial` enum is kept bit-exact
across two draft extensions and is cross-checked in CI — for information A can
carry additively.

On sub-question 2, the recommendation is that the protocol record the condition as
a **declared reference, not an evaluable rule**: a human-readable condition plus an
optional structured trigger (`no_event_of_type` + `window`). Evaluation stays at
the node, consistent with `§1.2`.

D is not recommended: a retention that two nodes report differently makes the
Order ledger (`§8.2.5`) incomparable across implementations, which is the specific
failure the ledger projection exists to prevent.

## Related

- Depends on the Settlement extension gaining a specification document. It is
  registered `experimental` in `protocol/manifest.yaml` with
  `doc: PROTOCOL.md#128-payment-model` — i.e. the extension has no document of its
  own, only the core payment-model section.
- Sibling settlement question from the same stress test: allocation of Order-level
  amounts across deliveries (Case 7).

## Labels

`protocol-evolution`, `rfc`
