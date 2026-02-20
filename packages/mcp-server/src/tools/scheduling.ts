import { z } from 'zod';
import type { CoordinaloClient } from '../client.js';

const ActorSchema = z.object({
  type: z.enum(['client', 'provider', 'organization', 'agent']),
  id: z.string(),
  on_behalf_of: z.object({
    type: z.string(),
    id: z.string(),
  }).optional(),
});

export const schedulingTools = {
  'scheduling.check_availability': {
    description: 'Consulta los horarios disponibles de un proveedor para un servicio en un rango de fechas',
    schema: z.object({
      provider_id: z.string().describe('ID del proveedor'),
      service_id: z.string().describe('ID del servicio'),
      date_range: z.object({
        from: z.string().describe('Fecha inicio (ISO date, ej: 2025-03-01)'),
        to: z.string().describe('Fecha fin (ISO date, ej: 2025-03-07)'),
      }),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id: string; service_id: string; date_range: { from: string; to: string } }) => {
      const result = await client.get(`/api/v1/providers/${args.provider_id}/slots`, {
        service_id: args.service_id,
        from: args.date_range.from,
        to: args.date_range.to,
      });
      return result;
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
      const result = await client.post('/api/v1/sessions', {
        serviceId: args.service_id,
        providerId: args.provider_id,
        clientId: args.client_id,
        startTime: args.starts_at,
        actor: args.actor,
      });
      return result;
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
      const result = await client.put(`/api/v1/sessions/${args.session_id}`, {
        startTime: args.new_datetime,
        actor: args.actor,
      });
      return result;
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
      const result = await client.post(`/api/v1/sessions/${args.session_id}/cancel`, {
        reason: args.reason,
        actor: args.actor,
      });
      return result;
    },
  },
};
