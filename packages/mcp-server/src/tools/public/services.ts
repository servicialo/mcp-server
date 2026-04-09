import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const publicServicesTools = {
  'services.list': {
    description:
      'List the public service catalog of an organization: names, prices, durations, and modalities. ' +
      'Use this after registry.search to see what services an organization offers before checking availability. ' +
      'Do NOT use for organization discovery (use registry.search) or checking time slots (use scheduling.check_availability). ' +
      'Returns active, publicly bookable services only — internal or draft services are excluded.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string }) => {
      return client.pub.get(`/api/servicialo/${args.org_slug}/services`);
    },
  },
};
