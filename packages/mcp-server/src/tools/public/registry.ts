import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const registryTools = {
  'registry.search': {
    description:
      'Search for Servicialo-compatible organizations by vertical, location, and country. ' +
      'Use this as the primary discovery tool when a user needs a service ' +
      '(e.g., "find a physiotherapist in Santiago"). ' +
      'Do NOT use if you already have an org_slug (use registry.get_organization instead). ' +
      'Returns a ranked list of organizations with names, slugs, and service summaries.',
    schema: z.object({
      vertical: z.string().describe('Service vertical to search (e.g. "kinesiologia", "psicologia", "dental", "legal", "educacion")'),
      location: z.string().optional().describe('City or district to filter by (e.g. "santiago", "providencia"). Omit for country-wide results.'),
      country: z.string().default('cl').describe('ISO 3166-1 alpha-2 country code (e.g. "cl", "mx", "ar"). Default: "cl"'),
      limit: z.number().default(10).describe('Max results to return (1-100). Default: 10'),
    }),
    handler: async (client: ServicialoAdapter, args: { vertical: string; location?: string; country?: string; limit?: number }) => {
      const result = await client.pub.get('/api/servicialo/registry', {
        vertical: args.vertical,
        location: args.location,
        country: args.country ?? 'cl',
        limit: args.limit,
      });
      return result;
    },
  },

  'registry.manifest': {
    description:
      'Get the Servicialo server manifest: protocol version, server name, and available capabilities. ' +
      'Use this to verify server identity and protocol compatibility before interacting with tools. ' +
      'Do NOT use for organization discovery (use registry.search) or service details (use services.list). ' +
      'Returns static metadata about this MCP server instance, not about any specific organization.',
    schema: z.object({}),
    handler: async (client: ServicialoAdapter) => {
      const result = await client.pub.get('/api/servicialo/manifest');
      return result;
    },
  },

  'registry.get_organization': {
    description:
      'Get the full public profile of a specific organization: services offered, providers, and booking configuration. ' +
      'Use this after registry.search when you have an org_slug and need detailed info before booking. ' +
      'Do NOT use for searching across organizations (use registry.search). ' +
      'Returns service catalog with prices/durations, provider list, and booking policies.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización (ej: clinica-dental-sur)'),
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2 (ej: cl, mx, ar). Default: cl'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string; country?: string }) => {
      const result = await client.pub.get(`/api/servicialo/${args.org_slug}/services`, {
        country: args.country ?? 'cl',
      });
      return result;
    },
  },
};
