-- Removes the H4 verification fixtures inserted by seed-test-gating.sql.
-- Idempotent.

DELETE FROM public.telemetry_events
WHERE vertical IN ('_test_h4', '_test_h4_low');

DELETE FROM public.registry_entries
WHERE slug IN ('_test_h4_node', '_test_h4_node_idle');
