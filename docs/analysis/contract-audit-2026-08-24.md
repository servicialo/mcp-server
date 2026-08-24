# Contract audit — versioning and HTTP contract

**Date:** 2026-08-24
**Scope:** Phase 0 of the D1–D5 unification work. Read-only inspection: no
file outside this document was modified while producing it.
**Repo state:** `933bfae` (branch `claude/servicialo-version-contract-ru232q`,
identical to `origin/main` at audit time).

Every claim below carries one of three marks:

- `[leído: file:line]` — read directly in the tree at the commit above.
- `[ejecutado: command → result]` — a command actually run, with its result.
- `[inferido]` — reasoning, not observation. **Nothing marked `[inferido]`
  may support normative text or a "verified" claim.**

Where something could not be read or run, it says **no verificado**.

---

## 0. Ground truth used

Per the evidence hierarchy, "what runs" for the public HTTP contract is
**tool handlers + `HttpAdapter`**, not the test suite and not the profile.

One clarification that matters for reading the rest of this document:

- The **default** adapter is `CoordinaloClient`, not `HttpAdapter`
  `[leído: packages/mcp-server/src/adapter.ts:51]` — `SERVICIALO_ADAPTER`
  defaults to `'coordinalo'`. `CoordinaloClient` prefixes authenticated paths
  with `/api/organizations/{orgId}` `[leído: packages/mcp-server/src/client.ts:43,76]`.
- `HttpAdapter` is selected with `SERVICIALO_ADAPTER=http`
  `[leído: packages/mcp-server/src/adapter.ts:61-63]` and is the codepath that
  produces the canonical `/v1/*` surface `[leído: packages/mcp-server/src/adapter-http.ts:52-96]`.

So the canonical HTTP contract — the one a second implementer must serve — is
**tool path → `translatePath` → `/v1/…`**. The Coordinalo-internal paths that
appear in the handlers (`/coordinalo/…`, `/planificalo/…`, `/relacionalo/…`)
are inputs to that translation, never the wire.

---

## 1. Contract table per operation

Paths are the result of `translatePath` `[leído: adapter-http.ts:52-96]`.
Body field names are exactly as the handler sends them. All rows `[leído]`.

### 1.1 Public tier

| Tool | Method | Path sent by tool | After `translatePath` | Query / body as sent | Response fields consumed | Source |
|---|---|---|---|---|---|---|
| `registry.manifest` | GET | `/api/servicialo/manifest` | `/v1/manifest` | — | none (returns raw) | `tools/public/registry.ts:37` |
| `registry.search` | GET | `/api/servicialo/registry` | `/v1/registry` | `vertical`, `location`, `country`, `limit` | none (returns raw) | `tools/public/registry.ts:19-24` |
| `registry.get_organization` | GET | `/api/servicialo/{slug}/services` | `/v1/organizations/{slug}/services` | `country` | none (returns raw) | `tools/public/registry.ts:53-55` |
| `services.list` | GET | `/api/servicialo/{slug}/services` | `/v1/organizations/{slug}/services` | — | none (returns raw) | `tools/public/services.ts:15` |
| `scheduling.check_availability` | GET | `/api/servicialo/{slug}/availability` | `/v1/organizations/{slug}/availability` | `serviceId`, `providerId`, `resourceId`, `from`, `to` | none (returns raw) | `tools/public/availability.ts:21-27` |
| `resolve.lookup` | GET | `/api/servicialo/resolve/{country}/{slug}` | `/v1/resolve/{country}/{slug}` | — | none | `tools/public/resolve.ts:17` |
| `resolve.search` | GET | `/api/servicialo/resolve/{country}` | `/v1/resolve/{country}` | params | none | `tools/public/resolve.ts:38` |
| `trust.get_score` | GET | `/api/servicialo/resolve/{country}/{slug}` | `/v1/resolve/{country}/{slug}` | — | reads score fields | `tools/public/resolve.ts:55` |
| `registry.list_verticals` | GET | `/api/registry/verticals` | `/api/registry/verticals` (pass-through) | — | none | `tools/public/registry-discovery.ts:20` |
| `registry.list_regions` | GET | `/api/registry/regions` | pass-through | — | none | `registry-discovery.ts:31` |
| `registry.list_event_types` | GET | `/api/registry/event_types` | pass-through | — | none | `registry-discovery.ts:41` |
| `market.list_segments` | GET | `/api/benchmarks/segments` | pass-through | params | none | `tools/public/market.ts:33` |
| `market.get_benchmark` | GET | `/api/benchmarks` | pass-through | params | none | `tools/public/market.ts:75` |
| `a2a.get_agent_card` | GET | (org agent card) | — | — | none | `tools/public/a2a.ts:16` |
| `docs.quickstart` | — | (no network call) | — | — | — | `tools/public/docs-quickstart.ts:13` |

