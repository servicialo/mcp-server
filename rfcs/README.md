# Servicialo Protocol RFCs

> **ES:** Índice de Requests For Comments del Protocolo Servicialo. Los RFCs son la unidad formal de propuesta de cambios al protocolo. El proceso completo está definido en [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md).
>
> **EN:** Index of Servicialo Protocol Requests For Comments. RFCs are the formal unit of proposing changes to the protocol. The full process is defined in [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md).

---

## Scope / Alcance

**EN:** RFCs modify the Servicialo Protocol specification, canonical event model, interoperability requirements, lifecycle semantics, and reference implementation expectations. Product-specific behavior in [Coordinalo](https://coordinalo.com) or any other implementation should not be proposed as an RFC unless it changes protocol semantics.

Adoption by Coordinalo or any other implementation is tracked separately from RFC acceptance. RFC acceptance means the protocol changes; rollout in any specific implementation is each implementer's call.

**ES:** Los RFCs modifican la especificación del Protocolo Servicialo, el modelo canónico de eventos, los requisitos de interoperabilidad, la semántica del ciclo de vida y las expectativas de la implementación de referencia. El comportamiento específico de un producto en [Coordinalo](https://coordinalo.com) o cualquier otra implementación no debe proponerse como RFC salvo que cambie la semántica del protocolo.

La adopción por parte de Coordinalo o cualquier otra implementación se registra por separado de la aceptación del RFC. La aceptación del RFC significa que el protocolo cambia; el rollout en una implementación particular es decisión de cada implementador.

---

## How to submit an RFC / Cómo enviar un RFC

1. Read [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) for the full process.
2. Copy [RFC-TEMPLATE.md](RFC-TEMPLATE.md).
3. Create `RFC-NNN-{slug}.md` with the next sequential number.
4. Open a pull request titled `RFC-NNN: {title}`.
5. When an RFC enters `Open for Comment`, the maintainer opens or links a GitHub Discussion thread from the RFC header.

---

## Index / Índice

**EN:** RFCs 001–004 were authored by Servicialo SpA as the protocol's initial maintainer. Current maintainer: [@francodanioni](https://github.com/francodanioni). The governance and stewardship plan is described in [GOVERNANCE.md](../GOVERNANCE.md).

**ES:** Los RFCs 001–004 fueron escritos por Servicialo SpA como mantenedor inicial del protocolo. Mantenedor actual: [@francodanioni](https://github.com/francodanioni). El plan de gobernanza y stewardship está descrito en [GOVERNANCE.md](../GOVERNANCE.md).

| # | Title | Type | Status | Target version |
|:-:|-------|------|--------|----------------|
| [001](RFC-001-rfc-process-and-deprecation-policy.md) | RFC Process & Deprecation Policy | Process | Draft | v1.0 |
| [002](RFC-002-prepayment-and-credit-balance.md) | Prepayment & Client Credit Balance | Protocol Semantics | Draft | v1.0 |
| [003](RFC-003-refunds-and-credit-notes.md) | Refunds & Credit Notes (Forward-Only Ledger) | Ledger / Accounting | Draft | v1.0 |
| [004](RFC-004-pii-classification-framework.md) | PII / PHI Classification Framework | Data / Compliance | Draft | v1.0 |

RFCs 001–004 form the **first cohort** to pass through the process defined in RFC-001.

---

## RFC states / Estados de los RFCs

**EN:**

- **Draft** — Author iterating, not yet ready for public comment. A returned RFC re-enters this state.
- **Open for Comment** — Public comment window active.
- **Final Comment Period** — Final 1-week window before decision.
- **Accepted** — Approved; protocol change to be merged into the specification.
- **Rejected** — Declined with rationale captured.
- **Withdrawn** — Author retracted.
- **Implemented** — Accepted RFC merged into the protocol specification. Adoption by implementations, including Coordinalo, is tracked separately.
- **Superseded** — Replaced by a later RFC.

**ES:**

- **Draft** — El autor itera, todavía no listo para comentario público. Un RFC devuelto vuelve a este estado.
- **Open for Comment** — Ventana de comentario público activa.
- **Final Comment Period** — Última semana antes de decisión.
- **Accepted** — Aprobado; el cambio al protocolo se merge en la especificación.
- **Rejected** — Rechazado con rationale registrado.
- **Withdrawn** — Retirado por el autor.
- **Implemented** — RFC aceptado y merged en la especificación del protocolo. La adopción por implementaciones, incluyendo Coordinalo, se rastrea por separado.
- **Superseded** — Reemplazado por un RFC posterior.

See [RFC-001 §3.1](RFC-001-rfc-process-and-deprecation-policy.md) for the full lifecycle.

---

## Related / Relacionados

- [GOVERNANCE.md](../GOVERNANCE.md) — Governance and stewardship plan
- [ROADMAP.md](../ROADMAP.md) — Current protocol roadmap (v1.0 plan)
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Contribution guidelines
- [PROTOCOL.md](../PROTOCOL.md) — Current protocol specification (v0.9)

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../GOVERNANCE.md).
