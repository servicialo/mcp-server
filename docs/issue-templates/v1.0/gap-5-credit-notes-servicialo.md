---
name: "[v1.0 Gap 5] Implement Credit Notes schema + MCP tools"
about: Protocol-level implementation of RFC-003 (Refunds & Credit Notes) — spec, schemas, MCP server.
title: "[v1.0 Gap 5] Credit Notes — schema + MCP tools + §7.4/§7.6 normative update per RFC-003"
labels: [v1.0, gap-5, rfc-003, protocol, mcp-server, breaking-change-minor]
assignees: ''
---

## Summary / Resumen

**ES:** Implementar el objeto `CreditNote`, los 4 nuevos MCP tools, la extensión del enum `billing.status` (breaking change menor — mitigado por negociación de versión de RFC-001), y actualizar §7.4 (Dispute) y §7.6 (Partial Delivery) con normativa MUST.

**EN:** Implement the `CreditNote` object, the 4 new MCP tools, the `billing.status` enum extension (minor breaking change — mitigated via RFC-001 version negotiation), and update §7.4 (Dispute) and §7.6 (Partial Delivery) with normative MUST clauses.

---

## Linked RFC / RFC vinculado

[RFC-003 — Refunds & Credit Notes (Forward-Only Ledger)](../../../rfcs/RFC-003-refunds-and-credit-notes.md)

---

## Acceptance criteria / Criterios de aceptación

### Spec / Spec

- [ ] `PROTOCOL.md` §7.4 rewritten with normative MUST clause (RFC-003 §3.6).
- [ ] `PROTOCOL.md` §7.6 rewritten with normative MUST clause (RFC-003 §3.7).
- [ ] `PROTOCOL.md` §8.2.5 gains `amount_credited` field (computed) and net-amount derivations (RFC-003 §3.8).
- [ ] New §X "Refunds and Credit Notes" section with the full CreditNote model.
- [ ] `billing.status` enum extension documented with breaking-change marker + mitigation via version negotiation (RFC-003 §3.9).
- [ ] [Appendix C — Scopes](../../../PROTOCOL.md) — no new scopes (uses existing `payment:read`, `payment:write`, `mandate:admin`).

### Schemas / Schemas

- [ ] New file: [`schema/credit-note.schema.json`](../../../schema/) — defines `CreditNote`.
- [ ] `schema/service.schema.json` — `billing.status` enum extended; new optional `billing.credit_note_ids[]`.
- [ ] `schema/service-order.schema.json` — `ledger.amount_credited` added (computed).
- [ ] Manifest schema: add `capabilities.credit_notes` declaration per RFC-003 §3.11.

### MCP server (`@servicialo/mcp-server`)

- [ ] New tool: `payments.create_credit_note` — Tier 2, `payment:write`. Idempotent.
- [ ] New tool: `payments.list_credit_notes` — Tier 2, `payment:read`. Paginated.
- [ ] New tool: `payments.get_credit_note` — Tier 2, `payment:read`.
- [ ] New tool: `payments.cancel_credit_note` — Tier 2, `payment:write` + `mandate:admin` for non-trivial cases. Allowed only when `settlement.method == invoice_cancellation`.
- [ ] Tool registration in `packages/mcp-server/src/tools/` with Zod schemas.
- [ ] Unit tests covering reason codes, settlement methods, partial vs full, idempotency.

### Version-negotiation mitigation

- [ ] MCP server detects client protocol version from actor parameter / request header.
- [ ] When serving v0.9 clients, server maps `credited` → v0.9-compatible value (e.g., `paid` with `Servicialo-Deprecated-Behavior` header). RFC-003 §3.9.
- [ ] Test coverage for the mapping.

### HTTP profile

- [ ] `spec/HTTP_PROFILE.md` updated with REST equivalents.
- [ ] `spec/openapi.yaml` updated.

### Documentation

- [ ] `IMPLEMENTING.md` + `IMPLEMENTING.en.md` updated with "How to implement Refunds" section.
- [ ] [CHANGELOG.md](../../../CHANGELOG.md) entry for v1.0, explicit breaking-change call-out.
- [ ] One updated example in `examples/` showing a dispute resolution flow with credit note end-to-end.

---

## Affected files / Archivos afectados

```
PROTOCOL.md                                       (§7.4, §7.6, §8.2.5, new §X)
SPEC.md
spec/HTTP_PROFILE.md
spec/openapi.yaml
schema/credit-note.schema.json                    (new)
schema/service.schema.json                        (enum extension + new field)
schema/service-order.schema.json                  (ledger field)
packages/mcp-server/src/tools/credit-notes.ts     (new file recommended)
packages/mcp-server/src/__tests__/credit-notes.test.ts
IMPLEMENTING.md / IMPLEMENTING.en.md
CHANGELOG.md
examples/                                         (new dispute example)
```

---

## Estimated effort / Esfuerzo estimado (realistic 12.5h/wk)

| Task | Effort |
|------|--------|
| Spec writing (§7.4, §7.6, §8.2.5, new section) | 2 wks |
| New JSON Schema file + two schema updates | 1 wk |
| HTTP profile + openapi updates | 0.5 wk |
| MCP server tool implementation (4 new tools) | 2 wks |
| Version negotiation mitigation | 1 wk |
| Unit tests (including breaking-change compat tests) | 1.5 wks |
| Example update (Spanish + English) | 1 wk |
| Documentation (IMPLEMENTING bilingual) | 1 wk |
| Review cycles | 2 wks |
| **Total** | **~12 wks** |

---

## Dependencies / Dependencias

**Blocks / Bloquea:** v1.0 release candidate.

**Blocked by / Bloqueado por:**
- [RFC-003](../../../rfcs/RFC-003-refunds-and-credit-notes.md) acceptance.
- [RFC-001](../../../rfcs/RFC-001-rfc-process-and-deprecation-policy.md) (version negotiation infrastructure).
- [RFC-002](../../../rfcs/RFC-002-prepayment-and-credit-balance.md) (credit balance is one of the settlement methods).
- Servicialo Gap 1 spec changes merged ([`gap-1-credit-balance-servicialo.md`](gap-1-credit-balance-servicialo.md)).

**Implementation downstream:** Reference implementations adopting this RFC manage their own downstream roadmaps. The protocol surface defined in RFC-003 is what conformance is measured against.

---

## Verification / Verificación

- [ ] v0.9 client receives a session with `billing.status: credited` mapped to `paid` + deprecation header — does not crash.
- [ ] v1.0 client receives `billing.status: credited` natively.
- [ ] At least one v1.0 implementation publicly demonstrates: dispute won → credit note → balance restored; partial delivery → partial credit note; external refund flow — sufficient to verify the spec is implementable.
- [ ] Audit log shows credit note creation entries.

---

## Notes / Notas

- This issue introduces the only **breaking change** in the v1.0 set. Communication on `announce` channel + email list is critical when accepted.
- The deprecation timeline for v0.9 enum compatibility is governed by RFC-001 §3.6 (minimum 2 minor versions).
