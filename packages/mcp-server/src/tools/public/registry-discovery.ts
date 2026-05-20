import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

/**
 * Discovery tools that don't require the caller to know the taxonomy
 * in advance. Use these as the first call when an agent arrives without
 * context — they answer "what verticals exist?", "what regions are
 * active?", and "what event types can I query?".
 *
 * All three are public (no authentication needed).
 */
export const registryDiscoveryTools = {
  'registry.list_verticals': {
    description:
      'List every vertical present in the Servicialo network. Combines (a) verticals that registered nodes declare and (b) verticals observed in operational telemetry over the last 30 days. ' +
      'Use as the first call when an agent has no prior knowledge of the protocol taxonomy — before issuing market.get_benchmark, registry.search, or any other call that requires a `vertical` argument. ' +
      'Returns: array of { name, org_count, event_count_30d } sorted by activity. Test fixtures (verticals starting with `_`) are excluded.',
    schema: z.object({}),
    handler: async (client: ServicialoAdapter) => {
      return client.pub.get('/api/registry/verticals');
    },
  },

  'registry.list_regions': {
    description:
      'List every country/region present in the Servicialo network. Combines countries declared by registered nodes with regions observed in operational telemetry over the last 30 days. ' +
      'Use this when an agent needs to know "where is this protocol active?" before issuing a region-scoped query. ' +
      'Returns: array of { code, org_count, event_count_30d } sorted by activity. Codes are ISO 3166-1 alpha-2.',
    schema: z.object({}),
    handler: async (client: ServicialoAdapter) => {
      return client.pub.get('/api/registry/regions');
    },
  },

  'registry.list_event_types': {
    description:
      'List the catalog of operational-telemetry event types defined by the Servicialo protocol. Static (changes via RFC), but exposed as a discovery call so agents can know what event names market.get_benchmark accepts and what bucketed fields each event carries — without having to read the JSON Schema. ' +
      'Returns: array of { name, description, payload_fields[] } plus a `schema_url` for the canonical reference.',
    schema: z.object({}),
    handler: async (client: ServicialoAdapter) => {
      return client.pub.get('/api/registry/event_types');
    },
  },
};
