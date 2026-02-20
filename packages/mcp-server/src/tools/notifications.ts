import { z } from 'zod';
import type { CoordinaloClient } from '../client.js';

export const notificationsTools = {
  'notifications.send': {
    description: 'Envía una notificación (recordatorio, confirmación, etc.) a un cliente por el canal configurado',
    schema: z.object({
      client_id: z.string().describe('ID del cliente destinatario'),
      type: z.enum(['reminder', 'confirmation', 'cancellation', 'custom']).describe('Tipo de notificación'),
      session_id: z.string().optional().describe('ID de la sesión relacionada (si aplica)'),
      message: z.string().optional().describe('Mensaje personalizado (para type=custom)'),
      channel: z.enum(['whatsapp', 'email', 'sms']).optional().describe('Canal de envío (default: el preferido del cliente)'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string; type: string; session_id?: string; message?: string; channel?: string }) => {
      const result = await client.post('/api/v1/notifications', {
        clientId: args.client_id,
        type: args.type,
        sessionId: args.session_id,
        message: args.message,
        channel: args.channel,
      });
      return result;
    },
  },
};
