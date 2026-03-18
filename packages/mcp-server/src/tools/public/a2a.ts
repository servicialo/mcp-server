import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const a2aTools = {
  'a2a.get_agent_card': {
    description:
      'Get the A2A Agent Card for a Servicialo-compatible organization. ' +
      'Use this to discover booking capabilities before attempting to book.',
    schema: z.object({
      org_slug: z.string().describe('Organization slug (e.g. "clinica-dental-sur")'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string }) => {
      const result = await client.pub.get(
        `/api/${args.org_slug}/.well-known/agent.json`,
      );
      return result;
    },
  },
};
