# Provider Profile & Discoverable Attributes

> **Servicialo Protocol v0.8 — Section 15**
> **Status:** Draft

---

## 15.1 Motivation

Professional service marketplaces face a structural information asymmetry: the patient knows what hurts, but does not know who is best equipped to treat it. The professional knows their capabilities, but cannot efficiently signal them to the right patients. AI agents can bridge this gap — but only if provider attributes are structured, machine-readable, and trustworthy.

Most platforms treat provider profiles as free-text biographies optimized for human browsing. This approach fails on three fronts:

1. **Search engines** cannot extract structured capabilities from prose. A kinesiologist who specializes in pelvic floor rehabilitation for postpartum patients is invisible to a search for "postpartum pelvic pain" unless she uses those exact words.

2. **AI agents** cannot match a patient case to a provider without structured vocabulary. An agent that receives "38-year-old, 6 weeks postpartum, urinary incontinence" needs to query providers by condition treated, population served, and technique applied — not parse a bio paragraph.

3. **Self-reported attributes decay.** A professional may list specialties they no longer practice, or omit capabilities they have developed since writing their profile. The operational record — what conditions they actually treat, what outcomes they achieve — is more reliable than self-description.

The Provider Profile model addresses all three by defining attributes as structured, typed, and origin-tracked objects. Each attribute declares whether it was stated by the professional (declared), confirmed by a trusted authority (verified), or derived from operational data (inferred). The matching engine weights them accordingly.

### Why protocol-level, not implementation-level

Provider attributes belong in the protocol — not in each implementation — for the same reason that service lifecycle states do: interoperability. When a patient's agent queries providers across multiple clinics (each running a different implementation), the attributes must be comparable. A `condition:urinary_incontinence` in Coordinalo must mean the same thing as in any other compliant implementation. Without protocol-level taxonomy, every platform invents its own vocabulary, and cross-platform discovery becomes impossible.

---

## 15.2 Attribute Model

### 15.2.1 Formal structure