**Note on `/api/*` pass-through:** `translatePath` returns `/api/*` paths
unchanged `[leído: adapter-http.ts:90-92]`. So `registry.list_*` and `market.*`
do **not** become `/v1/*` — they stay `/api/registry/…` and `/api/benchmarks/…`
even under `HttpAdapter`. These are resolver/network endpoints, not node
endpoints.

### 1.2 Authenticated tier

| Tool | Method | Path sent by tool | After `translatePath` | Body as sent | State vocabulary | Source |
|---|---|---|---|---|---|---|
| `service.get` | GET | `/coordinalo/services/{id}` | `/v1/services/{id}` | — | — | `authenticated/entender.ts:12` |
| `contract.get` | GET | `/coordinalo/services/{id}/contract` | `/v1/services/{id}/contract` | query `orgId` | — | `entender.ts:24-26` |
| `clients.get_or_create` | POST | `/relacionalo/clients/upsert` | `/v1/clients` | `email`, `phone`, `name`, **`lastName`**, `actor` | — | `comprometer.ts:17-23` |
| `scheduling.book` | POST | `/coordinalo/sessions` | `/v1/sessions` | **`serviceId`**, **`providerId`**, **`clientId`**, **`startTime`**, **`resourceId`**, `actor` | — | `comprometer.ts:39-46` |
| `scheduling.confirm` | POST | `/coordinalo/sessions/{id}/confirm` | `/v1/sessions/{id}/confirm` | `actor` | — | `comprometer.ts:58-60` |
| `lifecycle.get_state` | GET | `/coordinalo/sessions/{id}/lifecycle` | `/v1/sessions/{id}/lifecycle` | — | — | `lifecycle.ts:13` |
| `lifecycle.transition` | POST | `/coordinalo/sessions/{id}/lifecycle/transition` | `/v1/sessions/{id}/lifecycle/transition` | **`toState`**, `actor`, `reason`, `evidence` | `scheduled, confirmed, in_progress, `**`delivered`**`, documented, `**`charged`**`, verified, cancelled` | `lifecycle.ts:22-36` |
| `scheduling.reschedule` | **PUT** | `/coordinalo/sessions/{id}` | `/v1/sessions/{id}` | **`startTime`**, `actor` | — | `lifecycle.ts:49-52` |
| `scheduling.cancel` | POST | `/coordinalo/sessions/{id}/cancel` | `/v1/sessions/{id}/cancel` | `reason`, `actor` | — | `lifecycle.ts:65-68` |
| `delivery.checkin` | POST | `/coordinalo/sessions/{id}/checkin` | `/v1/sessions/{id}/checkin` | `actor`, `location`, `timestamp` | — | `delivery.ts:16-20` |
| `delivery.checkout` | POST | `/coordinalo/sessions/{id}/checkout` | `/v1/sessions/{id}/checkout` | `actor`, `location`, `timestamp` | — | `delivery.ts:34-38` |
| `delivery.record_evidence` | POST | `/coordinalo/sessions/{id}/evidence` | `/v1/sessions/{id}/evidence` | **`evidenceType`**, `data`, `data_sensitivity`, `actor` | evidence types: `gps, signature, photo, document, duration, notes` | `delivery.ts:53-58` |
| `documentation.create` | POST | `/coordinalo/sessions/{id}/documentation` | `/v1/sessions/{id}/documentation` | `content`, **`templateId`**, `actor` | — | `cerrar.ts:16-20` |
| `payments.create_sale` | POST | `/planificalo/sales` | `/v1/sales` | **`clientId`**, **`serviceId`**, **`providerId`**, `quantity`, **`unitPrice`** | — | `cerrar.ts:35-41` |
| `payments.record_payment` | POST | `/planificalo/payments` | `/v1/payments` | **`ventaId`**, `amount`, **`paymentMethod`**, `reference` | method enum **in Spanish**: `efectivo, transferencia, mercadopago, tarjeta` | `cerrar.ts:51,55-60` |
| `payments.get_status` | GET | `/planificalo/sales/{id}` *or* `/planificalo/clients/{id}/account-history` | `/v1/sales/{id}` *or* `/v1/clients/{id}/account-history` | — | — | `cerrar.ts:73,76` |
| `resource.list` | GET | `/coordinalo/resources` | `/v1/resources` | params | — | `resource.ts:17` |
| `resource.get` | GET | `/coordinalo/resources/{id}` | `/v1/resources/{id}` | — | — | `resource.ts:32` |
| `resource.create` | POST | `/coordinalo/resources` | `/v1/resources` | body | — | `resource.ts:67` |
| `resource.update` | PATCH | `/coordinalo/resources/{id}` | `/v1/resources/{id}` | body | — | `resource.ts:112` |
| `resource.delete` | **PATCH** | `/coordinalo/resources/{id}` | `/v1/resources/{id}` | soft-delete body | — | `resource.ts:133` |
| `resource.get_availability` | GET | `/coordinalo/resources/{id}/availability` | `/v1/resources/{id}/availability` | params | — | `resource.ts:150` |
| `resolve.register` | POST | `/api/servicialo/resolve/register` | `/v1/resolve/register` | args | — | `resolve-auth.ts:32` |
| `resolve.update_endpoint` | PATCH | `/api/servicialo/resolve/{country}/{slug}/endpoint` | `/v1/resolve/{country}/{slug}/endpoint` | body | — | `resolve-auth.ts:57` |
| `telemetry.heartbeat` | PATCH | same as above | `/v1/resolve/{country}/{slug}/endpoint` | metrics | — | `resolve-auth.ts:82` |

