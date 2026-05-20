-- Removes the H5 webhook fixtures inserted by seed-test-webhooks.sql.
-- Idempotent.

DELETE FROM public.webhook_subscriptions
WHERE node_id IN (SELECT id FROM public.registry_entries WHERE slug LIKE '_test_h5%');

DELETE FROM public.registry_entries WHERE slug LIKE '_test_h5%';
