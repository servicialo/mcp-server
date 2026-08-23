# Stress test v0.10 — issue bodies and verification record

> **ES:** Cuerpos de issue listos para publicar, derivados del
> [stress test de casos v0.10](../../servicialo-stress-test-casos.md). Incluye la
> tabla de verificación: qué responde hoy la spec para cada una de las doce
> preguntas, con cita exacta. Separados de `.github/ISSUE_TEMPLATE/` para no
> contaminar el picker de "New Issue", igual que
> `docs/issue-templates/v1.0/` (llega con el [PR #13](https://github.com/servicialo/mcp-server/pull/13)).
>
> **EN:** Issue bodies ready to publish, derived from the
> [v0.10 case stress test](../../servicialo-stress-test-casos.md). Includes the
> verification record: what the spec answers today for each of the twelve
> questions, with exact citations. Kept out of `.github/ISSUE_TEMPLATE/` so they
> do not clutter the "New Issue" picker, same as `docs/issue-templates/v1.0/`
> (arriving with [PR #13](https://github.com/servicialo/mcp-server/pull/13)).

Issue bodies are in English — the implementer audience is international and the
repository's existing protocol issues (#6–#12) are English. They cite the analysis,
which is in Spanish.

---

## Verification record

Verified against `main` at protocol v0.10 (`protocol/manifest.yaml`
`protocol.version: "0.10"`, `status: draft`). **A question the spec already
answers does not become an issue** — publishing one damages the public signal.
Two were dropped on those grounds and three were narrowed.

| Q | Status | Where it lands | Key citation |
|:-:|--------|----------------|--------------|
| 1 | **Answered**, with an internal contradiction | RFC-005 | `§8.2.5` allows Order-level settlement (*"a prepaid or periodic Order invoices on its own schedule"*); `§5.8`/`§12.8.1` say `charged` *"always happens 1:1 with a completed session"*. Reconciled inside RFC-005, not patched separately |
| 2 | **Open** | RFC-005 | `schema/service.schema.json`: `duration_minutes` required `minimum: 1`; `schedule.scheduled_for` is a single datetime |
| 3 | **Open** | Proof of Service 0.3.0 | No grant / relying-party mechanism anywhere in spec or schemas. Nearest primitive: `§10` ServiceMandate |
| 4 | **Open** | Proof of Service 0.3.0 | `manifest.yaml`: `settlement_event: schema: narrative`. `§1.2` permits, does not specify |
| 5 | **Open** | [`q05-order-amendment.md`](q05-order-amendment.md) | `service-order.schema.json` has no version field and no `amended` event; `HTTP_PROFILE §10` has no amend operation |
| 6 | **Open** | [`q06-settlement-holdback.md`](q06-settlement-holdback.md) | Zero occurrences of holdback/escrow. `§12.8.1`: `pending → charged → invoiced → paid ↘ disputed` |
| 7 | **Answered** by construction | [`doc-fixes.md`](doc-fixes.md) | `§8.3` `active` has no progression requirement; `§8.2.2` `term.type: permanent`; `§8.2.5` allows `services_verified = 0` |
| 8 | **Partial** → narrowed | [`q08-pricing-units-tiers.md`](q08-pricing-units-tiers.md) | `§8.2.3` + schema already give `rate_card[] = {level, billable_rate, cost_rate}` — hourly and flat. Case 4 fully covered |
| 9 | **Partial** → narrowed | [`q09-evidence-shared-artifacts.md`](q09-evidence-shared-artifacts.md) | `base.schema.json` `$defs` already carry `uri`; zero `hash`/`digest`/`checksum` in all of `schema/` |
| 10 | **Open**, already registered | [`q10-acceptance-authority.md`](q10-acceptance-authority.md) | `actor.type ∈ {provider, client, system, agent}`; Order has no `policies` object; state-dimensions §6 open question 1 |
| 11 | **Partial** → reframed | [`q11-consumer-conformance.md`](q11-consumer-conformance.md) | The MUST exists (`§10.5`, `§10.7`); no consumer profile exists in `certification.md`, and §10 is absent from the verification matrix |
| 12 | **Open**, split in three | [`q12-settlement-allocation.md`](q12-settlement-allocation.md), [`q12b-chargeback-terminal-state.md`](q12b-chargeback-terminal-state.md), [comment on #7](comment-on-issue-7-external-origin.md) | `billing.amount` is per-delivery and the ledger is Order-level, so nothing declares the split. Origin overlaps #7's `provenance`. Core `billing.status` has no unconsented-reversal value, and RFC-003 — which extends that enum — adds only consented ones |

Questions 1–4 get no issue of their own: the RFC-005 pull request and the Proof of
Service 0.3.0 pull request are their discussion surface. Traceability is preserved
in the drafts' Motivation sections, which cite the originating cases explicitly
(Case 3 for RFC-005; Cases 1 and 7 for Proof Consumer).

---

## Index

| File | Title | Labels | Case |
|------|-------|--------|------|
| [`q05-order-amendment.md`](q05-order-amendment.md) | `[order]` Make Service Order amendment a first-class protocol concept | `protocol-evolution`, `rfc` | 2, 4 |
| [`q06-settlement-holdback.md`](q06-settlement-holdback.md) | `[settlement]` Support conditional holdback (hold → release) | `protocol-evolution`, `rfc` | 2 |
| [`q08-pricing-units-tiers.md`](q08-pricing-units-tiers.md) | `[order]` Extend `pricing.rate_card` beyond hourly rates | `protocol-evolution`, `rfc` | 3, 8 |
| [`q09-evidence-shared-artifacts.md`](q09-evidence-shared-artifacts.md) | `[evidence]` Content-addressed artifacts shared across deliveries | `protocol-evolution`, `rfc` | 5, 9 |
| [`q10-acceptance-authority.md`](q10-acceptance-authority.md) | `[evidence]` Declare acceptance authority in Order policy | `protocol-evolution`, `rfc` | 6 |
| [`q11-consumer-conformance.md`](q11-consumer-conformance.md) | `[conformance]` Define a consumer conformance profile | `protocol-evolution`, `rfc`, `v1.0-candidate` | 6 |
| [`q12-settlement-allocation.md`](q12-settlement-allocation.md) | `[settlement]` Declare allocation of Order-level amounts across deliveries | `protocol-evolution`, `rfc` | 7 |
| [`q12b-chargeback-terminal-state.md`](q12b-chargeback-terminal-state.md) | `[settlement]` Core `billing.status` cannot represent an unconsented reversal | `protocol-evolution`, `rfc`, `v1.0-candidate` | 7 |
| [`q13-version-negotiation-and-deprecation-envelope.md`](q13-version-negotiation-and-deprecation-envelope.md) | `[implementation]` Implement version negotiation and deprecation signalling | `protocol-evolution`, `v1.0-candidate`, `help wanted` | — |
| [`doc-fixes.md`](doc-fixes.md) | `[docs]` Two spec clarifications surfaced by the stress test | `protocol-evolution` | 2 |
| [`comment-on-issue-7-external-origin.md`](comment-on-issue-7-external-origin.md) | *(comment, not an issue)* external-rail origin on [#7](https://github.com/servicialo/mcp-server/issues/7) | — | 7 |

**Labels.** Only labels that already exist on this repository —
`protocol-evolution`, `rfc`, `v1.0-candidate`, plus `help wanted` (verified
present) on the one implementation-scoped issue. The domain travels in the title
prefix — `[order]`, `[settlement]`, `[evidence]`, `[conformance]`, `[docs]` — not
as a label. A label taxonomy of its own is worth creating past roughly twenty
protocol issues, not before.

---

## Relationship to the existing proposal cluster

Three of these touch the open cluster indexed by
[#12](https://github.com/servicialo/mcp-server/issues/12) and should be read
against it rather than in isolation:

- **Q10** vs [#8](https://github.com/servicialo/mcp-server/issues/8) — #8 proposes
  `attestations[].side: provider | client`. Case 6 breaks that binary: beneficiary
  and payer both are "the client side" and can disagree. The two compose if Q10
  lands first.
- **Q12 (origin)** vs [#7](https://github.com/servicialo/mcp-server/issues/7) —
  filed as a comment there, not as an issue.
- **Q12b** vs [RFC-003 — Refunds & Credit Notes](https://github.com/servicialo/mcp-server/pull/13) —
  RFC-003 already extends `billing.status` with `credited` / `partial_credit` and
  settles the refund side; the refund half of this question is therefore answered
  and was not filed. What remains is the unconsented reversal, which RFC-003's
  `CreditNote` cannot carry (its first required field is who issued it) and which
  the draft extensions already name `charged_back`. Recommended as a joint change
  with RFC-003, not a follow-up.
- **RFC-005** vs [#6](https://github.com/servicialo/mcp-server/issues/6) — `cac_resolved`
  is an aggregation over `(clientId, periodo)`. A period delivery is a single
  obligation satisfied over a window. RFC-005 distinguishes them explicitly;
  without that, the divergence the RFC closes reappears through CAC.

## Downstream of this analysis

| Artifact | What it carries |
|---|---|
| [`rfcs/RFC-005-period-deliveries.md`](../../../rfcs/RFC-005-period-deliveries.md) | Questions 1 and 2 — `kind: occurrence \| period`, and the §8.2.5 ⟷ §5.8/§12.8.1 reconciliation |
| [`public/spec/extensions/proof-of-service.md`](../../../public/spec/extensions/proof-of-service.md) §5 | Questions 3 and 4 — the Proof Consumer, at doc version 0.3.0 |
| [`docs/vocabulary-migration-plan.md`](../../vocabulary-migration-plan.md) | The `delivered`/`charged` divergence, coordinated with the `billing.status` additions from RFC-003 and from `q12b` into a single deprecation window |

## Citation rule

An issue body may cite **(a) files already on `main`**, or **(b) an open pull
request**. It may never cite a `blob/main/…` path that does not exist yet — a
publication order that produces broken links for "a few hours" is exactly the
detail a serious implementer notices.

That is why publication order is A-first: every body cites
`blob/main/docs/servicialo-stress-test-casos.md`, which exists only once PR A
merges.

Two bodies carry the token **`{{PR_D}}`** — `q12b` and `q13`. It refers to the
vocabulary migration plan, which lands in PR D *after* the issues are published,
so a `blob/main` path would break the rule. **Publication MUST substitute
`{{PR_D}}` with the real pull request URL**, which is known by then: PRs B, C and
D open before any issue is created. Optionally re-point it at `blob/main` after D
merges.

## Publication

Nothing here is published yet. When it is: one issue per file, body verbatim below
the frontmatter, title from the frontmatter `title` field. The two drafts go as
separate pull requests — one RFC, one PR, per the convention in
[`rfcs/README.md`](https://github.com/servicialo/mcp-server/pull/13).

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../../../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../../../GOVERNANCE.md).
