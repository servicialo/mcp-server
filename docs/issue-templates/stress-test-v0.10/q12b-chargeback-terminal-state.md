---
name: "[settlement] No terminal state for an unconsented reversal"
about: "Stress test v0.10 — Case 7. RFC-003 gives refunds a terminal state. A chargeback is not a refund, and has none."
title: "[settlement] Core billing.status cannot represent an unconsented reversal (chargeback)"
labels: [protocol-evolution, rfc, v1.0-candidate]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 7 — wedding photography: partial delivery + chargeback**, while checking
what a conforming implementation records after the reversal.

100% prepaid by card. Coverage delivered and accepted; album never delivered. The
client charges back **the total** through the card rail. The provider contests it.

## What is already answered — do not re-litigate

[RFC-003 — Refunds & Credit Notes](https://github.com/servicialo/mcp-server/pull/13)
(Draft, Open for Comment) settles the refund side thoroughly and well:

- `CreditNote` as the normative representation of a refund, partial correction, or
  client-prevails dispute (§3.2).
- `billing.status` gains `credited` and `partial_credit` (§3.9).
- Forward-only ledger; `amount_credited` added to the Order ledger (§3.8).
- §7.4 and §7.6 become normative MUSTs.

If the money going back to the client is something the organization issued, RFC-003
already covers it. **This issue is only about the case where it did not.**

## The gap

A chargeback is not a credit note, and RFC-003's model cannot absorb it without
asserting something false:

| RFC-003 requires | A chargeback |
|---|---|
| `issued_by` REQUIRED — provider ID, org admin ID, agent ID, or `system` (§3.2) | Issued by the card network, on the cardholder's instruction. No party to the Order issued it, and `system` would misattribute it to the node. |
| `reason_code` from a closed enum (§3.3): `dispute_won`, `partial_delivery`, `provider_error`, `client_cancellation_refundable`, `client_no_show_refunded`, `adjustment`, `goodwill`, `other` | None applies. `dispute_won` is the nearest and is wrong — that code means the §7.4 dispute flow resolved for the client. A chargeback bypasses §7.4 entirely; the rail decided, not the parties. |
| `settlement.method` ∈ `credit_balance` \| `external_refund` \| `invoice_cancellation` \| `manual` (§3.5) | None applies. `external_refund` is *"the client requested money back and the organization complied"*. The organization complied with nothing. |
| Terminal status `credited` (§3.4) | Records the organization as having granted a credit. It conceded nothing and is actively contesting. |

Forcing it through anyway produces a record that says the provider voluntarily
refunded a delivery it is currently defending. That is not a modeling
inconvenience — it is the opposite of the provider's position, written into the
protocol's own record by the protocol's own rules.

Falling back to the core enum does not help either: `billing.status` in
`schema/service.schema.json` and `PROTOCOL.md §12.8.1` is
`pending | charged | invoiced | paid | disputed`, with no reversal value at all.
`disputed` is defined as *"Charge frozen pending resolution (§7.4)"* — but the
money already moved and §7.4 was never entered.

## Two v1.0-bound documents will disagree

This is the part that makes it urgent rather than merely missing:

- The draft extensions **already have the state**. `charged_back` is a value of the
  `financial` dimension in
  [state-dimensions §2.4](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/state-dimensions.md)
  and of `settlement_states` in
  [proof-of-service §3.3](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/proof-of-service.md).
  The two are kept bit-exact and `scripts/verify-doc-claims.mjs` enforces it
  against `protocol/manifest.yaml`.
- **RFC-003 does not mention it once.** It extends the same `billing.status` enum
  in the same target version and stops at consented reversals.

So v1.0 is currently on track to ship a settlement vocabulary where the draft
extensions can express a chargeback, the core cannot, and the RFC that owns the
core enum did not consider it. Whichever lands first sets a default the other has
to work around.

## Why it matters commercially

The stress test's strategic note on this case: the coverage dossier is exactly what
a provider submits in a chargeback **representment**. The whole value of the Proof
of Service in that moment is that it distinguishes "we returned this money" from
"this money was taken from us and here is the client's own acceptance of the
delivery". A protocol that can only record the first loses the case for the
provider — and loses the acquirer/PSP implementor class that has a direct financial
incentive to consume the dossier.

There is also a payroll consequence: `§6.5` requires payroll to read only
`collected` sessions. An implementation that maps a chargeback to `credited` or
leaves it at `paid` gets provider compensation wrong in opposite directions.

## The question

Should core `billing.status` gain a terminal state for a reversal that no party to
the Order consented to, and how does it relate to RFC-003's `credited`?

## Options considered

| Option | Shape |
|---|---|
| **A. Add `charged_back` to core `billing.status`** | Alongside RFC-003's `credited` / `partial_credit`, reusing the name already fixed in both draft extensions. Consented and unconsented reversals become distinguishable at the core level. |
| **B. Model it as a credit note with a new reason code and settlement method** | Add `reason_code: chargeback` and `settlement.method: external_reversal` to RFC-003. |
| **C. Leave it to the state-dimensions extension** | Core stays blind; only adopters of a draft extension can express it. |
| **D. Status quo** | Implementations pick between three wrong values. |

## Recommended direction

**A, drafted jointly with RFC-003 rather than after it.** Both proposals extend the
same enum in the same target version; doing it as one coordinated change means one
version negotiation story (RFC-001 §3.7), one mapping table for v0.9 clients, and
one CI update to the bit-exact settlement-state check — instead of two, with the
second having to explain why the first stopped short.

**B is not recommended.** It preserves one object at the cost of the invariant that
makes RFC-003 sound: a credit note is *issued* by a party, and its immutability and
audit trail (§3.13) hang off that. An event nobody issued does not belong in an
object whose first required field is who issued it.

Two things worth stating normatively in whichever change lands:

- A chargeback MUST NOT regress the delivery's fulfillment, evidence or acceptance
  state. Already implied by §6.0 and
  [proof-of-service §2](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/proof-of-service.md)
  (*"a refund does not un-happen a delivery"*), and this is exactly where an
  implementer would break it.
- A subsequent representment that wins reverses the reversal. That is a forward
  event, not a rollback — consistent with RFC-003's forward-only ledger.

## Related

- [#7 — `provenance` on delivery and payment events](https://github.com/servicialo/mcp-server/issues/7)
  — a comment there proposes `source: external_rail` for the origin of exactly this
  event. Provenance answers *who originated it*; this issue answers *what state it
  leaves behind*. They are complementary and neither substitutes for the other.
- [RFC-003](https://github.com/servicialo/mcp-server/pull/13) — owns the enum being
  extended.
- Sibling settlement questions from the same case: allocation of Order-level
  amounts across deliveries, and conditional holdback (Case 2) — a forfeited
  holdback has the same "where does it terminate" problem.
- **Vocabulary migration plan** ({{PR_D}}) — the `delivered`/`charged` divergence
  tracked in `protocol/manifest.yaml` under
  `state_machines.service_lifecycle.reference_implementation_divergence` touches the
  same enum. That plan already schedules this issue's addition into a single
  deprecation window with RFC-003's, precisely so implementers face one breaking
  change rather than two serialized ones. If this issue is accepted, it ships in
  that window.

## Labels

`protocol-evolution`, `rfc`, `v1.0-candidate`
