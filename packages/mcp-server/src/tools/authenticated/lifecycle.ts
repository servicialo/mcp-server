import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';
import { ActorSchema } from '../schemas.js';

export const lifecycleTools = {
  'lifecycle.get_state': {
    description:
      '[Fase 4 — Ciclo de vida] Obtiene el estado actual de una sesión en el ciclo de vida Servicialo, incluyendo las transiciones disponibles desde el estado actual y el historial de transiciones pasadas.',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string }) => {
      return client.get(`/coordinalo/sessions/${args.session_id}/lifecycle`);
    },
  },

  'lifecycle.transition': {
    description:
      '[Fase 4 — Ciclo de vida] Ejecuta una transición de estado en el ciclo de vida de una sesión. Transiciones válidas: requested→scheduled, scheduled→confirmed, confirmed→in_progress, in_progress→delivered, delivered→documented, documented→charged, charged→verified, any→cancelled. Cada transición puede requerir evidencia según el contrato del servicio.',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión'),
      to_state: z.enum([
        'scheduled', 'confirmed', 'in_progress',
        'delivered', 'documented', 'charged', 'verified', 'cancelled',
      ]).describe('Estado destino de la transición'),
      actor: ActorSchema.describe('Quién ejecuta la transición'),
      reason: z.string().optional().describe('Motivo de la transición (requerido para cancelled)'),
      evidence: z.record(z.unknown()).optional().describe('Evidencia requerida por el contrato para esta transición'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; to_state: string; actor: z.infer<typeof ActorSchema>; reason?: string; evidence?: Record<string, unknown> }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/lifecycle/transition`, {
        toState: args.to_state,
        actor: args.actor,
        reason: args.reason,
        evidence: args.evidence,
      });
    },
  },

  'scheduling.reschedule': {
    description:
      '[Fase 4 — Ciclo de vida] Reagenda una sesión existente a una nueva fecha/hora. Flujo de excepción: la sesión vuelve a estado "Scheduled" con nuevo horario. La política de reagendamiento del contrato puede aplicar cargos.',
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
    description:
      '[Fase 4 — Ciclo de vida] Cancela una sesión existente. Flujo de excepción: aplica la política de cancelación definida en el contrato (reembolso total fuera de ventana de penalidad, parcial/nulo dentro). Llama contract.get primero para conocer la política.',
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