**Field-naming reality (bold above):** bodies are **camelCase** on the wire
(`toState`, `evidenceType`, `serviceId`, `startTime`, `unitPrice`, `templateId`,
`lastName`, `ventaId`, `paymentMethod`) while tool *inputs* are snake_case. This
is the wire as it runs; renaming would break Coordinalo. Documented as-is,
issue opened. One field is snake_case on the wire — `data_sensitivity`
`[leído: delivery.ts:56]` — so the body convention is not even internally
uniform.

**Error handling:** `HttpAdapter` never parses an error envelope. On any
non-2xx it throws `Error("<METHOD> <path> failed (<status>): <text>")`
`[leído: adapter-http.ts:149-155, 175-181, 190-196, 205-211, 219-225, 234-240]`.
No reference codepath reads `{errors:[…]}`, `INVALID_TRANSITION`, or any other
code from the profile's error table.

---

## 2. Drift table

One row per difference, per surface, against §1 (the running contract).

### 2.1 Paths and methods

| Operation | Running (§1) | Profile 1.0.0 | openapi.yaml | Suite | IMPLEMENTORS | IMPLEMENTING |
|---|---|---|---|---|---|---|
| `registry.manifest` | `GET /v1/manifest` | `GET /servicialo/v1/manifest` §4.0 `[leído: HTTP_PROFILE.md:295-301]` | **absent** (has `/` instead) `[leído: openapi.yaml:52]` | `GET /v1/manifest` ✅ `[leído: http-compat.test.ts:138-141]` | — | — |
| `registry.search` | `GET /v1/registry` | `GET /registry/organizations` `[leído: HTTP_PROFILE.md:230]` | `/registry/organizations` `[leído: openapi.yaml:101]` | `GET /v1/registry` ✅ `[leído: :160-163]` | — | — |
| `services.list` | `GET /v1/organizations/{slug}/services` | `/organizations/{slug}/services` ✅ | ✅ `[leído: openapi.yaml:189]` | ✅ `[leído: :172-176]` | listed | `GET /services` `[leído: IMPLEMENTING.md:328]` |
| `scheduling.check_availability` | `GET /v1/organizations/{slug}/availability` | ✅ §4.4 | **`/availability`** `[leído: openapi.yaml:215]` | ✅ `[leído: :185-192]` | listed | `GET /availability` `[leído: :329]` |
| `service.get` | `GET /v1/services/{id}` | ✅ §5.1 | ✅ `[leído: openapi.yaml:280]` | ✅ `[leído: :210-221]` | — | — |
| `contract.get` | `GET /v1/services/{id}/contract` | ✅ §5.2 | ✅ `[leído: openapi.yaml:334]` | **`GET /v1/contracts/{id}`** `[leído: :237-240]` | — | — |
| `clients.get_or_create` | `POST /v1/clients` | ✅ §6.1 | ✅ `[leído: openapi.yaml:369]` | ✅ `[leído: :261-265]` | — | — |
| `scheduling.book` | `POST /v1/sessions` | ✅ §6.2 | ✅ `[leído: openapi.yaml:412]` | ✅ `[leído: :312]` | listed | `POST /bookings` `[leído: :330]` |
| `scheduling.confirm` | `POST /v1/sessions/{id}/confirm` | ✅ §6.3 | ✅ `[leído: openapi.yaml:464]` | ✅ `[leído: :335-339]` | listed | `POST /bookings/:id/confirm` `[leído: :331]` |
| `lifecycle.get_state` | `GET /v1/sessions/{id}/lifecycle` | ✅ §7.1 | ✅ `[leído: openapi.yaml:503]` | **`GET /v1/sessions/{id}/state`** `[leído: :411-415]` | — | — |
| `lifecycle.transition` | `POST /v1/sessions/{id}/lifecycle/transition` | **`POST /sessions/{id}/transitions`** `[leído: HTTP_PROFILE.md:233]` | **`/sessions/{id}/transitions`** `[leído: openapi.yaml:544]` | **`POST /v1/sessions/{id}/transition`** `[leído: :424-428]` | listed | `POST /bookings/:id/transition` `[leído: :332]` |
| `scheduling.reschedule` | **`PUT /v1/sessions/{id}`** | §7.3 | **`/sessions/{id}/reschedule`** `[leído: openapi.yaml:592]` | — | — | — |
| `scheduling.cancel` | `POST /v1/sessions/{id}/cancel` | ✅ §7.4 | ✅ `[leído: openapi.yaml:630]` | — | — | — |
| `delivery.checkin` | `POST /v1/sessions/{id}/checkin` | ✅ §8.1 | ✅ `[leído: openapi.yaml:670]` | ✅ `[leído: :501-505]` | listed | `POST /bookings/:id/checkin` `[leído: :333]` |
| `delivery.checkout` | `POST /v1/sessions/{id}/checkout` | ✅ §8.2 | ✅ `[leído: openapi.yaml:709]` | ✅ `[leído: :517-521]` | — | — |
| `delivery.record_evidence` | `POST /v1/sessions/{id}/evidence` | ✅ §8.3 | ✅ `[leído: openapi.yaml:748]` | ✅ `[leído: :533-537]` | — | — |
| `documentation.create` | `POST /v1/sessions/{id}/documentation` | ✅ §9.1 | ✅ `[leído: openapi.yaml:792]` | ✅ `[leído: :611-615]` | — | — |
| `payments.create_sale` | `POST /v1/sales` | ✅ §9.2 | ✅ `[leído: openapi.yaml:829]` | **`POST /v1/payments/sales`** `[leído: :627-630]` | — | — |
| `payments.record_payment` | `POST /v1/payments` | §9.3 | **`/sales/{id}/payments`** `[leído: openapi.yaml:875]` | — | — | — |
| `payments.get_status` | `GET /v1/sales/{id}` \| `/v1/clients/{id}/account-history` | §9.4 | **`/payments/status`** `[leído: openapi.yaml:915]` | — | — | — |

