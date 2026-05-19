# RFC-003: Refunds & Credit Notes

| Field | Value |
|-------|-------|
| RFC number | 003 |
| Title | Refunds & Credit Notes (Forward-Only Ledger) |
| Author(s) | Servicialo SpA — Franco Danioni ([@danioni](https://github.com/danioni)), acting maintainer |
| Status | Draft |
| Created | 2026-05-17 |
| Target version | Servicialo Protocol v1.0 |
| Closes gap | Gap 5 (from v1.0 gap analysis) |
| Cohort | One of the first cohort (RFC-001/002/003/004) to pass through the process defined in RFC-001 |
| Depends on | [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) (process); [RFC-002](RFC-002-prepayment-and-credit-balance.md) (credit balance integration) |
| Related | [ROADMAP.md](../ROADMAP.md) §3.3; [RFC-004](RFC-004-pii-classification-framework.md) (classifies credit notes) |
| License | Apache-2.0 |

> **ES:** Define refunds y correcciones financieras como **credit notes forward-only**: el ledger nunca decrece, las correcciones llegan como entries adicionales. Cierra la ambigüedad de §7.4 (Dispute) y §7.6 (Partial Delivery), donde la spec actual dice "balance restored" o "adjust proportionally" sin definir cómo.
>
> **EN:** Defines refunds and financial corrections as **forward-only credit notes**: the ledger never decreases; corrections arrive as additional entries. Closes the ambiguity in §7.4 (Dispute) and §7.6 (Partial Delivery), where the current spec says "balance restored" or "adjust proportionally" without defining how.

---

## 1. Summary / Resumen

**ES:** Introducir el objeto `CreditNote` como representación normativa de un refund, una corrección parcial, o la resolución de una disputa a favor del cliente. Las credit notes son append-only y referencian el sale original. El monto neto reportable es `sales - credit_notes`. La liquidación puede ser por (a) acreditación al `CreditBalance` del cliente (RFC-002), (b) refund externo a través del payment method original, o (c) cancelación de un invoice todavía no cobrado. §7.4 y §7.6 se hacen normativos: MUST emit a credit note. El enum `billing.status` se extiende con `credited` y `partial_credit` (breaking change menor, mitigado vía negociación de versión RFC-001).

**EN:** Introduce the `CreditNote` object as the normative representation of a refund, partial correction, or client-prevails dispute resolution. Credit notes are append-only and reference the original sale. The reportable net amount is `sales - credit_notes`. Settlement may be via (a) crediting the client's `CreditBalance` (RFC-002), (b) external refund via the original payment method, or (c) cancelling an invoice that has not yet been collected. §7.4 and §7.6 become normative: MUST emit a credit note. The `billing.status` enum gains `credited` and `partial_credit` (minor breaking change, mitigated via version negotiation from RFC-001).

---

## 2. Motivation / Motivación

**ES:** v0.9 es silencioso sobre refunds de manera peligrosa. Casos donde el comportamiento debería ser determinístico pero no lo es:

- **§7.4 Dispute resolution** dice "Cancelled (client prevails, balance restored)" — `balance restored` no está definido. ¿Asiento contable de reverso? ¿CreditNote? ¿Devolución externa? Cada implementación inventa.
- **§7.6 Partial Delivery** dice "invoice SHOULD be adjusted proportionally" — `adjusted` no está definido. ¿Mutar el sale original (destruye historia)? ¿Emitir un sale negativo (rompe reports)? ¿Otro mecanismo?
- **El ledger del Service Order (§8.2.5)** define `amount_collected` como monotónicamente creciente. No hay slot para reverso. Esto rompe directamente el caso "sesión cobrada pero después devuelta".
- **Sin política clara**, un nodo con auditoría regulada (clínica con SUSESO, abogado con Colegio, plataforma sujeta a SII) no puede declarar Servicialo como source-of-truth — porque la spec no le dice cómo modelar lo que su regulador ya exige.

Un protocolo candidato a estándar global que es silencioso sobre cómo se revierte una transacción financiera no es defendible.

**EN:**
- **§7.4 Dispute resolution** says "Cancelled (client prevails, balance restored)" — `balance restored` is undefined. Reversal entry? Credit note? External refund? Every implementation invents its own.
- **§7.6 Partial Delivery** says "invoice SHOULD be adjusted proportionally" — `adjusted` is undefined. Mutate the original sale (destroys history)? Issue a negative sale (breaks reports)? Something else?
- **The Service Order ledger (§8.2.5)** defines `amount_collected` as monotonically increasing. No slot for reversal. This directly breaks the "session paid, later refunded" case.
- **Without clear policy**, a node with regulated audit (healthcare clinic, regulated legal practice, platform subject to tax authority) cannot declare Servicialo as source-of-truth — because the spec doesn't tell it how to model what its regulator already requires.

A candidate global standard that is silent on how to reverse a financial transaction is not defensible.

---

## 3. Detailed Design / Diseño detallado

### 3.1 Conceptual model / Modelo conceptual

```
Sale (original transaction, immutable)
   │
   │ amount: $100
   │ collected_at: 2026-06-01
   │
   └── CreditNote (reverses some or all of Sale)
         │ original_amount: $100
         │ credited_amount: $30 (partial)  or $100 (full)
         │ issued_at: 2026-06-15
         │
         └── Settlement (one of):
               ├── credit_balance: emit credit entry of $30 to client balance
               ├── external_refund: payment provider refund of $30
               └── invoice_cancellation: void uncollected invoice
```

**Invariants / Invariantes:**

- A `Sale` is immutable. Its `amount`, `currency`, `created_at`, etc. never change.
- A `CreditNote` is immutable. Once issued, its values never change.
- `net_collected(sale) = sale.amount − Σ(credit_notes against sale).credited_amount`
- For any sale: `Σ(credit_notes).credited_amount ≤ sale.amount`
- Settlement is recorded once per credit note. Implementations MUST NOT delete settlement.

### 3.2 CreditNote object / Objeto CreditNote

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID v4) | REQUIRED | Unique credit note identifier |
| `organization_id` | string | REQUIRED | Issuing organization |
| `client_id` | string | REQUIRED | Beneficiary client |
| `original_sale_id` | string | REQUIRED | The sale this credit note offsets |
| `original_service_id` | string | OPTIONAL | The service the sale was tied to (if any) |
| `original_amount` | object | REQUIRED | `{ value, currency }` — snapshot of original sale amount |
| `credited_amount` | object | REQUIRED | `{ value, currency }` — amount being credited. MUST satisfy `value > 0` and `value ≤ original_amount.value`. MUST match currency. |
| `type` | enum | REQUIRED | `full` (`credited_amount.value == original_amount.value`) or `partial` |
| `reason_code` | enum | REQUIRED | Standardized reason — see §3.3 |
| `reason` | string | OPTIONAL | Human-readable explanation |
| `settlement` | object | REQUIRED | Settlement details — see §3.5 |
| `tax_document_id` | string | OPTIONAL | Reference to the corresponding cancellation tax document (CFDI cancelado, NF-e cancelada, etc.) — populated in v1.1 |
| `issued_at` | datetime | REQUIRED | When the credit note was issued. ISO 8601. |
| `issued_by` | string | REQUIRED | Who issued: provider ID, organization admin ID, agent ID, or `system` |
| `audit_id` | string | OPTIONAL | Reference to an audit entry (§10.6) when issued by an agent |
| `idempotency_key` | string | OPTIONAL | Server MUST treat duplicate keys as same credit note |
| `metadata` | object | OPTIONAL | Implementation-specific |

### 3.3 Reason codes / Códigos de razón

Standardized reasons, enable cross-impl reporting and benchmarking:

| Code | Definition | Example |
|------|------------|---------|
| `dispute_won` | Client prevailed in §7.4 quality dispute | Clinical session disputed, client wins |
| `partial_delivery` | §7.6 partial delivery — service truncated | 60-min session ended at 30 min for valid reason |
| `provider_error` | Service was delivered but with material defects | Wrong procedure performed, organization refunds proactively |
| `client_cancellation_refundable` | Pre-delivery cancellation within refundable window per cancellation policy | Cancellation 48h before session |
| `client_no_show_refunded` | Edge case where org chooses to refund a no-show | Goodwill gesture |
| `adjustment` | Manual administrative correction | Pricing error, tax recalc |
| `goodwill` | Organization-discretionary credit | Customer-satisfaction gesture |
| `other` | Implementation-defined; MUST include `reason` text |

Implementations MAY define `x-` prefixed codes for vertical-specific reasons.

### 3.4 Type: full vs partial / Tipo: total vs parcial

| Type | Constraint | Effect on Sale status |
|------|------------|-----------------------|
| `full` | `credited_amount.value == original_amount.value` | Sale `billing.status` transitions to `credited` |
| `partial` | `0 < credited_amount.value < original_amount.value` | Sale `billing.status` transitions to `partial_credit`. Multiple partial credit notes may accumulate; if cumulative reaches the full amount, status transitions to `credited`. |

### 3.5 Settlement / Liquidación

Every credit note MUST declare how it is settled:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `settlement.method` | enum | REQUIRED | `credit_balance` \| `external_refund` \| `invoice_cancellation` \| `manual` |
| `settlement.credit_balance_entry_id` | string | Conditional | REQUIRED when `method == credit_balance`. Links to a `CreditBalanceEntry` (RFC-002) of type `credit`, source `refund`. |
| `settlement.external_refund_id` | string | Conditional | REQUIRED when `method == external_refund`. Implementation-specific external reference (e.g., Stripe refund ID). |
| `settlement.settled_at` | datetime | OPTIONAL | When settlement occurred. For `external_refund`, MAY be after `issued_at`. |
| `settlement.notes` | string | OPTIONAL | Free-text explanation, especially for `manual` |

**Method semantics:**

| Method | When to use | Effect |
|--------|-------------|--------|
| `credit_balance` | Default for refundable cancellation, partial delivery, voluntary org adjustments. Client retains the credit against future services. | RFC-002 entry created. `CreditBalance` increases by `credited_amount`. |
| `external_refund` | When the client requested money back (not credit) and the organization complied. | Implementation initiates external refund. Out-of-protocol mechanism, but the `external_refund_id` is recorded. |
| `invoice_cancellation` | When the original sale is `invoiced` but not yet `collected` — the invoice itself is voided. | No money movement. Sale moves to `cancelled` (billing track) without ever reaching `collected`. |
| `manual` | Implementations that handle refunds outside the protocol (rare). Audit-only. | No protocol-driven money movement. Implementation MUST log via §10.6. |

### 3.6 Effect on §7.4 (Dispute) / Efecto en §7.4

§7.4 is updated to read (normative):

> When a quality dispute resolves in favor of the client, the implementation MUST emit a credit note (RFC-003) with:
> - `reason_code: dispute_won`
> - `original_sale_id` = the sale of the disputed service
> - `credited_amount` = the full sale amount (default) or a partial amount if both parties agree
> - `settlement.method` = `credit_balance` (default) or `external_refund` (if the client requested money back)
>
> The Service lifecycle transitions to `cancelled` with exception `dispute`. The billing track transitions to `credited` (full) or `partial_credit` (partial).

When the dispute resolves in favor of the provider, no credit note is issued; the service flows to `verified` per the current §7.4 happy path.

### 3.7 Effect on §7.6 (Partial Delivery) / Efecto en §7.6

§7.6 is updated to read (normative):

> When a service is partially delivered (`in_progress` → `partial`), the implementation MUST emit a credit note (RFC-003) for the undelivered portion:
> - `reason_code: partial_delivery`
> - `original_sale_id` = the sale of the partial service
> - `credited_amount` = the proportion not delivered, computed from the partial-delivery evidence (§7.6 already requires documenting what was delivered)
> - `settlement.method` = per organization policy
>
> The Service lifecycle remains in `partial`. The billing track transitions to `partial_credit`.

### 3.8 Effect on §8.2.5 (Service Order ledger) / Efecto en §8.2.5

The ledger gains one new field (additive):

| Field (new) | Type | Description |
|-------------|------|-------------|
| `amount_credited` | number | Total amount across all credit notes issued against this order's sales. Computed, read-only, monotonically non-decreasing. |

Computed semantics:

```
amount_consumed_net  = amount_consumed - amount_credited
amount_collected_net = amount_collected - amount_credited (subject to settlement.method)
```

For backward-compatible reporting:

- `amount_billed`, `amount_collected`, `amount_consumed` remain monotonically non-decreasing (per the original spec).
- `amount_credited` is the new dimension; net values are derived by subtraction.
- v0.9 clients ignore `amount_credited` per §15.5 (forward-compat).

### 3.9 billing.status enum extension / Extensión del enum

| New value | When applied |
|-----------|--------------|
| `credited` | A full credit note was issued, sale is fully reversed |
| `partial_credit` | One or more partial credit notes issued, cumulative not yet equal to original amount |

**Breaking change classification:** Minor breaking — v0.9 clients with strict enum validators may reject these values. Mitigation:

1. Implementations MUST emit the new values only when the client has indicated v1.0 support via version negotiation (RFC-001 §3.7).
2. When serving a v0.9 client, the implementation MUST map: `credited` → emit `disputed` (the closest v0.9 terminal state) or `paid` depending on the dispute outcome; `partial_credit` → emit `paid` with a `Servicialo-Deprecated-Behavior: partial_credit_collapsed_to_paid` response header.

### 3.10 Tools / Herramientas

| Tool | Description | Scopes |
|------|-------------|--------|
| `payments.create_credit_note` | Create a credit note against a sale. Inputs: `sale_id`, `credited_amount`, `reason_code`, `reason`, `settlement.method` and required sub-fields, optional `idempotency_key`. | `payment:write` |
| `payments.list_credit_notes` | List credit notes with filters: `client_id`, `organization_id`, `sale_id`, `reason_code`, `date_range`. Paginated. | `payment:read` |
| `payments.get_credit_note` | Retrieve a single credit note by ID. | `payment:read` |
| `payments.cancel_credit_note` | Mark a credit note as cancelled. Only allowed if `settlement.method == invoice_cancellation` AND the underlying sale has not been re-collected. **All other credit notes are immutable**; if cancellation is needed, issue a counter credit note (anti-credit). | `payment:write` + `mandate:admin` for non-trivial cases |

`payments.cancel_credit_note` exists only for the narrow `invoice_cancellation` undo case. For all other corrections, **issue a new credit note** with `reason_code: adjustment` and direction explained in `reason`.

### 3.11 Manifest declaration / Declaración en manifest

Implementations MUST declare credit note support:

```json
{
  "capabilities": {
    "credit_notes": {
      "supported": true,
      "settlement_methods": ["credit_balance", "external_refund", "invoice_cancellation"],
      "partial_refunds": true
    }
  }
}
```

v1.0 conformance requires `credit_notes.supported: true` for any implementation that processes payments. Implementations that do not process payments (read-only catalogs, discovery-only nodes) MAY return `false`.

### 3.12 JSON Schema / Schema JSON

A new file `schema/credit-note.schema.json` defines the `CreditNote` object. The `schema/service.schema.json` is updated:

- `billing.status` enum extended with `credited` and `partial_credit`.
- A new optional field `billing.credit_note_ids: string[]` references credit notes against the sale.

`schema/service-order.schema.json` is updated:

- `ledger.amount_credited` added as a computed read-only field.

### 3.13 Audit / Auditoría

Every credit note creation MUST produce an audit entry per §10.6 with:

- `action: "payments.create_credit_note"`
- `resource_id: <credit_note_id>`
- `action_input` includes sanitized fields (`sale_id`, `credited_amount`, `reason_code`)
- For agents: `mandate_id` REQUIRED in metadata

Cancelling a credit note (the narrow case) requires a separate audit entry.

### 3.14 Idempotency / Idempotencia

`payments.create_credit_note` MUST accept `idempotency_key`. If absent, the server SHOULD derive one from `(sale_id, credited_amount.value, reason_code, issued_at_minute)`. Duplicate keys return the existing credit note with `idempotent: true` marker.

### 3.15 Edge cases / Casos límite

| Case | Behavior |
|------|----------|
| Multiple partial credit notes summing to the full amount | Last partial credit note transitions `billing.status` to `credited` from `partial_credit`. Sum is enforced ≤ original. |
| Credit note against an already-credited sale | REJECTED with `409 Conflict`, error code `sale_already_fully_credited`. |
| Credit note exceeds the sale amount | REJECTED with `400 Bad Request`, error code `credit_exceeds_original`. |
| Service was settled via Credit Balance (RFC-002), now being refunded | `settlement.method = credit_balance` adds a credit entry back to balance with source `refund`. The original consumption debit entry is NOT reversed (forward-only). |
| Credit note in a different currency than the sale | REJECTED with `400 Bad Request`. Credit notes MUST match sale currency. |
| Service Order ledger consistency after credit note | `amount_credited` increments. `amount_consumed_net` and `amount_collected_net` derived. Quantity-limit and hours-limit checks in §8.2.5 SHOULD use net values per implementation policy (this is left to implementations because it depends on whether the partial delivery counts against quota). |

---

## 4. Drawbacks / Inconvenientes

**ES:**
- **Two records per refund.** Reports need to compute net by joining sales with credit notes. Operationally heavier than mutating a single sale.
- **Implementation complexity.** Every implementation must handle three settlement methods correctly. Getting `external_refund` wrong (e.g., emitting the credit note before the external refund clears) causes audit divergence.
- **Tax document linkage.** The `tax_document_id` field is forward-compatible with v1.1 multi-currency + tax framework, but in v1.0 it sits empty for jurisdictions that already require cancellation docs (e.g., México CFDI cancelaciones). Implementations doing v1.0 in México have to handle this out-of-band until v1.1.
- **Enum extension breakage.** Some v0.9 clients with strict enum validators may reject `credited` / `partial_credit`. Mitigation via version negotiation works but requires implementer discipline.

**EN:** Same as above.

---

## 5. Alternatives Considered / Alternativas consideradas

### 5.1 Reversal entries (ledger decreases) — REJECTED

Add a `reversal` flag to sales and allow `amount_collected` to decrease. Simpler reports.

**Rejected because:**
- Breaks event-sourcing — the same event field can mean different things over time.
- Audit confusion: regulators (SUSESO, SII, SAT, IRS) generally require reversals to be separate documents, not mutations.
- Incompatible with tax document linkage in v1.1 (cancellation CFDI is a separate document).

### 5.2 Negative-amount sales — REJECTED

Issue a new sale with `amount: -50` that offsets the original `amount: 50`.

**Rejected because:**
- Reports need to filter on sign, every implementation invents the convention.
- Schema says `value: number, minimum: 0` — flipping this requires changing the core sale schema, breaking change everywhere.
- The `Sale` semantic is "a charge to the client" — a negative charge is semantically odd.

### 5.3 Mutate the sale status to "refunded" — REJECTED

Just set `billing.status = refunded` and record the refund amount in a new field on the sale itself.

**Rejected because:**
- Destroys history of what was originally charged vs. what was credited.
- Cannot represent partial refunds without a sub-collection on the sale, which is just the credit-note pattern with a different name.
- Audit-unfriendly — the immutability invariant on sales is intentional.

### 5.4 Use the existing CreditBalance entries (RFC-002) directly — REJECTED

Skip the CreditNote object entirely; just emit a credit entry on the client's balance for any refund.

**Rejected because:**
- Loses the linkage to the original sale (`original_sale_id`).
- Cannot represent `external_refund` cleanly (the money left the org, no balance entry needed).
- Cannot represent `invoice_cancellation` (no money moved at all).
- Reporting "how much did we refund this quarter and why" becomes impossible without a dedicated object.

The CreditNote object integrates with the CreditBalance (one of three settlement methods) but is a distinct concern.

---

## 6. Unresolved Questions / Preguntas Abiertas

1. **Tax document linkage.** The `tax_document_id` field is a forward placeholder for v1.1. Should v1.0 prescribe that the field MAY exist as opaque string, or should it wait until v1.1 defines structure? **Current proposal:** define as optional opaque string in v1.0; v1.1 RFC defines the actual tax doc model. Implementations that need it (México, Brasil) populate the field with their internal tax doc reference today.

2. **Should `amount_credited` on the Order ledger be split by settlement method?** E.g., `amount_credited_to_balance`, `amount_refunded_externally`, `amount_invoice_cancelled`. **Current proposal:** NO for v1.0 — derivable from joining credit_notes. Add splits in v1.x if reporting demand emerges.

3. **Authorization model for refunds.** Currently `payment:write` is required. Should there be a higher bar for refunds above a threshold (e.g., `require_confirmation_above` constraint from §10.3.3 applied to credit notes)? **Current proposal:** YES, the existing `require_confirmation_above` constraint applies — agents with mandates capped at $X cannot issue credit notes > $X. This works without spec changes because mandate validation already covers it.

4. **Should the underlying Service lifecycle transition when a full credit note is issued?** E.g., should a fully-credited Service automatically transition to `cancelled`? **Current proposal:** NO automatic transition. The Service lifecycle (delivery) and billing track (money) are intentionally decoupled (Principle 6). A fully-credited Service that was actually delivered stays in `documented` or `verified`; only the billing track changes. Org reports the financial reversal independently.

5. **Cross-currency credit notes (e.g., refund in different currency).** **Current proposal:** NOT supported in v1.0. Credit note currency MUST match sale currency. Cross-currency reserved for v1.1 multi-currency RFC.

6. **Mapping to jurisdiction-specific cancellation tax documents.** CFDI 4.0 (México) defines 4 cancellation motivos (01 errors with relation, 02 errors without relation, 03 operation not performed, 04 nominative related to global invoice) that do not map 1:1 to our `reason_code` enum. NF-e (Brasil) distinguishes 24-hour-window cancellation from devolução (return) which is a different document type. v1.1 tax framework will need mapping tables per jurisdiction. **Mitigation strategy if N:M relationships emerge:** `tax_document_id` stays singular in v1.0; if v1.1 evidence shows N:M need (one credit note generating multiple tax docs, or multiple consolidating into one), the field can be promoted to array (`tax_document_ids: string[]`) as an additive, non-breaking change at minor version. v1.0 implementations continue to populate `tax_document_id`; v1.1 implementations treat it as the first element of an array if present. The `reason_code` enum may also need extension (additive, non-breaking) as jurisdictional specifics emerge.

7. **Time-window constraints on cancellation vs return.** Some jurisdictions (notably BR NF-e) have hard time windows after which cancellation becomes a different document type. v1.0 does not model this — implementations enforce internally. Should v1.0 add an `original_sale_age_hours` constraint helper, or leave entirely to implementations? Current proposal: leave to implementations; revisit if multiple v1.0 adopters in BR/jurisdictions with similar rules request a protocol-level helper.

---

## 7. Migration Path / Camino de Migración

### 7.1 Backward compatibility / Compatibilidad hacia atrás

| Change | Impact |
|--------|--------|
| New CreditNote object | Additive, no backward-compat issue |
| New tools | Additive, no backward-compat issue |
| `billing.status` enum extension (`credited`, `partial_credit`) | **Minor breaking** — mitigated via version negotiation per RFC-001. Servers MUST map new values to v0.9-compatible values when serving v0.9 clients. |
| §7.4 and §7.6 prose update to normative MUST | Tightens previously ambiguous behavior. v0.9 implementations that did nothing are not non-conformant retroactively; conformance to v1.0 requires the new behavior. |
| New `amount_credited` ledger field | Additive, no backward-compat issue |

### 7.2 v0.9 implementer impact / Impacto en implementadores v0.9

An implementation currently on v0.9 has three paths:

1. **Stay on v0.9.** No action required. The `registry.manifest` declares `protocol_version: "0.9"` and `supported_versions: ["0.9"]`. Agents negotiating v1.0 receive `HTTP 426 Upgrade Required` and fall back to v0.9 semantics.

2. **Implement v1.0 fully.** Adopt credit notes, update billing.status handling, declare `supported_versions: ["0.9", "1.0"]`. Agents pick the highest mutually-supported version.

3. **Implement v1.0 partially with credit_notes disabled.** Declare `protocol_version: "1.0"`, `capabilities.credit_notes.supported: false`. This is permitted for read-only or discovery-only nodes. Implementations processing payments MUST implement credit notes for v1.0 conformance.

### 7.3 Deprecations / Deprecations

This RFC deprecates:

- **Undefined behavior in §7.4** ("balance restored") — soft-deprecated, replaced by normative credit note flow.
- **Undefined behavior in §7.6** ("adjusted proportionally") — soft-deprecated, replaced by normative credit note flow.

No tools or fields are removed.

### 7.4 Implementation downstream

Reference implementations adopting this RFC manage their own downstream roadmaps (database schema, dispute resolution flow, external refund integrations, admin UI, tests). Servicialo SpA does not prescribe or coordinate implementer roadmaps; the protocol surface defined in this RFC is what conformance is measured against.

---

## 8. References / Referencias

- [PROTOCOL.md §7.4](../PROTOCOL.md) — Current dispute resolution (to be updated)
- [PROTOCOL.md §7.6](../PROTOCOL.md) — Current partial delivery (to be updated)
- [PROTOCOL.md §8.2.5](../PROTOCOL.md) — Service Order ledger
- [PROTOCOL.md §10.6](../PROTOCOL.md) — Audit model
- [PROTOCOL.md §15.5](../PROTOCOL.md) — Backward compatibility
- [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) — Version negotiation rules
- [RFC-002](RFC-002-prepayment-and-credit-balance.md) — Credit Balance (settlement target)
- [RFC-004](RFC-004-pii-classification-framework.md) — PII framework (classifies credit notes)
- [Stripe Refunds API](https://stripe.com/docs/refunds) — Industry reference for refund/credit-note semantics
- [Servicialo Roadmap v1.0](../ROADMAP.md) §3.3

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../GOVERNANCE.md).
