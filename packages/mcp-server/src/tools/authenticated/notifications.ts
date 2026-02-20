import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

export const notificationsTools = {
  'notifications.send_session_reminder': {
    description: 'Envía una notificación/recordatorio para una sesión específica',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/send-notification`);
    },
  },

  'notifications.send_payment_reminder': {
    description: 'Envía un recordatorio de pago para una venta pendiente',
    schema: z.object({
      venta_id: z.string().describe('ID de la venta'),
    }),
    handler: async (client: CoordinaloClient, args: { venta_id: string }) => {
      return client.post(`/planificalo/sales/${args.venta_id}/send-payment-reminder`);
    },
  },
};
