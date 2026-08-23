---
name: "[evidence] Acceptance authority in Order policy"
about: "Stress test v0.10 — Q10. The 'client side' is not one actor: beneficiary, payer and mandatary can disagree about a delivery."
title: "[evidence] Declare acceptance authority in Order policy — the client side is not one actor"
labels: [protocol-evolution, rfc]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 6 — home care with a delegated agent** (question 10 of 12).

The daughter is payer and principal, and delegates scheduling to her agent. The
mother is the beneficiary. On visit 5 the assigned carer never arrives, a
substitute arrives two hours late, **the mother confirms the visit**, and **the
daughter disputes the charge**.

Both statements are true and both come from "the client side". The protocol has no
way to say which one is the acceptance.

## What the spec says today

The protocol separates beneficiary and payer for **money** — `client.id` /
`client.payer_id` (`§5.3`), Principle 3 (`§9`) — and stops there. Verified against
`main`:

- `schema/evidence/base.schema.json`: `actor.type ∈ { provider, client, system,
  agent }`. There is no payer, no mandatary, no third party. The daughter's
  dispute and the mother's confirmation are both `client`.
- `schema/service-order.schema.json` has **no `policies` object at all** — only
  `scope`, `term`, `pricing`, `payment_schedule`, `ledger`, `lifecycle`. There is
  nowhere to declare who may accept.
- `§6.3.1` auto-verifies after the window when "no client action" occurs, without
  naming which client-side actor's silence counts.
- [state-dimensions §2.3](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/state-dimensions.md)
  gives `acceptance` its own state machine (`pending`, `accepted`,
  `auto_accepted`, `disputed`) — with no actor on any state.

This gap is **already registered in the spec**: state-dimensions §6, open question
1 — *"Should `evidence` distinguish who attested (provider / beneficiary / third
party), or is that the Evidence Profiles extension's concern?"* This issue is the
concrete case that answers "yes, and here is why it cannot wait".

## Relationship to #8

[#8 — bilateral confirmation for high-stakes transitions](https://github.com/servicialo/mcp-server/issues/8)
proposes `attestations[].side: provider | client` for reasons that redistribute
cost. Case 6 is precisely a cost-redistributing event (a late delivery disputed by
the person paying) — and it breaks the binary that #8 assumes: **`side: client`
does not identify an actor when the beneficiary and the payer disagree**.

The two proposals compose cleanly if this one lands first: #8 decides *how many*
sides must attest; this one decides *who is the client side*.

## The question

Can a Service Order declare its acceptance authority — and does Evidence Profiles
carry the per-vertical defaults?

Sub-questions:

1. Where does the declaration live: a new `policies` object on the Order, or an
   Evidence Profile referenced by the Order?
2. What is the enum? `beneficiary`, `payer`, `either`, `both`, `mandatary`, plus
   the third-party attestor case?
3. What is the default when nothing is declared, and is it back-compatible with
   today's implicit "whoever the implementation calls the client"?
4. When authority is `both` and they disagree, is the result `disputed`, or does
   one side's dispute override the other's acceptance?
5. Does an agent acting under a Mandate accept *as* its principal, or as itself
   with the mandate as provenance? (§10.6.3 already requires `mandate_id` in
   transition metadata — the raw material exists.)

## Options considered

| Option | Shape |
|---|---|
| **A. `policies.acceptance_authority` on the Order** | Declared per agreement, where the parties actually negotiate it. Requires adding the Order's first `policies` object. |
| **B. In Evidence Profiles** | Per-vertical defaults ("in home care, the payer accepts"). Natural home for defaults; wrong home for a per-agreement override. |
| **C. Both** | Profile supplies the default; Order overrides. |
| **D. Widen `actor.type` only** | Record who attested, decide nothing about authority. Cheap, and leaves the disagreement unresolved. |

## Recommended direction

**C, built on D.** Widening `actor.type` beyond `{provider, client, system,
agent}` is a prerequisite for all of it and is purely additive — without it the
protocol cannot even *record* that the payer disputed. Then: Evidence Profiles
carries the vertical default (this is exactly its remit — it defines what valid
evidence is per vertical; "and from whom" is the missing half), and the Order
declares an override when the parties agree on one.

On sub-question 4 the recommended default is that **a dispute from an authorized
party moves `acceptance` to `disputed` regardless of another party's acceptance** —
consistent with `§7.4` and with the orthogonality rule: the mother's confirmation
remains true as evidence (`attested`), while acceptance is contested. The two
dimensions disagreeing is not a contradiction; it is the model working.

## Labels

`protocol-evolution`, `rfc`
