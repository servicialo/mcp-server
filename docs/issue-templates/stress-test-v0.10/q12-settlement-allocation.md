---
name: "[settlement] Allocation of Order-level amounts across deliveries"
about: "Stress test v0.10 — Q12 (allocation half). Money moves at Order level; the truth of a delivery lives at delivery level. Nothing declares the split."
title: "[settlement] Declare allocation of Order-level settlement amounts across deliveries"
labels: [protocol-evolution, rfc]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 7 — wedding photography: partial delivery + chargeback** (question 12 of
12, allocation half).

One Order, two deliveries: event coverage (delivered impeccably, confirmed by the
client) and a physical album (never delivered). The package was 100% prepaid by
card. The client charges back **the total** through the card rail.

The resulting state is the case that justifies the whole orthogonal model —
delivery: completed; evidence: recorded; acceptance: accepted; financial:
reversed, all true at once about the same delivery. What the protocol cannot say
is **how much of the reversal belongs to that delivery**.

> **This issue covers the allocation half only.** The external-origin half of
> question 12 is being raised as a comment on
> [#7 (`provenance`)](https://github.com/servicialo/mcp-server/issues/7) rather
> than as a separate issue, since that proposal already owns event provenance.

## What the spec says today

- `schema/service.schema.json`: `billing.amount` is per-Service (per delivery),
  required, `{ value, currency }`.
- `PROTOCOL.md §8.2.5`: the Order ledger tracks `amount_billed`,
  `amount_collected`, `amount_consumed` — **Order-level totals**. The reference
  scenario table has rows for "Multiple deliveries under one invoice" and
  "Chargeback | unchanged | unchanged | reduced by chargeback event", but no
  field expresses which delivery the reduction attaches to.
- `PROTOCOL.md §7.6` (partial delivery): *"The invoice SHOULD be adjusted
  proportionally"* — the only allocation statement in the spec, and it is a SHOULD
  about invoices, with no representation of the resulting split.

So the ledger can say the Order collected less; nothing can say the album's share
was reversed and the coverage's share was not. A Proof of Service for the coverage
delivery therefore has to report the settlement position of the *whole Order*,
which in this case is materially misleading about that delivery.

## Why this matters beyond bookkeeping

The stress test's strategic note: the coverage dossier is exactly what a provider
submits in a chargeback **representment**. A dossier that says "this Order was
reversed" loses the case; one that says "the portion attributable to this
delivery, EUR X of EUR Y, was reversed, and here is the client's own acceptance of
it" is the argument. This is a direct commercial use of Proof of Service, and it
points at acquirers and PSPs as a class of implementor with a financial incentive
to consume the protocol.

## The question

Can a settlement event declare how its amount allocates across the deliveries of
an Order, and can a delivery therefore report its own settlement position?

Sub-questions:

1. Is allocation declared **on the settlement event** (an array of
   `{delivery_ref, amount}`), or derived by a **rule on the Order** (pro-rata by
   `billing.amount`, by consumption, by explicit installment mapping)?
2. What is the default when nothing is declared — pro-rata by delivery
   `billing.amount`, or explicitly undefined?
3. Must allocations sum to the event amount, and what happens when they do not?
4. Can an allocation be corrected, or does a correction require a new event?
   (The ledger is an append-only projection per §8.2.5, which argues for the
   latter.)
5. Does the per-delivery settlement position become a derived read, or a stored
   field? (Consistent with §8.2.5, derived.)

## Options considered

| Option | Shape |
|---|---|
| **A. Declared allocation on the settlement event** | `allocations: [{ delivery_ref, amount }]`, optional. Explicit, auditable, works for the asymmetric case where a pro-rata rule would be wrong. |
| **B. Allocation rule on the Order** | The Order declares `allocation_method`; consumers compute. Compact, but cannot express Case 7 — the client charged back the total, not each delivery pro-rata, and the provider's position is that only the album's share is legitimate. |
| **C. Both** | Rule as the default, explicit allocation as the override. |
| **D. Status quo** | Order-level only; per-delivery settlement is out of contract. |

## Recommended direction

**C.** The rule covers the common case for free (most Orders really are pro-rata),
and the explicit override covers the case that actually needs the protocol — a
partial delivery, a disputed portion, a milestone reversal. Both feed a *derived*
per-delivery settlement position, never a stored balance, matching the ledger's
existing contract in §8.2.5.

Also worth stating normatively, because the case makes it concrete: **an
allocation is an accounting statement, not a delivery statement.** Allocating a
chargeback to a delivery MUST NOT regress its fulfillment, evidence or acceptance
state — already the rule in §6.0 and
[proof-of-service §2](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/proof-of-service.md),
and allocation is exactly where an implementer would be tempted to break it.

## Related

- [#7 — `provenance` on delivery and payment events](https://github.com/servicialo/mcp-server/issues/7)
  — companion half of this question.
- Sibling settlement question from the same stress test: conditional holdback
  (Case 2).
- Blocked on the same gap as both: the Settlement extension has no specification
  document of its own (`protocol/manifest.yaml`: `experimental`,
  `doc: PROTOCOL.md#128-payment-model`).

## Labels

`protocol-evolution`, `rfc`