**Base path:** the profile declares `/servicialo/v1/`
`[leído: HTTP_PROFILE.md:51-57]`; the running adapter produces `{base}/v1/…`
with no `/servicialo` segment `[leído: adapter-http.ts:127-129]`.

### 2.2 Envelope, headers, vocabulary

| Item | Running | Profile 1.0.0 | Verdict |
|---|---|---|---|
| Request `Content-Type` | `application/json` `[leído: adapter-http.ts:102]` | `application/vnd.api+json` `[leído: HTTP_PROFILE.md:65]` | drift |
| `Accept` | not sent `[leído: adapter-http.ts:100-111]` | `application/vnd.api+json` REQUIRED `[leído: :66]` | drift |
| `X-Servicialo-Version` | **not sent by any tool** `[leído: adapter-http.ts:100-125]` | `0.8`, labeled "Protocol version" `[leído: :67]` | drift (value **and** label) |
| Actor | body field `actor` on every write | `X-Servicialo-Actor` Base64 header `[leído: :75-93]` | drift — no tool sends the header |
| Response envelope | plain objects (`res.json()` returned raw) | JSON:API `{data:{type,id,attributes}}` `[leído: :95-155]` | drift |
| Error envelope | not consumed; throws on non-2xx | `{errors:[{code,…}]}` + 11 codes `[leído: :156-200]` | drift — cannot be MUST |
| Pagination | nothing produces `meta`/`links` | `meta`/`links` `[leído: :201-211]` | **no verificado** — no node code in this repo |
| Auth header | `Authorization: Bearer` `[leído: adapter-http.ts:105]` | implementation-defined `[leído: :43,73]` | consistent |
| Org context | `X-Servicialo-Org` `[leído: adapter-http.ts:108]` | not documented | drift (undocumented header that runs) |

