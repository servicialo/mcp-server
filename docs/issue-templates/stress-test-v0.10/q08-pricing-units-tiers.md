---
name: "[order] Rate cards beyond hourly: units and tiers"
about: "Stress test v0.10 — Q8 (narrowed). pricing.rate_card is hourly and flat; per-unit and marginal pricing have no home."
title: "[order] Extend pricing.rate_card beyond hourly rates: per-unit and tiered pricing"
labels: [protocol-evolution, rfc]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 8 — asynchronous agent-to-agent translation** and **Case 3 — monthly legal
retainer** (question 8 of 12).

> **This issue is narrower than the original question.** The stress test asked
> whether `Order.price` admits rate schedules at all, flagged `[verificar]`. It
> does — verification against the schema closed most of the question. What follows
> is only the part that remains open.

## What the spec already answers

`PROTOCOL.md §8.2.3` and `schema/service-order.schema.json`:

```
pricing.model      ∈ { fixed, t&m, rate_card, mixed }
pricing.rate_card  [] of { level, billable_rate, cost_rate }
```

with `billable_rate` documented as *"Rate charged to client per hour"* and `level`
as a professional level (`junior`, `senior`, `partner`).

That fully covers **Case 4** (200h consulting, hourly rates by seniority, rate
increase at renewal). No issue is needed for it.

## What remains open

Three gaps, all in the same field:

1. **The unit is hardcoded to the hour.** Case 8 prices translation *per word*
   (40,000 words). There is no `unit` field, so a per-word price can only be
   encoded by abusing `billable_rate` and stating the real unit in prose. Two
   nodes will disagree on whether `billable_rate: 0.08` means 8 cents per hour or
   per word — and neither is wrong under the current schema.

2. **Rates are flat, not tiered.** Case 3 is a retainer covering up to 10 hours a
   month, with hours 11+ billed at a marginal rate. `rate_card[]` has no notion of
   a threshold, so the marginal rate has to be modeled as a second `level`
   (`"overage"`), which misuses a field whose documented meaning is professional
   seniority and silently loses the threshold that separates them.

3. **`mixed` has no structure at all.** It is a valid enum value with no
   conditional requirement and no schema. `fixed` requires `fixed_amount`, `t&m`
   and `rate_card` require `rate_card` — `mixed` requires nothing, so it is
   currently a documented escape hatch that carries no information.

## The question

Should `pricing` describe the unit and the tier boundaries of a rate, and how
much structure does `mixed` need to stop being a hole?

## Options considered

| Option | Shape | Note |
|---|---|---|
| **A. Add `unit` + `tiers` to rate-card entries** | `{ level?, unit: "hour"\|"word"\|"unit"\|…, billable_rate, cost_rate?, applies_from?, applies_to? }`, with `unit` defaulting to `hour` for backwards compatibility. | Additive; existing rate cards keep validating unchanged. |
| **B. A separate `pricing.schedule` object** | Leave `rate_card` alone as the seniority case; add a parallel structure for unit/tier pricing. | Two structures for one concept; a consumer must read both. |
| **C. Free-form `unit` string** | Add `unit` as an open string, no enum. | Maximum flexibility, minimum interoperability — the exact failure mode of gap 1, just relocated. |
| **D. Leave to `mixed` + prose** | Status quo. | Status quo is what produced the ambiguity. |

## Recommended direction

**A**, with `unit` as an extensible enum (an initial closed set plus the `x-`
prefix convention already established in `§15.1` and `§15.3`) and `applies_from` /
`applies_to` as the tier boundary. Default `unit: "hour"` preserves every existing
document. Rename nothing.

For gap 3, the cheapest honest fix is a conditional requirement: `mixed` MUST
carry both `fixed_amount` and `rate_card`, which is what "mixed" means in every
case the stress test produced (a fixed component plus a consumption component).

## Not in scope

Whether the SLA penalty in Case 8 (10% per 24h late) belongs in the Order as a
machine-readable term. That is a separate question about *computable terms*, not
about pricing structure, and it is deliberately left out of this issue.

## Labels

`protocol-evolution`, `rfc`
