---
name: "[Hotfix] §13.5 Bookings Lookup — deprecate clear-text email"
about: Security hotfix — replace `?email=` with `?email_hash=` in public Bookings Lookup endpoint. Ships standalone, does NOT wait for v1.0.
title: "[Hotfix] §13.5 — Deprecate `?email=` clear-text lookup → `?email_hash=`"
labels: [security, hotfix, v0.9.x, priority-high]
assignees: ''
---

## Summary / Resumen

**ES:** §13.5 (Bookings Lookup) hoy acepta `?email={emailClearText}` en una URL pública sin autenticación. Esto es una bomba PII: el email del cliente queda en logs de servidor, logs de proxy, historial de browser, y permite enumeración trivial. **Hotfix de seguridad, ship en v0.9.x, no espera a v1.0.**

**EN:** §13.5 (Bookings Lookup) currently accepts `?email={clearTextEmail}` in a public unauthenticated URL. This is a PII landmine: client email lands in server logs, proxy logs, browser history, and enables trivial enumeration. **Security hotfix, ships in v0.9.x, does NOT wait for v1.0.**

---

## Scope / Alcance

This issue covers BOTH repos. Track sub-tasks if needed, or split into two linked issues — one in `servicialo/mcp-server` and one in `digitalo/coordinalo`.

| Repo | Files | Effort (realistic) |
|------|-------|--------------------|
| `servicialo/mcp-server` | [`PROTOCOL.md`](../../../PROTOCOL.md) §13.5; [`SPEC.md`](../../../SPEC.md) §7; [`spec/HTTP_PROFILE.md`](../../../spec/HTTP_PROFILE.md); [`spec/openapi.yaml`](../../../spec/openapi.yaml); MCP server (if it implements this endpoint as a tool) | ~3 days |
| `digitalo/coordinalo` | `/api/servicialo/[orgSlug]/bookings/route.ts` (or equivalent) | ~2 days |

Total: ~1 week of work.

---

## Linked RFC / RFC vinculado

No RFC required. This is a security patch, not a protocol redesign. The change is formalized retroactively in [RFC-004 §3.8](../../../rfcs/RFC-004-pii-classification-framework.md) but does NOT depend on it.

---

## Acceptance criteria / Criterios de aceptación

### Servicialo spec changes

- [ ] `PROTOCOL.md` §13.5 updated:
  - [ ] `email` query param marked `Deprecated`, removal target v1.0.
  - [ ] New `email_hash` query param defined: `sha256(lowercase(trim(email)))` as lowercase hex.
  - [ ] Same for `phone_hash`: `sha256(E.164-normalized phone)`.
  - [ ] Compatibility window: both accepted in v0.9.x; clear-text emits `Deprecation: true` + `Sunset: <2026-09-30>` response headers per RFC 8594; v1.0 rejects clear-text with `HTTP 400 Bad Request`.
- [ ] `SPEC.md` §7 ("Bookings Lookup" subsection) updated to match.
- [ ] `spec/HTTP_PROFILE.md` updated.
- [ ] `spec/openapi.yaml` updated with deprecation marker on `email` param.
- [ ] [CHANGELOG.md](../../../CHANGELOG.md) entry under v0.9.x patch notes.

### Servicialo MCP server (if applicable)

- [ ] If the MCP server proxies §13.5, it MUST forward both `email` (with deprecation warnings) and `email_hash`.
- [ ] MCP server response includes `deprecation` field when client uses clear-text path.

### Implementer guidance (informative, not normative for this issue)

Implementations choose their own migration path. A typical pattern:

- `/api/servicialo/{orgSlug}/bookings` accepts both `email` and `email_hash` during v0.9.x.
- When called with `email`, returns 200 (still functional) but includes `Deprecation` + `Sunset` HTTP response headers.
- When called with `email_hash`, returns 200 with the same payload shape, looked up via an indexed hash column.
- Migration: add a `client_email_hash` indexed column (or equivalent); populate via backfill job.
- After v1.0 release: clear-text path returns `HTTP 400 Bad Request` with error code `clear_text_email_disallowed`.

### Communication

- [ ] Release notes published with security advisory framing.
- [ ] `announce` channel + opt-in email list (when established) notifies implementations.
- [ ] Best-effort outreach to active implementations (RU/JP/DE/US/CL and others) where contact info is publicly available.

---

## Affected files / Archivos afectados (protocol level)

```
PROTOCOL.md                        (§13.5)
SPEC.md                            (§7)
spec/HTTP_PROFILE.md
spec/openapi.yaml
CHANGELOG.md
README.md / README.en.md           (if examples reference the old param)
examples/*.md                      (audit for ?email= usages)
```

Implementations adopting the hotfix touch their own application files independently (REST handler, schema/migrations, backfill jobs). Those changes are owned by each implementation.

---

## Estimated effort / Esfuerzo estimado (protocol-level work)

| Task | Effort |
|------|--------|
| Spec edits (PROTOCOL + SPEC + HTTP_PROFILE + openapi) | 0.5 day |
| Documentation + CHANGELOG | 0.5 day |
| Communication (release notes, advisories, outreach) | 0.5 day |
| **Total (protocol)** | **~1.5 days** |

Implementation downstream (REST handler, hash column, backfill) is owned by each implementer; typical implementation effort is on the order of 3–4 days at full-time pace, but Servicialo SpA does not estimate or schedule implementer work.

---

## Dependencies / Dependencias

**Blocks / Bloquea:** Nothing. This ships standalone.

**Blocked by / Bloqueado por:** Nothing. Pure security hotfix.

**Related:** [RFC-004](../../../rfcs/RFC-004-pii-classification-framework.md) formalizes the hash-only normative rule in v1.0 (§3.8).

---

## Notes / Notas

- **Hash MUST be computed client-side.** Agents compute `sha256(lowercase(trim(email)))` (or the `phone_hash` equivalent on E.164-normalized phone) before calling the endpoint. Servers MUST NOT accept clear-text in v1.0. During the v0.9.x deprecation window, servers MAY accept clear-text and compute the hash internally for backward compat, but MUST emit `Deprecation` and `Sunset` headers on that path.
- The hash is computed without salt. This is intentional: any client must be able to compute the hash without coordination. Rate limiting (already required by §13.0.3) mitigates rainbow-table risks for the limited use case (a user looking up their own bookings).
- Implementations that already encrypt email at rest still benefit from the hash-lookup path because the lookup becomes O(1) instead of O(n) decrypt-and-compare.
- Future hardening (post-v1.0): consider per-org pepper added to the hash. Out of scope for this hotfix.

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../../../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../../../GOVERNANCE.md).
