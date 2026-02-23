import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

export const publicAvailabilityTools = {
  'scheduling.check_availability': {
    description: 'Consulta horarios disponibles de una organización sin autenticación',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización'),
      service_id: z.string().optional().describe('ID del servicio (opcional)'),
      provider_id: z.string().optional().describe('ID del proveedor (opcional)'),
      date_from: z.string().describe('Fecha inicio (ISO date, ej: 2025-03-01)'),
      date_to: z.string().describe('Fecha fin (ISO date, ej: 2025-03-07)'),
    }),
    handler: async (client: CoordinaloClient, args: { org_slug: string; service_id?: string; provider_id?: string; date_from: string; date_to: string }) => {
      return client.pub.get(`/api/v1/public/agenda/${args.org_slug}/slots`, {
        serviceId: args.service_id,
        providerId: args.provider_id,
        from: args.date_from,
        to: args.date_to,
      });
    },
  },
};
