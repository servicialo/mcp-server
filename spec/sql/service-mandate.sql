-- =============================================================================
-- Servicialo v0.8 — Delegated Agency Model
-- Reference implementation: Digitalo (Postgres / Supabase)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ServiceMandate — explicit delegation from principal to agent
-- -----------------------------------------------------------------------------

CREATE TYPE mandate_principal_type AS ENUM ('professional', 'patient', 'organization');
CREATE TYPE mandate_acting_for    AS ENUM ('professional', 'patient', 'organization');
CREATE TYPE mandate_status        AS ENUM ('active', 'expired', 'revoked', 'suspended');

CREATE TABLE service_mandates (
  mandate_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id      TEXT        NOT NULL,
  principal_type    mandate_principal_type NOT NULL,
  agent_id          TEXT        NOT NULL,
  agent_name        TEXT,
  acting_for        mandate_acting_for    NOT NULL,
  context           TEXT        NOT NULL,   -- e.g. 'org:mamapro', 'personal:maria'
  scopes            TEXT[]      NOT NULL CHECK (array_length(scopes, 1) >= 1),
  constraints       JSONB       DEFAULT '{}',
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  revocation_reason TEXT,
  status            mandate_status NOT NULL DEFAULT 'active',
  metadata          JSONB       DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Temporal validity: expires_at must be after issued_at
  CONSTRAINT chk_temporal_validity CHECK (expires_at > issued_at),

  -- No self-issuance: principal cannot be the agent
  CONSTRAINT chk_no_self_issuance CHECK (principal_id != agent_id),

  -- Revocation consistency
  CONSTRAINT chk_revocation_consistency CHECK (
    (status = 'revoked' AND revoked_at IS NOT NULL) OR
    (status != 'revoked')
  )
);

-- Fast lookups by agent, principal, context, and status
CREATE INDEX idx_mandates_agent_status      ON service_mandates (agent_id, status);
CREATE INDEX idx_mandates_principal         ON service_mandates (principal_id);
CREATE INDEX idx_mandates_context_status    ON service_mandates (context, status);
CREATE INDEX idx_mandates_expires_at        ON service_mandates (expires_at)
  WHERE status = 'active';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_mandate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mandate_updated_at
  BEFORE UPDATE ON service_mandates
  FOR EACH ROW EXECUTE FUNCTION update_mandate_timestamp();

-- -----------------------------------------------------------------------------
-- 2. Mandate Audit Log — append-only record of every agent action
-- -----------------------------------------------------------------------------

CREATE TYPE audit_result AS ENUM ('success', 'failure', 'rejected', 'halted');

