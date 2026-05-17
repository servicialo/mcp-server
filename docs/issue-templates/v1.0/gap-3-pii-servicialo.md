---
name: "[v1.0 Gap 3] PII / PHI classification framework"
about: Protocol-level implementation of RFC-004 (Data Sensitivity Classification expansion) — spec, schemas, Tier 0/1 filtering.
title: "[v1.0 Gap 3] PII Classification — extend §9.8 + schema annotations + tier filtering"
labels: [v1.0, gap-3, rfc-004, protocol, schemas]
assignees: ''
---

## Summary / Resumen

**ES:** Implementar RFC-004: renombrar §9.8 a "Data Sensitivity Classification", extender clasificación a Client / Provider / Audit / Submission con defaults por vertical, anotar schemas con `x-sensitivity`, formalizar reglas de filtrado en Tier 0 / Tier 1, y agregar capability flag al manifest. No requiere nuevos MCP tools — el framework es estructural.

**EN:** Implement RFC-004: rename §9.8 to "Data Sensitivity Classification", extend classification to Client / Provider / Audit / Submission with per-vertical defaults, annotate schemas with `x-sensitivity`, formalize Tier 0 / Tier 1 filtering rules, and add a capability flag to the manifest. No new MCP tools required — the framework is structural.

---

## Linked RFC / RFC vinculado

[RFC-004 — PII / PHI Classification Framework](../../../rfcs/RFC-004-pii-classification-framework.md)

---

## Acceptance criteria / Criterios de aceptación

### Spec / Spec

- [ ] `PROTOCOL.md` §9.8 renamed: "Evidence Sensitivity Classification" → "Data Sensitivity Classification".
- [ ] §9.8 restructured per RFC-004 §3.5: universal taxonomy + obligations first, then per-entity default tables, then per-vertical overrides.
- [ ] §9.8 MUST obligations for `restricted` promoted: applies to ALL restricted data, not only evidence (encryption at rest, per-access audit log, retention policy, DPA).
- [ ] §5.2 (Provider) gains a "Default sensitivity" subsection or annotation.
- [ ] §5.3 (Client) gains a "Default sensitivity" subsection or annotation.
- [ ] §10.6 (Audit Model) updated: audit entries inherit max sensitivity of referenced fields.
- [ ] §13.5 (Bookings Lookup) normative rule: ONLY hashed identifiers accepted (post-hotfix).
- [ ] Tier 0 / Tier 1 filtering rules added (RFC-004 §3.7).
- [ ] Out-of-scope items documented (RFC-004 §3.9 — DSR API, consent management, cross-border transfer, anonymization deferred).

### Schemas / Schemas

- [ ] All entity schemas updated with `x-sensitivity-default` at object level and `x-sensitivity` on individual fields where overrides exist:
  - [ ] [`schema/service.schema.json`](../../../schema/service.schema.json)
  - [ ] [`schema/service-order.schema.json`](../../../schema/service-order.schema.json)
  - [ ] [`schema/service-mandate.schema.json`](../../../schema/service-mandate.schema.json)
  - [ ] [`schema/resolution.schema.json`](../../../schema/resolution.schema.json)
  - [ ] Evidence schemas in [`schema/evidence/`](../../../schema/evidence/) — confirm consistency with existing classifications.
- [ ] New machine-readable file: `schema/sensitivity-overrides.json` mirroring the per-vertical override matrix from PROTOCOL.md §9.8.
- [ ] Manifest schema: add `capabilities.pii_classification` declaration.

### MCP server (`@servicialo/mcp-server`)

- [ ] No new tools. The framework is structural.
- [ ] Existing tool responses for Tier 0 / Tier 1 audited to ensure no fields > `public` are returned.
- [ ] Optional helper: `sanitize-for-tier` utility module that filters response payloads by sensitivity.
- [ ] `delivery.record_evidence` already calls `sanitizeEvidence()` for `restricted`; extend the helper to handle any restricted entity field, not only evidence.

### HTTP profile

