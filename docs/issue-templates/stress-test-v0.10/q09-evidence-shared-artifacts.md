---
name: "[evidence] Content-addressed artifacts shared across deliveries"
about: "Stress test v0.10 — Q9 (narrowed). Evidence payloads carry URIs but no digest, and nothing says one artifact may support N deliveries."
title: "[evidence] Let Evidence reference content-addressed artifacts shared across deliveries"
labels: [protocol-evolution, rfc]
assignees: ''
---

## Context

Surfaced by the [v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md),
**Case 5 — 20-student cohort** and **Case 9 — subcontracting chain** (question 9
of 12).

One physical fact, N commercial truths:

- Case 5: one class session, one signed attendance sheet, one recording — and 20
  bilateral Orders, therefore 20 deliveries, each of which needs that same sheet
  as evidence.
- Case 9: one window cleaning, two independent bilateral Orders (office↔company,
  company↔contractor). The same photo evidences both, from two contexts that must
  not learn about each other.

> **This issue is narrower than the original question.** The stress test asked
> whether Evidence can reference addressable artifacts, flagged `[verificar]`.
> Partly it can. What follows is the part that does not work.

## What the spec already answers

`schema/evidence/base.schema.json` `$defs` gives three payloads a `uri`
(`format: uri`):

- `signature_data.uri` — location of the signature artifact
- `photo_data.uri` — photo location
- `document_data.uri` — document location

Nothing forbids twenty evidence envelopes from carrying the same URI. So
reference-by-URI is already legal today.

## What remains open

1. **No content digest anywhere.** Verified: zero occurrences of `hash`,
   `digest`, `sha256` or `checksum` across all of `schema/`. Two envelopes
   pointing at the same URI is an assertion that they are the same artifact; it is
   not verifiable, and the URI can be re-pointed after the fact. For a Proof of
   Service whose whole purpose is to be presented to a third party
   ([proof-of-service](https://github.com/servicialo/mcp-server/blob/main/public/spec/extensions/proof-of-service.md)),
   an unverifiable shared reference is the weakest possible link in the dossier.

2. **Evidence is embedded, not referenced.** Evidence lives inside
   `Service.proof.evidence[]` (`schema/service.schema.json`). There is no
   artifact object with an identity of its own, so "the same artifact" is a
   property of a string that happens to repeat, not a modeled relationship.

3. **Nothing blesses the pattern.** With no statement either way, a reasonable
   implementer reads the embedded array as 1 evidence → 1 delivery and duplicates
   the artifact per delivery. Twenty copies of one attendance sheet is not just
   waste — it means twenty artifacts that can drift apart.

## The question

Should Evidence Events reference content-addressed artifacts (URI + digest) that
are explicitly reusable across deliveries and across Orders?

## Options considered

| Option | Shape |
|---|---|
| **A. Add a digest to the existing payloads** | `{ uri, digest: { alg, value } }` on `signature_data`, `photo_data`, `document_data`. Smallest possible change; sharing stays implicit but becomes verifiable. |
| **B. Introduce an artifact reference type** | A shared `$defs/artifact_ref` (`uri`, `digest`, `media_type`, optional `size`) reused by every payload that points at a file, plus a normative sentence blessing reuse across deliveries and Orders. |
| **C. A first-class Artifact object** | Artifacts get their own identity, lifecycle and endpoint; evidence points at artifact IDs. |
| **D. Status quo** | Leave it implicit. |

## Recommended direction

**B.** It is additive (a new optional sibling of `uri`, or `uri` absorbed into the
ref), it closes the verifiability gap that A also closes, and unlike A it carries
the normative sentence that actually prevents the duplication reflex: *an Evidence
Event MAY reference an artifact that also supports other deliveries, including
deliveries under a different Order; twenty dossiers citing one digest is the
correct encoding of a shared fact, not a modeling error.*

**C is explicitly not recommended** and would violate the stress test's own rule
(composition before proliferation). A digest is enough to make two references
provably the same artifact — an object with a lifecycle is not needed to say so.

## Privacy note

Cross-Order sharing must not become cross-Order disclosure. Case 9 is the test:
the two Orders in a subcontracting chain reference the same artifact and must
remain mutually invisible. A digest is safe here — it identifies without
revealing — but the accompanying text should state that referencing a shared
artifact grants no access to the other contexts that reference it, and that
`data_sensitivity` (`§9.8`) is a property of the artifact, evaluated per accessor.

## Related

- The anti-pattern this protects: Case 9's tripartite Order. Relationships are
  always bilateral; chains compose from Orders. Worth a paragraph in
  `IMPLEMENTORS.md` independently of this issue.
- Feeds the Proof Consumer redaction model in the Proof of Service draft.

## Labels

`protocol-evolution`, `rfc`
