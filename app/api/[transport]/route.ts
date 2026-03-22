import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { proxyToUpstream } from '@/lib/servicialo/proxy';
import { searchEntries } from '@/lib/registry-db';

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'servicialo_registry',
      'Find Servicialo-compatible organizations by vertical or location. Returns org slugs, names, and descriptions.',
      {
        vertical: z.string().optional().describe('Service vertical (e.g. "kinesiologia", "psicologia", "odontologia")'),
        location: z.string().optional().describe('City or region (e.g. "Santiago", "Providencia")'),
        limit: z.number().default(10).describe('Max results (default 10)'),
      },
      async ({ vertical, location, limit }) => {
        try {
          // Primary: query the canonical Servicialo Registry
          const entries = await searchEntries({
            vertical: vertical ?? undefined,
            q: location ?? undefined,
            limit,
          });

          // Map to the same response shape as before (no breaking change)
          const data = entries.map((e) => ({
            slug: e.slug,
            name: e.display_name,
            description: (e.metadata as Record<string, unknown>)?.description ?? '',
            vertical: e.verticals[0] ?? '',
            location: (e.metadata as Record<string, unknown>)?.location ?? '',
            country: e.country,
          }));

          return { content: [{ type: 'text' as const, text: JSON.stringify({ total: data.length, data }, null, 2) }] };
        } catch {
          // Fallback: query the local resolver DB
          const where: Record<string, unknown> = { discoverable: true };
          if (vertical) where.vertical = { contains: vertical, mode: 'insensitive' };
          if (location) where.location = { contains: location, mode: 'insensitive' };

          const orgs = await prisma.organization.findMany({
            where,
            select: { slug: true, name: true, description: true, vertical: true, location: true, country: true },
            orderBy: { trustScore: 'desc' },
            take: limit,
          });

          return { content: [{ type: 'text' as const, text: JSON.stringify({ total: orgs.length, data: orgs, _source: 'local_fallback' }, null, 2) }] };
        }
      },
    );

    server.tool(
      'servicialo_services',
      'List discoverable services for an organization. Returns service names, durations, and prices.',
      {
        org_slug: z.string().describe('Organization slug (e.g. "clinica-dental-sur")'),
      },
      async ({ org_slug }) => {
        const result = await proxyToUpstream(org_slug, 'services');
        if (!result.ok) {
          return { content: [{ type: 'text' as const, text: JSON.stringify(result.data) }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] };
      },
    );

    server.tool(
      'servicialo_availability',
      'Get available booking slots for an organization. Supports single date, date range, or next N slots.',
      {
        org_slug: z.string().describe('Organization slug'),
        service_id: z.string().optional().describe('Filter by service ID'),
        provider_id: z.string().optional().describe('Filter by provider ID'),
        date: z.string().optional().describe('Single date (YYYY-MM-DD)'),
        from: z.string().optional().describe('Range start date (YYYY-MM-DD)'),
        days: z.number().optional().describe('Number of days for range (default 7)'),
        next: z.number().optional().describe('Return next N available slots'),
      },
      async ({ org_slug, ...params }) => {
        const queryParams: Record<string, string> = {};
        if (params.service_id) queryParams.serviceId = params.service_id;
        if (params.provider_id) queryParams.providerId = params.provider_id;
        if (params.date) queryParams.date = params.date;
        if (params.from) queryParams.from = params.from;
        if (params.days) queryParams.days = String(params.days);
        if (params.next) queryParams.next = String(params.next);

        const result = await proxyToUpstream(org_slug, 'availability', { params: queryParams });
        if (!result.ok) {
          return { content: [{ type: 'text' as const, text: JSON.stringify(result.data) }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] };
      },
    );

    server.tool(
      'servicialo_book',
      'Book a service session for a client. Requires org, service, provider, datetime, and client info.',
      {
        org_slug: z.string().describe('Organization slug'),
        service_id: z.string().describe('Service ID'),
        provider_id: z.string().describe('Provider ID'),
        start: z.string().describe('ISO 8601 datetime of the slot'),
        client_name: z.string().describe('Full name of the client'),
        client_email: z.string().describe('Email of the client'),
        notes: z.string().optional().describe('Notes for the session'),
      },
      async ({ org_slug, ...booking }) => {
        const result = await proxyToUpstream(org_slug, 'book', {
          method: 'POST',
          body: JSON.stringify({
            serviceId: booking.service_id,
            providerId: booking.provider_id,
            start: booking.start,
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            notes: booking.notes,
          }),
        });
        if (!result.ok) {
          return { content: [{ type: 'text' as const, text: JSON.stringify(result.data) }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] };
      },
    );
  },
  {
    serverInfo: { name: 'servicialo', version: '0.8.0' },
    capabilities: {},
  },
  { basePath: '/api', maxDuration: 60 },
);

export { handler as GET, handler as POST, handler as DELETE };
