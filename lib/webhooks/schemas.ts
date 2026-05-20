/**
 * Zod schemas for the webhooks API request bodies. Centralized here so the
 * endpoint handlers stay thin and the contract stays the single source of
 * truth.
 */

import { z } from 'zod';
import { WEBHOOK_EVENTS } from './events';

const httpsUrl = z
  .string()
  .url()
  .refine(
    (u) =>
      u.startsWith('https://') ||
      u.startsWith('http://localhost') ||
      u.startsWith('http://127.0.0.1'),
    { message: 'must use HTTPS (http only allowed for localhost)' },
  )
  .max(2048, { message: 'url too long' });

const subscribedEvents = z
  .array(z.enum(WEBHOOK_EVENTS as unknown as [string, ...string[]]))
  .min(1, { message: 'at least one event is required' })
  .max(WEBHOOK_EVENTS.length, { message: 'too many events' });

export const CreateSubscriptionBody = z
  .object({
    url: httpsUrl,
    subscribed_events: subscribedEvents,
  })
  .strict();

export const UpdateSubscriptionBody = z
  .object({
    subscribed_events: subscribedEvents,
  })
  .strict();

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionBody>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionBody>;