A `ProviderAttribute` is the atomic unit of provider description.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attribute_id` | string (UUID v4) | ✅ | Unique identifier. |
| `provider_id` | string | ✅ | The professional this attribute describes. |
| `category` | enum | ✅ | Attribute category. See §15.3. |
| `key` | string | ✅ | Attribute key within category. Follows the taxonomy in §15.3. |
| `value` | string \| number \| boolean \| string[] | ✅ | The attribute value. Type depends on the attribute definition. |
| `origin` | enum | ✅ | `declared` \| `verified` \| `inferred` — how this attribute was established. |
| `confidence` | number (0.0–1.0) | | For `inferred` attributes: statistical confidence. 1.0 = absolute certainty (e.g., service count). 0.7 = derived from limited data. Not applicable for `declared` or `verified`. |
| `evidence_count` | integer | | For `inferred` attributes: number of data points that support this inference. |
| `verified_by` | string | | For `verified` attributes: the entity that confirmed this (e.g., `"colegio_kinesiologo_cl"`, `"org:mamapro"`). |
| `verified_at` | datetime (ISO 8601) | | When verification occurred. |
| `visibility` | enum | ✅ | `public` \| `unlisted` \| `private` — inherits from the v0.7 visibility model. |
| `valid_from` | datetime (ISO 8601) | | When this attribute became valid. |
| `valid_until` | datetime (ISO 8601) | | When this attribute expires (e.g., a certification with expiry date). Null = indefinite. |
| `version` | integer | ✅ | Monotonically increasing version number. Enables history tracking. |
| `updated_at` | datetime (ISO 8601) | ✅ | Last modification timestamp. |

### 15.2.2 Origin semantics

| Origin | Definition | Weight in matching | Example |
|--------|------------|-------------------|---------|
| `declared` | The professional stated this attribute. Not independently confirmed. | Base weight (1.0x) | "I specialize in sports rehabilitation" |
| `verified` | A trusted authority confirmed this attribute. The `verified_by` entity vouches for its accuracy. | High weight (1.5x) | Professional license confirmed by regulatory body |
| `inferred` | Derived from operational data by the implementation. The `confidence` field indicates reliability. | Highest weight (2.0x × confidence) | 85% of sessions in last 12 months involved postpartum patients |

**Design rationale:** Inferred attributes carry the highest weight because they reflect what a professional actually does, not what they claim to do. A kinesiologist who declares "sports rehabilitation" but whose last 200 sessions were all pelvic floor therapy is, operationally, a pelvic floor specialist. The matching engine should reflect this reality.

### 15.2.3 Versioning

Attributes are versioned, not overwritten. When an attribute changes:
- The `version` field increments.
- The previous version is preserved in the attribute history.
- The `updated_at` timestamp reflects the latest version.

This enables:
- Tracking how a provider's profile evolves over time.
- Auditing who changed what and when.
- Rolling back erroneous changes.

---

## 15.3 Base Taxonomy

The base taxonomy defines the minimum attribute set that every Servicialo implementation must support. Implementations may extend it with domain-specific attributes using the `x-{domain}:` prefix (e.g., `x-health:clinical_approach`).

### 15.3.1 Identity (`identity`)

Stable, foundational attributes about the professional.

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `profession` | string | Primary profession | `"kinesiologist"` |
| `primary_specialty` | string | Main area of practice | `"pelvic_floor_rehabilitation"` |
| `subspecialties` | string[] | Additional areas of expertise | `["postpartum", "urinary_incontinence"]` |
| `title` | string | Academic or professional title | `"Lic. Kinesiología"` |
| `training_institution` | string | Where the professional studied | `"Universidad de Chile"` |
| `license_number` | string | Professional license/registration | `"CK-12345"` |
| `license_jurisdiction` | string | Where the license is valid | `"CL"` |
| `years_experience` | integer | Years in practice | `12` |
| `languages` | string[] | Languages spoken | `["es", "en"]` |
| `bio` | string | Free-text biography (for human display) | `"Kinesióloga especialista en..."` |
| `photo_url` | string (URL) | Profile photo | |

### 15.3.2 Clinical Capability (`capability`)

What the professional can treat and how. This is the core of agent-driven matching.

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `conditions_treated` | string[] | Conditions/diagnoses the provider handles | `["urinary_incontinence", "pelvic_pain", "diastasis_recti"]` |
| `techniques` | string[] | Methods and techniques applied | `["biofeedback", "manual_therapy", "exercise_prescription"]` |
| `populations_served` | string[] | Patient demographics served | `["postpartum", "pregnant", "elderly", "pediatric", "athletes"]` |
| `age_range` | object | Age range served: `{ min: 0, max: 99 }` | `{ "min": 18, "max": 65 }` |
| `contraindications` | string[] | Conditions the provider does NOT treat | `["surgical_cases", "oncology"]` |
| `typical_session_count` | object | Typical treatment duration: `{ min: 4, max: 12 }` | For treatment planning |
| `outcome_metrics` | string[] | Outcomes the provider tracks | `["pain_scale", "functional_score", "satisfaction"]` |

### 15.3.3 Availability & Modality (`availability`)

How and when the provider can be reached. Most of these are **real-time attributes** (see §15.4).

| Key | Type | Origin | Description |
|-----|------|--------|-------------|
| `modalities` | string[] | declared | `["in_person", "virtual", "home_visit"]` |
| `typical_hours` | object | inferred | Usual schedule blocks derived from booking history |
| `avg_wait_days` | number | inferred | Average days from request to first available slot |
| `next_available` | datetime | inferred (real-time) | Next open slot — synced from scheduling system |
| `accepts_new_patients` | boolean | declared | Whether currently accepting new patients |
| `max_daily_sessions` | integer | declared | Self-imposed daily limit |

### 15.3.4 Geographic Context (`geography`)

Where the provider operates.

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `country` | string (ISO 3166-1) | Country | `"CL"` |
| `region` | string | Administrative region | `"Región Metropolitana"` |
| `city` | string | City | `"Santiago"` |
| `district` | string | Sub-city division (comuna, barrio) | `"Providencia"` |
| `address` | string | Primary practice address | |
| `coordinates` | object | `{ lat, lng }` | `{ "lat": -33.42, "lng": -70.61 }` |
| `service_radius_km` | number | For home visits: max distance served | `15` |
| `remote_policy` | string | Virtual care availability | `"same_region"`, `"national"`, `"international"` |

### 15.3.5 Economic Profile (`economic`)

Pricing and payment attributes.

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `price_range` | object | `{ min, max, currency }` | `{ "min": 25000, "max": 45000, "currency": "CLP" }` |
| `insurance_accepted` | string[] | Accepted insurance types | `["fonasa", "isapre_banmedica"]` |
| `payment_methods` | string[] | Accepted payment methods | `["transfer", "cash", "debit", "credit"]` |
| `cancellation_policy` | string | Human-readable policy | `"24h notice required"` |
| `cancellation_window_hours` | integer | Machine-readable cancellation window | `24` |
| `offers_packages` | boolean | Whether multi-session packages are available | `true` |

### 15.3.6 Trust Metrics (`trust`)

System-generated attributes. These are always `origin: "inferred"` and `visibility: "public"`.

| Key | Type | Description |
|-----|------|-------------|
| `rating_avg` | number (1.0–5.0) | Average client rating |
| `rating_count` | integer | Number of ratings |
| `cancellation_rate` | number (0.0–1.0) | Provider-initiated cancellation rate |
| `no_show_rate` | number (0.0–1.0) | Client no-show rate (reflects case selection) |
| `response_time_hours` | number | Average time to respond to booking requests |
| `platform_tenure_months` | integer | Months active on the platform |
| `services_completed` | integer | Total completed services |
| `repeat_client_rate` | number (0.0–1.0) | Percentage of clients who return |

### 15.3.7 Domain Extensions

Implementations may define domain-specific attribute categories using the `x-{domain}:` prefix:

```
x-health:clinical_approach      → "holistic" | "evidence_based" | "functional"
x-health:emr_integration        → "epic" | "medilink" | "custom"
x-legal:bar_association         → "colegio_abogados_cl"
x-legal:practice_areas          → ["family_law", "labor_law"]
x-education:certification_body  → "mineduc_cl"
```

Domain extensions are not validated by the protocol but must follow the `ProviderAttribute` structure.

---

## 15.4 Real-Time vs. Static Attributes

Attributes fall into two categories based on their update frequency:

| Type | Update pattern | Source | Examples |
|------|---------------|--------|----------|
| **Static** | Changed by human action (profile edit, certification renewal) | Provider, admin, verification authority | `profession`, `license_number`, `conditions_treated` |
| **Real-time** | Updated automatically from operational data | Scheduling system, analytics pipeline | `avg_wait_days`, `next_available`, `cancellation_rate`, `rating_avg` |

### 15.4.1 Synchronization model

Real-time attributes are not stored in the profile database as primary sources. Instead:

1. The **scheduling system** (e.g., Coordinalo) is the source of truth for availability attributes.
2. The **analytics pipeline** computes trust metrics from the service history on a defined cadence (recommended: daily for rates, real-time for `next_available`).
3. The **profile API** merges static attributes from the profile store with real-time attributes from the scheduling and analytics systems at query time.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Profile Store   │     │  Scheduling API   │     │  Analytics DB   │
│  (static attrs)  │     │  (Coordinalo)     │     │  (computed)     │
└────────┬────────┘     └────────┬──────────┘     └────────┬────────┘
         │                       │                          │
         └───────────┬───────────┘──────────────────────────┘
                     │
              ┌──────▼───────┐
              │  Profile API  │
              │  (merge at    │
              │  query time)  │
              └──────┬───────┘
                     │
           ┌─────────▼─────────┐
           │  Discovery / MCP   │
           │  (consumer)        │
           └───────────────────┘
```

