import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const publicServicesTools = {
  'services.list': {
    description: 'Lista el catálogo público de servicios de una organización',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string }) => {
      return client.pub.get(`/api/servicialo/${args.org_slug}/services`);
    },
  },
};