### 2.3 State vocabulary — three layers

| Layer | Where | Evidence |
|---|---|---|
| (i) Spanish | test suite only: `solicitado` `[leído: http-compat.test.ts:325]`, `confirmado` `[leído: :344]`, `cancelado` `[leído: :424,429]`; plus a tolerant telemetry match `[leído: telemetry/dispatch.ts:90]` | Suite must drop it; `dispatch.ts` keeps its internal match (not a binding) |
| (ii) Legacy English | `delivered`/`charged` in the tool enum `[leído: lifecycle.ts:24]`; declared as known divergence `[leído: protocol/manifest.yaml:196-204]`; migration in PR #23 | **Do not touch.** Document with pointer. |
| (iii) camelCase bodies | `toState`, `evidenceType`, `serviceId`, `startTime`, `unitPrice`, `templateId`, `lastName`, `ventaId`, `paymentMethod` (§1.2) | Document as-is; issue |

**Fourth, previously unrecorded layer:** Spanish leaks past the state
vocabulary into a *live tool surface* — `payments.record_payment` exposes
`venta_id` as an input name and a Spanish `method` enum
(`efectivo, transferencia, mercadopago, tarjeta`), sending `ventaId`
`[leído: cerrar.ts:48-60]`. This is not covered by the "no Spanish literals"
gate (which targets lifecycle states) and is not part of the PR #23 migration.
Recorded as a gap → issue; **not** changed here (it is live wire).

### 2.4 Competing definitions of "required operations"

Five lists exist today. No two agree.

| # | Source | Operations |
|---|---|---|
| 1 | Profile §3.1 table (says "6 endpoints") `[leído: HTTP_PROFILE.md:224-236]` | `registry.search`, `service.get`, `scheduling.book`, `lifecycle.transition`, `delivery.record_evidence`, `payments.create_sale` |
| 2 | Profile per-endpoint `Compliance: REQUIRED` markers — **7**, not 6 `[ejecutado: grep -c "Compliance\*\* \| REQUIRED" spec/HTTP_PROFILE.md → 7]` | list 1 **+ `registry.manifest`** (§4.0) `[leído: :295-301]` |
| 3 | `IMPLEMENTORS.md` row 4 `[leído: IMPLEMENTORS.md:32]` | `services.list`, `scheduling.check_availability`, `scheduling.book`, `scheduling.confirm`, `lifecycle.transition`, `delivery.checkin` |
| 4 | `IMPLEMENTING.md` Paso 4 table `[leído: IMPLEMENTING.md:326-333]` | same six as row 3, on `/bookings` paths |
| 5 | `manifest.yaml` `bindings` comment: "implementing the required Core profiles" `[leído: protocol/manifest.yaml:104-105]` | points at *profiles*, not operations — no operation list anywhere in the manifest |

