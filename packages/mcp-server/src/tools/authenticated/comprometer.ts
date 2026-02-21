import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';
import { ActorSchema } from '../schemas.js';

export const comprometerTools = {
  'clients.get_or_create': {
    description:
      '[Fase 3 — Comprometer] Busca un cliente por email o teléfono. Si existe, retorna sus datos y resumen de historial. Si no existe, lo crea con los datos proporcionados. Una sola llamada para resolver la identidad del cliente antes de agendar.',
    schema: z.object({
      email: z.string().email().optional().describe('Email del cliente (buscará primero por email)'),
      phone: z.string().optional().describe('Teléfono del cliente (buscará si no se provee email)'),
      name: z.string().optional().describe('Nombre — requerido solo si el cliente no existe'),
      last_name: z.string().optional().describe('Apellido — requerido solo si el cliente no existe'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: CoordinaloClient, args: { email?: string; phone?: string; name?: string; last_name?: string; actor: z.infer<typeof ActorSchema> }) => {
      return client.post('/relacionalo/clients/upsert', {
        email: args.email,
        phone: args.phone,
        name: args.name,
        lastName: args.last_name,
        actor: args.actor,
      });
    },
  },

  'scheduling.book': {
    description:
      '[Fase 3 — Comprometer] Agenda una nueva sesión para un cliente con un proveedor. Crea la sesión en estado "Solicitado". Requiere haber llamado contract.get antes para conocer las reglas del servicio.',
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

  'scheduling.confirm': {
    description:
      '[Fase 3 — Comprometer] Confirma una sesión agendada, moviéndola a estado "Confirmado". Ambas partes (proveedor y cliente) deben confirmar antes de que el servicio pueda iniciar.',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión a confirmar'),
      actor: ActorSchema.describe('Quién confirma (client, provider, organization o agent)'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; actor: z.infer<typeof ActorSchema> }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/confirm`, {
        actor: args.actor,
      });
    },
  },
};
