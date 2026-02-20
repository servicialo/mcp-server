import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

export const publicServicesTools = {
  'services.list': {
    description: 'Lista el catálogo público de servicios de una organización',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización'),
    }),
    handler: async (client: CoordinaloClient, args: { org_slug: string }) => {
      return client.pub.get(`/api/v1/public/agenda/${args.org_slug}`);
    },
  },
};