`certification.md` CORE states five **capability** requirements and no
operation list at all `[leído: public/spec/certification.md:33-68]`.

**Internal contradiction inside the profile itself:** §3.1 says "these 6
endpoints" but seven endpoints carry `Compliance: REQUIRED`. `registry.manifest`
is REQUIRED in its own section and missing from the summary table.

### 2.5 Manifest-response shape — four variants

| Source | Shape |
|---|---|
| Profile §4.0 example | `{"servicialo": "0.7", "name", "description", "endpoints"}` `[leído: HTTP_PROFILE.md:314-322]` |
| Live resolver endpoint | `{servicialo_version: '1.0', name, description, resolver, registry, endpoints, …}` `[leído: app/api/servicialo/manifest/route.ts:6]` |
| Suite assertion | `protocol_version`, `org_slug`, `name` `[leído: http-compat.test.ts:138]` |
| `verify-interop.mjs` check [1] | `protocol_version` `[leído: scripts/verify-interop.mjs:121,128]` |

There is **no node-level `/v1/manifest` route in this repo**
`[ejecutado: find app/api/servicialo -name route.ts → 12 routes, none is a node manifest]`.
`/api/servicialo/manifest` is the **resolver's own** manifest, a different
object from a node manifest. The node manifest is served by Coordinalo
(other repo) — **no verificado** here.

No tool consumes any manifest field (`registry.manifest` returns the raw body
`[leído: tools/public/registry.ts:36-39]`), so running code does not decide
the shape. Two running scripts require `protocol_version`; nothing requires
`servicialo`. → §4 records this as a pending decision.

---

## 3. Versions observed

| Literal | File:line | Manifest source of truth | Status |
|---|---|---|---|
| `0.10` | `protocol/manifest.yaml:20` | `protocol.version` | authoritative |
| `0.10` | `PROTOCOL.md` header `| **Version** |` | `protocol.version` | ✅ (guarded by v1) |
| `0.10` | `SPEC.md` source-of-truth line | `protocol.version` | ✅ (guarded) |
| `0.10` | `CHANGELOG.md` `## [Protocol v0.10]` | `protocol.version` | ✅ (guarded) |
| `0.10` | `spec/HTTP_PROFILE.md:8` | `protocol.version` | ✅ (guarded) |
| `1.0.0` | `spec/HTTP_PROFILE.md:7` | `bindings.http.profile_version` | ✅ matches `manifest.yaml:117` |
| `1.0` | `lib/servicialo/response.ts:8` | `bindings.http.resolver_api_version` | ✅ wire value — **do not change** |
| `1.0` | `lib/servicialo/proxy.ts:13` | same | ✅ |
| `0.9.14` | `packages/mcp-server/package.json` + `server.json` ×2 | `bindings.mcp.package_version` | ✅ (guarded) |
| **`0.8`** | `spec/HTTP_PROFILE.md:67` | should be `resolver_api_version` (`1.0`) | ❌ **drift** — wrong value *and* mislabeled "Protocol version" |
| **`0.8`** | `spec/HTTP_PROFILE.md:257` (`"protocol_version"` example) | `protocol.version` (`0.10`) | ❌ **drift** |
| **`0.7`** | `spec/HTTP_PROFILE.md:314` (`"servicialo"` example) | — | ❌ **drift** |
| **`0.9`** | `packages/mcp-server/src/telemetry/operational.ts:147` | `protocol.version` | ❌ **drift** (D1 explicitly authorizes this change) |
| **`0.9`** | `packages/mcp-server/README.md:260`, `README.en.md:246` | `protocol.version` | ❌ **drift** (documented default) |
| **`0.9`** | `packages/mcp-server/README.md:470`, `README.en.md:454` ("stable version") | `protocol.version` | ❌ **drift** |
| **`0.9`** | `app/api/servicialo/[orgSlug]/.well-known/agent.json/route.ts:7` | `protocol.version` | ❌ **drift** — advertised on a live agent card |
| **`v0.9`** | `PROTOCOL.md:877` "claiming Servicialo v0.9 compliance" | — | ❌ **drift** in a v0.10 normative clause |
| **`v0.8`** | `spec/delegated-agency-model.md:194` "claiming Servicialo v0.8 compliance" | — | ❌ same class |
| **`v0.9`** | `README.md:383` `# SERVICIALO v0.9` | — | ❌ **drift** |
| **`v0.6`** | `README.en.md:347` `# SERVICIALO v0.6` | — | ❌ **drift** |
| `v0.9` | `README.md:29` "Whitepaper v0.9" | — | ⚠️ advisory — reword as historical snapshot |
| `v0.8` | `PROTOCOL.md:953` "The v0.8 update adds…" | — | ⚠️ advisory — history in normative body |
| `v0.2` | `WEBHOOKS.md:3` | none | ⚠️ document's own version, undeclared in manifest |
| `servicialo-op-v0.9` | `telemetry/operational.ts:16`, `lib/servicialo/contribution.ts:28` | — | ✅ **wire salt — MUST NOT change** `[leído: protocol/manifest.yaml:12-13]`, guarded by `verify-salt-parity.mjs` |