CREATE TABLE mandate_audit_log (
  audit_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id     UUID        NOT NULL REFERENCES service_mandates(mandate_id),
  agent_id       TEXT        NOT NULL,
  principal_id   TEXT        NOT NULL,
  acting_for     mandate_acting_for NOT NULL,
  action         TEXT        NOT NULL,   -- e.g. 'scheduling.book', 'lifecycle.transition'
  action_input   JSONB       DEFAULT '{}',
  action_result  audit_result NOT NULL,
  failure_reason TEXT,
  resource_id    TEXT,                    -- primary affected resource (service_id, patient_id, etc.)
  context        TEXT        NOT NULL,
  ip_address     INET,
  request_id     TEXT,                   -- correlation ID for distributed tracing
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only: revoke INSERT/UPDATE/DELETE permissions from application role,
-- grant only INSERT. This is enforced at the application level as well.
-- REVOKE UPDATE, DELETE ON mandate_audit_log FROM app_role;

-- Query patterns: by mandate, by principal, by time range
CREATE INDEX idx_audit_mandate_id   ON mandate_audit_log (mandate_id, timestamp DESC);
CREATE INDEX idx_audit_principal_id ON mandate_audit_log (principal_id, timestamp DESC);
CREATE INDEX idx_audit_agent_id     ON mandate_audit_log (agent_id, timestamp DESC);
CREATE INDEX idx_audit_resource_id  ON mandate_audit_log (resource_id)
  WHERE resource_id IS NOT NULL;
CREATE INDEX idx_audit_timestamp    ON mandate_audit_log (timestamp DESC);

-- -----------------------------------------------------------------------------
-- 3. Daily action counter — for max_actions_per_day constraint enforcement
-- -----------------------------------------------------------------------------

CREATE TABLE mandate_daily_actions (
  mandate_id   UUID        NOT NULL REFERENCES service_mandates(mandate_id),
  action_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  action_count INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (mandate_id, action_date)
);

-- Increment function (called by middleware on each successful action)
CREATE OR REPLACE FUNCTION increment_mandate_action_count(
  p_mandate_id UUID,
  p_date       DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO mandate_daily_actions (mandate_id, action_date, action_count)
  VALUES (p_mandate_id, p_date, 1)
  ON CONFLICT (mandate_id, action_date)
  DO UPDATE SET action_count = mandate_daily_actions.action_count + 1
  RETURNING action_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4. Supabase Row-Level Security (RLS) policies
-- -----------------------------------------------------------------------------

ALTER TABLE service_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_audit_log ENABLE ROW LEVEL SECURITY;

-- Principals can read their own mandates
CREATE POLICY mandate_select_principal ON service_mandates
  FOR SELECT USING (principal_id = auth.uid()::text);

-- Principals can create mandates (issuance)
CREATE POLICY mandate_insert_principal ON service_mandates
  FOR INSERT WITH CHECK (principal_id = auth.uid()::text);

-- Principals can revoke their own mandates (update status only)
CREATE POLICY mandate_update_principal ON service_mandates
  FOR UPDATE USING (principal_id = auth.uid()::text);

-- Agents can read mandates issued to them
CREATE POLICY mandate_select_agent ON service_mandates
  FOR SELECT USING (agent_id = auth.uid()::text);

-- Audit log: principals can read audit entries for their mandates
CREATE POLICY audit_select_principal ON mandate_audit_log
  FOR SELECT USING (principal_id = auth.uid()::text);

-- Audit log: service role can insert (write-ahead audit from middleware)
CREATE POLICY audit_insert_service ON mandate_audit_log
  FOR INSERT WITH CHECK (true);
-- NOTE: In production, restrict to service_role only.

-- -----------------------------------------------------------------------------
-- 5. Materialized view: active mandates (for fast validation)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW active_mandates AS
SELECT *
FROM service_mandates
WHERE status = 'active'
  AND expires_at > now()
  AND revoked_at IS NULL;

-- -----------------------------------------------------------------------------
-- 6. Function: validate mandate for an action (used by middleware)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_mandate(
  p_mandate_id  UUID,
  p_agent_id    TEXT,
  p_scope       TEXT,
  p_context     TEXT
)
RETURNS TABLE (
  is_valid       BOOLEAN,
  failure_reason TEXT,
  mandate        JSONB
) AS $$
DECLARE
  v_mandate service_mandates%ROWTYPE;
BEGIN
  -- 1. Existence
  SELECT * INTO v_mandate FROM service_mandates WHERE mandate_id = p_mandate_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Mandate not found'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- 2. Status
  IF v_mandate.status != 'active' THEN
    RETURN QUERY SELECT false,
      format('Mandate status is %s', v_mandate.status)::TEXT,
      to_jsonb(v_mandate);
    RETURN;
  END IF;

  -- 3. Temporal validity
  IF now() >= v_mandate.expires_at THEN
    RETURN QUERY SELECT false, 'Mandate has expired'::TEXT, to_jsonb(v_mandate);
    RETURN;
  END IF;

  IF v_mandate.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Mandate has been revoked'::TEXT, to_jsonb(v_mandate);
    RETURN;
  END IF;

  -- 4. Agent identity
  IF v_mandate.agent_id != p_agent_id THEN
    RETURN QUERY SELECT false, 'Agent ID mismatch'::TEXT, to_jsonb(v_mandate);
    RETURN;
  END IF;

  -- 5. Scope coverage
  IF NOT (p_scope = ANY(v_mandate.scopes)) THEN
    RETURN QUERY SELECT false,
      format('Scope %s not granted', p_scope)::TEXT,
      to_jsonb(v_mandate);
    RETURN;
  END IF;

  -- 6. Context match
  IF v_mandate.context != p_context AND NOT p_context LIKE v_mandate.context || ':%' THEN
    RETURN QUERY SELECT false,
      format('Context mismatch: mandate=%s, requested=%s', v_mandate.context, p_context)::TEXT,
      to_jsonb(v_mandate);
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, NULL::TEXT, to_jsonb(v_mandate);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
