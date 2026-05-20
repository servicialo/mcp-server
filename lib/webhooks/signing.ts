/**
 * HMAC signing + outgoing-header builder for webhook deliveries.
 *
 * The signature scheme is intentionally simple: HMAC-SHA256 of the raw
 * JSON body using the subscription's secret, hex-encoded. Subscribers
 * verify by recomputing the same HMAC over the body they received and
 * comparing in constant time.
 */

import { createHmac, randomUUID } from 'node:crypto';

const NODE_VERSION_LABEL = 'Servicialo-Webhooks/0.1';

export interface WebhookEnvelope {
  event: string;
  event_id: string;
  emitted_at: string;
  data: Record<string, unknown>;
}

export function buildEnvelope(event: string, data: Record<string, unknown>): WebhookEnvelope {
  return {
    event,
    event_id: `evt_${randomUUID()}`,
    emitted_at: new Date().toISOString(),
    data,
  };
}

export function sign(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function buildHeaders(params: {
  envelope: WebhookEnvelope;
  rawBody: string;
  secret: string;
  deliveryId: string;
}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent': NODE_VERSION_LABEL,
    'X-Servicialo-Event-Id': params.envelope.event_id,
    'X-Servicialo-Event-Type': params.envelope.event,
    'X-Servicialo-Delivery-Id': params.deliveryId,
    'X-Servicialo-Timestamp': params.envelope.emitted_at,
    'X-Servicialo-Signature': `sha256=${sign(params.rawBody, params.secret)}`,
  };
}
