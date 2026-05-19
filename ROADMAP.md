# Servicialo Protocol — Hoja de Ruta v1.0 / Roadmap v1.0

> **ES:** Este documento define el camino de **Servicialo Protocol v0.9 → v1.0**. Reemplaza el ROADMAP anterior de tipo "trayectoria abierta" por una hoja de ruta con alcance acotado, dependencias explícitas, y un cronograma sujeto a la ventana de comentarios de la comunidad.
>
> **EN:** This document defines the path of **Servicialo Protocol v0.9 → v1.0**. It replaces the previous open-ended roadmap with a scoped, dependency-explicit plan and a timeline subject to the community comment window.

| Field | Value |
|-------|-------|
| Document version | 1.0 |
| Authored | 2026-05-17 |
| Author | Servicialo SpA — Franco Danioni ([@danioni](https://github.com/danioni)), acting maintainer |
| Status | Draft — open for community comment |
| License | Apache-2.0 |
| Supersedes | Previous `ROADMAP.md` (v0.1 → v0.7 trajectory) |

---

## 1. Estado actual / Current State

**ES:** Servicialo Protocol v0.9 está publicado y operativo. El MCP server `@servicialo/mcp-server` v0.9.x está en npm con 34 herramientas. Hay implementaciones activas en Rusia, Japón, Alemania, Estados Unidos y Chile, con adopción orgánica. La spec define 8 dimensiones, 6+3 estados de ciclo de vida, 6 flujos de excepción, 7 principios, modelo de agencia delegada, y dos canales de interoperabilidad (MCP + HTTP REST).

**EN:** Servicialo Protocol v0.9 is published and operating. The MCP server `@servicialo/mcp-server` v0.9.x is on npm with 34 tools. Active implementations exist in Russia, Japan, Germany, the United States and Chile, via organic adoption. The spec defines 8 dimensions, 6+3 lifecycle states, 6 exception flows, 7 principles, the delegated agency model, and two interoperability channels (MCP + HTTP REST).

| Surface | Version | Status |
|---------|---------|--------|
| Protocol spec | v0.9 | Live ([servicialo.com/spec](https://servicialo.com/spec)) |
| MCP server (`@servicialo/mcp-server`) | v0.9.x | Published on npm |
| Reference HTTP profile | [`spec/HTTP_PROFILE.md`](spec/HTTP_PROFILE.md) | Live |
| Active implementations | RU, JP, DE, US, CL | Independent, organic adoption |
| License | Apache-2.0 | Stable since v0.7 |
| Governance entity | Servicialo SpA (Chile) — Estatutos foundation-mode in drafting | In formation |

---

## 2. Por qué v1.0 ahora / Why v1.0 Now

**ES:** v0.9 está estable y adoptado, pero una revisión externa identificó 7 gaps arquitectónicos que separan a Servicialo de la credibilidad de un estándar global. v1.0 cierra cuatro de esos siete y define un proceso ordenado para los otros tres. La declaración v1.0 sirve a tres audiencias: implementadores que necesitan garantías de compatibilidad, reguladores que requieren claridad sobre manejo de datos sensibles, y la comunidad que necesita un proceso formal para evolucionar el protocolo.

**EN:** v0.9 is stable and adopted, but an external review identified 7 architectural gaps separating Servicialo from global-standard credibility. v1.0 closes four of those seven and defines an orderly process for the other three. The v1.0 declaration serves three audiences: implementers needing compatibility guarantees, regulators requiring clarity on sensitive-data handling, and the community needing a formal process to evolve the protocol.

---

## 3. Alcance v1.0 / v1.0 Scope

v1.0 cierra cuatro gaps en orden de ejecución obligatorio. / v1.0 closes four gaps in a mandatory execution order.

### Resumen / Summary

| # | Gap | Type | RFC | Effort (focused) | Dependencies |
|:-:|-----|------|-----|------------------|--------------|
| 1 | **7a — RFC process & deprecation policy** | SPEC | [RFC-001](rfcs/RFC-001-rfc-process-and-deprecation-policy.md) | ~1 wk | None — wrapper for all others |
| 2 | **1 — Prepayment & Credit Balance** | SPEC + IMPL | [RFC-002](rfcs/RFC-002-prepayment-and-credit-balance.md) | ~2–3 wks | Gap 7a |
| 3 | **5 — Refunds & Credit Notes** | SPEC + IMPL | [RFC-003](rfcs/RFC-003-refunds-and-credit-notes.md) | ~3–4 wks | Gap 1 |
| 4 | **3 — PII classification framework** | SPEC + IMPL | [RFC-004](rfcs/RFC-004-pii-classification-framework.md) | ~3–4 wks | Gap 7a; parallel with Gap 5 |

Effort columns reflect focused-work weeks for protocol-level work (RFC, schema, MCP server). They do not include comment windows, community iteration, or reference-implementation downstream. Consolidated calendar target: §7.

### Orden de ejecución / Execution Order

```
Gap 7a (process wrapper, blocking)
    │
    ▼
Gap 1 (prepayment, blocking for refunds)
    │
    ▼
Gap 5 ──── parallel ──── Gap 3
    │                      │
    └─────► v1.0 RC ◄──────┘
                │
                ▼
       Community review (4 wks)
                │
                ▼
            v1.0 final
```

### 3.1 Gap 7a — RFC Process & Deprecation Policy

**ES:** Formaliza el proceso por el cual el protocolo evoluciona. Sin esto, anunciar v1.0 a las implementaciones activas es un acto unilateral. Esta es la primera pieza que debe quedar firme — define cómo se anuncian los otros cambios.

**EN:** Formalizes the process by which the protocol evolves. Without this, announcing v1.0 to active implementations is a unilateral act. This is the first piece that must be settled — it defines how the other changes are announced.

| Field | Value |
|-------|-------|
| Type | SPEC-only |
| Components | [PROTOCOL.md](PROTOCOL.md) §17 (Versioning), [CONTRIBUTING.md](CONTRIBUTING.md), new `/rfcs/` directory + index |
| RFC | [RFC-001](rfcs/RFC-001-rfc-process-and-deprecation-policy.md) |

**Acceptance criteria:**

- [ ] [PROTOCOL.md](PROTOCOL.md) §17 contains: RFC submission flow, comment window, acceptance criteria, version coexistence rules, deprecation timeline (minimum 2 minor versions of notice).
- [ ] `/rfcs/` directory has README index + RFC template.
- [ ] `registry.manifest` MUST return `protocol_version` and an array `supported_versions[]`.
- [ ] Implementations MUST reject requests targeting an unsupported version with `HTTP 426 Upgrade Required` and a `Servicialo-Supported-Versions` response header.
- [ ] Breaking-change communication channel established (mailing list or dedicated `announce` repo).
- [ ] Formal-objection mechanism defined (RFC-001 §3.10).
- [ ] [CONTRIBUTING.md](CONTRIBUTING.md) updated to point at the RFC process.

### 3.2 Gap 1 — Prepayment & Credit Balance

**ES:** Cierra el contrato semántico entre prepago (existente en §12.8 como REST flow) y el ciclo de vida de Services atómicos. Adopta **Credit Balance del cliente** como modelo: el cliente tiene un saldo monetario que se consume al ejecutar Services, agnóstico al Service Order. Append-only, composable con suscripciones, packs y memberships.

**EN:** Closes the semantic contract between prepayment (already in §12.8 as a REST flow) and the atomic Service lifecycle. Adopts **client-level Credit Balance** as the model: the client holds a monetary balance consumed as Services are delivered, agnostic to any Service Order. Append-only, composable with subscriptions, packs and memberships.

| Field | Value |
|-------|-------|
| Type | SPEC + IMPLEMENTATION (protocol level) |
| Components | [PROTOCOL.md](PROTOCOL.md) §6, §6.5, §8.2.5, §12.8; [`schema/service.schema.json`](schema/service.schema.json); [`schema/service-order.schema.json`](schema/service-order.schema.json); new `schema/credit-balance.schema.json`; MCP `payments.*` tools |
| RFC | [RFC-002](rfcs/RFC-002-prepayment-and-credit-balance.md) |

**Acceptance criteria:**

- [ ] New `CreditBalance` object defined in spec (§12.8.x) and JSON Schema.
- [ ] New tool: `payments.record_prepayment` (Tier 2, `payment:write`).
- [ ] New tool: `payments.get_credit_balance` (Tier 2, `payment:read`).
- [ ] New tool: `payments.list_credit_balance_entries` (Tier 2, `payment:read`).
- [ ] New tool: `payments.adjust_credit_balance` (Tier 2, `mandate:admin` + `payment:write`).
- [ ] `payments.create_sale` extended with server-side balance consumption check before falling through to post-service settlement.
- [ ] Payroll rule (§6.5) reconciled: `collected` for a prepaid service is set at `documented` transition with `payment_source: "credit_balance"` in metadata.
- [ ] Manifest declaration: `capabilities.credit_balance.supported`.
- [ ] Migration path for v0.9 implementations: backward-compatible (existing tools retain signatures).

### 3.3 Gap 5 — Refunds & Credit Notes

**ES:** Define refunds como **forward-only credit notes**: el ledger nunca decrece, las correcciones llegan como entries adicionales. Es consistente con event-sourcing, auditable, y compatible con la emisión de tax documents de cancelación que llegarán en v1.1 (Gap 2).

**EN:** Defines refunds as **forward-only credit notes**: the ledger never decreases; corrections arrive as additional entries. Consistent with event-sourcing, auditable, and compatible with cancellation tax documents arriving in v1.1 (Gap 2).

| Field | Value |
|-------|-------|
| Type | SPEC + IMPLEMENTATION (protocol level) |
| Components | [PROTOCOL.md](PROTOCOL.md) §7.4 (Dispute), §7.6 (Partial), §8.2.5 (Ledger), new §X (Reversals); [`schema/service.schema.json`](schema/service.schema.json); new `schema/credit-note.schema.json`; MCP `payments.create_credit_note`, `payments.list_credit_notes`, `payments.get_credit_note`, `payments.cancel_credit_note` |
| RFC | [RFC-003](rfcs/RFC-003-refunds-and-credit-notes.md) |

**Acceptance criteria:**

- [ ] New `CreditNote` object defined in spec and JSON Schema.
- [ ] §7.4 (Dispute) and §7.6 (Partial Delivery) reference the credit note model with normative MUST clauses.
- [ ] `billing.status` enum gains `credited` and `partial_credit` values (minor breaking change, mitigated via RFC-001 version negotiation).
- [ ] Ledger fields gain `amount_credited` (computed, append-only).
- [ ] Four new MCP tools registered with appropriate scopes.
- [ ] Partial refund support (`credited_amount` < `original_amount`); ledger fully reconciles.
- [ ] Version-negotiation server-side mitigation: when serving v0.9 clients, server maps new enum values to v0.9-compatible.
- [ ] Manifest declaration: `capabilities.credit_notes`.

### 3.4 Gap 3 — PII Classification Framework

**ES:** Extiende §9.8 (que hoy aplica solo a evidence) a las entidades core: Client, Provider, Audit, Submission. Defaults por vertical. Bloquea la candidatura de estándar global porque sin clasificación de datos sensibles es legalmente imposible operar la capa de benchmarks cross-implementación.

**EN:** Extends §9.8 (today only for evidence) to core entities: Client, Provider, Audit, Submission. Per-vertical defaults. Blocks global-standard candidacy because without sensitive-data classification, operating the cross-implementation benchmarks layer is legally impossible.

| Field | Value |
|-------|-------|
| Type | SPEC + IMPLEMENTATION (protocol level) |
| Components | [PROTOCOL.md](PROTOCOL.md) §5.2, §5.3, §9.8, §10.6, §13.5; all entity schemas; MCP `clients.get_or_create`, audit entries |
| RFC | [RFC-004](rfcs/RFC-004-pii-classification-framework.md) |

**Acceptance criteria:**

- [ ] §9.8 renamed and expanded to "Data Sensitivity Classification" covering all entities, not just evidence.
- [ ] Schemas gain `x-sensitivity` and `x-sensitivity-default` annotations.
- [ ] Defaults table extended: Client, Provider, Audit, Submission with per-vertical overrides.
- [ ] MUST obligations of `restricted` (encryption at rest, per-access audit log, retention policy, DPA) apply to ALL `restricted` data, not just evidence.
- [ ] §13.5 Bookings Lookup hotfix landed in v0.9.x (see §8 — this work ships first, independent of v1.0).
- [ ] Tier 0 / Tier 1 filtering rules made normative: public-tier responses MUST NOT return fields above `public` sensitivity.
- [ ] Out-of-scope items documented (DSR API, consent management, breach notification protocol, minimum-necessary, designated privacy officer).
- [ ] Manifest declaration: `capabilities.pii_classification`.

### 3.5 Definición de "v1.0 ready" / v1.0 Release Criteria

v1.0 se declara cuando: / v1.0 is declared when:

- [ ] RFCs 001–004 are merged with community comment windows closed.
- [ ] At least one v1.0 implementation publicly available so the spec is empirically demonstrated.
- [ ] Conformance test suite covers the four gap areas (basic version — full suite is v1.x).
- [ ] [`PROTOCOL.md`](PROTOCOL.md) carries `Version: 1.0`, `Status: Stable`, with the backwards-compatibility guarantee from §15.5 made normative.
- [ ] Servicialo SpA governance milestones met: Estatutos foundation-mode in effect + advisory committee seated (see §5).

---

## 4. Alcance v1.1 / v1.1 Scope

**ES:** Tres gaps quedan post-v1.0. Dos tienen camino claro; uno (identity portability) está reservado para conversación con el comité asesor de Servicialo SpA antes de definir modelo.

**EN:** Three gaps remain post-v1.0. Two have clear paths; one (identity portability) is reserved for a Servicialo SpA advisory committee conversation before model selection.

| # | Gap | Type | Status |
|:-:|-----|------|--------|
| 5 | **2 — Multi-currency + Tax (wrapper + MX-CFDI + CL-Boleta)** | SPEC + IMPL | Planned for v1.1 |
| 6 | **4 — Multi-party services (`clients[]` array)** | SPEC + IMPL | Planned for v1.1 |
| 7 | **6 — Cross-node identity portability** | SPEC + IMPL | **TBD** — model selection deferred to architectural RFC pre-v1.1, reserved for advisory committee conversation |

Additional tax jurisdiction profiles (EU-VAT, BR-NFe, US sales tax) ship as independent RFCs post-v1.1 — they do not block v1.1.

---

## 5. Servicialo SpA — Governance Entity / Entidad de Gobernanza

### Gap 7b — Governance entity formalization (revised scope)

Servicialo SpA is the legal entity custodian of the protocol. Status:

- **Estatutos foundation-mode**: in drafting, target completion within 7 days. Five mandated clauses:
  1. Single purpose (maintain the open protocol).
  2. No profit distribution.
  3. Implementation neutrality.
  4. Irrevocable IP assignment under Apache-2.0.
  5. Optional evolution path to Fundación sin fines de lucro.
- **Formal constitution** via Chilean Empresa en un Día system: target completion within the current month.
- **Advisory committee** (2–3 external members, non-voting initially): recruitment in progress, target seating before v1.0 sign-off.
- **Optional future transition** to Fundación sin fines de lucro: tracked as v2.0+ consideration, not blocking for v1.0.

**Rationale for SpA-as-Foundation structure:** substance (bylaws) matters more than legal form for protocol governance credibility. The Linux Foundation is technically a 501(c)(6) trade association; the Apache Software Foundation is a 501(c)(3); neither legal form determined their legitimacy — operational neutrality and bylaws did. Servicialo SpA with foundation-mode Estatutos is a pragmatic vehicle that unblocks v1.0 without sacrificing governance principles.

**Milestones:**

| Milestone | Description | Target |
|-----------|-------------|--------|
| **M1** — Estatutos foundation-mode drafted | Five mandated clauses settled in draft | Within 7 days of this document |
| **M2** — SpA formally constituted | RUT + registration via Empresa en un Día | Within current month |
| **M3** — Advisory committee recruited | 2–3 external members publicly named | Before v1.0 RC |
| **M4** — First advisory meeting | Recorded, summary published | Before v1.0 final |
| **M5** — Bylaws v1 ratified | Sufficient for advisory committee to participate in v1.0 sign-off | Before v1.0 final |

**Minimum for v1.0 sign-off:** M1 + M2 + M3. M4 and M5 are required for v1.0 final but their timing flexes with the technical track.

---

## 6. Estrategia de migración / Migration Strategy

**ES:** La transición v0.9 → v1.0 es una invitación a coordinar, no un anuncio unilateral. La fechas en esta sección son **objetivos, no compromisos**: la ventana de comentarios de la comunidad puede ajustarlas. Servicialo SpA quiere acompañar a las implementaciones activas en el cambio — si tu implementación tiene restricciones de migración que no conocemos, por favor decilo antes del cierre de la ventana de comentarios.

**EN:** The v0.9 → v1.0 transition is an invitation to coordinate, not a unilateral announcement. The dates in this section are **targets, not commitments**: the community comment window can shift them. Servicialo SpA wants to accompany active implementations through the change — if your implementation has migration constraints we don't know about, please tell us before the comment window closes.

> *Reference implementations — including the active third-party nodes in RU/JP/DE/US/CL — adapt to v1.0 per their own independent roadmaps. Servicialo SpA does not coordinate or prescribe implementer roadmaps.*

### 6.1 Anuncio v0.9 → v1.0 / v0.9 → v1.0 Announcement

**ES:** v1.0 propone dos breaking changes en producción (extensiones de enum en `billing.status` para credit notes, y deprecation de `?email=` en §13.5). Todo lo demás es aditivo. Si los RFCs son aceptados, la migración propuesta corre en tres fases — estas fechas son objetivos, y la ventana de comentarios (T-12 wks) está abierta para surfacear preocupaciones que las pueden mover.

**EN:** v1.0 proposes two production-breaking changes (enum extensions on `billing.status` for credit notes, and deprecation of `?email=` in §13.5). Everything else is additive. If the RFCs are accepted, the proposed migration will run in three phases — these dates are targets, and the community comment window (T-12 wks) is open to surface concerns that can shift them.

| Phase | Date (target) | Action |
|-------|---------------|--------|
| **T-12 wks** | When v1.0 RC enters community review | RFC merge announcement on `announce` channel + GitHub Discussions + best-effort outreach to active nodes |
| **T-6 wks** | After RC review window | v1.0 final release tag; canonical spec URL updated to `/spec/v1.0`; **v0.9 spec remains canonical at `/spec/v0.9` indefinitely** |
| **T = 0** | v1.0 release | Old `/spec` resolves to v1.0; v0.9 URL stable for 18 months minimum |

### 6.2 Coexistencia de versiones / Version Coexistence

**ES:** Las implementaciones v0.9 y v1.0 coexisten indefinidamente. El protocolo define negociación vía `registry.manifest`. Una organización puede declarar `supported_versions: ["0.9", "1.0"]` y los agentes eligen la versión más alta común.

**EN:** v0.9 and v1.0 implementations coexist indefinitely. The protocol defines version negotiation via `registry.manifest`. An organization can declare `supported_versions: ["0.9", "1.0"]` and agents pick the highest common version.

```json
{
  "protocol_version": "1.0",
  "supported_versions": ["0.9", "1.0"],
  "minimum_client_version": "0.9"
}
```

When a client requests a version not in `supported_versions`, the server MUST return `HTTP 426 Upgrade Required` with a `Servicialo-Supported-Versions` response header listing acceptable versions. (Normative spec text; see RFC-001 §3.7.)

### 6.3 Deprecation timeline

| Item | Status at v1.0 | Removal target |
|------|----------------|----------------|
| §13.5 `?email=` clear-text lookup | Already deprecated via hotfix before v1.0 (see §8) | v1.0 — replaced by `?email_hash=` |
| `billing.status` value `disputed` (terminal) | Soft-deprecated; superseded by `disputed` → resolution (`credited` / `verified`) | v1.2 |
| `data_sensitivity` absence (defaulting to `internal`) for restricted-vertical data | Soft-deprecated for health vertical clinical fields | v1.1 |

**Rule of thumb / Regla general:** any item soft-deprecated in vN is removed no earlier than v(N+2).

### 6.4 Coordinación con implementaciones activas / Coordination with active implementations

**ES:** Servicialo SpA quiere coordinar esta transición con las implementaciones activas. Los canales abiertos para coordinación son los canales públicos del protocolo, no canales privados:

**EN:** Servicialo SpA wants to coordinate this transition with active implementations. The channels open for coordination are the protocol's public channels, not private channels:

Channels open for coordination / Canales abiertos para coordinación:

- GitHub Discussions on the spec repo (primary, archived).
- `announce` repo with release notes per version, mirror to npm package release notes.
- `registry.manifest` returns current and supported versions — agents discover automatically.
- Optional opt-in email list (created as part of Gap 7a deliverables).

Where contact info is publicly available, Servicialo SpA will reach out directly during the comment window — this is best-effort outreach, not a notification requirement on implementers. If you would prefer a different cadence or channel, please open a Discussion thread and we will adjust.

---

## 7. Cronograma objetivo / Target Calendar

**ES:** v1.0 objetivo: **H2 2027**, sujeto a refinamiento durante la ventana de comentarios.

**EN:** v1.0 target: **H2 2027**, to be refined during the community comment window.

The technical work (RFC drafts, schemas, validators, reference adaptations) is estimated at 80–100 days of focused effort with AI-assisted development. The governance vehicle (Servicialo SpA with foundation-mode Estatutos) is constituted in parallel and does not gate v1.0 timing. The H2 2027 window primarily reflects community comment windows (4 weeks per major RFC, partially overlapping) plus realistic capacity constraints for spec review. Specific dates will be locked after community comment closes.

| Track | Notes |
|-------|-------|
| Technical (RFC drafts, schema, MCP server, tests) | AI-assisted; 80–100 days of focused work |
| Governance entity (Servicialo SpA, Estatutos, advisory committee) | Parallel track; constitution within current month; does not gate v1.0 |
| Community comment windows | 4 wks per major RFC, partially overlapping; non-compressible |

A more detailed internal calendar breakdown is maintained privately for planning; the public commitment is the H2 2027 window plus the explicit "subject to comment" framing.

---

## 8. Hotfixes Inmediatos / Immediate Hotfixes

**ES:** Items que no pueden esperar al cronograma de v1.0 por riesgo de seguridad o de credibilidad. Se ejecutan como patches de v0.9.x antes del arranque formal de v1.0.

**EN:** Items that cannot wait on the v1.0 timeline due to security or credibility risk. Executed as v0.9.x patches before v1.0 work formally starts.

| Hotfix | Reason | ETA | Standalone issue |
|--------|--------|-----|------------------|
| §13.5 `?email=` → `?email_hash=` | PII exposure in public unauthenticated URL | 1 week | [`hotfix-bookings-lookup-email.md`](docs/issue-templates/v1.0/hotfix-bookings-lookup-email.md) |

The hotfix ships independently of v1.0. It introduces no breaking change at the v0.9.x patch level (both `?email=` and `?email_hash=` accepted with deprecation headers on the legacy path). The hard removal of `?email=` happens in v1.0 with full advance notice via `Deprecation` and `Sunset` HTTP headers per RFC 8594.

---

## 9. Cómo contribuir / How to Contribute

**ES:** Los cuatro RFCs que componen v1.0 están abiertos para comentarios. Cada uno tiene su propia ventana de discusión que se abre al merge del RFC en draft state. Para contribuir:

**EN:** The four RFCs composing v1.0 are open for comments. Each has its own discussion window that opens when the RFC is merged in draft state. To contribute:

1. Read the RFC in `/rfcs/`.
2. Open a GitHub Discussion thread tagged with the RFC number.
3. Submit pull requests against the RFC document with proposed changes.
4. Implementer feedback is especially welcome — if your implementation currently runs v0.9 and a proposed change creates migration pain, say so via Discussion or PR comment.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the formal RFC process (formalized as part of Gap 7a / RFC-001).

---

## 10. Historial / History

| Version | Date | Note |
|---------|------|------|
| This document | 2026-05-17 | First v1.0-scoped roadmap. Supersedes the open-ended roadmap previously at this path. |
| Previous roadmap | (in git history) | Mid/long-term direction without explicit scope. Preserved for historical reference. |

---

> **Source of truth / Fuente de verdad:** This roadmap reflects current intent and is **not** a contract. Material changes go through the RFC process formalized in Gap 7a. / Esta hoja de ruta refleja la intención actual y **no** es un contrato. Los cambios materiales pasan por el proceso RFC formalizado en Gap 7a.
>
> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](GOVERNANCE.md).
