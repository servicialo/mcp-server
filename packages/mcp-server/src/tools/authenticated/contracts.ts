import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

export const contractsTools = {
  'contract.get': {
    description:
      'Obtiene el contrato de servicio pre-acordado para un servicio específico. Llama esto ANTES de ejecutar cualquier acción (book, cancel, reschedule) para conocer las reglas bajo las que opera el servicio: evidencia requerida, políticas de cancelación, inasistencia y arbitraje.',
    schema: z.object({
      service_id: z.string().describe('ID del servicio'),
      org_id: z.string().describe('ID de la organización'),
    }),
    handler: async (client: CoordinaloClient, args: { service_id: string; org_id: string }) => {
      return client.get(`/coordinalo/services/${args.service_id}/contract`, {
        orgId: args.org_id,
      });
    },
  },
};
