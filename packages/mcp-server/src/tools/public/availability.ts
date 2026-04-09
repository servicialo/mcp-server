import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const publicAvailabilityTools = {
  'scheduling.check_availability': {
    description:
      'Query available time slots for booking at an organization. No authentication required. ' +
      'Use this after services.list when you know the org and need to find open slots before booking. ' +
      'Checks 3-way availability: provider schedule AND client conflicts AND physical resource (room/equipment). ' +
      'Do NOT use for searching organizations (use registry.search) or listing services (use services.list). ' +
      'Returns available slots grouped by date, each with start time, end time, provider, and resource.',
    schema: z.object({
      org_slug: z.string().describe('Organization slug (e.g. "clinica-dental-sur"). Get this from registry.search results.'),
      service_id: z.string().optional().describe('Filter by service ID. Get valid IDs from services.list. Omit to check all services.'),
      provider_id: z.string().optional().describe('Filter by provider ID. Omit to check all available providers.'),
      resource_id: z.string().optional().describe('Filter by physical resource (room, equipment). Only needed if the service requires a specific resource.'),
      date_from: z.string().describe('Start date in ISO format (e.g. "2026-03-01"). Must be today or later.'),
      date_to: z.string().describe('End date in ISO format (e.g. "2026-03-07"). Max range: 30 days from date_from.'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string; service_id?: string; provider_id?: string; resource_id?: string; date_from: string; date_to: string }) => {
      return client.pub.get(`/api/servicialo/${args.org_slug}/availability`, {
        serviceId: args.service_id,
        providerId: args.provider_id,
        resourceId: args.resource_id,
        from: args.date_from,
        to: args.date_to,
      });
    },
  },
};
