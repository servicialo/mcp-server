# RFC-001: RFC Process & Deprecation Policy

| Field | Value |
|-------|-------|
| RFC number | 001 |
| Title | RFC Process & Deprecation Policy |
| Author(s) | Servicialo SpA — Franco Danioni ([@francodanioni](https://github.com/francodanioni)), acting maintainer |
| Status | Draft |
| Created | 2026-05-17 |
| Target version | Servicialo Protocol v1.0 |
| Closes gap | Gap 7a (from v1.0 gap analysis) |
| First cohort | This RFC and RFCs 002, 003, 004 form the first cohort to pass through the process this RFC defines. |
| Related | [ROADMAP.md](../ROADMAP.md) §3.1, §6 |
| License | Apache-2.0 |

> **ES:** Este RFC define el proceso por el cual el protocolo evoluciona. Es el primer RFC porque define el formato de los siguientes. Su aceptación habilita el resto del trabajo de v1.0.
>
> **EN:** This RFC defines the process by which the protocol evolves. It is the first RFC because it defines the format of the rest. Its acceptance enables the remainder of the v1.0 work.

---

## 1. Summary / Resumen

**ES:** Formalizar el proceso de evolución de Servicialo Protocol con: (a) flujo RFC público con ventanas de comentario; (b) política de deprecation con ventana mínima de 2 minor versions; (c) reglas de coexistencia de versiones vía `registry.manifest`; (d) canal `announce` para comunicación con implementadores activos. Este es el wrapper de proceso para todos los cambios v0.9 → v1.0 y posteriores.

**EN:** Formalize the Servicialo Protocol evolution process with: (a) public RFC workflow with comment windows; (b) deprecation policy with a minimum 2-minor-version window; (c) version coexistence rules via `registry.manifest`; (d) an `announce` channel for communication with active implementers. This is the process wrapper for all v0.9 → v1.0 changes and beyond.

---

## 2. Motivation / Motivación

**ES:** v0.9 está en producción con implementaciones activas en RU, JP, DE, US, CL. Cualquier cambio al protocolo afecta esas implementaciones. Sin proceso formal:

- Los cambios se anuncian unilateralmente desde un mantenedor individual.
- Los implementadores no tienen ventana de comentario predecible.
- No hay norma sobre cuánto tiempo permanece una feature deprecated antes de removerse.
- Los nodos no pueden negociar versión entre sí — se quedan con la versión del momento de la integración.

Sin este proceso, declarar Servicialo como "candidato a estándar global" carece de credibilidad institucional. Los estándares maduros (W3C, IETF, MCP mismo) tienen procesos públicos auditables. Servicialo debe tener uno antes de v1.0.

**EN:** v0.9 is in production with active implementations in RU, JP, DE, US, CL. Any change to the protocol affects those implementations. Without a formal process:

- Changes are announced unilaterally from a single maintainer.
- Implementers have no predictable comment window.
- There is no norm on how long a deprecated feature remains before removal.
- Nodes cannot negotiate versions with each other — they stay frozen at the version they integrated against.

Without this process, declaring Servicialo a "candidate global standard" lacks institutional credibility. Mature standards (W3C, IETF, MCP itself) have publicly auditable processes. Servicialo must have one before v1.0.

---

## 3. Detailed Design / Diseño Detallado

### 3.1 RFC lifecycle / Ciclo de vida del RFC

```
Draft ──► Open for Comment ──► Final Comment Period ──► Accepted ──► Implemented
   │             │                      │                   │
   └─► Withdrawn │                      │                   │
                 └─► Rejected           │                   │
                                        └─► Returned        │
                                                            └─► Superseded
```

| State | Definition | Who can transition |
|-------|------------|--------------------|
| `Draft` | Author iterating, not yet ready for public comment | Author |
| `Open for Comment` | Public comment window active (minimum 4 wks for major, 2 wks for minor) | Maintainer (PR merge) |
| `Final Comment Period` | 1 wk final comment window before decision | Maintainer |
| `Accepted` | Approved, implementation may proceed | Maintainer (initially); Governance body (post-v1.0) |
| `Rejected` | Declined with rationale captured in the RFC | Maintainer |
| `Returned` | Sent back to author for revision | Maintainer |
| `Withdrawn` | Author retracts | Author |
| `Implemented` | Merged into protocol and implementation | Maintainer (after impl verified) |
| `Superseded` | Replaced by a later RFC | Maintainer (after later RFC accepted) |

### 3.2 RFC categories / Categorías

| Category | Definition | Comment window | Implementation evidence |
|----------|------------|----------------|--------------------------|
| **Major** | Breaking change, new entity, or removal | 4 wks minimum + 1 wk final | Reference impl + 1 external impl willing to commit |
| **Minor** | New OPTIONAL field, new tool, additive change | 2 wks minimum + 1 wk final | Reference impl |
| **Editorial** | Clarification, typo, example, formatting | 1 wk minimum | Not required |
| **Process** | Governance, RFC process itself, communication channels | 4 wks minimum + 1 wk final | Not applicable |

This RFC is **Process + Major** (since it gates v1.0).

### 3.3 RFC document format / Formato del documento RFC

Each RFC follows the structure of this document: / Cada RFC sigue la estructura de este documento:

1. Header table (RFC number, title, author, status, dates, target version, related)
2. Summary (ES + EN)
3. Motivation (ES + EN)
4. Detailed Design (technical content, primarily English for citability)
5. Drawbacks
6. Alternatives Considered
7. Unresolved Questions
8. Migration Path (when a breaking change is involved)

RFC files live at `/rfcs/RFC-NNN-{slug}.md` with sequential numbering. An index at `/rfcs/README.md` lists all RFCs with their state.

### 3.4 Submission workflow / Flujo de envío

```
1. Author forks repo, creates /rfcs/RFC-NNN-{slug}.md based on the template
2. Opens PR — PR title: "RFC-NNN: {title}"
3. PR gets RFC label; Discussions thread auto-created
4. Author iterates in Draft until ready
5. Maintainer marks Open for Comment → starts comment window
6. After window: Final Comment Period (1 wk)
7. Decision: Accepted, Rejected, or Returned
8. If Accepted: implementation tracked via linked GitHub issue
9. RFC marked Implemented after merge of implementation
```

**Pre-v1.0 maintainer role:** Sole maintainer (Franco Danioni) makes acceptance decisions, with comment window as the input-gathering mechanism.

**Post-v1.0 governance body role (Gap 7b):** Acceptance requires either: (i) maintainer + 1 advisor concurrence for minor/editorial; (ii) maintainer + majority of advisors for major. Process formalized when Gap 7b reaches M6 (bylaws ratified).

### 3.5 Version numbering / Numeración de versiones

Servicialo follows **Semantic Versioning 2.0.0** for the protocol. The `@servicialo/mcp-server` npm package has its own independent semver line.

| Increment | Trigger |
|-----------|---------|
| Patch (`x.y.Z`) | Editorial RFC merged. Spec text only — no behavior change. |
| Minor (`x.Y.0`) | Minor RFC merged. New OPTIONAL fields, new tools, additive changes. |
| Major (`X.0.0`) | Major RFC merged. Breaking change, REQUIRED field removal, semantic shift. |

A `pre-release` suffix (`x.y.z-rc.N`) MAY be used during the Final Comment Period of major RFCs.

### 3.6 Deprecation policy / Política de deprecation

When a feature is marked deprecated, it MUST remain functional for a minimum window before removal:

| Feature class | Minimum deprecation window |
|---------------|----------------------------|
| Tool, endpoint, field (OPTIONAL) | 2 minor versions |
| Field (REQUIRED) | 1 major version + 2 minor versions |
| Behavior change (semantic shift, no signature change) | 2 minor versions with **dual-behavior support** |
| Editorial deprecation (terminology rename) | 1 minor version |

**Deprecation signals (normative):**

1. Spec document marks the item with `> **Deprecated in v0.X.Y, removal target v0.Z.0.**` callout.
2. HTTP responses involving deprecated endpoints MUST include `Deprecation: true` and `Sunset: <date>` headers per RFC 8594.
3. MCP tool responses involving deprecated tools MUST include a `deprecation` field in the response envelope with `since`, `removal_target`, and `replacement` keys.
4. The `announce` channel publishes a deprecation notice within 7 days of the RFC acceptance.

**Removal:** A removal happens via a follow-up RFC that references the deprecating RFC. The removal RFC may be minor or major depending on the item.

### 3.7 Version coexistence / Coexistencia de versiones

Implementations MAY support multiple protocol versions simultaneously. The `registry.manifest` tool MUST return version metadata so agents can negotiate.

**Manifest fields (additive to v0.9):**

```json
{
  "protocol_version": "1.0",
  "supported_versions": ["0.9", "1.0"],
  "minimum_client_version": "0.9"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocol_version` | string (semver) | REQUIRED | Highest version the server fully implements. |
| `supported_versions` | string[] | REQUIRED | All versions the server can serve. MUST include `protocol_version`. |
| `minimum_client_version` | string (semver) | OPTIONAL | Lowest version the server will accept client requests for. Default: oldest in `supported_versions`. |

**Negotiation rules:**

1. Agents SHOULD pick the highest version in `supported_versions` they themselves implement.
2. Agents MAY indicate their requested version via a `Servicialo-Version: 1.0` request header (HTTP) or a `version` field in the actor parameter (MCP).
3. If the server cannot serve the requested version, it MUST return `HTTP 426 Upgrade Required` with a `Servicialo-Supported-Versions` response header listing acceptable versions.
4. If no header is sent, the server MUST serve `protocol_version` (the highest).

### 3.8 Communication channels / Canales de comunicación

Three public channels, each with a defined purpose:

| Channel | Purpose | Cadence |
|---------|---------|---------|
| GitHub Discussions (spec repo) | Per-RFC threads, open Q&A, design discussion | Continuous |
| `announce` repo (or RSS feed mirrored to npm release notes) | Release announcements, deprecation notices, security advisories | Per release |
| Opt-in email list (`announce@servicialo.com` or equivalent) | Critical changes only — major RFCs, security advisories, deprecation removal notices | As needed (target ≤ 6/year) |

The email list is established as a deliverable of this RFC. Subscription is opt-in only; the resolver registry stores contact emails for active implementers and offers opt-in at registration time.

### 3.9 Breaking change communication SLA / SLA de comunicación de cambios disruptivos

When an RFC becomes `Accepted` and introduces a breaking change:

| Action | Deadline |
|--------|----------|
| Spec document published with deprecation callout | 7 days |
| Announcement on GitHub Discussions + `announce` repo | 7 days |
| Email to opt-in list | 14 days |
| Direct outreach to active external nodes with public contact info | 28 days |

"Active external node" means: appears in the public resolver, has sent a heartbeat in the last 90 days, and has a registered contact email. Direct outreach is best-effort; Servicialo SpA commits to making the attempt where contact info is public, with no guarantee of delivery.

### 3.10 Formal Objections / Objeciones Formales

**ES:** Cualquier implementador activo o stakeholder PUEDE presentar una objeción formal durante la ventana de comentarios o el FCP. Las objeciones son señales públicas que pueden pausar, ajustar o retornar un RFC a Draft.

**EN:** Any active implementer or stakeholder MAY file a formal objection during the comment window or the FCP. Objections are public signals that can pause, adjust, or return an RFC to Draft.

**What constitutes a formal objection:**

A GitHub issue or PR review comment from an active implementer (organization appears in the resolver and has sent a heartbeat in the last 90 days, OR has a publicly documented Servicialo-compatible implementation) that contains:

1. **Specific impact statement.** Which system, integration, or operational practice the proposed change breaks.
2. **Estimated migration cost.** Time, money, or operational disruption — quantified or at least bounded.
3. **Proposed alternative or mitigation** (when the implementer has one). Optional but strongly encouraged.

The issue MUST be tagged `rfc-objection-NNN` where NNN is the RFC number, OR the PR review comment MUST start with `[RFC-NNN objection]`.

**Threshold for automatic pause:**

If **3 or more active implementers** file formal objections against the same RFC, the RFC automatically returns to `Draft` status for redesign. This is non-discretionary — no decision required, the threshold itself pauses the RFC.

**Below threshold — SLA for maintainer response:**

For each formal objection filed:

- The maintainer (acting for Servicialo SpA) MUST respond within **7 days** of objection filing.
- The response MUST be one of three:
  1. **Accept** — the RFC is revised to address the objection (revision happens within the same comment window or FCP is extended).
  2. **Reject with public rationale** — the maintainer explains in writing why the objection does not change the RFC. Rationale becomes part of the RFC's permanent record.
  3. **Extend FCP by 2 weeks** — additional discussion time before a decision is made.

**Pre-governance interim period (current state):**

Until the Servicialo SpA advisory committee is seated (target: pre-v1.0 sign-off — see [ROADMAP §5](../ROADMAP.md)), the dispute resolution mechanism operates with the acting maintainer as sole decision-maker, responding to formal objections within 7 days with one of the three actions above. In this interim period the maintainer's decision is unilateral with no collective override. Once the advisory committee is seated, the supermajority override below applies as the standard dispute resolution path.

**Post-governance period (after Servicialo SpA advisory committee is seated):**

- A 2/3 supermajority of the seated advisory committee MAY override the maintainer's decision on any formal objection.
- Process: any advisor opens an `override-RFC-NNN` issue; advisor votes are recorded publicly; supermajority within 14 days triggers RFC return to `Draft`.
- The maintainer does NOT vote on overrides (avoids tied-vote ambiguity).

This formal-objection mechanism applies to all RFCs regardless of category (Major, Minor, Editorial, Process), though in practice Editorial RFCs are unlikely to attract objections.

---

## 4. Drawbacks / Inconvenientes

**ES / EN (shared bullets — see §6 for unresolved governance questions):**
- **Friction increases.** Every change goes through a public process with mandatory comment windows. Quick spec fixes that today take a day will take 1+ week.
- **Maintainer burden during interim period.** Until the Servicialo SpA advisory committee is seated, the acting maintainer signs off on all RFCs. This is a single point of failure with explicit timeline ([ROADMAP §5](../ROADMAP.md)) for resolution via committee seating.
- **External implementers may not participate.** Comment windows depend on community engagement. If implementers don't comment, the maintainer makes decisions with the input that arrived — formal objections (§3.10) remain available as the corrective mechanism.
- **Backwards-compat tax.** The deprecation policy (2 minor versions minimum) constrains how quickly the protocol can clean up bad decisions.

---

## 5. Alternatives Considered / Alternativas consideradas

### 5.1 No formal process (status quo)

Keep changes happening via direct PR + CHANGELOG entries. Rejected because: contradicts the stated goal of v1.0 as a "candidate global standard". A standard without a process for its own evolution is not credible to regulators, large adopters, or third-party implementers.

### 5.2 Heavyweight IETF-style RFC process

Adopt IETF's full RFC process with shepherds, working groups, IESG-equivalent review board. Rejected for v1.0 because: requires the governance body to exist first (Gap 7b is not complete). Aim for IETF-equivalent rigor in v2.x or later, not v1.0.

### 5.3 W3C-style two-track process (WD/CR/PR/REC)

Adopt W3C-style Working Draft / Candidate Recommendation / Proposed Recommendation / Recommendation stages. Rejected for v1.0 because: overengineered for current size. The proposed Draft/Open-for-Comment/Accepted/Implemented track is functionally equivalent at smaller scale, and can evolve toward W3C-style staging when the governance body matures.

### 5.4 MCP-style draft-spec-only

Mirror MCP's "single repo, PRs against spec.md, releases tag versions" approach. Rejected for v1.0 because: MCP has Anthropic as a single steward; Servicialo aims for multi-stakeholder governance. Multi-stakeholder governance requires public comment windows that PR-only flow does not natively provide.

---

## 6. Unresolved Questions / Preguntas Abiertas

1. **Advisor decision rule once the Servicialo SpA committee is seated.** Current proposal: 2/3 supermajority to override maintainer decisions on formal objections (§3.10); majority of advisors + maintainer concurrence for acceptance of major RFCs. Bylaws drafting (ROADMAP §5 M5) finalizes this.

2. **How are normative reference implementations selected?** The protocol does not designate any single implementation as authoritative. As the network grows, the spec may want to declare a "reference impl set" — e.g., any 3+ independent implementations demonstrating conformance. Deferred to a future Process RFC.

3. **Should RFC numbers be assigned at PR open or at acceptance?** Current proposal: at PR open (sequential). Alternative: at acceptance (so rejected RFCs don't consume numbers). Cost of the current proposal is occasional gaps in numbering; benefit is stable referenceability while in draft.

4. **What is the SLA for the maintainer to respond to an RFC in `Open for Comment`?** Currently not specified. The Formal Objection SLA (§3.10) is 7 days; the general comment response SLA could mirror this or extend. Reasonable default: 2 weeks. To be added in a follow-up Editorial RFC once the realistic load is observed.

5. **What happens if the maintainer fails to meet the §3.10 SLA?** Currently unspecified. Pre-governance: implementers can escalate via public Discussion. Post-governance: advisory committee can step in. Worth formalizing once load is observed.

---

## 7. Migration Path / Camino de Migración

Esta RFC es la base — no rompe nada del comportamiento v0.9 actual. Define proceso para los siguientes cambios. / This RFC is foundational — it breaks nothing in current v0.9 behavior. It defines the process for the following changes.

**Pre-v1.0 transition (now → v1.0 acceptance):**

1. This RFC is the first to use the proposed format. Its own acceptance is dogfood.
2. RFCs 002–004 follow the same format and exercise the workflow before v1.0 ships.
3. The deprecation policy (§3.6) and version coexistence (§3.7) apply to v1.0 itself — v0.9 implementations get 2 minor versions of soft-deprecation for any breaking changes v1.0 introduces.

**At v1.0 acceptance:**

1. PROTOCOL.md §17 is rewritten to reference this RFC instead of its current short text.
2. CONTRIBUTING.md is updated to point at `/rfcs/` for the canonical process.
3. The `announce` channel goes live with v1.0 announcement as its first post.
4. The opt-in email list is created and existing implementers are invited.

**Post-v1.0 transition (v1.0 → Servicialo SpA advisory committee seated):**

1. Acceptance decisions remain with the acting maintainer during the interim period (see §3.10 and [ROADMAP §5](../ROADMAP.md)).
2. After the advisory committee is seated, the formal-objection override (2/3 supermajority of advisors, §3.10) and acceptance rules from §3.4 take effect.
3. The transition itself does NOT require a new RFC — it is anticipated in this one.

---

## 8. References / Referencias

- [Semantic Versioning 2.0.0](https://semver.org/)
- [RFC 8594 — The Sunset HTTP Header Field](https://www.rfc-editor.org/rfc/rfc8594)
- [W3C Process Document](https://www.w3.org/policies/process/)
- [Rust RFC process](https://github.com/rust-lang/rfcs) — primary inspiration for the document format
- [MCP specification](https://modelcontextprotocol.io/) — versioning patterns
- [Servicialo Roadmap v1.0](../ROADMAP.md) — §3.1 (Gap 7a), §5 (Servicialo SpA), §6 (Migration Strategy)

---

> Maintained by Servicialo SpA (Chile) under Apache-2.0 license. Foundation-mode bylaws in effect. / Mantenido por Servicialo SpA (Chile) bajo licencia Apache-2.0. Estatutos modo-fundación en vigencia.
