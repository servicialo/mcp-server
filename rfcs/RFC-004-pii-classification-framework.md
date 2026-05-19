# RFC-004: PII Classification Framework

| Field | Value |
|-------|-------|
| RFC number | 004 |
| Title | PII / PHI Classification Framework (Entity-level Sensitivity) |
| Author(s) | Servicialo SpA — Franco Danioni ([@danioni](https://github.com/danioni)), acting maintainer |
| Status | Draft |
| Created | 2026-05-17 |
| Target version | Servicialo Protocol v1.0 |
| Closes gap | Gap 3 (from v1.0 gap analysis) |
| Cohort | One of the first cohort (RFC-001/002/003/004) to pass through the process defined in RFC-001 |
| Depends on | [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) (process) |
| Related | [ROADMAP.md](../ROADMAP.md) §3.4, §8 (§13.5 hotfix prerequisite); [RFC-002](RFC-002-prepayment-and-credit-balance.md) (classifies CreditBalance entries); [RFC-003](RFC-003-refunds-and-credit-notes.md) (classifies CreditNote documents) |
| License | Apache-2.0 |

> **ES:** Extiende el modelo de sensibilidad de datos existente en §9.8 (hoy solo aplica a evidence) a las entidades core: Client, Provider, Audit, Submission context. Define defaults por vertical y promueve las obligaciones MUST de `restricted` a todos los datos clasificados así, no solo evidence. **NO incluye** Data Subject Rights API (export/delete/rectify) — eso queda reservado para un RFC separado en v1.x.
>
> **EN:** Extends the existing data sensitivity model from §9.8 (today only for evidence) to core entities: Client, Provider, Audit, Submission context. Defines per-vertical defaults and promotes the `restricted` MUST obligations to apply to all data so classified, not only evidence. **Does NOT include** a Data Subject Rights API (export/delete/rectify) — reserved for a separate v1.x RFC.

---

## 1. Summary / Resumen

**ES:** Renombrar §9.8 a "Data Sensitivity Classification" (de "Evidence Sensitivity Classification") y expandirla para clasificar datos en todas las entidades del protocolo. Los cuatro niveles (`public | internal | confidential | restricted`) se mantienen sin cambio. Las defaults por entidad y vertical se definen normativamente. Las obligaciones MUST de `restricted` (encryption-at-rest, per-access audit, retention, DPA) aplican a cualquier dato clasificado así, no solo a evidence. Schemas se anotan con `x-sensitivity` para clasificación machine-readable. **Prerequisite no-bloqueante:** el hotfix de §13.5 (deprecar `?email=` clear-text por `?email_hash=`) ship antes de v1.0 como patch de seguridad de v0.9.x.

**EN:** Rename §9.8 to "Data Sensitivity Classification" (from "Evidence Sensitivity Classification") and expand it to classify data across all protocol entities. The four levels (`public | internal | confidential | restricted`) remain unchanged. Per-entity and per-vertical defaults are defined normatively. The `restricted` MUST obligations (encryption-at-rest, per-access audit, retention, DPA) apply to any data so classified, not only to evidence. Schemas gain `x-sensitivity` annotations for machine-readable classification. **Non-blocking prerequisite:** the §13.5 hotfix (deprecate `?email=` clear-text in favor of `?email_hash=`) ships before v1.0 as a v0.9.x security patch.

---

## 2. Motivation / Motivación

**ES:** v0.9 §9.8 estableció el marco para evidencia sensible, pero los datos PII fluyen por todo el protocolo, no solo en `proof.evidence[]`:

- `client.id`, `client.payer_id`, los emails / teléfonos / nombres que las implementaciones inevitablemente almacenan
- `provider.credentials` (números de licencia profesional, jurisdicción de licencia)
- `audit.action_input` puede contener parámetros sensibles
- `submission.agent_id` + `submission.platform` revelan identidad operacional
- `§13.5 Bookings Lookup ?email=` expone email clear-text en URL pública sin autenticación

Sin clasificación uniforme:
1. **Implementadores no saben qué proteger** — la spec dice "encrypt clinical_record" pero no dice nada sobre el nombre del paciente que está al lado.
2. **Reguladores no aceptan la spec como base de cumplimiento** — HIPAA, LGPD, GDPR, Ley 20.584 (Chile) requieren clasificación de datos por sensibilidad, y nuestro silencio en entidades core es legalmente inaceptable.
3. **La capa de Network Intelligence (§14) es legalmente imposible operar** — ¿qué datos pueden aparecer en benchmarks agregados anónimos? Sin clasificación, cualquier dato es teóricamente público y eso choca con la realidad regulatoria.

Sin cerrar este gap, Servicialo no puede defender candidatura de estándar global ante reguladores en ninguna jurisdicción seria.

**EN:**
- `client.id`, `client.payer_id`, emails / phones / names that implementations inevitably store
- `provider.credentials` (professional license numbers, license jurisdictions)
- `audit.action_input` may contain sensitive parameters
- `submission.agent_id` + `submission.platform` reveal operational identity
- `§13.5 Bookings Lookup ?email=` exposes clear-text email in a public unauthenticated URL

Without uniform classification:
1. **Implementers don't know what to protect** — the spec says "encrypt clinical_record" but says nothing about the patient name right next to it.
2. **Regulators won't accept the spec as a compliance basis** — HIPAA, LGPD, GDPR, Ley 20.584 (Chile) all require data classification by sensitivity, and our silence on core entities is legally unacceptable.
3. **The Network Intelligence layer (§14) is legally impossible to operate** — what data may appear in aggregate anonymous benchmarks? Without classification, anything is theoretically public, which clashes with regulatory reality.

Closing this gap is required for Servicialo to defend global-standard candidacy before regulators in any serious jurisdiction.

---

## 3. Detailed Design / Diseño detallado

### 3.1 Section rename / Renombrar sección

§9.8 in PROTOCOL.md is renamed:

| Current | New |
|---------|-----|
| "Evidence Sensitivity Classification" | "Data Sensitivity Classification" |

The section is restructured: first the universal taxonomy + obligations, then per-entity defaults, then per-vertical overrides. The existing evidence table is preserved as one of several entity tables.

### 3.2 Taxonomy (unchanged from v0.9) / Taxonomía

| Level | Definition | Implementation obligations |
|-------|-----------|----------------------------|
| `public` | No restrictions. Indexable, broadcastable, exportable. | No special handling. |
| `internal` | Default for operational data. Accessible to authorized parties (provider + platform). | Standard access control — only parties to the service may access. |
| `confidential` | Business-sensitive or personally identifiable. | Implementations SHOULD encrypt at rest and limit access to named roles. |
| `restricted` | Subject to regulatory requirements. Clinical, legal, financial-identifying data. | Implementations MUST provide: encryption at rest (AES-256 or equivalent), per-access audit logging, retention policy aligned with applicable regulations, and a Data Processing Agreement (DPA) with any sub-processors. |

The four levels are unchanged. Only the scope of application changes.

### 3.3 MUST obligations of restricted / Obligaciones MUST de restricted

Promoted from "evidence-only" to "any data classified as restricted":

1. **Encryption at rest.** AES-256 or equivalent, applied to the field/payload, not just to disk.
2. **Per-access audit logging.** Each access (read or write) MUST produce an audit entry (§10.6) with: accessor identity, timestamp, accessor IP if available, fields accessed (field-level granularity preferred; entity-level minimum).
3. **Retention policy.** Documented retention period aligned with the applicable jurisdiction(s) for that data type. The protocol does not prescribe specific durations but MUST require that one exists.
4. **Data Processing Agreement (DPA).** Implementations sub-processing `restricted` data via third parties MUST have a written DPA with each sub-processor.

These four obligations apply universally to any field at level `restricted`. v0.9 implementations that handled only `restricted` evidence become non-conformant against v1.0 if they hold any non-evidence `restricted` data without these protections.

### 3.4 Schema annotations / Anotaciones en schemas

Every JSON Schema field gains an optional annotation:

```json
{
  "client": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "x-sensitivity": "internal"
      },
      "name": {
        "type": "string",
        "x-sensitivity": "confidential"
      },
      "payer_id": {
        "type": "string",
        "x-sensitivity": "internal"
      }
    },
    "x-sensitivity-default": "confidential"
  }
}
```

Rules:

| Annotation | Scope | Precedence |
|------------|-------|------------|
| `x-sensitivity` | Field-level | Overrides entity-level default |
| `x-sensitivity-default` | Object-level | Applies to all sub-fields not individually annotated |
| Vertical override | Per (entity, vertical) tuple | Overrides field-level if vertical applicable to the service context |

A field WITHOUT explicit `x-sensitivity` inherits the object's `x-sensitivity-default`. If neither is set, the field is classified as `internal` (the protocol-wide fallback).

### 3.5 Default classifications by entity / Clasificaciones default por entidad

#### 3.5.1 Client (§5.3)

| Field | Default | Notes |
|-------|---------|-------|
| `client.id` | `internal` | Identifier, org-scoped |
| `client.payer_id` | `internal` | Identifier, org-scoped |
| (impl-defined) `client.name` | `confidential` | Always confidential minimum |
| (impl-defined) `client.email` | `confidential` | Always confidential minimum |
| (impl-defined) `client.phone` | `confidential` | Always confidential minimum |
| (impl-defined) `client.tax_id` | `confidential` minimum | May be `restricted` per jurisdiction |

The protocol-defined Client schema (§5.3) only has `id` and `payer_id`. Most implementations attach name/email/phone — the protocol does not require it but DOES classify those fields if they exist.

#### 3.5.2 Provider (§5.2 and §12)

| Field | Default | Notes |
|-------|---------|-------|
| `provider.id` | `public` when org has discoverability enabled; `internal` otherwise |
| `provider.organization_id` | `public` |
| `provider.credentials[]` | `confidential` | License numbers, certs |
| `provider.trust_score` | `public` |
| `ProviderAttribute.value` | varies by attribute key | See §3.5.5 |

ProviderAttribute classifications:

| Category | Default |
|----------|---------|
| `identity` (profession, specialty, bio) | `public` |
| `identity.license_number` | `confidential` |
| `capability` | `public` |
| `availability` | `public` for current-state, `internal` for historical |
| `geography` | `public` for service area, `confidential` for exact home address if `home_visit` |
| `economic` | `public` for ranges, `confidential` for exact rates |
| `trust` | `public` |

#### 3.5.3 Audit (§10.6)

| Field | Default | Notes |
|-------|---------|-------|
| `audit_id` | `internal` |
| `mandate_id` | `internal` |
| `principal_id` | `internal` |
| `agent_id` | `internal` |
| `action` | `internal` |
| `action_input` (sanitized) | `confidential` | May reference clinical records — see §3.5.6 |
| `failure_reason` | `confidential` | May reveal sensitive context |
| `ip_address` | `confidential` |

`action_input` MAY be classified `restricted` if it references a restricted resource (e.g., `delivery.record_evidence` for clinical_record). Implementations MUST propagate the maximum sensitivity of referenced fields.

#### 3.5.4 Submission context (§13.2.2)

| Field | Default | Notes |
|-------|---------|-------|
| `channel` | `public` |
| `submitted_by_type` | `public` |
| `agent_id` | `internal` |
| `agent_name` | `internal` |
| `platform` | `internal` |

#### 3.5.5 Evidence (§5.7, unchanged from v0.9 §9.8)

Existing table from §9.8 preserved exactly. No changes to evidence classification.

#### 3.5.6 ServiceMandate (§10.3)

| Field | Default |
|-------|---------|
| `mandate_id` | `internal` |
| `principal_id` | `internal` |
| `agent_id` | `internal` |
| `scopes` | `internal` |
| `constraints` | `confidential` (may reveal financial threshold) |
| `signature` | `confidential` |

#### 3.5.7 CreditBalance + CreditBalanceEntry (RFC-002)

The objects defined in RFC-002 inherit classification per this RFC:

| Object / field | Default |
|----------------|---------|
| `CreditBalance.client_id`, `organization_id`, `currency` | `internal` |
| `CreditBalance.balance` | `confidential` (reveals client financial position with the org) |
| `CreditBalanceEntry.id`, `client_id`, `organization_id`, `currency`, `type`, `source` | `internal` |
| `CreditBalanceEntry.amount` | `confidential` |
| `CreditBalanceEntry.payment_id` (external payment reference) | `confidential` |
| `CreditBalanceEntry.idempotency_key` | `internal` |
| `CreditBalanceEntry.metadata` | inherits max sensitivity of contents (default `internal`) |

Per-vertical overrides for health/legal apply to the underlying Client identity (§3.6); CreditBalance objects themselves do not have vertical-specific overrides beyond what their referenced Client carries.

#### 3.5.8 CreditNote (RFC-003)

The CreditNote object defined in RFC-003 inherits classification per this RFC:

| Field | Default |
|-------|---------|
| `id`, `organization_id`, `client_id`, `original_sale_id`, `original_service_id` | `internal` |
| `original_amount`, `credited_amount` | `confidential` |
| `type`, `reason_code` | `internal` |
| `reason` (free-text) | `confidential` (may reveal clinical/legal context in some verticals) |
| `settlement.method`, `settlement.settled_at` | `internal` |
| `settlement.external_refund_id`, `settlement.credit_balance_entry_id` | `confidential` |
| `tax_document_id` | `confidential` (links to fiscal documents) |
| `issued_at`, `issued_by`, `audit_id` | `internal` |

For credit notes against services in health, legal, or education verticals, the `reason` field MUST be classified as `restricted` if it contains clinical, legal, or minor-related information. Implementations are responsible for detecting this at write time or applying a vertical-uniform restricted classification.

### 3.6 Per-vertical overrides / Overrides por vertical

When a Service has `vertical: <vertical>`, the following overrides apply to its associated Client / Provider / Audit data:

| Vertical | Field | Override |
|----------|-------|----------|
| Health | `client.id` | `confidential` |
| Health | `client.payer_id` (insurance) | `confidential` |
| Health | (impl) `client.name`, `client.email`, `client.phone` | `restricted` (was `confidential` minimum) |
| Health | `audit.action_input` for evidence:write involving `clinical_record` | `restricted` |
| Legal | `client.id` | `confidential` |
| Legal | (impl) `client.name`, `client.email`, `client.phone` | `restricted` |
| Legal | `audit.action_input` for evidence:write involving `meeting_minutes` | `restricted` |
| Education | (impl) minor `client.id`, `client.name` (age < 18) | `restricted` |
| Education | (impl) `client.email` | `confidential` (minimum) |
| Consulting | `client.id` | `confidential` (B2B clients) |
| Consulting | `audit.action_input` for evidence:write involving `committee_minutes` | `restricted` |
| Home | (no vertical-specific override beyond defaults) | — |

Vertical overrides upgrade sensitivity; they NEVER downgrade. If a field is `confidential` by default and the vertical assigns `internal`, the result remains `confidential` (max wins).

### 3.7 Public-tier exposure rules / Reglas de exposición en tier público

Tier 0 (Resolver) and Tier 1 (Discovery) tools — the unauthenticated public surface — MUST NOT return fields classified above `public`. Specifically:

- `registry.search`, `registry.get_organization`, `services.list`, `scheduling.check_availability`, `a2a.get_agent_card`, `resolve.lookup`, `resolve.search`, `trust.get_score` — all results MUST be filtered to `public`-only fields at the field level.
- Implementations MUST NOT leak `confidential` or `restricted` data through pagination, error messages, or trace IDs.
- `registry.manifest` returns metadata only; if it includes operational stats, those MUST be aggregated and free of `confidential`/`restricted` data.

Implementations MAY further restrict (e.g., make `provider.trust_score` `internal` if the org disables public trust scores).

### 3.8 §13.5 Bookings Lookup hotfix integration / Integración del hotfix §13.5

The §13.5 hotfix that replaces `?email=` with `?email_hash=` ships **before** this RFC lands (as a v0.9.x security patch). This RFC formalizes the lookup as a `public`-tier operation that MUST NOT accept `confidential` PII as a query parameter.

Normative change to §13.5 in v1.0:

> Public bookings lookup MUST accept ONLY hashed identifiers (`email_hash`, `phone_hash`) as query parameters. Clear-text identifiers MUST be rejected with `HTTP 400 Bad Request`. Hashes MUST be computed as `sha256(lowercase(trim(value)))` and represented as lowercase hex.

After the hotfix, the canonical hash format is normative; v1.0 reinforces it as part of the broader PII framework.

### 3.9 Out of scope for v1.0 / Fuera de alcance para v1.0

Reserved for future RFCs (v1.x):

- **Data Subject Rights API** — `data_subject.request_export`, `data_subject.request_deletion`, `data_subject.rectify` tools. Required for GDPR Articles 15-20, LGPD Articles 18-22. Separate RFC because the design touches identity portability (Gap 6 / v1.1).
- **Consent management** — opt-in / opt-out tracking, lawful basis recording per GDPR. Separate RFC.
- **Cross-border data transfer controls** — Standard Contractual Clauses, adequacy decisions, transfer impact assessments. Separate RFC.
- **Anonymization protocols for Network Intelligence telemetry (§14)** — k-anonymity thresholds, differential privacy parameters. Separate RFC tied to Network Intelligence activation.
- **Pseudonymization standards** — how `email_hash` interacts with re-identification risk. Mentioned but not normatively prescribed.
- **Breach notification protocol.** HIPAA §164.404 (US), GDPR Articles 33-34 (EU), LGPD Article 48 (BR) all define breach notification timelines (60 days HIPAA, 72 hours GDPR, ANPD reporting LGPD). A future RFC will define: breach severity classification, notification recipients (regulators, data subjects, downstream sub-processors), notification template, and minimum SLAs. v1.0 implementations subject to these regulations MUST implement notification processes out-of-band.
- **Minimum-necessary access (HIPAA §164.502(b)) and equivalent role-based limitations.** The protocol provides scopes (§10.3.2) and constraints (§10.3.3) sufficient to enforce minimum-necessary access, but does NOT prescribe specific role taxonomies or vertical-specific role profiles. A future RFC may add standardized clinical role profiles.
- **Designated privacy officer / DPO requirement (GDPR Article 37, HIPAA §164.530(a)).** This is an organizational role rather than a protocol object. Out of scope unless a future RFC defines an `OrgRole` taxonomy.
- **Workforce training requirements.** Organizational policy, not a protocol concern. Implementers in regulated industries handle this independently.

> **Note on conformance vs. regulatory compliance:** Implementations subject to specific regulatory frameworks (HIPAA covered entities, GDPR controllers, LGPD operators, NOM-024 sujetos obligados) MUST implement the out-of-scope items above through their own processes until the corresponding RFCs land. **v1.0 conformance does NOT imply HIPAA / GDPR / LGPD compliance** — it provides the protocol-level building blocks (classification, encryption, audit, retention, DPA) on which compliance can be built.

### 3.10 Audit completeness / Completitud de auditoría

For `restricted` data:

- Each access (read AND write) MUST produce an audit entry.
- The audit entry MUST identify the field(s) accessed at minimum, the entity at minimum.
- The audit log itself MUST be append-only (§10.6.2 rule 1) and MUST be classified at least at the sensitivity of the highest field it references.
- Audit entries describing access to `restricted` data are themselves at least `confidential` (so they're not bulk-exportable via Tier 1).

---

## 4. Drawbacks / Inconvenientes

**ES:**
- **Operational cost.** Per-access audit logging for `restricted` data adds infrastructure cost (storage, query, retention). Small implementations may find compliance expensive.
- **No DSR API in v1.0.** Implementations subject to GDPR Article 15-20 or LGPD Article 18-22 are NOT v1.0-complete from a compliance perspective; they must implement DSR out-of-band. This is a known v1.0 limitation, with a clear plan to close it in v1.x.
- **Schema annotation tax.** Adding `x-sensitivity` to every field across schemas inflates the spec surface. Mitigated by `x-sensitivity-default` at the object level.
- **Vertical overrides complexity.** The matrix of (entity × vertical × field) overrides can become unwieldy. We're starting with a minimal set and will expand via RFCs as patterns emerge.

**EN:** Same as above.

---

## 5. Alternatives Considered / Alternativas consideradas

### 5.1 Entity-level classification only (rejected)

Assign a single sensitivity level to each entity type (e.g., "all Client data is `confidential`"). Simpler matrix.

**Rejected because:** loses precision. A Client object has fields ranging from public (`id` when published) to restricted (`email` in health vertical). Entity-level uniformity either over-protects (treating `id` as restricted) or under-protects (treating `email` as internal). Field-level annotation with object-level defaults gives both ease-of-use and precision.

### 5.2 Adopt an external standard (rejected for v1.0)

Adopt ISO/IEC 27018, NIST SP 800-122, or HL7 FHIR data sensitivity classifications wholesale.

**Rejected for v1.0 because:** none of these match the protocol's vertical-agnostic scope. FHIR is health-only; ISO 27018 is cloud-PII-only; NIST SP 800-122 is US-federal. The four-level Servicialo taxonomy is intentionally lighter and cross-vertical. v1.x may add mappings TO these standards for compliance reporting, but not adoption AS.

### 5.3 Data Subject Rights API in v1.0 (rejected)

Include `data_subject.*` tools for export / delete / rectify in v1.0 to claim GDPR / LGPD readiness.

**Rejected because:** DSR design depends on cross-node identity portability (Gap 6 / v1.1 / TBD). A data export must follow the data subject across all nodes where their identity exists. Doing DSR before identity portability produces a half-solution that has to be re-designed when Gap 6 lands. Better to ship classification first (v1.0) and DSR after identity portability (v1.x).

### 5.4 No protocol prescription, leave to implementations (rejected)

Let each implementation handle PII per its local regulation, no normative spec.

**Rejected because:** kills cross-implementation interoperability for Network Intelligence (§14), kills regulatory acceptance as a standard, and makes the "candidate global standard" claim hollow.

---

## 6. Unresolved Questions / Preguntas Abiertas

1. **Should `x-sensitivity` annotations be machine-actionable or human-only?** Current proposal: machine-readable (JSON Schema annotations) so tools/agents can verify exposure. Risk: agents that don't recognize `x-` prefixes ignore them; serializers may strip them. Mitigation: document the canonical location and require v1.0 conformance tooling to honor the annotations.

2. **Hash algorithm for identifier lookup.** Current proposal: SHA-256 of lowercase trimmed value. Should the protocol prescribe a salt? **Current:** NO salt — the protocol uses a public hash so any client can compute the same hash without coordination. Risk: rainbow table attacks. Mitigation: lookups are rate-limited (already in §13.0.3); the use case is "find my booking by email I already know", not "enumerate emails".

3. **How does sensitivity interact with the §10.6 audit log itself?** Audit logs reference resources by ID, may include sanitized inputs. **Current proposal:** audit entries inherit max sensitivity of referenced fields. Concrete edge case: an audit entry for `delivery.record_evidence` on a clinical record is `restricted`. The audit log table thus contains `restricted` rows that themselves must be encrypted/audited. Is this recursion ergonomic? Implementations report back.

4. **Per-field encryption vs full-row encryption.** Current proposal: spec says "encryption at rest" without prescribing granularity. Implementations may encrypt rows wholesale (simpler) or per-field (more complex, but allows decryption only of needed fields per access). Recommendation: leave to implementations; v1.x may add granularity guidance.

5. **Vertical override matrix maintenance.** As new verticals are added or existing verticals' regulatory landscape evolves, the override matrix changes. Should the matrix live in a normative table within PROTOCOL.md (visible diffs in PRs) or in a separate `schema/sensitivity-overrides.json` machine-readable file? **Current proposal:** both. Normative prose in PROTOCOL.md §9.8, machine-readable mirror in `schema/sensitivity-overrides.json` for tooling.

---

## 7. Migration Path / Camino de migración

### 7.1 Backward compatibility / Compatibilidad

| Change | Impact |
|--------|--------|
| §9.8 rename to "Data Sensitivity Classification" | Editorial — no behavior change |
| Promotion of `restricted` MUST obligations to all data | **Behavior change for non-conformant implementations** — v0.9 impls that classified non-evidence data as `restricted` without obligations become non-conformant against v1.0 |
| `x-sensitivity` schema annotations | Additive — v0.9 clients ignore unknown annotations |
| `x-sensitivity-default` object-level annotation | Additive |
| Tier 0/Tier 1 filtering rules | Tightening — non-conformant v0.9 impls that leaked `confidential` fields via public tools become non-conformant against v1.0 |
| §13.5 normative hash-only lookup | Already deprecated via hotfix in v0.9.x; v1.0 removes clear-text path |

### 7.2 Pre-v1.0 hotfix / Hotfix pre-v1.0

The §13.5 hotfix is **standalone** and ships as part of v0.9.x:

- Implementations add `?email_hash=` and `?phone_hash=` support.
- Implementations keep `?email=` working for one v0.9.x patch cycle (e.g., v0.9.10 ships both; v0.9.11 starts emitting `Deprecation` and `Sunset` headers; v1.0 rejects).
- Operators who control external nodes are notified via the v0.9.x release notes + `announce` channel.

Tracked by a separate GitHub issue (`hotfix-deprecate-email-lookup-13.5`), not blocked by this RFC.

### 7.3 v0.9 implementer impact / Impacto en v0.9

An implementation currently on v0.9 has three paths:

1. **Stay on v0.9.** No action required. The §9.8 framework only applies to evidence.

2. **Implement v1.0 fully.** Audit existing data exposure. Add encryption/audit/retention/DPA for any field newly classified `restricted` (most commonly: clinical names/emails in health, client names/emails in legal). Add `x-sensitivity` annotations to extended schemas. Update Tier 0/1 endpoints to filter.

3. **Implement v1.0 with limited verticals.** An implementation that only handles `home` services has minimal new obligations (home vertical has no override beyond defaults). Implementations in health or legal carry the full burden.

A migration checklist is appended in §7.4.

### 7.4 Migration checklist / Lista de migración

For implementations claiming v1.0 conformance:

- [ ] Review all stored fields against the default classification table (§3.5).
- [ ] Apply per-vertical overrides for services with health/legal/education verticals (§3.6).
- [ ] Verify encryption at rest for all `restricted` fields, not just evidence.
- [ ] Implement per-access audit logging for `restricted` fields (extend §10.6).
- [ ] Document a retention policy covering each `restricted` field type.
- [ ] Establish DPAs with sub-processors handling `restricted` data.
- [ ] Update Tier 0 / Tier 1 endpoints to filter at the field level.
- [ ] Update `registry.manifest` to declare `pii_classification: "v1.0"` capability.
- [ ] Migrate any `?email=` callers to `?email_hash=` (already required by hotfix).

### 7.5 Implementation downstream

Reference implementations adopting this RFC manage their own downstream roadmaps (audit data classification, encryption at rest, per-access audit logging, retention automation, DPA template and sub-processor outreach, Tier 0/1 endpoint filtering audits, tests). Servicialo SpA does not prescribe or coordinate implementer roadmaps; the protocol surface defined in this RFC is what conformance is measured against.

---

## 8. References / Referencias

- [PROTOCOL.md §9.8](../PROTOCOL.md) — Current Evidence Sensitivity Classification
- [PROTOCOL.md §10.6](../PROTOCOL.md) — Audit Model (extended by this RFC)
- [PROTOCOL.md §13.5](../PROTOCOL.md) — Bookings Lookup (hotfix prerequisite)
- [RFC-002](RFC-002-prepayment-and-credit-balance.md) — CreditBalance objects classified by this RFC
- [RFC-003](RFC-003-refunds-and-credit-notes.md) — CreditNote objects classified by this RFC
- [HIPAA Privacy Rule (US)](https://www.hhs.gov/hipaa/for-professionals/privacy/index.html)
- [LGPD (Brazil), Law 13.709/2018](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [GDPR (EU), Regulation 2016/679](https://gdpr-info.eu/)
- [Ley 19.628 (Chile)](https://www.bcn.cl/leychile/navegar?idNorma=141599) — Protección de Datos Personales
- [Ley 20.584 (Chile)](https://www.bcn.cl/leychile/navegar?idNorma=1039348) — Derechos y deberes en atención de salud
- [NOM-024 (México)](https://dof.gob.mx/nota_detalle.php?codigo=5280848) — Sistemas de información del expediente clínico electrónico
- [Servicialo Roadmap v1.0](../ROADMAP.md) §3.4, §8 (hotfix)

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../GOVERNANCE.md).
