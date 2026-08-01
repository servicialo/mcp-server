# Documentation Changelog

Changes to Servicialo documentation, messaging, and positioning.

---

## 2026-08-01 — intents.md 1.2.0: payloads verified against the reference implementation

`public/spec/intents.md` claimed shapes the reference implementation (Coordinalo) never produced. Every request/response in the doc is now verified against the live implementation:

- **`check_availability`** — real responses documented: single-day mode returns a bare result object (no `servicialo_version`/`organization`/`results` wrapper); range and next modes return a flat `slots` list with `service` and `timezone`. Slot `start`/`end` are **ISO 8601 UTC datetimes**, not local `HH:MM`. Mode precedence (`next` > `from` > `date`) and the no-param default (today) documented.
- **`cancel_session` / `reschedule_session`** — `X-Org-Api-Key` authentication documented (REST section previously showed none); real request fields (`reason` optional, `cancelledBy` includes `system` and defaults to it; reschedule takes `scheduledAt` — `newScheduledAt` is accepted at the A2A layer only); real responses (`{sessionId, status, policy_applied}` / `{sessionId, status, scheduledAt, duration}` — reschedule updates the session **in place**, it does not cancel + recreate); real error catalog (`ALREADY_CANCELLED`, `SLOT_INVALID` family, 401).
- **`book_session`** — `derived_state` documented as Spanish wire values (`solicitado`…`verificado`) mapping 1:1 to canonical states; real error codes (`OUTSIDE_PROVIDER_HOURS`, `SLOT_CONFLICT` message).
- **`list_services`** — field nullability and types corrected (`price` serializes as a numeric string, `requirements` is an array); platform-level vs proxy-level errors separated.
- **A2A transport** — response format documented (agent Message with text part + data part carrying `{intent, status, http_status, result}`), structured DataPart requests, JSON-RPC error codes, per-IP+org rate limit. Matches the reference implementation shipped 2026-08-01 (coordinalo `7dd73135`).
- Autonomous agent flow example updated to the real shapes end-to-end.

---

## 2026-08-01 — One coherent thesis: the open domain protocol for coordinating services

Full communication refactor so the site, spec, and docs tell a single, technically defensible story.

### Canonical thesis
> Servicialo es el protocolo abierto de dominio para coordinar servicios. Estandariza la relación entre compromiso, entrega, evidencia y liquidación. Coordínalo es la implementación de referencia. MCP/HTTP/A2A son bindings. La red es opcional.

### Structural changes
- **`protocol/manifest.yaml`** — single source of truth (version, tools, states, profiles, bindings, extensions, implementations) + 3 CI guardrails. The site now derives every count/version from it via `lib/manifest.ts`.
- **Site IA** — home rebuilt to answer: qué es → problema → objetos → modelo (diagrama Offer→Order→Delivery→Evidence/Settlement→Proof) → Prueba de Servicio → ciclo → principios → agentes → estado actual → participar. New `/extensions` (maturity-labeled) and `/vision` (aspirational content, explicitly non-normative) pages. `/network` and `/implementors` rewritten in Spanish with honest framing. `/whitepaper` reduced to an archived-snapshot page.
- **States** — "9 estados universales" retired everywhere; replaced by 6 core + 3 optional financial, with the 9 milestones as the happy-path view and the no-total-order rule (PROTOCOL.md §6.0, state-dimensions draft extension).
- **Claims honesty** — 80/20 disputes → design goal of an in-design extension; "certificación automatizada" → manual review today, suite as roadmap; "Nodes" → installations; `mandates.*` tools delisted (specified, unimplemented); "Nexo"/`prueba_de_entrega` removed (Proof of Service specified as a draft extension instead); tool counts unified at 40 = 15 + 25; versions unified at protocol 0.10 / package 0.9.12.
- **Known stale artifacts (intentionally untouched):** whitepaper PDFs (v0.9 snapshot, bannered), `packages/mcp-server/.smithery/shttp/manifest.json` (Smithery build artifact, 0.6.0-era), `distribution/registries.yaml` historical entries.

---

## 2026-03-06 — Messaging overhaul: neutral protocol positioning

### Positioning change

Servicialo is now positioned as **neutral infrastructure** — an open protocol, not a product. The new tagline:

> **"The orchestration layer for the AI-agent service economy"**

### Files changed

