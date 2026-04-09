import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const a2aTools = {
  'a2a.get_agent_card': {
    description:
      'Get the A2A (Agent-to-Agent) Agent Card for an organization, enabling inter-agent discovery. ' +
      'Use this when your agent needs to communicate with another agent managing this organization — ' +
      'the card declares supported capabilities, endpoints, and authentication requirements. ' +
      'Do NOT use for human-facing discovery (use registry.get_organization) or service listing (use services.list). ' +
      'Returns a JSON-LD Agent Card following the A2A v0.3 specification.',
    schema: z.object({
      org_slug: z.string().describe('Organization slug (e.g. "clinica-dental-sur")'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string }) => {
      const result = await client.pub.get(
        `/api/servicialo/${args.org_slug}/.well-known/agent.json`,
      );
      return result;
    },
  },
};
