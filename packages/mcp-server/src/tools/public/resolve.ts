import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const resolveTools = {
  'resolve.lookup': {
    description:
      'Resolve an organization slug to its MCP/REST endpoints and trust level — the DNS of professional services. ' +
      'Use this when you know the org_slug and need its API endpoint before calling any other tool. ' +
      'Do NOT use for searching by vertical or location (use resolve.search or registry.search instead). ' +
      'Returns: endpoint URLs, trust score (0-100), trust level, and last heartbeat timestamp.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización (ej: clinica-dental-sur)'),
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2 (ej: cl, mx, ar). Default: cl'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string; country?: string }) => {
      const country = args.country ?? 'cl';
      return client.pub.get(`/api/servicialo/resolve/${country}/${args.org_slug}`);
    },
  },

  'resolve.search': {
    description:
      'Search the global Servicialo resolver for registered organizations by country and vertical. ' +
      'Use this for broad discovery when you need to find all organizations in a country/vertical ' +
      '(e.g., "what physiotherapy clinics exist in Chile?"). ' +
      'Do NOT use if you already have an org_slug (use resolve.lookup instead). ' +
      'Unlike registry.search, this queries the DNS-level resolver and returns endpoint URLs + trust levels.',
    schema: z.object({
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2 (ej: cl, mx, ar). Default: cl'),
      vertical: z.string().optional().describe('Vertical del servicio (ej: salud, hogar, legal, educacion)'),
      limit: z.number().default(20).describe('Cantidad máxima de resultados (1-100). Default: 20'),
    }),
    handler: async (client: ServicialoAdapter, args: { country?: string; vertical?: string; limit?: number }) => {
      const country = args.country ?? 'cl';
      const params: Record<string, string | number | undefined> = {};
      if (args.vertical) params.vertical = args.vertical;
      if (args.limit) params.limit = args.limit;
      return client.pub.get(`/api/servicialo/resolve/${country}`, params);
    },
  },

  'trust.get_score': {
    description:
      'Get the trust score of an organization from the Servicialo resolver. ' +
      'Use this to evaluate reliability before booking — returns score (0-100), ' +
      'trust level (unverified → declared → vouched → verified), and last activity timestamp. ' +
      'Do NOT use this to find organizations (use resolve.search). ' +
      'Trust accumulates passively from verified service history; it cannot be purchased or self-declared.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización (ej: clinica-dental-sur)'),
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2. Default: cl'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string; country?: string }) => {
      const country = args.country ?? 'cl';
      const result = await client.pub.get(`/api/servicialo/resolve/${country}/${args.org_slug}`);
      // Extract trust portion from resolution record
      const resolution = (result as Record<string, unknown>)?.resolution as Record<string, unknown> | undefined;
      if (resolution?.trust) {
        return {
          org_slug: args.org_slug,
          country,
          trust: resolution.trust,
          status: resolution.status,
        };
      }
      return result;
    },
  },
};
