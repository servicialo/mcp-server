# Servicialo v1.0 — Issue Templates

> **ES:** Templates listos para copiar al issue tracker de Servicialo. Cubren el trabajo a nivel de protocolo (spec, schemas, MCP server) que Servicialo SpA conduce directamente. Las implementaciones de referencia que adopten v1.0 manejan su propio downstream — el ROADMAP no prescribe sus issue trackers.
> Estos templates se mantienen separados del `.github/ISSUE_TEMPLATE/` estándar para evitar contaminar el picker de "New Issue" con templates específicos del ciclo v1.0.
>
> **EN:** Templates ready to copy into the Servicialo issue tracker. They cover protocol-level work (spec, schemas, MCP server) that Servicialo SpA conducts directly. Reference implementations adopting v1.0 manage their own downstream — the ROADMAP does not prescribe their issue trackers.
> These templates are kept separate from the standard `.github/ISSUE_TEMPLATE/` to avoid cluttering the "New Issue" picker with v1.0-specific templates.

---

## Index / Índice

### Hotfixes (ship before v1.0)

| Template | Scope | Priority | ETA |
|----------|-------|----------|-----|
| [`hotfix-bookings-lookup-email.md`](hotfix-bookings-lookup-email.md) | Servicialo protocol (§13.5 normative rule + REST profile + openapi) | High (security) | 1 wk |

### v1.0 implementation issues

| Template | Scope | Linked RFC |
|----------|-------|------------|
| [`gap-1-credit-balance-servicialo.md`](gap-1-credit-balance-servicialo.md) | Servicialo protocol (spec + schemas + MCP server) | [RFC-002](../../../rfcs/RFC-002-prepayment-and-credit-balance.md) |
| [`gap-3-pii-servicialo.md`](gap-3-pii-servicialo.md) | Servicialo protocol (spec + schema annotations + Tier 0/1 filtering) | [RFC-004](../../../rfcs/RFC-004-pii-classification-framework.md) |
| [`gap-5-credit-notes-servicialo.md`](gap-5-credit-notes-servicialo.md) | Servicialo protocol (spec + schemas + MCP server) | [RFC-003](../../../rfcs/RFC-003-refunds-and-credit-notes.md) |

---

## Effort estimates / Estimaciones de esfuerzo

Per-gap effort estimates in each template are AI-assisted estimates for protocol-level work (RFC drafting, schema design, MCP server implementation, test scaffolding). They do **not** include reference-implementation downstream work, which is owned by each implementer and tracked in their own repos. See [ROADMAP.md §7](../../../ROADMAP.md) for the consolidated H2 2027 target window.

---

## Dependency graph / Grafo de dependencias

```
Hotfix §13.5 (ships first, standalone — v0.9.x security patch)
    │
    ▼
RFC-001 merged (process artifact — direct PR to PROTOCOL.md, no impl issue)
    │
    ▼
Gap 1 — Credit Balance (RFC-002)
    │
    ▼
Gap 5 — Credit Notes (RFC-003) ──── parallel ──── Gap 3 — PII (RFC-004)
    │                                                  │
    └──────────────────► v1.0 Release Candidate ◄──────┘
```

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../../../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../../../GOVERNANCE.md).
