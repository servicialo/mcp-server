# Proof of Service

**Servicialo Protocol Extension**

| | |
|---|---|
| **Extension ID** | `proof-of-service` |
| **Maturity** | **Draft** |
| **Version** | 0.2.0 |
| **Applies to** | Servicialo Protocol ≥ 0.10 |
| **License** | Apache-2.0 |

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", "MAY", and "OPTIONAL"
in this document are to be interpreted as described in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

> **Draft status.** No wire object for Proof of Service exists today. This
> document specifies the target composite that the core protocol's existing
> objects already make derivable. Nothing here is required for protocol
> conformance.

---

## 1. Definition

A **Proof of Service** (Spanish: *Prueba de Servicio*) is the verifiable
dossier that links, for one delivery:

1. **What was agreed** — the Service Order (or offer terms) governing the
   delivery: scope, parties, price, policies.
2. **What was delivered** — the delivery record: what, who, to whom, when,
   where or through which channel, quantity, operational outcome.
3. **The available evidence** — the Evidence Events supporting claims about
   the delivery: confirmations, documents, signatures, timestamps,
   operational records, attestations by provider, beneficiary, organization
   or third parties.
4. **The settlement position** — the Settlement Events associated with the
   order or delivery: invoice, charge, payment, partial payment, refund,
   chargeback, reconciliation.

## 2. What a Proof of Service is not

These boundaries are part of the definition, not caveats:

- It does **not** declare the truth of the world. It records claims,
  evidence, attestations, and certainty levels. A dossier with strong
  evidence makes a claim *accreditable*; it does not make it infallible.
- It does **not** by itself guarantee the quality of the outcome. Quality
  judgment remains with the parties (and with whatever evidence profile they
  agreed to).
- Settlement is linked, but does not determine existence: a delivery can be
  accredited while payment is still pending, and a refund does not un-happen
  a delivery. Payment is **not** a prerequisite for accrediting a delivery.

## 3. The three dimensions of a dossier

A Proof of Service is described along three **related but independent**
dimensions. The certainty level describes what evidence supports a delivery.
Accreditation indicates whether that evidence satisfies a given policy.
Settlement records the related financial movements. None of the three is a
projection of another.

Canonical machine-readable source:
[`protocol/manifest.yaml`](https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml)
(`proof_of_service` block).

### 3.1 Certainty level — what evidence exists

The strength of the evidence behind a dossier is not binary. This extension
defines four cumulative levels:

| Level | Key | What it means |
|---|---|---|
| **L1** | `asserted` | One party asserts the delivery occurred. The claim is recorded, without corroboration yet. |
| **L2** | `bilateral` | Provider and recipient present compatible attestations of the same delivery. |
| **L3** | `operationally_supported` | Additional operational evidence exists: check-in/check-out records, actual duration, location or channel, signed documents. |
| **L4** | `financially_reconciled` | In addition, the delivery is reconciled against related financial events. |

Interpretation rules (normative):

- Levels are cumulative in **evidence**, not in truth. L4 does **not** mean
  "more true" in every context — it means additional *financial* evidence
  exists.
- A free delivery MAY reach sufficient certainty without ever reaching L4
  (there is nothing to reconcile).
- A reconciled payment does **not** by itself prove the quality or the scope
  of what was delivered.
- Implementations MUST NOT present the certainty gradient as a single linear
  scale where settlement is the terminal, superior state.

### 3.2 Dossier state — accreditation against a policy

The dossier state exists independently of the certainty level:

| State | Meaning |
|---|---|
| `draft` | The dossier is being composed: claims and evidence under collection. |
| `supported` | Recorded evidence supports the delivery; not yet evaluated against a policy. |
| `accredited` | The evidence satisfies the applicable accreditation policy. |
| `disputed` | A party disputes the delivery or its evidence. |
| `revoked` | Accreditation was withdrawn after new evidence or a resolution. |

Accreditation depends on a policy, not on a fixed level:

```text
accreditation_policy
→ evidence requirements
→ required attestations
→ minimum certainty level
→ exceptions
```

