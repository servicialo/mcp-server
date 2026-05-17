---
name: "[v1.0 Gap 1] Implement Credit Balance schema + MCP tools"
about: Protocol-level implementation of RFC-002 (Prepayment & Credit Balance) — spec, schemas, MCP server.
title: "[v1.0 Gap 1] Credit Balance — schema + MCP tools per RFC-002"
labels: [v1.0, gap-1, rfc-002, protocol, mcp-server]
assignees: ''
---

## Summary / Resumen

**ES:** Implementar el modelo `CreditBalance` y los 4 nuevos MCP tools definidos en RFC-002, así como las extensiones de schema. Trabajo a nivel de protocolo (PROTOCOL.md + schemas + mcp-server). Las implementaciones que adopten v1.0 manejan su propio downstream según sus roadmaps independientes.

**EN:** Implement the `CreditBalance` model and the 4 new MCP tools defined in RFC-002, plus schema extensions. Protocol-level work (PROTOCOL.md + schemas + mcp-server). Implementations adopting v1.0 manage their own downstream per their independent roadmaps.

---

## Linked RFC / RFC vinculado

[RFC-002 — Prepayment & Client Credit Balance](../../../rfcs/RFC-002-prepayment-and-credit-balance.md)

---

## Acceptance criteria / Criterios de aceptación

### Spec / Spec

- [ ] `PROTOCOL.md` §12.8 expanded with `CreditBalance` and `CreditBalanceEntry` objects (RFC-002 §3.2, §3.3).
- [ ] `PROTOCOL.md` §6.5 (Payroll rule) updated with reconciliation rule for prepaid services (RFC-002 §3.6).
- [ ] `PROTOCOL.md` §8.2.5 (Service Order ledger) clarifies relationship with credit balance (no ledger field changes for Gap 1; Gap 5 adds `amount_credited`).
- [ ] [Appendix C — Scopes](../../../PROTOCOL.md) updated to reflect the 4 new tools (no new scopes — uses existing `payment:read`, `payment:write`, `mandate:admin`).

### Schemas / Schemas

- [ ] New file: [`schema/credit-balance.schema.json`](../../../schema/) — defines `CreditBalance` + `CreditBalanceEntry`.
- [ ] `schema/service.schema.json` — no signature changes; documentation update only.
- [ ] Manifest schema (TBD location): add `capabilities.credit_balance` declaration per RFC-002 §3.9.

### MCP server (`@servicialo/mcp-server`)

- [ ] New tool: `payments.get_credit_balance` — Tier 2, scope `payment:read`.
- [ ] New tool: `payments.list_credit_balance_entries` — Tier 2, scope `payment:read`. Paginated.
- [ ] New tool: `payments.record_prepayment` — Tier 2, scope `payment:write`. Idempotent.
- [ ] New tool: `payments.adjust_credit_balance` — Tier 2, scopes `mandate:admin` + `payment:write`. Audit-logged.
- [ ] Modified: `payments.create_sale` — server-side balance consumption check before falling through to post-service settlement. No signature change.
- [ ] Tool registration in `packages/mcp-server/src/tools/` with Zod schemas.
- [ ] Tool unit tests in `packages/mcp-server/src/__tests__/`.

### HTTP profile

- [ ] `spec/HTTP_PROFILE.md` updated with REST equivalents of the 4 new tools.
- [ ] `spec/openapi.yaml` updated.

### Documentation

- [ ] `IMPLEMENTING.md` + `IMPLEMENTING.en.md` updated with a "How to implement Credit Balance" section.
- [ ] [CHANGELOG.md](../../../CHANGELOG.md) entry for v1.0.
- [ ] One updated example in `examples/` showing a prepaid flow end-to-end (Spanish + English versions).

---

## Affected files / Archivos afectados

```
PROTOCOL.md
SPEC.md
spec/HTTP_PROFILE.md
spec/openapi.yaml
schema/credit-balance.schema.json                (new)
schema/service.schema.json                       (documentation update)
packages/mcp-server/src/tools/payments.ts        (or split into credit-balance.ts)
packages/mcp-server/src/__tests__/payments.test.ts
IMPLEMENTING.md / IMPLEMENTING.en.md
CHANGELOG.md
examples/                                        (new prepaid example)
```

---

## Estimated effort / Esfuerzo estimado (realistic 12.5h/wk)

| Task | Effort |
|------|--------|
| Spec writing (PROTOCOL.md §12.8 expansion) | 1 wk |
| New JSON Schema file | 0.5 wk |
| HTTP profile + openapi updates | 0.5 wk |
| MCP server tool implementation (4 new tools) | 2 wks |
| Modified `payments.create_sale` behavior | 0.5 wk |
| Unit tests | 1 wk |
| Example update (Spanish + English) | 1 wk |
| Documentation (IMPLEMENTING bilingual) | 1 wk |
| Review cycles + revisions | 1.5 wks |
| **Total** | **~9 wks** |

---

## Dependencies / Dependencias

**Blocks / Bloquea:** Issue `gap-5-credit-notes-servicialo.md` (refund settlement to credit balance depends on this).

**Blocked by / Bloqueado por:**
- [RFC-002](../../../rfcs/RFC-002-prepayment-and-credit-balance.md) acceptance.
- [RFC-001](../../../rfcs/RFC-001-rfc-process-and-deprecation-policy.md) acceptance (process wrapper).

**Implementation downstream:** Reference implementations adopting this RFC manage their own downstream roadmaps. The protocol surface defined in RFC-002 is what conformance is measured against.

---

## Verification / Verificación

- [ ] At least one v1.0 implementation publicly demonstrates the feature end-to-end (prepayment → book → deliver → document → auto-collected via balance) — sufficient to verify the spec is implementable. Specific implementations choose their own validation path.
- [ ] Manifest negotiation works: a v1.0 server with `credit_balance.supported: true` is correctly detected by a v1.0 client.
- [ ] An external implementation that does NOT support credit balance returns `501` and falls through gracefully.
