---
name: "[conformance] Consumer conformance profile"
about: "Stress test v0.10 — Q11 (reframed). The mandate-scope MUST already exists; what is missing is a profile for callers and any verification of it."
title: "[conformance] Define a consumer conformance profile and verify mandate scope enforcement"
labels: [protocol-evolution, rfc, v1.0-candidate]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 6 — home care with a delegated agent** (question 11 of 12).

The daughter's mandate authorizes her agent to schedule and reschedule up to 8
visits a month within a spend cap, and explicitly forbids cancelling the series.
Later the agent attempts to cancel the series. Nothing in the conformance surface
today says what a conforming system must do about that — or who is even being
asked.

> **This issue is reframed relative to the original question.** The stress test
> asked whether mandate-scope enforcement should be a MUST of the consumer
> conformance profile. Verification found that the MUST already exists, and that
> the profile does not.

## What the spec already answers

The normative requirement is there, and it is strong:

- `PROTOCOL.md §10.5` — *"Any implementation claiming Servicialo v0.9 compliance
  MUST enforce these rules"*, including Rule 5 (context confinement) and Rule 8
  (graceful degradation on mandate loss).
- `PROTOCOL.md §10.7` — *"Scope validation is REQUIRED at the protocol level. No
  implicit hierarchy."*

So "should scope enforcement be a MUST?" is answered: it is one.

## What is actually missing

**1. There is no consumer conformance profile.** `public/spec/certification.md`
defines CORE, FULL and NETWORK. Every requirement in all three is addressed to the
party *exposing* the surface: model 8 dimensions, implement 6 states, handle
exception flows, expose an agent card, register in the resolver. An agent, client
library, or orchestrator that *calls* Servicialo has nothing to conform to and no
way to declare that it does.

**2. The existing MUST is unverified.** The requirement → verification matrix in
`certification.md` covers requirements 1–14. §10 appears in none of them — neither
in the automated column nor in manual review. A requirement that no level checks
is a requirement the ecosystem discovers by breach.

**3. The reference implementation does not enforce it,** and says so honestly in
two places: `protocol/manifest.yaml` (`delegated-agency` note: *"Mandate scopes
are advisory in the reference implementation — not enforced at the MCP tool
boundary"*) and `PROTOCOL.md §16` (*"Treat mandate scopes as advisory until
enforcement ships"*). Delegated Agency is registered `experimental`.

**4. Editorial:** `§10.5` says *"claiming Servicialo v0.9 compliance"* inside a
v0.10 document. Tracked in the companion doc-fixes issue.

## Why this is the strategic one

The stress test's own framing: this is the cheapest on-ramp for implementor #2.
Everything else in CORE/FULL/NETWORK asks someone to *build a backend*. A consumer
profile asks an agent developer to respect scopes and handle a revoked mandate
gracefully — a conformance claim reachable in an afternoon, by a population
(agent developers) far larger than the population of platform implementers. It is
also the only conformance surface that a `SCOPE_INSUFFICIENT` response
(`spec/HTTP_PROFILE.md §2.5`) currently talks to and cannot name.

## The question

Should the protocol define a consumer (caller) conformance profile, and what are
its requirements?

Candidate requirements, all derived from text that already exists:

| # | Requirement | Source |
|---|---|---|
| 1 | A consumer MUST NOT attempt an action outside its mandate's scopes, and MUST NOT retry or escalate on `SCOPE_INSUFFICIENT`. | §10.5 R2, §10.7 |
| 2 | A consumer MUST halt, preserve state and surface the loss on mandate expiry or revocation mid-operation. | §10.5 R8 |
| 3 | A consumer MUST NOT use a mandate outside its `context`. | §10.5 R5 |
| 4 | A consumer MUST include `mandate_id` in transition metadata when `method: agent`. | §6.1, §10.6.3 |
| 5 | A consumer MUST require human confirmation for the transitions the autonomy matrix marks as such. | §11.1, §11.2, §11.3 |
| 6 | A consumer MUST ignore unrecognized fields rather than reject them. | §15.5 |
| 7 | A consumer MUST honor constraints conjunctively (spend caps, time windows, daily limits). | §10.3.3 |

Open sub-questions:

1. Is this a fourth level, or an orthogonal profile (CORE-CONSUMER) that composes
   with the existing three?
2. How is a consumer claim verified, given there is no endpoint to test against?
   A self-test harness that drives a mock server presenting revoked and
   out-of-scope mandates seems the only honest answer.
3. Does the profile bind the agent, the client library, or both?
4. Should server-side enforcement of §10 be added to the CORE verification matrix
   in the same change? (Recommended: yes — a consumer profile with no
   server-side counterpart just moves the unverified requirement.)

## Recommended direction

Define it as an **orthogonal profile**, not a fourth level — a system can be an
excellent consumer and no kind of implementation at all, and the CORE→FULL→NETWORK
ladder is about surface completeness, which does not apply. Ship it together with
the addition of §10 to the CORE verification matrix, so the requirement is
verified on both sides of the boundary in one change rather than one side per
release.

## Sequencing

Per the session plan this is the **next draft after RFC-005 (period deliveries)
and Proof of Service 0.3.0**.

## Labels

`protocol-evolution`, `rfc`, `v1.0-candidate`
