# Proof of Service

**Servicialo Protocol Extension**

| | |
|---|---|
| **Extension ID** | `proof-of-service` |
| **Maturity** | **Draft** |
| **Version** | 0.3.0 |
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
| Third-party access | Proof Consumer grant (§5) — no core surface yet |

## 5. The Proof Consumer

A **Proof Consumer** (Spanish: *Consumidor de Prueba*; in other standards, a
*relying party*) is a party that reads a Proof of Service it did not participate
in producing, in order to make its own decision — and, often, to move its own
money.

Two everyday examples, both from real coordinations:

- A health insurer reimburses a patient who paid out of pocket, weeks after the
  fact, if the dossier satisfies the insurer's policy. The insurer never contracted
  with the provider.
- An acquirer or PSP evaluates a provider's dossier during the representment of a
  card chargeback.

Neither is the Payer. The protocol's client/payer separation (`PROTOCOL.md` §5.3,
Principle 3) covers "the employer pays" — a payer inside the Order. A Proof
Consumer is outside it entirely: it has no Order with anyone in the coordination,
takes on no obligation, and may never appear in the record except as the holder of
a grant.

### 5.1 What a Proof Consumer is not

- **Not a Payer.** It does not settle the Order. Money it moves flows on its own
  rail, to whichever party it owes — in the insurer case, to the patient, not to
  the provider.
- **Not a party to the Order.** It cannot accept, dispute, confirm, or transition
  anything. Reading is the whole of its capability.
- **Not required to be a node.** A Proof Consumer may be an insurer's claims
  system, a bank analyst, or a person with a link. The protocol MUST NOT require a
  relying party to implement it in order to read a dossier — requiring the reader
  to be a node would defeat the purpose of having a portable proof.

### 5.2 Access: the grant

A Proof of Service is not public. Access by a Proof Consumer is by **explicit
grant**, with four properties, all REQUIRED:

| Property | Requirement |
|---|---|
| **Explicit** | Access MUST be granted by an affirmative act. There is no implied access, and no access by possession of an identifier. |
| **Scoped** | A grant MUST name what it reaches: which dossier or dossiers, and which redaction profile (§5.3) applies to the reader. |
| **Time-bounded** | A grant MUST carry an expiry. An access right with no end is not a grant, it is publication. |
| **Revocable** | The granting party MUST be able to revoke before expiry, and revocation MUST take effect immediately. |

Every access under a grant SHOULD produce an audit record readable by the granting
party. A grant whose use is invisible to the person who issued it is a weak
instrument.

#### Who grants

The Order's policy designates the granting party. **The default is the client** —
the beneficiary of the service — on the principle that the record of a service is
the recipient's to show. An Order MAY designate otherwise (a payer-granted policy
is reasonable in employer-funded arrangements), but silence means the client.

This is deliberately the same shape as the acceptance-authority question the
protocol has open elsewhere: who, on the receiving side, holds a given right. A
period where the two are answered inconsistently would be worse than either
answer, so the default here is stated as a default, not as a constant.

#### The client floor (normative)

A default that an Order can override is not protection. Without a floor, an Order
could name the organization sole grantor and leave the beneficiary unable to show
their own record — so the floor is a MUST, in three clauses:

1. **The client MAY always grant access to a dossier concerning them**, whatever
   the Order's policy says. This right is over a *view*: the grant is subject to
   the applicable redaction profile exactly as any other grant is (§5.3). The
   floor confers the power to show, not a bypass of redaction.
2. **The client MUST be able to enumerate every grant over that dossier**, current
   and historical, whoever issued it — with its scope, issuer, expiry and status.
   Access transparency is as much a floor as the power to grant: knowing who was
   shown your record is not a lesser right than showing it.
3. **The floor does NOT confer revocation over grants issued by others.**
   Revocation follows the issuer (§5.2). A client can always grant and can always
   see; a client cannot cancel a grant that the Order's designated grantor issued.

