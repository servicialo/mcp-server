/**
 * Webhook event catalog. The single source of truth for what a node can
 * subscribe to. Extend this array (and the WEBHOOKS.md spec) together.
 *
 * Conventions:
 *   - `<domain>.<past_tense_verb>` (e.g. booking.created)
 *   - Lowercase, dot-separated, no spaces
 *   - Past-tense because events describe things that already happened
 */

export const WEBHOOK_EVENTS = [
  // Registry-emitted (delivered by the protocol cron / worker)
  'benchmark.weekly_snapshot',

  // Implementer-emitted (delivered by a node's own runtime — these are
  // declared here so subscribers can ask for them through this API too;
  // the actual emission lives in the implementer's code)
  'booking.created',
  'booking.confirmed',
  'booking.cancelled',

  // Diagnostics
  'webhook.test',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function isKnownEvent(name: string): name is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(name);
}