### 15.4.2 Staleness indicators

Each real-time attribute carries an implicit freshness guarantee:

| Attribute | Maximum staleness |
|-----------|-------------------|
| `next_available` | 5 minutes |
| `avg_wait_days` | 24 hours |
| `cancellation_rate` | 24 hours |
| `rating_avg` | 1 hour |
| `services_completed` | 24 hours |

If an attribute exceeds its staleness threshold, implementations should either refresh it on demand or exclude it from matching (with a flag indicating unavailability).

---

## 15.5 Semantic Matching

### 15.5.1 Query model

An agent with scope `discovery:read` (or using public discovery tools without a mandate) can query the provider directory using structured criteria:

```json
{
  "query": {
    "conditions": ["urinary_incontinence", "pelvic_pain"],
    "population": "postpartum",
    "modality": "in_person",
    "geography": {
      "city": "Santiago",
      "district": "Providencia",
      "max_distance_km": 10
    },
    "insurance": "fonasa",
    "max_wait_days": 7,
    "language": "es"
  },
  "patient_context": {
    "age": 34,
    "sex": "female",
    "weeks_postpartum": 8
  }
}
```

### 15.5.2 Scoring model

The matching engine produces a **compatibility score** for each provider based on weighted attribute matching:

```
score = Σ (match_weight × origin_weight × attribute_score)
```

Where:
- **match_weight** depends on query priority: conditions (3.0), population (2.5), geography (2.0), availability (1.5), economic (1.0), trust (1.0)
- **origin_weight** depends on attribute origin: declared (1.0), verified (1.5), inferred (2.0 × confidence)
- **attribute_score** is binary (0/1) for exact matches, or continuous (0.0–1.0) for fuzzy/distance-based matches

### 15.5.3 Result structure