A Proof of Service MAY become `accredited` at L1, L2, L3 or L4, depending on
the context and the applicable policy. A delivery can be accredited before
payment, without payment, or without financial reconciliation, if it
satisfies the applicable evidence policy.

### 3.3 Settlement state — the financial position

The settlement position remains a separate dimension. Its states are those
of the `financial` dimension of the
[state-dimensions extension](./state-dimensions.md) (kept bit-exact):

`not_required` · `pending` · `invoiced` · `partially_paid` · `paid` ·
`refunded` · `charged_back` · `written_off`

Settlement MAY occur before, after, or never relative to the delivery. A
`refunded` or `charged_back` settlement does not regress the dossier's
certainty level — it adds settlement events to the record.

### 3.4 Presentation rule

A dossier MUST be presented together with its certainty level **and** its
dossier state. Implementations MUST NOT present a Proof of Service without
its certainty level — an interface that shows the proof while hiding the
level misrepresents the dossier. Interfaces SHOULD avoid visual encodings
that suggest settlement increases the truth of a delivery ("more payment =
more truth").

## 4. Relationship to the core protocol

Everything the dossier links already exists in the core protocol or its
extensions:

| Dossier component | Core surface |
|---|---|
| What was agreed | Service Order (`schema/service-order.schema.json`), offer terms |
| What was delivered | Session / delivery records (`delivery.checkin`, `delivery.checkout`), lifecycle milestones. Wire object: `Service` (represents one Service Delivery instance) |
| Evidence | Evidence Events (`schema/evidence/base.schema.json`, `delivery.record_evidence`, `documentation.create`) |
| Settlement | `billing.*` dimension, `payments.*` tools |
| Independent lifecycles | [state-dimensions extension](./state-dimensions.md) (draft) |

## 5. Non-normative sketch

A future wire object could look like this. This sketch is illustrative only.

```json
{
  "proof_of_service": {
    "order_ref": "ord_2f8a…",
    "delivery_ref": "ses_91c4…",
    "certainty": { "level": 3, "key": "operationally_supported" },
    "dossier": { "state": "accredited", "policy_ref": "pol_health_default" },
    "agreed":    { "scope": "…", "price": { "amount": 45000, "currency": "CLP" } },
    "delivered": { "at": "2026-07-30T15:00:00-04:00", "by": "prv_…", "to": "cli_…", "outcome": "completed" },
    "evidence":  [ { "type": "signature", "actor": "client", "at": "…" } ],
    "settlement": { "state": "invoiced", "events": [ { "type": "invoice", "at": "…" } ] }
  }
}
```

Note that the dossier is `accredited` at L3, with settlement still at
`invoiced`: accreditation preceded payment because the applicable policy was
satisfied by operational evidence.

## 6. Open questions

1. Is the dossier materialized (stored object) or derived on read from the
   event store?
2. Who signs an attestation, and with what key infrastructure?
3. How do multi-delivery orders aggregate proofs — one dossier per delivery,
   one per order, or both?
4. How are accreditation policies expressed and exchanged (a policy schema,
   or references to out-of-band agreements)?
5. Promotion criteria to `experimental`: a reference implementation exposing
   a read endpoint for the composite.

## 7. Changelog

### 0.2.0 — 2026-08-01

Draft revision. Separated the model into three independent dimensions
(certainty / dossier state / settlement) and renumbered the certainty levels.
No wire object existed at 0.1.0, so no wire compatibility is affected.

Level mapping from 0.1.0:

| 0.1.0 level | 0.2.0 level |
|---|---|
| — (new) | L1 `asserted` |
| L1 Bilateral verification | L2 `bilateral` |
| L2 On-site context | L3 `operationally_supported` |
| L3 Payer rail + L4 Settlement reconciliation | L4 `financially_reconciled` |

The 0.1.0 binary "verification state" (*verifying* / *accreditable*) was
replaced by the dossier states of §3.2 (`draft`, `supported`, `accredited`,
`disputed`, `revoked`), decoupled from the certainty level: accreditation is
policy-based and can occur at any level.

### 0.1.0 — 2026-05-20

Initial draft.

---

*Registered in [`protocol/manifest.yaml`](https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml) under `extensions`.*
