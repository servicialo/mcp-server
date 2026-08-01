# Proof of Service

**Servicialo Protocol Extension**

| | |
|---|---|
| **Extension ID** | `proof-of-service` |
| **Maturity** | **Draft** |
| **Version** | 0.1.0 |
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

## 3. Certainty gradient

The strength of a Proof of Service is not binary. This extension defines four
cumulative levels:

| Level | Name | What it adds |
|---|---|---|
| **L1** | Bilateral verification | Both parties' records agree the delivery occurred (check-in / check-out, confirmations) |
| **L2** | On-site context | Operational context recorded at delivery time (location or channel, duration, resource used) |
| **L3** | Payer rail | An independent financial rail observed a matching settlement event |
| **L4** | Settlement reconciliation | The delivery is reconciled against effective settlement over time (invoiced ↔ collected ↔ verified) |

A dossier at any level MUST be presented together with its level and its
verification state. Implementations MUST NOT present a Proof of Service
without its certainty level — an interface that shows the proof while hiding
the level misrepresents the dossier.

Two verification states apply at every level: **verifying** (evidence being
gathered or evaluated) and **accreditable** (evidence satisfies the agreed
profile for that level).

## 4. Relationship to the core protocol

Everything the dossier links already exists in the core protocol or its
extensions:

| Dossier component | Core surface |
|---|---|
| What was agreed | Service Order (`schema/service-order.schema.json`), offer terms |
| What was delivered | Session / delivery records (`delivery.checkin`, `delivery.checkout`), lifecycle milestones |
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
    "certainty": { "level": 2, "state": "accreditable" },
    "agreed":    { "scope": "…", "price": { "amount": 45000, "currency": "CLP" } },
    "delivered": { "at": "2026-07-30T15:00:00-04:00", "by": "prv_…", "to": "cli_…", "outcome": "completed" },
    "evidence":  [ { "type": "signature", "actor": "client", "at": "…" } ],
    "settlement": { "status": "invoiced", "events": [ { "type": "invoice", "at": "…" } ] }
  }
}
```

## 6. Open questions

1. Is the dossier materialized (stored object) or derived on read from the
   event store?
2. Who signs an attestation, and with what key infrastructure?
3. How do multi-delivery orders aggregate proofs — one dossier per delivery,
   one per order, or both?
4. Promotion criteria to `experimental`: a reference implementation exposing
   a read endpoint for the composite.

---

*Registered in [`protocol/manifest.yaml`](https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml) under `extensions`.*