```json
{
  "results": [
    {
      "provider_id": "provider_barbara",
      "provider_name": "Dra. Bárbara Figueroa",
      "compatibility_score": 0.92,
      "match_breakdown": {
        "conditions": { "score": 1.0, "origin": "inferred", "confidence": 0.95 },
        "population": { "score": 1.0, "origin": "inferred", "confidence": 0.88 },
        "geography": { "score": 0.85, "origin": "declared", "distance_km": 3.2 },
        "availability": { "score": 0.9, "origin": "inferred", "next_available": "2026-03-12" },
        "insurance": { "score": 1.0, "origin": "declared" },
        "trust": { "score": 0.88, "rating": 4.8, "services_completed": 1247 }
      },
      "profile_url": "https://servicialo.com/cl/mamapro/barbara-figueroa"
    }
  ],
  "query_metadata": {
    "total_matches": 12,
    "returned": 10,
    "staleness_warnings": []
  }
}
```

### 15.5.4 Privacy-aware matching

Matching operates on different attribute sets depending on the requester:

| Requester | Attributes visible | Mandate required? |
|-----------|-------------------|-------------------|
| Public search (human or agent, no auth) | `visibility: "public"` only | No |
| Authenticated agent with `discovery:read` | `public` + `unlisted` | Yes |
| Authenticated agent with `patient:read` + `discovery:read` | `public` + `unlisted` + `private` (for patients in their mandate context) | Yes |

---

## 15.6 JSON-LD Schema for Semantic Indexation

Provider profiles are serializable as JSON-LD for search engine indexation. The protocol defines a minimal JSON-LD context that maps provider attributes to Schema.org types.

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "servicialo": "https://servicialo.com/schema/",
    "MedicalBusiness": "https://schema.org/MedicalBusiness",
    "Physician": "https://schema.org/Physician"
  },
  "@type": ["MedicalBusiness", "servicialo:ProviderProfile"],
  "@id": "https://servicialo.com/cl/mamapro/barbara-figueroa",
  "name": "Dra. Bárbara Figueroa",
  "description": "Kinesióloga especialista en piso pélvico y rehabilitación postparto",
  "medicalSpecialty": {
    "@type": "MedicalSpecialty",
    "name": "Pelvic Floor Rehabilitation"
  },
  "availableService": [
    {
      "@type": "MedicalProcedure",
      "name": "Sesión de kinesiología pélvica",
      "procedureType": "physical_therapy_session"
    }
  ],
  "areaServed": {
    "@type": "City",
    "name": "Santiago",
    "containedInPlace": {
      "@type": "AdministrativeArea",
      "name": "Región Metropolitana"
    }
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Providencia",
    "addressRegion": "Región Metropolitana",
    "addressCountry": "CL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -33.42,
    "longitude": -70.61
  },
  "priceRange": "CLP 25,000 - 45,000",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.8,
    "reviewCount": 342,
    "bestRating": 5
  },
  "servicialo:trustMetrics": {
    "cancellationRate": 0.02,
    "responseTimeHours": 1.5,
    "servicesCompleted": 1247,
    "platformTenureMonths": 60
  },
  "servicialo:capabilities": {
    "conditionsTreated": ["urinary_incontinence", "pelvic_pain", "diastasis_recti"],
    "populationsServed": ["postpartum", "pregnant", "elderly"],
    "techniques": ["biofeedback", "manual_therapy", "exercise_prescription"]
  }
}
```

### 15.6.1 SEO mapping rules

| Provider attribute | Schema.org property | Notes |
|-------------------|---------------------|-------|
| `identity.profession` | `@type` | Map to appropriate Schema.org type |
| `identity.primary_specialty` | `medicalSpecialty` | For health vertical |
| `identity.bio` | `description` | |
| `geography.city` | `areaServed` | |
| `geography.address` | `address` | |
| `geography.coordinates` | `geo` | |
| `economic.price_range` | `priceRange` | Formatted as string |
| `trust.rating_avg` | `aggregateRating.ratingValue` | |
| `trust.rating_count` | `aggregateRating.reviewCount` | |

Attributes without a Schema.org equivalent are placed under the `servicialo:` namespace.

---

## 15.7 Integration with Service Manifest and Delegated Agency Model

### 15.7.1 Provider profile in the service manifest

The `provider` dimension of a service (§4, Dimension 3.2) is extended with an optional `profile` reference:

```yaml
provider:
  id: string*
  credentials: string[]
  trust_score: number
  organization_id: string*
  profile_id: string             # NEW in v0.8 — reference to ProviderProfile
