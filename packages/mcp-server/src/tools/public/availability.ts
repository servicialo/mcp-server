import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const publicAvailabilityTools = {
  'scheduling.check_availability': {
    description: 'Consulta horarios disponibles de una organización sin autenticación. Verifica disponibilidad de profesional y, si el servicio tiene resource_id en su location, también verifica disponibilidad del recurso físico (sala, box, sillón). Scheduler de 3 variables: profesional ∧ cliente ∧ recurso.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización'),
      service_id: z.string().optional().describe('ID del servicio (opcional)'),
      provider_id: z.string().optional().describe('ID del proveedor (opcional)'),
      resource_id: z.string().optional().describe('ID del recurso físico (opcional, filtra slots donde el recurso esté disponible)'),
      date_from: z.string().describe('Fecha inicio (ISO date, ej: 2025-03-01)'),
      date_to: z.string().describe('Fecha fin (ISO date, ej: 2025-03-07)'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string; service_id?: string; provider_id?: string; resource_id?: string; date_from: string; date_to: string }) => {
      return client.pub.get(`/api/servicialo/${args.org_slug}/availability`, {
        serviceId: args.service_id,
        providerId: args.provider_id,
        resourceId: args.resource_id,
        from: args.date_from,
        to: args.date_to,
      });
    },
  },
};
