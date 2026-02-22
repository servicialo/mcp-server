import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

export const entenderTools = {
  'service.get': {
    description:
      '[Fase 2 — Entender] Obtiene las 8 dimensiones de un servicio: qué se entrega, quién lo entrega, quién lo recibe (con pagador separado), cuándo, dónde, ciclo de vida, evidencia requerida y cobro. Llama esto para entender completamente un servicio antes de comprometerse.',
    schema: z.object({
      service_id: z.string().describe('ID del servicio'),
    }),
    handler: async (client: CoordinaloClient, args: { service_id: string }) => {
      return client.get(`/coordinalo/services/${args.service_id}`);
    },
  },

  'contract.get': {
    description:
      '[Fase 2 — Entender] Obtiene el contrato de servicio pre-acordado. Define las reglas bajo las que opera el servicio: evidencia requerida, políticas de cancelación, inasistencia y arbitraje. DEBE llamarse antes de cualquier acción en Fase 3+.',
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
