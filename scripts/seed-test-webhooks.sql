-- Fixtures for verify-webhooks-api.mjs.
-- Idempotent.
--
-- Convention: all test slugs start with '_' so notify_registry_alert()
-- skips them (see migration silence_registry_alert_for_test_fixtures).

DELETE FROM public.webhook_subscriptions
WHERE node_id IN (SELECT id FROM public.registry_entries WHERE slug LIKE '_test_h5%');

DELETE FROM public.registry_entries WHERE slug LIKE '_test_h5%';

INSERT INTO public.registry_entries (slug, country, display_name, endpoint_url, implementer, ownership_token, discoverable)
VALUES
  ('_test_h5_node',  'XX', 'Test H5 Node',  'http://test.local', 'test', 'test_h5_token_primary_secret_for_verify', false),
  ('_test_h5_other', 'XX', 'Test H5 Other', 'http://test.local', 'test', 'test_h5_token_other_secret_for_verify',   false);
