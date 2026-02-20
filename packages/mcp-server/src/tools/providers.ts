import { z } from 'zod';
import type { CoordinaloClient } from '../client.js';

export const providersTools = {
  'providers.list': {
    description: 'Lista los profesionales/proveedores de la organización',
    schema: z.object({
      search: z.string().optional().describe('Buscar por nombre'),
      limit: z.number().default(20).describe('Resultados por página'),
      page: z.number().default(1).describe('Número de página'),
    }),
    handler: async (client: CoordinaloClient, args: { search?: string; limit?: number; page?: number }) => {
      return client.get('/planificalo/providers', {
        search: args.search,
        limit: args.limit ?? 20,
        page: args.page ?? 1,
      });
    },
  },

  'providers.get': {
    description: 'Obtiene el detalle de un profesional incluyendo servicios y comisiones',
    schema: z.object({
      provider_id: z.string().describe('ID del profesional'),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id: string }) => {
      return client.get(`/planificalo/providers/${args.provider_id}`);
    },
  },

  'providers.get_commission': {
    description: 'Consulta la configuración de comisiones de un profesional',
    schema: z.object({
      provider_id: z.string().describe('ID del profesional'),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id: string }) => {
      return client.get(`/planificalo/providers/${args.provider_id}/commission`);
    },
  },
};