#### README.md
- **Tagline**: "The open standard for services" → "The orchestration layer for the AI-agent service economy"
- **Subtitle**: Rewritten to emphasize four protocol primitives (scheduling, identity, delivery verification, financial settlement)
- **Tags**: `Open standard` → `Open protocol` · `Agent-native` · `Apache 2.0 license`
- **Problem section**: Added collective intelligence framing; "common language" → "common protocol"
- **Protocol primitives**: New section documenting the four coordination primitives with table
- **Principles**: 7 → 8, added Principle 8 (collective intelligence as protocol commons, Waze parallel)
- **Architecture**: "Modules" → "Extensions" terminology
- **Terminology**: "standard" → "protocol" throughout
- **Navigation**: Added link to GOVERNANCE.md
- **Repo structure**: Added GOVERNANCE.md entry

#### README.es.md
- Mirror of all README.md changes in Spanish
- New tagline: "La capa de orquestación para la economía de servicios en la era de agentes AI"
- Protocol primitives section added in Spanish
- Same principle, terminology, and architecture updates

#### PROTOCOL.md
- **Header**: Added tagline "The orchestration layer for the AI-agent service economy"
- **Table of contents**: Renumbered (2→14 sections, was 1→13). Added "Protocol Primitives" (§2) and "Network Intelligence" (§12)
- **§1 Overview**: Rewritten with orchestration layer positioning; added "no single implementation owns it"
- **§1 What Servicialo is NOT**: Added "Not owned by any single company" bullet
- **§2 Protocol Primitives** (new): Four primitives documented — Schedule Coordination, Identity Verification, Financial Settlement, Demand Signals
- **§9 Principles**: Added Principle 7 (collective intelligence as protocol commons) with Waze parallel and governance reference. Merged former Principles 5 (service is a product) and 6 (AI agents are first-class) into Principle 5 (a service is a machine-readable product)
- **§12 Network Intelligence** (new, replaces "Telemetry Extension"): Expanded with network effect narrative, contribute-to-access model, data governance principles
- **Terminology**: "standard" → "protocol" in all normative references
- **Cross-references**: Updated all section number references
- **Note**: Subsection numbering within sections (3.1, 3.5b, 5.1, etc.) retained from previous version — full renumber deferred

#### GOVERNANCE.md (new file)
- Protocol neutrality statement
- Network narrative with Waze parallel
- Data flow model: what flows to protocol layer vs. what stays at the node
- Five data governance principles: protocol commons, node sovereignty, anonymity by design, symmetric benefit, transparent aggregation
- Decision-making framework and governance evolution stages
- Relationship between Coordinalo (reference implementation) and the protocol

#### ROADMAP.md
- "open standard" → "open protocol"
- "7 principles" → "8 principles" → "7 principles" (after merging Principles 5+6)
- "Modular architecture" → "Layered architecture"
- Added "Network Intelligence" milestone in Mid Term
- Added GOVERNANCE.md reference in Done section
- "Finance module" / "Dispute resolution module" → "extension"

#### SOCIAL.md
- Complete rewrite of launch post and thread
- English-first with Spanish version added
- Messaging aligned to protocol positioning: four primitives, network effect, protocol commons
- Removed LATAM-specific framing from primary copy

#### CONTRIBUTING.md
- "open standard" → "open protocol"
- "Proposals to the Standard" → "Proposals to the Protocol"
- "the standard" → "the protocol" throughout
- "modules" → "extensions"
- "7 principles" → "8 principles" → "7 principles" (after merging Principles 5+6)

#### packages/mcp-server/README.md
- Added tagline in description
- Clarified Coordinalo as reference implementation
- "We're onboarding pilot implementations" → "Any platform can implement the protocol as a sovereign node"
- "standard" → "protocol"

#### CHANGELOG.md
- "open standard" → "open protocol"

#### CODE_OF_CONDUCT.md
- "open standard" → "open protocol"

### Language removed (per guidelines)

- "ganarle al caos" (not found in current docs)
- "socio de operaciones" (not found in current docs)
- Emotional product language
- References to specific modules (replaced with "extensions")

### Language introduced

- "orchestration layer"
- "protocol primitives" (scheduling, identity, financial settlement, demand signals)
- "protocol commons" / "collective intelligence"
- "sovereign node"
- "network intelligence"
- "contribute-to-access"
- Waze parallel for network effects
