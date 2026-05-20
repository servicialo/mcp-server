-- Fixtures for verify-benchmarks-gating.mjs.
-- Idempotent: safe to re-run.
--
-- NOTE: every test slug starts with '_' on purpose. The registry_entries
-- INSERT trigger (notify_registry_alert) skips slugs matching '\_%', so
-- these fixtures do not spam the admin inbox. Do not rename them.
--
-- Sets up 4 scenarios:
--   1. Tier 2 contributor (60 events in last 30 days, 50+ threshold)
--   2. Tier 1 identified-but-idle node (registered, 0 contributions)
--   3. Vertical _test_h4 has ≥5 distinct fingerprints (k-anon passes)
--   4. Vertical _test_h4_low has 1 fingerprint (k-anon fails)

-- Clean slate (the registry_entries table has no UNIQUE constraint on slug,
-- so we delete then insert rather than ON CONFLICT)
DELETE FROM public.telemetry_events WHERE vertical IN ('_test_h4', '_test_h4_low');
DELETE FROM public.registry_entries WHERE slug IN ('_test_h4_node', '_test_h4_node_idle');

-- Tier 2 node: contributing.   Tier 1 node: identified but idle.
INSERT INTO public.registry_entries (slug, country, display_name, endpoint_url, implementer, ownership_token, discoverable)
VALUES
  ('_test_h4_node',      'XX', 'Test H4 Contributor', 'http://test.local', 'test', 'test_h4_token_secret_value_for_verify', false),
  ('_test_h4_node_idle', 'XX', 'Test H4 Idle',        'http://test.local', 'test', 'test_h4_idle_token_secret_for_verify',  false);

-- 60 events from the tier-2 node's fingerprint (spread across last 30 days)
INSERT INTO public.telemetry_events
  (protocol_version, node_version, event_type, vertical, region, occurred_at, org_fingerprint, payload)
SELECT
  '0.9',
  'test',
  'service_completed',
  '_test_h4',
  'XX',
  NOW() - (INTERVAL '1 day' * ((n % 28) + 1)),
  encode(digest('_test_h4_node::servicialo-op-v0.9', 'sha256'), 'hex'),
  jsonb_build_object('duration_bucket', '30-60min', 'outcome', 'completed', 'evidence_completeness', 'complete')
FROM generate_series(1, 60) n;

-- 4 additional fingerprints (1 event each) to bring vertical _test_h4 to k-anon ≥5
INSERT INTO public.telemetry_events
  (protocol_version, node_version, event_type, vertical, region, occurred_at, org_fingerprint, payload)
SELECT
  '0.9',
  'test',
  'service_completed',
  '_test_h4',
  'XX',
  NOW() - INTERVAL '1 day',
  'fp_other_' || n,
  jsonb_build_object('duration_bucket', '60-90min', 'outcome', 'completed')
FROM generate_series(1, 4) n;

-- Low-k segment: 1 fingerprint only, should fail k-anon
INSERT INTO public.telemetry_events
  (protocol_version, node_version, event_type, vertical, region, occurred_at, org_fingerprint, payload)
VALUES
  ('0.9', 'test', 'service_completed', '_test_h4_low', 'XX', NOW() - INTERVAL '1 day', 'fp_solo_h4', '{"duration_bucket":"30-60min","outcome":"completed"}');
