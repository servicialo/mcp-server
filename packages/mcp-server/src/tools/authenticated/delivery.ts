import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';
import { ActorSchema, LocationSchema } from '../schemas.js';

export const deliveryTools = {
  'delivery.checkin': {
    description:
      '[Fase 5 — Verificar entrega] Registra el check-in del proveedor o cliente, moviendo la sesión a "En Curso". Captura timestamp y ubicación GPS como evidencia de inicio de servicio.',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión'),
      actor: ActorSchema.describe('Quién hace check-in (provider o client)'),
      location: LocationSchema.optional().describe('Ubicación GPS al momento del check-in'),
      timestamp: z.string().optional().describe('ISO datetime del check-in (default: ahora)'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; actor: z.infer<typeof ActorSchema>; location?: z.infer<typeof LocationSchema>; timestamp?: string }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/checkin`, {
        actor: args.actor,
        location: args.location,
        timestamp: args.timestamp,
      });
    },
  },

  'delivery.checkout': {
    description:
      '[Fase 5 — Verificar entrega] Registra el check-out al finalizar el servicio, moviendo la sesión a "Entregado". Captura timestamp y ubicación GPS. La duración real se calcula automáticamente.',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión'),
      actor: ActorSchema.describe('Quién hace check-out (provider o client)'),
      location: LocationSchema.optional().describe('Ubicación GPS al momento del check-out'),
      timestamp: z.string().optional().describe('ISO datetime del check-out (default: ahora)'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; actor: z.infer<typeof ActorSchema>; location?: z.infer<typeof LocationSchema>; timestamp?: string }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/checkout`, {
        actor: args.actor,
        location: args.location,
        timestamp: args.timestamp,
      });
    },
  },

  'delivery.record_evidence': {
    description:
      '[Fase 5 — Verificar entrega] Registra evidencia de entrega del servicio según los requisitos del contrato. Tipos: GPS, firma, foto, documento, duración, notas. Consultar contract.get para conocer la evidencia requerida por vertical.',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión'),
      evidence_type: z.enum(['gps', 'signature', 'photo', 'document', 'duration', 'notes']).describe('Tipo de evidencia'),
      data: z.record(z.unknown()).describe('Payload de la evidencia (estructura varía por tipo)'),
      actor: ActorSchema.describe('Quién registra la evidencia'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; evidence_type: string; data: Record<string, unknown>; actor: z.infer<typeof ActorSchema> }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/evidence`, {
        evidenceType: args.evidence_type,
        data: args.data,
        actor: args.actor,
      });
    },
  },
};
