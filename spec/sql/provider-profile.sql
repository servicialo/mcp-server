-- =============================================================================
-- Servicialo v0.8 — Provider Profile & Discoverable Attributes
-- Reference implementation: Digitalo (Postgres / Supabase)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Provider Profiles — one per provider per organization context
-- -----------------------------------------------------------------------------

CREATE TABLE provider_profiles (
  profile_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      TEXT        NOT NULL,
  organization_id  TEXT        NOT NULL,
  display_name     TEXT        NOT NULL,
  slug             TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  version          INTEGER     NOT NULL DEFAULT 1,

  -- A provider has one profile per organization
  CONSTRAINT uq_provider_org UNIQUE (provider_id, organization_id),
  -- Slug must be unique within an organization
  CONSTRAINT uq_slug_org UNIQUE (organization_id, slug)
);

CREATE INDEX idx_profiles_provider ON provider_profiles (provider_id);
CREATE INDEX idx_profiles_org      ON provider_profiles (organization_id);

-- -----------------------------------------------------------------------------
-- 2. Provider Attributes — typed, origin-tracked, versioned
-- -----------------------------------------------------------------------------

CREATE TYPE attribute_category AS ENUM (
  'identity', 'capability', 'availability', 'geography', 'economic', 'trust'
);
CREATE TYPE attribute_origin AS ENUM ('declared', 'verified', 'inferred');
CREATE TYPE attribute_visibility AS ENUM ('public', 'unlisted', 'private');

CREATE TABLE provider_attributes (
  attribute_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     TEXT                NOT NULL,
  profile_id      UUID                NOT NULL REFERENCES provider_profiles(profile_id) ON DELETE CASCADE,
  category        attribute_category  NOT NULL,
  key             TEXT                NOT NULL,
  value           JSONB               NOT NULL,  -- string | number | boolean | string[]
  origin          attribute_origin    NOT NULL DEFAULT 'declared',
  confidence      NUMERIC(3,2)        CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  evidence_count  INTEGER,
  verified_by     TEXT,
  verified_at     TIMESTAMPTZ,
  visibility      attribute_visibility NOT NULL DEFAULT 'public',
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  version         INTEGER             NOT NULL DEFAULT 1,
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT now(),

  -- Confidence is required for inferred attributes
  CONSTRAINT chk_inferred_confidence CHECK (
    origin != 'inferred' OR confidence IS NOT NULL
  ),
  -- Verified attributes must have a verifier
  CONSTRAINT chk_verified_by CHECK (
    origin != 'verified' OR verified_by IS NOT NULL
  )
);

-- Primary query patterns
CREATE INDEX idx_attrs_provider     ON provider_attributes (provider_id);
CREATE INDEX idx_attrs_profile      ON provider_attributes (profile_id);
CREATE INDEX idx_attrs_category_key ON provider_attributes (category, key);
CREATE INDEX idx_attrs_visibility   ON provider_attributes (visibility);

-- GIN index for JSONB value queries (conditions_treated, techniques, etc.)
CREATE INDEX idx_attrs_value_gin    ON provider_attributes USING GIN (value);

-- Composite index for matching: category + key + visibility + origin
CREATE INDEX idx_attrs_matching ON provider_attributes (category, key, visibility, origin);

-- Unique constraint: one active attribute per provider per category+key per profile
CREATE UNIQUE INDEX idx_attrs_unique_active ON provider_attributes (profile_id, category, key);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Also bump the parent profile's updated_at and version
  UPDATE provider_profiles
  SET updated_at = now(), version = version + 1
  WHERE profile_id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attr_updated
  BEFORE UPDATE ON provider_attributes
  FOR EACH ROW EXECUTE FUNCTION update_profile_timestamp();

-- -----------------------------------------------------------------------------
-- 3. Attribute History — versioned snapshots (append-only)
-- -----------------------------------------------------------------------------

