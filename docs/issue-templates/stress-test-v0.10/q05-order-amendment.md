---
name: "[order] Service Order amendment as a first-class concept"
about: "Stress test v0.10 — Q5. An Order whose scope, pricing or committed resource changes mid-term has no protocol representation."
title: "[order] Make Service Order amendment a first-class protocol concept"
labels: [protocol-evolution, rfc]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 2 — industrial repair by milestones** and **Case 4 — 200h T&M consulting**
(question 5 of 12).

Two real mutations of a live agreement, neither of which the protocol can record:

- Case 2: scope is widened mid-job by a written addendum, and materials repriced
  after a 12% supplier increase.
- Case 4: the team lead committed in the Order is replaced in month 3, and rates
  go up 5% at the month-6 renewal.

Both are changes to *what was agreed*, not to *what was delivered*. Principle 6
(§9) says those are two different objects with two different lifecycles — but only
the delivery side has an audit trail today.

## What the spec says today

Verified against `main` (protocol v0.10):

- `schema/service-order.schema.json` has no version field and no `amended` event.
  `lifecycle.transitions[]` records state changes only (`from`, `to`, `at`, `by`,
  `method`, `metadata`) — a scope or pricing edit produces no transition.
- `PROTOCOL.md §8.3` lists `draft → proposed → negotiating → active → paused →
  completed → cancelled`. `negotiating` exists but is described as pre-`active`;
  nothing describes re-negotiating a live Order.
- `spec/HTTP_PROFILE.md §10` specifies `service_orders.{list,get,create,propose,
  activate,get_ledger}`. There is no amend operation, and
  `protocol/manifest.yaml` `specified_unimplemented_tools` matches that list.

So an implementation that needs to widen a scope today has three unattractive
choices: mutate the Order in place (destroying the record of what was originally
agreed), cancel and re-create (breaking the link to deliveries already made under
it), or keep the amendment out of band (making the ledger unauditable).

## Prior art in the ecosystem

The reference implementation already hit this. **Coordinalo RFC-001 (perímetro
atestado)** — `docs/protocol/rfc-001-perimetro-atestado.md` in the Coordinalo
repository — proposes `registered / amended / annulled` as the attested scope for
`sc_order`. That is the strongest available signal that the concept is needed: the
implementation that runs the protocol in production cannot describe its own
attested perimeter without it, while the public spec has no such concept.

> **Note on numbering.** Coordinalo's RFC-001 and this repository's
> [RFC-001 — RFC Process & Deprecation Policy](https://github.com/servicialo/mcp-server/pull/13)
> share a number by accident. They are unrelated documents in different
> repositories. Always cite the former as "Coordinalo RFC-001 (perímetro
> atestado)".

## The question

Should amendment of a live Service Order be a first-class protocol concept, and if
so, in which of these shapes?

| Option | Shape | Cost |
|---|---|---|
| **A. Amendment event** | An `amended` entry in the Order's audit trail carrying the delta (which fields changed, from what, to what, authorized by whom). | Cheapest. Additive. But reconstructing "what was agreed on date D" means replaying the trail. |
| **B. Order versioning** | Each amendment produces a new immutable Order revision; deliveries point at the revision in force when they occurred. | Strongest auditability, and the only option that makes a Proof of Service unambiguous about which terms governed a given delivery. Heaviest: every consumer must learn revision resolution. |
| **C. Amendment as a new Order** | Close the old Order, open a linked successor. | No new concept, but breaks the ledger and the "one agreement, many deliveries" relationship at exactly the moment continuity matters. |
| **D. Status quo** | Leave it to implementations. | Two conforming nodes produce incomparable histories for the same commercial event. |

## Recommended direction

**A, with the door open to B.** Model the amendment as an event on the existing
audit trail (`amended`, carrying the field-level delta and the authorizing party),
which is additive and breaks nothing. Declare in the same change that a delivery
MAY reference the amendment in force at its time — that is what B needs later, and
recording it from the start avoids a migration.

**Candidate mechanics: no new machinery.** The Order already has a
`proposed → active` handshake with an acceptance requirement attached to it
(`§8.3`, `§10.8`, `service_orders.propose` / `service_orders.activate` in
`HTTP_PROFILE §10.4`–`§10.5`). An amendment can reuse it verbatim: the amended
Order is proposed, the counterparty activates, and the `amended` entry records the
delta and the acceptance. That is composition rather than a parallel amendment
lifecycle, and it means the two constraints below are enforced by a path that
already exists instead of by new rules.

Two constraints that fall out of §10.8 and should be stated explicitly:

- An amendment that changes scope, pricing or term is a change to a bilateral
  agreement. Per §10.8 ("Activating a Service Order requires client acceptance —
  the organization's agent MUST NOT accept on behalf of the client"), an
  amendment MUST require counterparty acceptance, not just `order:write`.
- Provider substitution is amendment-shaped only when the committed resource
  changes for the remainder of the Order. Reassigning a single delivery is
  already the reassignment exception flow (§7.2) and MUST NOT be modeled as an
  amendment.

## Out of scope

Renegotiating a *completed* Order; credit notes and refunds (covered by
[RFC-003](https://github.com/servicialo/mcp-server/pull/13)).

## Labels

`protocol-evolution`, `rfc`
