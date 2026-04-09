import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const resolveAuthTools = {
  'resolve.register': {
    description:
      'Registra una nueva organización en el resolver Servicialo con un orgSlug único global. ' +
      'Requiere al menos un endpoint (MCP o REST). El slug es portable: si la org migra de ' +
      'plataforma, conserva su slug y solo actualiza los endpoints.',
    schema: z.object({
      slug: z.string().describe('Identificador único (ej: clinica-dental-sur). 3-48 chars, lowercase, hyphens.'),
      country: z.string().describe('País ISO 3166-1 alpha-2 (ej: cl, mx, ar)'),
      name: z.string().describe('Nombre de la organización'),
      mcp_url: z.string().optional().describe('URL del servidor MCP de la organización'),
      rest_url: z.string().optional().describe('URL de la API REST de la organización'),
      health_url: z.string().optional().describe('URL del health-check endpoint'),
      legal_name: z.string().optional().describe('Nombre legal (si difiere del nombre comercial)'),
      verticals: z.array(z.string()).optional().describe('Verticales de servicio. Valores comunes: tecnologia, consultoria, kinesiologia, psicologia, dental, nutricion, fonoaudiologia, terapia-ocupacional, medicina, veterinaria, educacion, fitness, legal, belleza, hogar (ej: ["tecnologia", "consultoria"])'),
      contact_email: z.string().optional().describe('Email de contacto'),
    }),
    handler: async (client: ServicialoAdapter, args: {
      slug: string;
      country: string;
      name: string;
      mcp_url?: string;
      rest_url?: string;
      health_url?: string;
      legal_name?: string;
      verticals?: string[];
      contact_email?: string;
    }) => {
      return client.post('/api/servicialo/resolve/register', args);
    },
  },

  'resolve.update_endpoint': {
    description:
      'Actualiza los endpoints de una organización en el resolver. Esta es la operación de ' +
      'portabilidad: si la org migra de Coordinalo a otro CRM, actualiza sus URLs aquí y todos ' +
      'los agentes la encuentran automáticamente en la nueva ubicación.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización'),
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2. Default: cl'),
      mcp_url: z.string().optional().describe('Nueva URL del servidor MCP'),
      rest_url: z.string().optional().describe('Nueva URL de la API REST'),
      health_url: z.string().optional().describe('Nueva URL del health-check'),
    }),
    handler: async (client: ServicialoAdapter, args: {
      org_slug: string;
      country?: string;
      mcp_url?: string;
      rest_url?: string;
      health_url?: string;
    }) => {
      const country = args.country ?? 'cl';
      const { org_slug: _slug, country: _country, ...body } = args;
      return client.patch(`/api/servicialo/resolve/${country}/${args.org_slug}/endpoint`, body);
    },
  },

  'telemetry.heartbeat': {
    description:
      'Envía un heartbeat al resolver Servicialo indicando que el nodo sigue activo. ' +
      'Opcionalmente incluye métricas de uso. Los nodos sin heartbeat por 7+ días se marcan inactivos.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización'),
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2. Default: cl'),
      metrics: z
        .object({
          services_active: z.number().optional().describe('Servicios activos actualmente'),
          appointments_30d: z.number().optional().describe('Citas en los últimos 30 días'),
        })
        .optional()
        .describe('Métricas opcionales de uso'),
    }),
    handler: async (client: ServicialoAdapter, args: {
      org_slug: string;
      country?: string;
      metrics?: { services_active?: number; appointments_30d?: number };
    }) => {
      const country = args.country ?? 'cl';
      return client.patch(`/api/servicialo/resolve/${country}/${args.org_slug}/endpoint`, {
        heartbeat: true,
        metrics: args.metrics,
      });
    },
  },
};