Clause 3 is the load-bearing one and the least obvious. If the floor read "the
client controls access to their record", the adverse client of §5.6.2 would revoke
the provider's defence grant and the representment would die exactly as it does
without any of this. The floor is **affirmative power plus full visibility, with
no veto over another grantor's grants** — which is a narrower right than control,
and the only version of it that survives the case where the parties disagree.

Two notes on the shape of the floor:

- **Why it is a floor and not a preference.** Data-protection regimes generally
  recognise a data subject's right of access to, and portability of, records
  concerning them independently of any contract between other parties. An Order
  that could strip that would be arguing with the law as well as with the ethics.
  The adoption path needs it too: "the client presents the dossier to their payer"
  — the entire premise of §5.6.1 — presupposes client agency. Without a floor
  that agency is a concession the organization can withdraw.
- **The floor belongs to the client, and only to the client.** In a coordination
  where beneficiary, payer and mandatary are different parties, the payer's access
  comes from the Order's policy and the mandatary's from a mandate under the
  Delegated Agency Model. Neither gets it from this floor. The floor tracks who the
  record is *about*, which is a different question from who pays for it or who acts
  on someone's behalf.

#### The mechanism is not specified, and composes with the Mandate

This document specifies the **properties** of a grant, not its encoding. An
implementation MAY express a grant as a signed token, a database record, a
capability URL, or a row in an access-control list — the protocol requires only
that the four properties above hold and are auditable. This mirrors the stance the
Delegated Agency Model already takes for mandates: *"It does not prescribe storage,
transport, or cryptographic mechanisms."*

The natural composition is with the **ServiceMandate** (`PROTOCOL.md` §10), which
already provides scoped, expiring, revocable, deny-by-default delegation with an
append-only audit model, and already supports an Order-level boundary through
`context: order:so_abc123`. A grant to a Proof Consumer is recognizably a mandate
with a read-only scope, issued by the client rather than by the organization.

What a grant needs from that model, and does not have today:

- A **read scope for the dossier** — no existing scope in §10.3.2 means "read this
  Proof of Service and nothing else". `document:read` and `service:read` are both
  too wide, and both are framed as capabilities inside an organization.
- A **principal type for the client-as-grantor**. `principal_type` is
  `professional | patient | organization`; `acting_for` likewise. A relying party
  acts for itself, which none of the three describes.
- **Third-party holders.** §10's model assumes the agent serves one of the parties.
  A Proof Consumer serves its own interest, which is exactly why the conflict-of-
  interest rule (§10.5 rule 4) is not the right instrument here and a read-only
  grant is.

> **Implementation note (non-normative).** A signed-token encoding — for instance
> a JWS carrying dossier reference, redaction profile, expiry and issuer — is one
> candidate mechanism, and has been identified as such in the reference
> implementation's own verifiability review. It is a candidate, not a
> requirement, and no such mechanism is deployed at the time of writing. Nothing
> in this section depends on it.

### 5.3 What a Proof Consumer sees: the redacted view

A Proof Consumer receives a **redacted view** of the dossier, never the dossier
itself. The default view answers four questions and no others:

| Question | Field |
|---|---|
| Was it delivered? | The delivery record's outcome, with its certainty level and dossier state (§3.4 applies here in full) |
| When? | The delivery's time or window |
| On whose authority? | Which parties attested, by role — not by identity |
| For how much? | The amount, and the settlement position |

**Zero PII by default.** The redacted view MUST NOT include clinical, legal or
otherwise private content, and MUST NOT include personal identifiers of the
beneficiary or the provider unless the applicable redaction profile explicitly
admits them. "The delivery was attested by the beneficiary" is inside the default
view; who the beneficiary is, is not.

This is the point of the whole construction. An insurer needs to know that a
physiotherapy session happened, when, and for how much. It does not need the
clinical note, and a protocol that hands one over because the other was requested
has failed at the only job the redacted view has.

Two rules follow:

- The `data_sensitivity` classification of the underlying evidence
  (`PROTOCOL.md` §9.8) is evaluated **per accessor**. Evidence classified
  `restricted` MUST NOT be reachable through a grant unless the redaction profile
  names it and the granting party's affirmative act covered it.
