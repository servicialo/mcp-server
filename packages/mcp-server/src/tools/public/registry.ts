import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

export const registryTools = {
  'registry.search': {
    description: 'Busca organizaciones Servicialo-compatible por vertical, ubicación u otros criterios',
    schema: z.object({
      vertical: z.string().describe('Vertical del servicio (ej: kinesiologia, psicologia, dental)'),
      location: z.string().optional().describe('Ciudad o comuna para filtrar'),
      limit: z.number().default(10).describe('Cantidad máxima de resultados'),
    }),
    handler: async (client: CoordinaloClient, args: { vertical: string; location?: string; limit?: number }) => {
      return client.pub.get('/api/servicialo/registry', {
        vertical: args.vertical,
        location: args.location,
        limit: args.limit,
      });
    },
  },

  'registry.get_organization': {
    description: 'Obtiene el detalle público de una organización: servicios, profesionales y configuración de booking',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización (ej: clinica-dental-sur)'),
    }),
    handler: async (client: CoordinaloClient, args: { org_slug: string }) => {
      return client.pub.get(`/api/servicialo/${args.org_slug}/services`);
    },
  },
};