```

The `profile_id` links to the full provider profile. When a service is returned by the MCP server, the response includes the provider's public attributes inline (to avoid an extra round trip), while `unlisted` and `private` attributes require a separate query with appropriate mandate.

### 15.7.2 Mandate scopes for profile access

| Action | Required scope | Notes |
|--------|---------------|-------|
| Browse public profiles | None (Phase 1 discovery tools) | `visibility: "public"` attributes only |
| Query unlisted attributes | `discovery:read` | For programmatic matching with extended data |
| Read private attributes | `patient:read` or `service:read` | Only within mandate context |
| Update profile attributes | `profile:write` | Professional's own profile or org admin |

### 15.7.3 Profile as mandate context

A provider's profile is scoped to their organizational context. When a professional works at multiple organizations, they may have different attribute sets per context:

```
provider_barbara @ org:mamapro  → pelvic_floor, postpartum, biofeedback
provider_barbara @ org:clinica2 → sports_rehab, athletes, manual_therapy
```

The `context` field in the ServiceMandate determines which profile variant the agent accesses.

---

## 15.8 Reference Use Cases

### 15.8.1 Human search by specialty and geography

**Scenario:** A 34-year-old postpartum patient in Providencia searches Google for "kinesióloga piso pélvico providencia".

**Flow:**
1. Google indexes the JSON-LD structured data from the provider's Servicialo profile page.
2. The search result displays: name, specialty, rating (4.8), price range (CLP 25,000–45,000), and address.
3. Patient clicks through to the Servicialo profile page, which shows public attributes: conditions treated, techniques, availability, and insurance accepted.
4. Patient requests an appointment through the page — no agent involved.

**Attributes used:** `identity.primary_specialty`, `geography.district`, `trust.rating_avg`, `economic.price_range`, `capability.conditions_treated`.

### 15.8.2 Agent-driven matching from patient case

**Scenario:** Patient María's health agent (mandate with `discovery:read` + `schedule:read`) receives a referral: "pelvic pain, 8 weeks postpartum, prefers in-person in Santiago, has Fonasa."

**Flow:**
1. Agent constructs a structured query (§15.5.1) from the referral data.
2. Agent calls `registry.search` with structured criteria — no mandate needed for public discovery.
3. Matching engine scores providers using the weighted model (§15.5.2).
4. Agent receives ranked results with compatibility scores and match breakdowns.
5. Agent selects the top-ranked provider whose `next_available` is within the patient's requested timeframe.
6. Agent uses its scheduling mandate (`schedule:write`) to book the appointment.
7. The booking's `transition.metadata` records both the matching score and the mandate used.

**Attributes used:** `capability.conditions_treated` (inferred, confidence 0.95), `capability.populations_served` (inferred, confidence 0.88), `geography.coordinates` (declared), `availability.next_available` (real-time), `economic.insurance_accepted` (declared), `trust.rating_avg` (inferred).

### 15.8.3 Multi-clinic discovery with conflict-of-interest protection

**Scenario:** An organizational agent for a health network needs to match patients across 5 clinics.

**Flow:**
1. Agent holds a mandate with `context: "org:health_network"`, `acting_for: "organization"`, scope `discovery:read`.
2. Agent queries provider profiles across all clinics in the network.
3. For each patient case, the agent produces a ranked list of providers — considering capability match, availability, geographic proximity, and trust metrics.
4. The agent does NOT book appointments (lacks `schedule:write`) — it presents recommendations to the human administrator.
5. The conflict-of-interest rule ensures this organizational agent cannot simultaneously act as a patient agent for any of the patients being matched.

---

## 15.9 Schema

**Machine-readable JSON Schema:** [`schema/provider-profile.schema.json`](./schema/provider-profile.schema.json)

```yaml
provider_profile:
  profile_id: string*             # UUID v4
  provider_id: string*            # Reference to provider entity
  organization_id: string*        # Context for this profile variant
  display_name: string*           # Human-readable name
  slug: string*                   # URL-safe identifier
  attributes: provider_attribute[]  # Array of typed attributes
  created_at: datetime*
  updated_at: datetime*
  version: integer*               # Profile-level version

provider_attribute:
  attribute_id: string*           # UUID v4
  provider_id: string*
  category: enum*                 # identity | capability | availability | geography | economic | trust
  key: string*                    # Attribute key within category
  value: any*                     # string | number | boolean | string[]
  origin: enum*                   # declared | verified | inferred
  confidence: number              # 0.0–1.0, for inferred attributes
  evidence_count: integer         # Data points supporting inference
  verified_by: string
  verified_at: datetime
  visibility: enum*               # public | unlisted | private
  valid_from: datetime
  valid_until: datetime
  version: integer*
  updated_at: datetime*
```

Fields marked with `*` are required.