- A redacted view MUST carry its certainty level and dossier state, per §3.4.
  Presenting a redacted proof without them is the failure §3.4 already prohibits,
  and it is more tempting here — a relying party asking a yes/no question is
  exactly who a bare "verified" badge would mislead.

Which fields a vertical admits, and under which profile, is not decided here.
See §5.5.

### 5.4 Recording what the Proof Consumer did

When a Proof Consumer acts on a dossier — reimburses a patient, resolves a
representment — the protocol **MAY** record it. It is not a MUST, and this is a
deliberate limit: the relying party is not a participant, is frequently not a node,
and cannot be placed under an obligation by a protocol it never adopted.

Two routes, both valid:

- **(a) A settlement event referencing the Proof of Service.** Used where the
  relying party, or a node acting for it, records the movement. This is a
  settlement between parties that share no Order, which the Settlement extension
  does not currently describe (§5.5).
- **(b) Evidence attached by the client.** The patient uploads the insurer's
  remittance advice against their own dossier. Nothing new is required: it is an
  Evidence Event of type `document`.

Route (b) is expected to be the common one for a long time, and the model should
not treat it as second-class.

#### Why a third party's payment is strong evidence — and of what

There is a temptation to read "a third party paid against this dossier" as the top
of the certainty gradient. **That reading is wrong, and §3.1 already forbids it**:
levels are cumulative in evidence, not in truth, and implementations MUST NOT
present the gradient as a linear scale where settlement is the superior terminal
state.

The strength is real but it is not about the money. What makes a Proof Consumer's
payment significant is that **an independent party, with an interest adverse to
paying, evaluated the dossier under its own policy and acted on it.** An insurer
that reimburses has audited the record against rules the provider did not write and
could not relax. That is corroboration of a specific and limited kind: evidence
that the dossier satisfied an *external* accreditation policy.

So it is recorded for what it is — an attestation by a third party (`attested`, in
the evidence dimension of the
[state-dimensions extension](./state-dimensions.md)), optionally accompanied by a
settlement event that contributes to `financially_reconciled` in the ordinary way.
**It introduces no new certainty level and MUST NOT be encoded as one.** The
existing four are sufficient, and adding a fifth for "someone else paid" would
rebuild the exact linear-scale error §3.1 exists to prevent.

> **Dependency, stated rather than assumed.** This recording is **not expressible
> today**. The evidence envelope's `actor.type` is
> `provider | client | system | agent`, so an insurer's attestation has no
> representable actor and would have to be recorded as one of the parties — which
> is precisely the misattribution this subsection exists to avoid. The third-party
> attestation described here therefore lands **together with** the Evidence
> Profiles change in §5.5 item 2, not before it. That item also closes the
> beneficiary/payer distinction from the other direction; the two are the same
> hole seen from two sides and are to be closed once, in one change, rather than
> in two passes that would each widen `actor.type` differently.

Stated plainly for implementers: a dossier that an insurer reimbursed against is
not *more true* than one it did not. It is a dossier that has survived an
adversarial reading, which is a different and often more useful thing to be able
to show.

### 5.5 What this section asks of other extensions

This section deliberately specifies no field. It states a role, an access model and
a view, and it creates concrete requirements for three neighbours.

