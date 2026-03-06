# Documentation Changelog

Changes to Servicialo documentation, messaging, and positioning.

---

## 2026-03-06 — Messaging overhaul: neutral protocol positioning

### Positioning change

Servicialo is now positioned as **neutral infrastructure** — an open protocol, not a product. The new tagline:

> **"The orchestration layer for the AI-agent service economy"**

### Files changed

#### README.md
- **Tagline**: "The open standard for services" → "The orchestration layer for the AI-agent service economy"
- **Subtitle**: Rewritten to emphasize four protocol primitives (scheduling, identity, delivery verification, financial settlement)
- **Tags**: `Open standard` → `Open protocol` · `Agent-native` · `MIT license`
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
- **§8 Principles**: Added Principle 8 (collective intelligence as protocol commons) with Waze parallel and governance reference
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
- "7 principles" → "8 principles"
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
- "7 principles" → "8 principles"

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
