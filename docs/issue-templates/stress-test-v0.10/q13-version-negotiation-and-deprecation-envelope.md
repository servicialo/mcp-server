---
name: "[implementation] Version negotiation and deprecation signalling"
about: "Blocking prerequisite for every v1.0 breaking change. Well-scoped, mechanical, already specified upstream — a good first contribution."
title: "[implementation] Implement version negotiation and deprecation signalling in the reference MCP server"
labels: [protocol-evolution, v1.0-candidate, help wanted]
assignees: ''
---

## Context

Surfaced while drafting the vocabulary migration plan ({{PR_D}}) from the
[v0.10 case stress test](https://github.com/servicialo/mcp-server/blob/main/docs/servicialo-stress-test-casos.md).

[RFC-001](https://github.com/servicialo/mcp-server/pull/13) specifies version
coexistence (§3.7) and deprecation signalling (§3.6). **Neither exists in the
reference implementation**, and at least two v1.0 changes are already written
assuming both do.

This is not a design question. RFC-001 already decided the shape. What is missing
is the code.

## Why it blocks

Two v1.0 changes name version negotiation as their mitigation for a breaking
change:

- **[RFC-003](https://github.com/servicialo/mcp-server/pull/13) §3.9** extends
  `billing.status` with `credited` and `partial_credit`, classified as a minor
  breaking change, and mitigates it thus: *"Implementations MUST emit the new
  values only when the client has indicated v1.0 support via version negotiation
  (RFC-001 §3.7)."*
- **The vocabulary migration** ({{PR_D}}) selects legacy or canonical lifecycle
  vocabulary by negotiated version throughout its two-minor dual-behavior window.

Neither can ship as specified. Both would either break v0.x clients or quietly
drop their own mitigation.

## What is missing

Verified against `main`:

**1. `registry.manifest` returns no version set.** RFC-001 §3.7 requires
`protocol_version`, `supported_versions` and (optionally) `minimum_client_version`.
The manifest returns a protocol version and nothing else — zero occurrences of
`supported_versions` or `minimum_client_version` anywhere in the repository.

**2. There is no negotiation.** RFC-001 §3.7 rules 1–4 describe a client picking
the highest mutually supported version, indicating it per request, and the server
serving `protocol_version` when no indication arrives. None of that exists.

**3. There is no `426 Upgrade Required`,** and no `Servicialo-Supported-Versions`
response header, which §3.7 rule 3 requires when the server cannot serve the
requested version.

**4. There is no MCP `deprecation` envelope.** RFC-001 §3.6 signal 3 requires MCP
tool responses touching a deprecated surface to carry a `deprecation` object with
`since`, `removal_target` and `replacement`. Zero occurrences in
`packages/mcp-server/src/` or `lib/`. This one has **no precedent to copy** — it
needs designing once, here, so the next deprecation reuses it instead of
reinventing it.

## A collision the implementer will hit

There is already a version header, and it is not the one RFC-001 describes.

| | Existing | RFC-001 §3.7 |
|---|---|---|
| Header | `X-Servicialo-Version` | `Servicialo-Version` |
| Direction | Request (required per `spec/HTTP_PROFILE.md` §2.2) and echoed on responses | Request |
| Semantics | Single asserted version; unknown → **`406`** (`UNSUPPORTED_VERSION`, `ERRORS.md`) | Negotiated; unservable → **`426`** |

Two headers differing by an `X-` prefix, with different status codes for the same
failure, is a trap. Resolving it is part of this issue and is the one genuinely
non-mechanical decision in it — see the sub-questions below.

Two related snags worth knowing before starting:

- `spec/HTTP_PROFILE.md` §2.2 documents the header's example value as `0.8`, while
  the protocol is at 0.10. Stale.
- `X-Servicialo-Version: 1.0` as emitted by the resolver routes
  (`app/api/servicialo/manifest/route.ts`, `lib/servicialo/response.ts`) is the
  **resolver API version**, not the protocol version — `protocol/manifest.yaml`
  documents it as a wire value that MUST NOT be changed to track the protocol.
  Don't "fix" it.

## Scope

**In scope**

- `registry.manifest` returns the version set (§3.7).
- Request-side version indication, for both bindings: the HTTP header, and the
  `version` field on the MCP actor parameter.
- `426` plus `Servicialo-Supported-Versions` when the requested version cannot be
  served.
- A `deprecation` envelope on MCP tool responses, specified once and applied to
  zero surfaces initially (nothing is deprecated yet — this issue builds the
  mechanism, not its first use).
- The minimum spec surface those require: `spec/HTTP_PROFILE.md` §2.2 and §2.4,
  `spec/openapi.yaml`, `ERRORS.md`.

**Out of scope**

- Deprecating anything. The vocabulary migration and RFC-003 are separate.
- Changing the resolver API version or its header.
- Any lifecycle or settlement vocabulary change.

## Acceptance criteria

- [ ] `registry.manifest` returns `protocol_version`, `supported_versions` and
      `minimum_client_version` per RFC-001 §3.7, and `supported_versions` includes
      `protocol_version`.
- [ ] A request indicating a supported version is served at that version.
- [ ] A request indicating no version is served at `protocol_version` (§3.7 rule 4).
- [ ] A request indicating an unsupported version returns `426` with
      `Servicialo-Supported-Versions` listing acceptable versions.
- [ ] The header collision is resolved, the resolution is documented in
      `spec/HTTP_PROFILE.md`, and `ERRORS.md` reflects whichever of `406`/`426`
      applies to which case.
- [ ] The MCP `deprecation` envelope shape is specified and implemented, with a
      test exercising it against a fixture tool.
- [ ] `spec/openapi.yaml` matches.
- [ ] No behavior changes for a client that sends nothing new.

## Sub-questions for whoever picks this up

1. **Does `X-Servicialo-Version` become the negotiation header, or does
   `Servicialo-Version` join it?** Reusing the existing header is less surface but
   changes the meaning of a header already in the wild, and its documented failure
   mode (`406`) is not §3.7's (`426`). Adding a second header is more surface and
   is additive. A third path — keep `X-Servicialo-Version` as the strict assertion
   it already is, and treat `426` as reachable only through the new header — may be
   the honest reading of both documents.
2. **Where does the `deprecation` object live in an MCP response?** MCP tool
   results have no standard envelope in this server. Alongside the result, or
   wrapping it? Whatever is chosen becomes the precedent.
3. **Does the envelope deserve its own small RFC?** It is reusable infrastructure
   with no current consumer. Specifying it inside a migration RFC would bury it.

## Why this is a good first contribution

Stated plainly, because it is: the work is well-bounded, the design is already
decided by RFC-001, the acceptance criteria are mechanical and testable, and it
touches no part of the protocol's ontology — no opinion required on deliveries,
evidence, settlement, or any of the questions the rest of this cohort argues
about. It is also unusually high-leverage for a first contribution: two v1.0
changes are blocked behind it.

Sub-question 1 is the only judgement call, and it is a small one with three
written-out options. Happy to discuss it in the thread before any code.

## Labels

`protocol-evolution`, `v1.0-candidate`, `help wanted`
