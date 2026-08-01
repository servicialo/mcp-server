# State Dimensions

**Servicialo Protocol Extension**

| | |
|---|---|
| **Extension ID** | `state-dimensions` |
| **Maturity** | **Draft** |
| **Version** | 0.1.0 |
| **Applies to** | Servicialo Protocol ≥ 0.10 |
| **License** | Apache-2.0 |

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

> **Draft status.** This extension is a design proposal. Nothing here is
> required for protocol conformance. The wire enums of the core protocol
> (`schema/service.schema.json`) are unchanged by this document.

---

## 1. Motivation

The core lifecycle enum projects four orthogonal concerns onto a single
sequence:

```
requested → scheduled → confirmed → in_progress → completed → documented
                                     → invoiced → collected → verified
```

That sequence is an accurate description of the most common operational path —
an appointment that is booked, delivered, documented, billed, collected and
verified, in that order. It is **not** an accurate description of every real
coordination. Real services include prepayment, free services, monthly
invoicing, multiple deliveries under one order, partial charges, milestone
payments, acceptance before payment, payers distinct from beneficiaries,
refunds, chargebacks, and failed or partial deliveries.

In all of those cases the linear sequence breaks — not because the states are
wrong, but because **delivery, evidence, acceptance and settlement are
different dimensions with independent lifecycles**.

The core protocol already acknowledges this: PROTOCOL.md §6.0 states that no
total order exists across dimensions, and the `billing.*` dimension already
carries its own status track. This extension formalizes the full orthogonal
projection.

## 2. The Five Dimensions

Each dimension is an independent state machine. Ordering constraints exist
only **within** a dimension, never across dimensions.

### 2.1 `fulfillment` — did the delivery happen?

| State | Meaning |
|---|---|
| `requested` | Delivery asked for, not yet planned |
| `planned` | Intent to deliver exists (no concrete slot yet) |
| `scheduled` | Concrete slot / window assigned |
| `confirmed` | Both parties confirmed the commitment |
| `in_progress` | Delivery is underway |
| `completed` | Delivery finished as agreed |
| `partial` | Delivery finished, but incomplete relative to the agreement |
| `failed` | Delivery attempted and failed |
| `cancelled` | Commitment cancelled before delivery |
| `no_show` | A required party did not appear |

### 2.2 `evidence` — what supports the claims about the delivery?

| State | Meaning |
|---|---|
| `missing` | No evidence recorded |
| `submitted` | Evidence recorded, not yet evaluated |
| `sufficient` | Evidence satisfies the agreed evidence profile |
| `attested` | One or more parties (or third parties) attested to the evidence |
| `insufficient` | Evidence evaluated and found lacking |
| `contested` | A party disputes the evidence |
| `resolved` | A contest was resolved (by agreement or arbitration) |

### 2.3 `acceptance` — did the recipient accept the delivery?

| State | Meaning |
|---|---|
| `pending` | Acceptance not yet given |
| `accepted` | Explicitly accepted |
| `auto_accepted` | Accepted by expiry of the review window |
| `disputed` | Acceptance refused / under dispute |

### 2.4 `financial` — what is the settlement position?

| State | Meaning |
|---|---|
| `not_required` | No settlement applies (free / internal service) |
| `pending` | Settlement expected, not yet invoiced |
| `invoiced` | Invoice or charge issued |
| `partially_paid` | Partial payment received |
| `paid` | Fully paid |
| `refunded` | Payment returned |
| `charged_back` | Payment reversed by the payer's rail |
| `written_off` | Settlement abandoned |

### 2.5 `order` — the Service Order that governs the deliveries

| State | Meaning |
|---|---|
| `draft` | Being composed |
| `proposed` | Sent to counterparty |
| `accepted` | Agreed by all parties |
| `active` | In force; deliveries may occur under it |
| `paused` | Temporarily suspended |
| `completed` | Fulfilled and closed |
| `cancelled` | Terminated before completion |
| `expired` | Validity window passed |

## 3. The No-Total-Order Rule

Implementations adopting this extension **MUST NOT** assume a total order
across the `fulfillment`, `evidence`, `acceptance` and `financial` dimensions.
Ordering constraints exist only within each dimension.

Consequences (normative for adopters):

- A delivery MAY be `completed` while `financial` is `not_required`,
  `pending`, or already `paid` (prepayment).
- Evidence MAY reach `sufficient` before or after settlement.
- `acceptance` MAY resolve before invoicing (acceptance before payment).
- The settlement position never determines the existence of the delivery:
  `financial: refunded` does not imply `fulfillment` regresses.

An implementation MAY present a linear experience to its users.
Interoperability is evaluated per dimension.

## 4. Mapping from the Core Wire Enums

This extension is a **projection**, not a replacement. The core enums remain
the wire encoding.

### 4.1 `lifecycle.current_state` → dimensions

| Core state | fulfillment | evidence | acceptance | financial |
|---|---|---|---|---|
| `requested` | requested | missing | pending | pending \| not_required |
| `scheduled` | scheduled | missing | pending | any |
| `confirmed` | confirmed | missing | pending | any |
| `in_progress` | in_progress | missing \| submitted | pending | any |
| `completed` | completed | missing \| submitted | pending | any |
| `documented` | completed | submitted \| sufficient | pending | any |
| `invoiced` | completed | sufficient | pending \| accepted | invoiced |
| `collected` | completed | sufficient | pending \| accepted | paid \| partially_paid |
| `verified` | completed | attested | accepted \| auto_accepted | paid |
| `cancelled` | cancelled | any | any | any |
| `disputed` | any | contested | disputed | any |
| `reassigning` | requested \| planned | any | any | any |
| `rescheduling` | planned | any | any | any |
| `partial` | partial | any | any | any |

The mapping shows why the core sequence is a *happy path*: each successive
milestone bundles progress across several dimensions at once. The bundling is
convenient; it is not semantics.

### 4.2 `billing.status` → `financial`

| `billing.status` | `financial` |
|---|---|
| `pending` | pending |
| `charged` | invoiced |
| `invoiced` | invoiced |
| `paid` | paid |
| `disputed` | (acceptance: disputed; financial unchanged) |

### 4.3 Service Order → `order`

The core Service Order enum (`draft`, `proposed`, `negotiating`, `active`,
`paused`, `completed`, `cancelled`) maps directly; `negotiating` is subsumed
by the `proposed` ↔ `accepted` handshake, and `accepted` / `expired` are new
distinctions this extension introduces.

## 5. Wire Compatibility

This extension is additive. Adopting implementations MAY include an optional
`x-state-dimensions` object in `lifecycle.get_state` responses:

```json
{
  "current_state": "documented",
  "x-state-dimensions": {
    "fulfillment": "completed",
    "evidence": "sufficient",
    "acceptance": "pending",
    "financial": "pending"
  }
}
```

Consumers that do not understand the field MUST ignore it. The core
`current_state` remains authoritative for core-only consumers.

## 6. Open Questions

1. Should `evidence` distinguish *who* attested (provider / beneficiary /
   third party), or is that the Evidence Profiles extension's concern?
2. Does `acceptance` need a `waived` state for services where the recipient
   never reviews (e.g. machine-to-machine deliveries)?
3. Should multi-delivery orders aggregate dimension states, or expose one
   tuple per delivery only?
4. Promotion criteria to `experimental`: at least one implementation
   populating `x-state-dimensions` in production.

---

*Registered in [`protocol/manifest.yaml`](https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml) under `extensions`.*
