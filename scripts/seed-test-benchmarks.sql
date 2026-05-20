-- Test fixtures for verify-benchmarks.mjs.
-- Run with: psql $DATABASE_URL -f scripts/seed-test-benchmarks.sql
-- Cleanup with: scripts/cleanup-test-benchmarks.sql
--
-- Convention: all test vertical/slug names begin with '_'. The
-- registry_entries INSERT trigger skips slugs matching '\_%', so
-- fixtures do not trigger admin alert emails.

-- 5 distinct fingerprints (k-anon threshold met) for vertical=_test_h3
INSERT INTO public.telemetry_events
  (protocol_version, node_version, event_type, vertical, region, occurred_at, org_fingerprint, payload)
VALUES
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '1 day',  'fp_test_a', '{"duration_bucket":"30-60min","outcome":"completed","evidence_completeness":"complete"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '2 day',  'fp_test_a', '{"duration_bucket":"60-90min","outcome":"completed","evidence_completeness":"complete"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '3 day',  'fp_test_b', '{"duration_bucket":"30-60min","outcome":"completed","evidence_completeness":"partial"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '4 day',  'fp_test_b', '{"duration_bucket":"30-60min","outcome":"no_show_client"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '5 day',  'fp_test_c', '{"duration_bucket":"15-30min","outcome":"completed","evidence_completeness":"complete"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '6 day',  'fp_test_c', '{"duration_bucket":"60-90min","outcome":"completed","evidence_completeness":"complete"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '7 day',  'fp_test_d', '{"duration_bucket":"30-60min","outcome":"partial"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '8 day',  'fp_test_d', '{"duration_bucket":"30-60min","outcome":"completed","evidence_completeness":"complete"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '9 day',  'fp_test_e', '{"duration_bucket":"90-120min","outcome":"completed","evidence_completeness":"complete"}'),
  ('0.9', 'test', 'service_completed', '_test_h3', 'XX', NOW() - INTERVAL '10 day', 'fp_test_e', '{"duration_bucket":"30-60min","outcome":"no_show_provider"}');

-- 1 fingerprint only (must be filtered out by k-anon) for vertical=_test_h3_low
INSERT INTO public.telemetry_events
  (protocol_version, node_version, event_type, vertical, region, occurred_at, org_fingerprint, payload)
VALUES
  ('0.9', 'test', 'service_completed', '_test_h3_low', 'XX', NOW() - INTERVAL '1 day', 'fp_solo', '{"duration_bucket":"30-60min","outcome":"completed"}'),
  ('0.9', 'test', 'service_completed', '_test_h3_low', 'XX', NOW() - INTERVAL '2 day', 'fp_solo', '{"duration_bucket":"60-90min","outcome":"completed"}');