**Deliberately not drift** (historical records, correctly bannered):
`PROTOCOL.md` Appendix B changelog headings; `docs/whitepaper.md:24`
(bannered archived snapshot); `docs/SERVICIALO_AUDIT.md:3` (bannered stale);
`packages/mcp-server/CHANGELOG.md` historical entries;
`docs/issue-templates/**` (issue bodies quoting the problems);
`SPEC.md:129` "new since v0.8"; `ROADMAP.md:44`; `examples/*` "[RESUELTO v0.8]";
`schemas.ts:17` "Protocol v0.6.0: Resource" (records when it landed).

**Count of fixable drifts for PR A: 14** (the ❌ rows). The v2 guardrail must
fail on at least these before any fix lands.

---

## 4. Material contradictions and pending decisions

### 4.1 Contradictions with D1–D5 — none blocking

No evidence found that contradicts D1–D5 as specified. Two refinements, both
supported by evidence rather than opinion:

1. **`PROTOCOL.md` §10.5 fix should drop the version, not bump it.** Prior
   analysis in-repo already reached this conclusion and gave the reason: a
   version pinned inside a normative scoping clause drifts again next release
   `[leído: docs/issue-templates/stress-test-v0.10/doc-fixes.md:56-66]`.
   Applying the same treatment to `spec/delegated-agency-model.md:194`.
2. **`optional_financial` must not be renamed.** It has two live consumers:
   `lib/manifest.ts:85` (typed) and `app/spec/page.tsx:302` (rendered)
   `[ejecutado: grep -rn "optional_financial" → 2 code consumers]`. §5.2.3
   already anticipated this; confirmed by grep. Only prose copy changes.

### 4.2 Pending decisions (manifest is silent; no running code decides)

| # | Decision | Evidence making it necessary |
|---|---|---|
| P1 | **Node `/v1/manifest` response shape.** Four variants exist (§2.5). The manifest declares no schema for it. | Profile says `servicialo`; suite + `verify-interop.mjs` require `protocol_version`; live resolver emits `servicialo_version`; no tool consumes any field. Profile 1.1.0 will document `protocol_version` — the only variant two running scripts already require — and note the resolver's own manifest as a distinct object. Confirmation requested. |
| P2 | **`registry.manifest` in the CORE list.** §5.2.2 includes it by default and says to drop it on Franco's word. | It is REQUIRED in profile §4.0 `[leído: :301]`, the suite's first test `[leído: :138]`, and check [1] of `verify-interop.mjs` `[leído: :115-131]` — but absent from the profile's own §3.1 summary of "6 endpoints" `[leído: :224-236]`. Included, flagged. |
| P3 | **Spanish in `payments.record_payment`.** `venta_id` input + Spanish `method` enum on a live tool surface (§2.3). | Outside the gate's literal list and outside PR #23's scope. Not changed (live wire). Issue only. |

