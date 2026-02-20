import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

const ActorSchema = z.object({
  type: z.enum(['client', 'provider', 'organization', 'agent']),
  id: z.string(),
  on_behalf_of: z.object({
    type: z.string(),
    id: z.string(),
  }).optional(),
});

export const schedulingTools = {
  'scheduling.list_sessions': {
    description: 'Lista sesiones con filtros por fecha, proveedor, cliente o estado',
    schema: z.object({
      date_from: z.string().optional().describe('Fecha inicio (ISO date)'),
      date_to: z.string().optional().describe('Fecha fin (ISO date)'),
      provider_id: z.string().optional().describe('Filtrar por proveedor'),
      client_id: z.string().optional().describe('Filtrar por cliente'),
      status: z.string().optional().describe('Filtrar por estado (scheduled, completed, cancelled)'),
      limit: z.number().default(20).describe('Resultados por página'),
      page: z.number().default(1).describe('Número de página'),
    }),
    handler: async (client: CoordinaloClient, args: { date_from?: string; date_to?: string; provider_id?: string; client_id?: string; status?: string; limit?: number; page?: number }) => {
      return client.get('/coordinalo/sessions', {
        from: args.date_from,
        to: args.date_to,
        providerId: args.provider_id,
        clientId: args.client_id,
        status: args.status,
        limit: args.limit ?? 20,
        page: args.page ?? 1,
      });
    },
  },

  'scheduling.book': {
    description: 'Agenda una nueva sesión para un cliente con un proveedor',
    schema: z.object({
      service_id: z.string().describe('ID del servicio'),
      provider_id: z.string().describe('ID del proveedor'),
      client_id: z.string().describe('ID del cliente'),
      starts_at: z.string().describe('Fecha y hora de inicio (ISO datetime)'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: CoordinaloClient, args: { service_id: string; provider_id: string; client_id: string; starts_at: string; actor: z.infer<typeof ActorSchema> }) => {
      return client.post('/coordinalo/sessions', {
        serviceId: args.service_id,
        providerId: args.provider_id,
        clientId: args.client_id,
        startTime: args.starts_at,
        actor: args.actor,
      });
    },
  },

  'scheduling.reschedule': {
    description: 'Reagenda una sesión existente a una nueva fecha/hora',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión a reagendar'),
      new_datetime: z.string().describe('Nueva fecha y hora (ISO datetime)'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; new_datetime: string; actor: z.infer<typeof ActorSchema> }) => {
      return client.put(`/coordinalo/sessions/${args.session_id}`, {
        startTime: args.new_datetime,
        actor: args.actor,
      });
    },
  },

  'scheduling.cancel': {
    description: 'Cancela una sesión existente',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión a cancelar'),
      reason: z.string().optional().describe('Motivo de la cancelación'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; reason?: string; actor: z.infer<typeof ActorSchema> }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/cancel`, {
        reason: args.reason,
        actor: args.actor,
      });
    },
  },
};
