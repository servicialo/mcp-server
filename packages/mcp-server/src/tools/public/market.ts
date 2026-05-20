import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const marketTools = {
  'market.list_segments': {
    description:
      'List every (event_type, vertical, region) segment that has at least 5 distinct contributing organizations over the last 90 days — i.e. every benchmark that the protocol is allowed to publish without violating k-anonymity. ' +
      'Use this to discover what benchmarks exist before issuing market.get_benchmark. ' +
      'Filters are optional; passing none lists all available segments sorted by contributor count. ' +
      'Returns: array of { event_type, vertical, region, sample_size, contributors, first_event, last_event }.',
    schema: z.object({
      event_type: z
        .enum(['booking_created', 'service_completed', 'dispute_opened', 'payment_settled'])
        .optional()
        .describe('Filter to a single event type. Omit to list all.'),
      vertical: z
        .string()
        .optional()
        .describe('Filter to a single vertical (e.g. health, legal, home). Omit to list all.'),
      region: z
        .string()
        .optional()
        .describe('Filter to a single ISO 3166-1 alpha-2 country (e.g. CL, AR, MX). Omit to list all.'),
    }),
    handler: async (
      client: ServicialoAdapter,
      args: { event_type?: string; vertical?: string; region?: string },
    ) => {
      const params: Record<string, string | number | undefined> = {};
      if (args.event_type) params.event_type = args.event_type;
      if (args.vertical) params.vertical = args.vertical;
      if (args.region) params.region = args.region;
      return client.pub.get('/api/benchmarks/segments', params);
    },
  },

  'market.get_benchmark': {
    description:
      'Get the bucket distribution for a (event_type, vertical, region) segment over a time window. ' +
      'Returns the share of each bucketed value within the payload (e.g. for booking_created, the share of bookings in each lead_time_bucket). ' +
      'All values are categorical buckets — no raw prices, durations, or names are ever returned. ' +
      'If the segment has fewer than 5 distinct contributing organizations, returns { ok: false, reason: "insufficient_data", contributors }. ' +
      'Use market.list_segments first to know which segments will return data. ' +
      'Example: market.get_benchmark({ event_type: "payment_settled", vertical: "health", region: "CL" }) → distribution of price bands, payment methods, time-to-collect buckets.',
    schema: z.object({
      event_type: z
        .enum(['booking_created', 'service_completed', 'dispute_opened', 'payment_settled'])
        .describe('Which event type to query.'),
      vertical: z
        .string()
        .describe('Industry vertical (e.g. health, legal, home, education).'),
      region: z
        .string()
        .describe('ISO 3166-1 alpha-2 country code (e.g. CL, AR, MX).'),
      from: z
        .string()
        .optional()
        .describe('Lower bound of the time window (ISO date or datetime). Default: 90 days ago.'),
      to: z
        .string()
        .optional()
        .describe('Upper bound of the time window (ISO date or datetime). Default: now.'),
    }),
    handler: async (
      client: ServicialoAdapter,
      args: { event_type: string; vertical: string; region: string; from?: string; to?: string },
    ) => {
      const params: Record<string, string | number | undefined> = {
        event_type: args.event_type,
        vertical: args.vertical,
        region: args.region,
      };
      if (args.from) params.from = args.from;
      if (args.to) params.to = args.to;
      return client.pub.get('/api/benchmarks', params);
    },
  },
};
