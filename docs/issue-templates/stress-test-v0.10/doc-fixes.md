---
name: "[docs] Two clarifications surfaced by the v0.10 stress test"
about: "Stress test v0.10 — questions the spec already answers, but not out loud. Editorial only."
title: "[docs] Two spec clarifications surfaced by the v0.10 stress test"
labels: [protocol-evolution]
assignees: ''
---

## Context

Two of the twelve questions raised by the
[v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md)
turned out to be answered by the spec on verification — one by construction rather
than by statement, one by a version number that drifted. Neither is a protocol
change. Both are worth fixing because a reader who asked the question had to
reconstruct the answer.

Editorial per RFC-001 §3.2 (1 week comment window, no implementation evidence
required). Patch-level per §17.2.

---

## 1. An active Order with no scheduled deliveries (§8.3)

**Where it came from:** Case 2 — industrial repair. After the last milestone, the
Order stays in force for a 60-day warranty window with no deliveries scheduled and
possibly none ever occurring.

**What the spec says:** the answer is yes, and it is provable from four places at
once — but never stated.

- `§8.3`: `active` is *"Accepted and in execution"*. No progression requirement.
- `§8.2.2`: `term.type: permanent` with `ends_at: null` is a valid term.
- `§4`: *"A Service MAY exist standalone or within a Service Order"*; an Order
  groups *"one or more deliveries"*.
- `§8.2.5`: "Prepayment before first delivery" is listed as a valid ledger state
  with `services_verified = 0`.

**Proposed fix:** one sentence in §8.3, in the row or immediately below the state
table. Something to the effect of: *an Order MAY remain `active` with no scheduled
and no pending deliveries — a warranty window, a stand-by term, or a scope that is
consumed on demand. `active` asserts that the agreement is in force, not that
delivery is imminent.*

Optionally, a matching row in the §8.2.5 reference scenario table: warranty
window — `services_verified` unchanged, `amount_billed` unchanged,
`amount_collected` unchanged.

## 2. `§10.5` cites v0.9 compliance inside a v0.10 document

**Where it came from:** verifying question 11 (consumer conformance).

**What it says:** *"Any implementation claiming Servicialo v0.9 compliance MUST
enforce these rules"* — in `PROTOCOL.md`, whose header table reads
`| **Version** | 0.10 |`.

**Why it is worth fixing:** the sentence carries eight MUSTs, including the
mandate rules whose enforcement status is already the subject of a conformance
note in §16. A stale version in the scoping clause of the most load-bearing MUST
list in the document is exactly the ambiguity an implementer will resolve in their
own favour.

**Proposed fix:** *"Any implementation claiming Servicialo compliance MUST enforce
these rules"* — drop the version rather than bump it, so it does not drift again.
Same treatment anywhere else a normative scoping clause pins a version;
`spec/delegated-agency-model.md` still carries a *"Servicialo Protocol v0.8 —
Section 10"* header and should be checked in the same pass.

---

## Not in this issue

The third editorial finding from the same verification —
`public/spec/intents.md:940` mapping wire value `cobrado` to canonical `charged`
when the canonical enum is `collected` — is deliberately excluded. It is not an
isolated typo but one surface of the `delivered`/`charged` vs
`completed`/`invoiced`/`collected` divergence tracked in
`protocol/manifest.yaml` under
`state_machines.service_lifecycle.reference_implementation_divergence`, and it
belongs to the vocabulary migration plan rather than to a docs pass. Fixing it
alone would make the mapping table correct and the tool enum still wrong.

## Labels

`protocol-evolution`