### 4.3 Guardrail blind spots found

- `verify-doc-claims.mjs` walks only `app`, `components`, `lib`
  `[leído: scripts/verify-doc-claims.mjs:83-85]` — it never reads
  `packages/mcp-server/src`. Consequence: `docs.quickstart` claims
  **"9 herramientas públicas"** `[leído: tools/public/docs-quickstart.ts:20]`
  while the manifest has **15** public tools, and its own `public` array lists
  **10** `[leído: :60-71]` (missing `market.list_segments`,
  `market.get_benchmark`, `registry.list_verticals`, `registry.list_regions`,
  `registry.list_event_types`). Unguarded, agent-facing, and wrong.
- `verify-versions.mjs` v1 checks six header lines and three package fields
  only `[leído: scripts/verify-versions.mjs:56-71]`. It reads no document
  body, no example block, and no code default — which is why all 14 drifts in
  §3 pass CI today.

---

## 5. Baseline verification

All `integrity.yml` steps run locally at `933bfae`, before any edit.

| Step | Command | Result |
|---|---|---|
| Install (root) | `pnpm install --frozen-lockfile` | `[ejecutado → exit 0]` |
| Install (pkg) | `npm install --no-audit --no-fund` | `[ejecutado → exit 0]` |
| Lint | `pnpm run lint` | `[ejecutado → exit 0, "No ESLint warnings or errors"]` |
| tsc (root) | `pnpm exec tsc --noEmit` | `[ejecutado → exit 0]` |
| tsc (pkg) | `npx tsc --noEmit` | `[ejecutado → exit 0]` |
| Vitest | `npm test` | `[ejecutado → 146 passed, 16 skipped (9 files)]` |
| Salt parity | `node scripts/verify-salt-parity.mjs` | `[ejecutado → exit 0]` |
| Import extensions | `node scripts/verify-import-extensions.mjs` | `[ejecutado → exit 0]` |
| serverInstructions | `node scripts/verify-server-instructions.mjs` | `[ejecutado → exit 0, 15 public tools]` |
| Manifest/tools | `node scripts/verify-manifest-tools.mjs` | `[ejecutado → exit 0, 40 = 15 + 25]` |
| **Versions (v1)** | `node scripts/verify-versions.mjs` | `[ejecutado → exit 0]` — **green despite the 14 drifts in §3** |
| Doc claims | `node scripts/verify-doc-claims.mjs` | `[ejecutado → exit 0, 129 surfaces]` |

The 16 skipped tests are the whole `http-compat` suite: it self-skips without
`SERVICIALO_BASE_URL` `[leído: http-compat.test.ts:36-41]`.

**Credentials for a real target: absent.**
`[ejecutado: SERVICIALO_BASE_URL / SERVICIALO_API_KEY / SERVICIALO_ORG_ID → all unset]`
The suite therefore **cannot be run against a live implementation in this
environment**, and no claim in this work asserts that it passed. Reported as
"no ejecutada".

A v2 guardrail does not exist in `scripts/` yet
`[ejecutado: ls scripts/ → verify-versions.mjs only]`, so the "must fail with
≥12 drifts" check is a PR A deliverable, not a Phase 0 observation.

---

## 6. What this audit licenses

- The contract table in §1 is the input for HTTP Profile **1.1.0** and the
  regenerated `openapi.yaml`.
- §2.4 justifies a single machine-readable CORE list in `manifest.yaml`.
- §2.2 justifies demoting the error envelope from MUST to RECOMMENDED
  ("not exercised by the reference client").
- §3 gives the v2 guardrail its 14 targets.
- §4.2 lists what must **not** be guessed.