CREATE TABLE provider_attribute_history (
  history_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id   UUID        NOT NULL REFERENCES provider_attributes(attribute_id),
  provider_id    TEXT        NOT NULL,
  category       attribute_category NOT NULL,
  key            TEXT        NOT NULL,
  value          JSONB       NOT NULL,
  origin         attribute_origin NOT NULL,
  confidence     NUMERIC(3,2),
  version        INTEGER     NOT NULL,
  changed_by     TEXT        NOT NULL,  -- who made the change (user_id, 'system', agent_id)
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attr_history_attr ON provider_attribute_history (attribute_id, version DESC);
CREATE INDEX idx_attr_history_provider ON provider_attribute_history (provider_id, changed_at DESC);

-- Trigger: auto-snapshot on attribute update
CREATE OR REPLACE FUNCTION snapshot_attribute_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO provider_attribute_history (
    attribute_id, provider_id, category, key, value,
    origin, confidence, version, changed_by
  ) VALUES (
    OLD.attribute_id, OLD.provider_id, OLD.category, OLD.key, OLD.value,
    OLD.origin, OLD.confidence, OLD.version, current_setting('app.current_user', true)
  );
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attr_history
  BEFORE UPDATE ON provider_attributes
  FOR EACH ROW EXECUTE FUNCTION snapshot_attribute_history();

-- -----------------------------------------------------------------------------
-- 4. Supabase RLS
-- -----------------------------------------------------------------------------

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_attribute_history ENABLE ROW LEVEL SECURITY;

-- Public attributes are readable by anyone
CREATE POLICY attrs_public_read ON provider_attributes
  FOR SELECT USING (visibility = 'public');

-- Unlisted and private: require authenticated user
CREATE POLICY attrs_unlisted_read ON provider_attributes
  FOR SELECT USING (
    visibility = 'unlisted' AND auth.role() = 'authenticated'
  );

CREATE POLICY attrs_private_read ON provider_attributes
  FOR SELECT USING (
    visibility = 'private'
    AND (
      -- Provider can see their own private attributes
      provider_id = auth.uid()::text
      -- Or org members can see attributes in their org
      OR profile_id IN (
        SELECT profile_id FROM provider_profiles
        WHERE organization_id = current_setting('app.current_org', true)
      )
    )
  );

-- Profiles are publicly readable (they only contain display info)
CREATE POLICY profiles_public_read ON provider_profiles
  FOR SELECT USING (true);

-- Providers can update their own profiles
CREATE POLICY profiles_update_own ON provider_profiles
  FOR UPDATE USING (provider_id = auth.uid()::text);

-- Providers can insert/update their own attributes
CREATE POLICY attrs_write_own ON provider_attributes
  FOR ALL USING (provider_id = auth.uid()::text);

-- History is readable by the provider
CREATE POLICY history_read_own ON provider_attribute_history
  FOR SELECT USING (provider_id = auth.uid()::text);

-- -----------------------------------------------------------------------------
-- 5. Weighted Matching Query
-- -----------------------------------------------------------------------------

-- Function: match providers to a patient case
-- Returns providers ranked by weighted compatibility score

CREATE OR REPLACE FUNCTION match_providers(
  p_conditions    TEXT[],           -- conditions to match
  p_population    TEXT DEFAULT NULL, -- population segment
  p_modality      TEXT DEFAULT NULL, -- in_person | virtual | home_visit
  p_city          TEXT DEFAULT NULL,
  p_district      TEXT DEFAULT NULL,
  p_lat           NUMERIC DEFAULT NULL,
  p_lng           NUMERIC DEFAULT NULL,
  p_max_distance_km NUMERIC DEFAULT NULL,
  p_insurance     TEXT DEFAULT NULL,
  p_max_wait_days INTEGER DEFAULT NULL,
  p_org_id        TEXT DEFAULT NULL, -- optionally restrict to one org
  p_limit         INTEGER DEFAULT 20
)
RETURNS TABLE (
  provider_id      TEXT,
  profile_id       UUID,
  display_name     TEXT,
  organization_id  TEXT,
  compatibility_score NUMERIC,
  conditions_score NUMERIC,
  population_score NUMERIC,
  geography_score  NUMERIC,
  availability_score NUMERIC,
  economic_score   NUMERIC,
  trust_score      NUMERIC,
  distance_km      NUMERIC,
  next_available   TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH
  -- 1. Condition matching (weight: 3.0)
  condition_matches AS (
    SELECT
      a.provider_id,
      a.profile_id,
      COUNT(DISTINCT cond.elem)::NUMERIC / GREATEST(array_length(p_conditions, 1), 1) AS match_ratio,
      CASE a.origin
        WHEN 'inferred' THEN 2.0 * COALESCE(a.confidence, 0.5)
        WHEN 'verified' THEN 1.5
        ELSE 1.0
      END AS origin_weight
    FROM provider_attributes a,
         LATERAL jsonb_array_elements_text(a.value) AS cond(elem)
    WHERE a.category = 'capability'
      AND a.key = 'conditions_treated'
      AND a.visibility IN ('public', 'unlisted')
      AND cond.elem = ANY(p_conditions)
    GROUP BY a.provider_id, a.profile_id, a.origin, a.confidence
  ),

  -- 2. Population matching (weight: 2.5)
  population_matches AS (
    SELECT
      a.provider_id,
      1.0 AS match_score,
      CASE a.origin
        WHEN 'inferred' THEN 2.0 * COALESCE(a.confidence, 0.5)
        WHEN 'verified' THEN 1.5
        ELSE 1.0
      END AS origin_weight
    FROM provider_attributes a,
         LATERAL jsonb_array_elements_text(a.value) AS pop(elem)
    WHERE a.category = 'capability'
      AND a.key = 'populations_served'
      AND a.visibility IN ('public', 'unlisted')
      AND pop.elem = p_population
      AND p_population IS NOT NULL
  ),

  -- 3. Geography matching (weight: 2.0) — haversine distance
  geo_matches AS (
    SELECT
      a.provider_id,
      CASE
        WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
          -- Haversine distance in km
          6371 * acos(
            LEAST(1.0, cos(radians(p_lat)) * cos(radians((a.value->>'lat')::NUMERIC))
            * cos(radians((a.value->>'lng')::NUMERIC) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians((a.value->>'lat')::NUMERIC)))
          )
        ELSE NULL
      END AS distance_km
    FROM provider_attributes a
    WHERE a.category = 'geography'
      AND a.key = 'coordinates'
      AND a.visibility IN ('public', 'unlisted')
  ),

  -- 4. District/city match fallback
  city_matches AS (
    SELECT
      a.provider_id,
      1.0 AS match_score
    FROM provider_attributes a
    WHERE a.category = 'geography'
      AND (
        (a.key = 'district' AND a.value #>> '{}' = p_district AND p_district IS NOT NULL)
        OR (a.key = 'city' AND a.value #>> '{}' = p_city AND p_city IS NOT NULL)
      )
      AND a.visibility IN ('public', 'unlisted')
  ),

  -- 5. Insurance matching (weight: 1.0)
  insurance_matches AS (
    SELECT
      a.provider_id,
      1.0 AS match_score
    FROM provider_attributes a,
         LATERAL jsonb_array_elements_text(a.value) AS ins(elem)
    WHERE a.category = 'economic'
      AND a.key = 'insurance_accepted'
      AND a.visibility IN ('public', 'unlisted')
      AND ins.elem = p_insurance
      AND p_insurance IS NOT NULL
  ),

  -- 6. Trust metrics (weight: 1.0)
  trust_metrics AS (
    SELECT
      a.provider_id,
      CASE a.key
        WHEN 'rating_avg' THEN (a.value #>> '{}')::NUMERIC / 5.0
        WHEN 'services_completed' THEN LEAST((a.value #>> '{}')::NUMERIC / 500.0, 1.0)
        WHEN 'cancellation_rate' THEN 1.0 - (a.value #>> '{}')::NUMERIC
        ELSE 0.5
      END AS metric_score,
      a.key
    FROM provider_attributes a
    WHERE a.category = 'trust'
      AND a.key IN ('rating_avg', 'services_completed', 'cancellation_rate')
      AND a.visibility = 'public'
  ),

  -- Aggregate trust score per provider
  trust_agg AS (
    SELECT provider_id, AVG(metric_score) AS trust_score
    FROM trust_metrics
    GROUP BY provider_id
  ),

  -- 7. Availability (real-time, from scheduling system)
  availability AS (
    SELECT
      a.provider_id,
      CASE
        WHEN a.key = 'avg_wait_days' AND p_max_wait_days IS NOT NULL THEN
          CASE WHEN (a.value #>> '{}')::NUMERIC <= p_max_wait_days THEN 1.0 ELSE 0.0 END
        ELSE 0.5
      END AS avail_score,
      CASE
        WHEN a.key = 'next_available' THEN (a.value #>> '{}')::TIMESTAMPTZ
        ELSE NULL
      END AS next_available_ts
    FROM provider_attributes a
    WHERE a.category = 'availability'
      AND a.key IN ('avg_wait_days', 'next_available')
      AND a.visibility IN ('public', 'unlisted')
  ),

  avail_agg AS (
    SELECT
      provider_id,
      MAX(avail_score) AS avail_score,
      MIN(next_available_ts) AS next_available_ts
    FROM availability
    GROUP BY provider_id
  )

  -- Final scoring
  SELECT
    pp.provider_id,
    pp.profile_id,
    pp.display_name,
    pp.organization_id,
    -- Weighted composite score
    (
      COALESCE(cm.match_ratio * cm.origin_weight * 3.0, 0) +
      COALESCE(pm.match_score * pm.origin_weight * 2.5, 0) +
      COALESCE(
        CASE
          WHEN gm.distance_km IS NOT NULL AND p_max_distance_km IS NOT NULL THEN
            GREATEST(0, 1.0 - gm.distance_km / p_max_distance_km) * 2.0
          WHEN cim.match_score IS NOT NULL THEN cim.match_score * 2.0
          ELSE 0
        END, 0
      ) +
      COALESCE(aa.avail_score * 1.5, 0) +
      COALESCE(im.match_score * 1.0, 0) +
      COALESCE(ta.trust_score * 1.0, 0)
    ) / (3.0 + 2.5 + 2.0 + 1.5 + 1.0 + 1.0) AS compatibility_score,
    -- Individual dimension scores
    COALESCE(cm.match_ratio * cm.origin_weight, 0) AS conditions_score,
    COALESCE(pm.match_score * pm.origin_weight, 0) AS population_score,
    COALESCE(
      CASE
        WHEN gm.distance_km IS NOT NULL AND p_max_distance_km IS NOT NULL THEN
          GREATEST(0, 1.0 - gm.distance_km / p_max_distance_km)
        WHEN cim.match_score IS NOT NULL THEN cim.match_score
        ELSE 0
      END, 0
    ) AS geography_score,
    COALESCE(aa.avail_score, 0) AS availability_score,
    COALESCE(im.match_score, 0) AS economic_score,
    COALESCE(ta.trust_score, 0) AS trust_score,
    gm.distance_km,
    aa.next_available_ts AS next_available
  FROM provider_profiles pp
  LEFT JOIN condition_matches cm  ON cm.profile_id = pp.profile_id
  LEFT JOIN population_matches pm ON pm.provider_id = pp.provider_id
  LEFT JOIN geo_matches gm        ON gm.provider_id = pp.provider_id
  LEFT JOIN city_matches cim      ON cim.provider_id = pp.provider_id
  LEFT JOIN insurance_matches im  ON im.provider_id = pp.provider_id
  LEFT JOIN trust_agg ta          ON ta.provider_id = pp.provider_id
  LEFT JOIN avail_agg aa          ON aa.provider_id = pp.provider_id
  WHERE
    -- Must match at least one condition
    cm.match_ratio IS NOT NULL AND cm.match_ratio > 0
    -- Optional org filter
    AND (p_org_id IS NULL OR pp.organization_id = p_org_id)
    -- Optional distance filter
    AND (p_max_distance_km IS NULL OR gm.distance_km IS NULL OR gm.distance_km <= p_max_distance_km)
  ORDER BY compatibility_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- Example matching query:
-- "Postpartum patient, urinary incontinence + pelvic pain, Providencia, Fonasa"
-- -----------------------------------------------------------------------------

-- SELECT * FROM match_providers(
--   p_conditions    := ARRAY['urinary_incontinence', 'pelvic_pain'],
--   p_population    := 'postpartum',
--   p_modality      := 'in_person',
--   p_city          := 'Santiago',
--   p_district      := 'Providencia',
--   p_lat           := -33.42,
--   p_lng           := -70.61,
--   p_max_distance_km := 10,
--   p_insurance     := 'fonasa',
--   p_max_wait_days := 7,
--   p_limit         := 10
-- );