- [ ] `spec/HTTP_PROFILE.md` updated with sensitivity references where appropriate.
- [ ] `spec/openapi.yaml` annotated with `x-sensitivity` on schema definitions (OpenAPI 3.1 supports vendor extensions).

### Documentation

- [ ] `IMPLEMENTING.md` + `IMPLEMENTING.en.md` updated with "Implementando el marco PII" section.
- [ ] [CHANGELOG.md](../../../CHANGELOG.md) entry for v1.0 with explicit note that implementations holding restricted non-evidence data become non-conformant if they lack MUST obligations.
- [ ] Documented migration checklist (RFC-004 §7.4).

### Hotfix coordination

- [ ] §13.5 hotfix ([`hotfix-bookings-lookup-email.md`](hotfix-bookings-lookup-email.md)) MUST land in v0.9.x BEFORE this issue closes. This issue formalizes the hash-only rule normatively in v1.0.

---

## Affected files / Archivos afectados

```
PROTOCOL.md                                       (§5.2, §5.3, §9.8, §10.6, §13.5)
SPEC.md
spec/HTTP_PROFILE.md
spec/openapi.yaml
schema/service.schema.json                        (x-sensitivity annotations)
schema/service-order.schema.json
schema/service-mandate.schema.json
schema/resolution.schema.json
schema/evidence/*.schema.json                     (audit consistency)
schema/sensitivity-overrides.json                 (new)
packages/mcp-server/src/lib/sanitize.ts           (extend existing)
packages/mcp-server/src/tools/                    (audit Tier 0/1 tool responses)
packages/mcp-server/src/__tests__/sanitize.test.ts
IMPLEMENTING.md / IMPLEMENTING.en.md
CHANGELOG.md
```

---

## Estimated effort / Esfuerzo estimado (realistic 12.5h/wk)

| Task | Effort |
|------|--------|
| Spec restructuring (§9.8 rewrite + entity-level subsections) | 2 wks |
| Schema annotations across 5+ schema files | 1.5 wks |
| Machine-readable overrides file | 0.5 wk |
| HTTP profile + openapi updates | 0.5 wk |
| Sanitize helper extension | 1 wk |
| Audit Tier 0/1 tool responses + fixes | 1 wk |
| Unit tests for sensitivity propagation | 1 wk |
| Documentation (IMPLEMENTING bilingual) | 1.5 wks |
| Review cycles | 2 wks |
| **Total** | **~11 wks** |

---

## Dependencies / Dependencias

**Blocks / Bloquea:** v1.0 release candidate.

**Blocked by / Bloqueado por:**
- [RFC-004](../../../rfcs/RFC-004-pii-classification-framework.md) acceptance.
- [RFC-001](../../../rfcs/RFC-001-rfc-process-and-deprecation-policy.md) (process).
- [`hotfix-bookings-lookup-email.md`](hotfix-bookings-lookup-email.md) shipped in v0.9.x (the hash-only rule depends on the hotfix being live).

**Can run in parallel with:** [`gap-5-credit-notes-servicialo.md`](gap-5-credit-notes-servicialo.md) — no shared files of consequence.

**Implementation downstream:** Reference implementations adopting this RFC manage their own downstream roadmaps (encryption at rest, per-access audit log, retention policy, DPA template + sub-processor outreach). The protocol surface defined in RFC-004 is what conformance is measured against.

---

## Verification / Verificación

- [ ] Tier 0 / Tier 1 endpoints audited: a public agent does not see any `confidential` or `restricted` field.
- [ ] Spec includes per-vertical override table for health / legal / education at minimum.
- [ ] At least one v1.0 implementation publicly demonstrates encryption at rest for newly classified `restricted` fields and per-access audit logging — sufficient to verify the spec is implementable.
- [ ] Manifest declares `pii_classification.supported: "v1.0"` capability.

---

## Notes / Notas

- This is the most spec-heavy of the four v1.0 gaps. Reviewer focus likely on the per-vertical override matrix.
- Data Subject Rights API (export / delete / rectify) is explicitly out of scope for v1.0 (RFC-004 §3.9). Implementations needing GDPR Article 15-20 compliance must implement DSR out-of-band until the future v1.x RFC.
