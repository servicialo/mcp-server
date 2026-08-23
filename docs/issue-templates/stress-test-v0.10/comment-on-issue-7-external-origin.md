---
name: "Comment on #7 — external-rail origin"
about: "Not an issue. Comment body to post on issue #7 (provenance), covering the external-origin half of stress test Q12."
title: "(comment on https://github.com/servicialo/mcp-server/issues/7)"
labels: []
assignees: ''
---

> **This file is a comment body, not an issue.** Post it on
> [#7 — Proposal: add `provenance` field to delivery and payment events](https://github.com/servicialo/mcp-server/issues/7).
> Everything below the line is the comment.

---

A case from the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md)
(Case 7 — wedding photography, partial delivery + chargeback) produces a
settlement event that the proposed `source` enum cannot classify, and I think it
is a gap in the enum rather than a separate proposal.

**The case.** A package is 100% prepaid by card. Coverage is delivered and
confirmed by the client; the album never arrives. The client charges back the
**total** through the card rail. The reversal is originated by neither party to
the Order, authorized by neither, and known to the node only after the fact.

**Why the current enum does not cover it.** The closest value is
`gateway_webhook` — *"Third-party payment gateway settled"*, `method: direct`,
`confidence: high`. But a chargeback is not a settlement, and the confidence
framing points the wrong way: the event is *highly reliable as a fact* (the money
really did move back) and *not an assertion by any participant at all*. Grouping
it with a successful gateway settlement loses the one property that matters
downstream — that the protocol is recording a movement it did not authorize and
cannot contest through its own surfaces.

The distinction is already latent elsewhere in the spec:
`PROTOCOL.md §1.2` says *"the settlement event references the movement; the
movement happens outside the protocol"*, and both draft extensions carry
`charged_back` as a distinct financial state
([state-dimensions §2.4](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/state-dimensions.md),
[proof-of-service §3.3](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/proof-of-service.md)).
What is missing is the origin marker on the event that puts them there.

**Suggested addition to the canonical `source` table:**

| Source | Meaning | Typical method | Typical confidence |
|---|---|---|---|
| `external_rail` | A payment rail reversed or adjusted a movement without authorization from any party to the Order (chargeback, bank reversal, clawback). | `direct` | `high` |

with two notes:

- `actor` is unavailable for this source, like `auto_advance` and `backfill` —
  the originator is outside the protocol. Suggest adding it to the exemption list
  in *"Mandatory fields vs optional"*, and requiring `notes` to carry the rail's
  own reference.
- `confidence: high` is correct and worth stating explicitly, so nobody reads
  "unauthorized" as "unreliable". The event is epistemically strong and
  *commercially contested* — two different axes, which is exactly the separation
  §6.0 draws between the financial dimension and the rest.

**A related gap this exposes, outside #7's scope.** `billing.status` in the core
wire enum is `pending | charged | invoiced | paid | disputed`
(`schema/service.schema.json`, `PROTOCOL.md §12.8.1`). There is no `refunded` and
no `charged_back`. So even with `provenance` on the event, a conforming v0.10
implementation has no core value to move the delivery's billing status to after a
chargeback — only the draft extensions can express the resulting position. Worth
noting here because it affects how much of this proposal is usable before the
state-dimensions extension matures.

The allocation half of the same case — *which* delivery a total-Order reversal
attaches to — is filed separately, since it is about settlement structure rather
than event provenance.
