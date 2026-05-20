-- Removes the H3 verification fixtures inserted by seed-test-benchmarks.sql.
-- Idempotent.
DELETE FROM public.telemetry_events
WHERE vertical IN ('_test_h3', '_test_h3_low');