**Of [Evidence Profiles](https://github.com/servicialo/mcp-server/blob/main/schema/evidence/base.schema.json):**

1. **Redaction profiles per vertical.** Evidence Profiles already defines what
   valid evidence *is* for a vertical. The redacted view needs the complement:
   which evidence types, and which fields within them, are visible to a Proof
   Consumer under a named profile. A health profile admits "session occurred,
   45 minutes, attested by beneficiary"; it does not admit `clinical_record`, which
   §9.8 classifies `restricted`.
2. **Attestation authority, extended to third parties.** The evidence envelope's
   `actor.type` is `provider | client | system | agent`. A Proof Consumer's
   attestation has no representable actor. This is the same gap that the
   beneficiary/payer distinction opens from the other direction, and it should be
   closed once, for both.

**Of the Settlement extension:**

3. **A settlement event that references a Proof of Service.** Route (a) above needs
   a settlement whose counterparties do not share an Order, anchored to a dossier
   rather than to an Order. Nothing in the current model expresses this.
4. **Origin attribution.** A movement recorded by or for a relying party did not
   originate with a party to the Order. The dossier's settlement dimension cannot
   distinguish it from an ordinary payment today, which matters most in the case
   where the third party's action is adverse — a chargeback (§5.6.2).

**Of the [Delegated Agency Model](https://github.com/servicialo/mcp-server/blob/main/spec/delegated-agency-model.md):**

5. **A dossier read scope, and a grantor role for the client.** Both named in §5.2.
   A grant is a mandate shape the model does not currently have a vocabulary for.

### 5.6 Examples

Non-normative.

#### 5.6.1 The insurer who reimburses the patient

A physiotherapy centre publishes "45-minute session". A patient contracts ten
sessions and pays out of pocket after each one. Weeks later they present the record
to their insurer, which reimburses 60% **to the patient**, if the evidence
satisfies the insurer's policy. The insurer never contracts with the centre.

| Element | Modelling |
|---|---|
| Offer | The session |
| Order | Patient ↔ centre. In that bilateral relationship, client = payer = patient |
| Deliveries | Ten sessions, `kind: occurrence` |
| Evidence | Bilateral confirmation plus on-site context |
| Settlement | Ten charges, paid |
| Insurer | **Proof Consumer.** Not a Payer, not a party, not necessarily a node |

The flow:

1. The patient — the client, and the default granting party under §5.2 — issues a
   grant to the insurer, scoped to the ten dossiers of this Order, under the health
   redaction profile, expiring in 90 days.
2. The insurer reads ten redacted views: session occurred, date, duration, attested
   by beneficiary and provider, amount, settlement `paid`. **No clinical record, no
   diagnosis, no identifiers beyond what the profile admits.**
3. The insurer evaluates against its own policy and reimburses the patient on its
   own rail. The protocol moves no money and is not asked to.
4. The reimbursement is recorded — or not. Under route (b) the patient attaches the
   remittance advice as a `document` Evidence Event. Under route (a) a node acting
   for the insurer records a settlement referencing the dossier.
5. The grant expires. If the patient revokes earlier, access stops immediately.

What the protocol contributed: the patient could show ten dossiers instead of ten
receipts, and could show them without handing over their clinical file.

#### 5.6.2 The chargeback representment

A wedding package: event coverage plus a physical album, prepaid in full by card.
The coverage is delivered impeccably and confirmed by the client. The album never
arrives. The client charges back **the total** through the card rail. The provider
contests it.

The acquirer or PSP evaluating the representment is a Proof Consumer, and this case
inverts the first one in three ways worth stating.

**The grant may not come from the client.** The default of §5.2 assumes a
cooperative beneficiary. Here the client initiated the reversal. The provider needs
to present the coverage dossier and the client is unlikely to grant access to it.
This is precisely why §5.2 makes the granting party a **policy of the Order** rather
than a constant: a provider that will one day defend a representment needs the
Order to have said so in advance. An Order that is silent leaves the provider
holding evidence it cannot show — and discovering that during a chargeback is
discovering it too late.

It is also why clause 3 of the client floor is written as it is. The floor gives
the client an affirmative power to grant and full visibility of every grant, and
deliberately stops short of a veto: were it otherwise, the client here would revoke
the provider's defence grant and this case would fail for the same reason it fails
with no grant model at all. The client sees that the grant exists, and cannot
cancel it.

**The dossier's job is to disaggregate.** One Order, two deliveries. The coverage
delivery reads: fulfilment `completed`, evidence recorded, acceptance `accepted` —
by the client, before the reversal — and settlement reversed. The album delivery
reads: never delivered, disputed. Four dimensions saying different things about the
same Order, all true at once. A single-state model cannot express it; this one can,
and the representment is exactly the audience that needs it disaggregated.

**The third party's act is adverse.** The insurer paid; the acquirer may not. The
same neutrality applies in both directions: the dossier records that an independent
party evaluated it, and the outcome, without the protocol taking a position on who
was right. A dossier that could only record favourable third-party outcomes would
be worthless as evidence, because everyone would know it.

Two things this example needs that do not exist yet, both listed in §5.5: a
settlement position that distinguishes a reversal nobody in the Order consented to
from a refund the provider issued, and a declared allocation of an Order-level
amount across its deliveries — without which the coverage dossier can only report
that the whole Order was reversed, which is materially misleading about the
delivery it describes.

### 5.7 Privacy and abuse considerations

- **A grant is not a licence to redistribute.** Access is granted to a reader, for
  a purpose, for a period. Onward disclosure by the Proof Consumer is outside the
  protocol's control and MUST NOT be presented as prevented by it. What the
  protocol can offer is minimisation — the redacted view — and the record of who
  was granted what.
- **Correlation across grants.** A relying party holding many grants from many
  clients accumulates a view no single grantor consented to. Redaction profiles
  bound each view; they do not bound the aggregate. Implementations serving a
  high-volume relying party SHOULD consider this when designing profiles.
- **Revocation is not retraction.** Revoking a grant stops future reads. It does
  not unsee what was read. This is worth stating because the alternative
  expectation is common and false.
- **The grant is the audit anchor.** Because a Proof Consumer is not a party, the
  grant record is the only trace that a disclosure happened. That makes its
  audit properties (§5.2) load-bearing rather than a nicety.

---

## 6. Non-normative sketch

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

## 7. Open questions

1. Is the dossier materialized (stored object) or derived on read from the
   event store?
2. Who signs an attestation, and with what key infrastructure?
3. How do multi-delivery orders aggregate proofs — one dossier per delivery,
   one per order, or both?
4. How are accreditation policies expressed and exchanged (a policy schema,
   or references to out-of-band agreements)?
5. Promotion criteria to `experimental`: a reference implementation exposing
   a read endpoint for the composite.
6. Does a grant (§5.2) reach a dossier, an Order, or a party relationship? A
   patient presenting a year of treatment to an insurer would rather issue one
   grant than forty; a per-dossier grant is easier to reason about and to revoke.
7. Is a redacted view a distinct rendering of the dossier, or the dossier itself
   with fields withheld? The difference shows up in whether the certainty level
   is recomputed over what the reader can see, or reported as computed over the
   whole. Reporting L3 to a reader who can see only L1's worth of evidence is
   defensible but needs to be a decision, not an accident.
8. Should a grant be presentable *by the reader* — the provider hands the acquirer
   a token — or only issuable *to* a registered reader? The representment case
   (§5.6.2) wants the former; the audit properties of §5.2 are easier with the
   latter.

## 8. Changelog

### 0.3.0 — 2026-08-23

Draft revision. Adds §5, the Proof Consumer: the party that reads a dossier it
did not participate in producing, in order to make its own decision. Covers the
access model (explicit, scoped, time-bounded, revocable grant, granted by default
by the client), the redacted view (four questions, zero PII by default), and the
optional recording of what the relying party did.

§5.2 carries a normative **client floor**: the client MAY always grant access to a
dossier concerning them (subject to redaction), MUST be able to enumerate every
grant over it whoever issued it, and does NOT thereby gain revocation over grants
issued by another designated grantor. The third clause is what keeps §5.6.2
workable — a floor phrased as "the client controls access" would let an adverse
client revoke the provider's defence grant.

Additive only. No wire object existed at 0.2.0 and none is introduced. **The four
certainty levels are unchanged and were not renumbered** — §5.4 explicitly
declines to add a fifth level for third-party payment, and records it as a
third-party attestation instead, because a "someone else paid" level would rebuild
the linear-scale error §3.1 prohibits.

The section specifies no field. It states requirements for Evidence Profiles
(redaction profiles, third-party attestation authority), Settlement (a settlement
referencing a dossier across parties with no shared Order, and origin attribution)
and Delegated Agency (a dossier read scope, a grantor role for the client) —
collected in §5.5.

Motivated by cases 1 and 7 of the
[v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md).

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
