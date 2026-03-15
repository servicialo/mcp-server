import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';
import { ActorSchema, ResourceSchema, ResourceAvailabilitySchema } from '../schemas.js';

export const resourceTools = {
  'resource.list': {
    description:
      '[Gestión de Recursos] Lista los recursos físicos de una organización (salas, boxes, sillas, equipamiento). Soporta filtros opcionales por tipo y estado activo.',
    schema: z.object({
      organization_id: z.string().describe('ID de la organización'),
      type: z.enum(['room', 'box', 'chair', 'equipment']).optional()
        .describe('Filtrar por tipo de recurso'),
      is_active: z.boolean().optional()
        .describe('Filtrar por estado activo/inactivo'),
    }),
    handler: async (client: ServicialoAdapter, args: { organization_id: string; type?: string; is_active?: boolean }) => {
      return client.get('/coordinalo/resources', {
        organizationId: args.organization_id,
        type: args.type,
        isActive: args.is_active !== undefined ? String(args.is_active) : undefined,
      });
    },
  },

  'resource.get': {
    description:
      '[Gestión de Recursos] Obtiene los detalles completos de un recurso físico, incluyendo sus bloques de disponibilidad recurrente (ResourceAvailability).',
    schema: z.object({
      resource_id: z.string().describe('ID del recurso'),
    }),
    handler: async (client: ServicialoAdapter, args: { resource_id: string }) => {
      return client.get(`/coordinalo/resources/${args.resource_id}`);
    },
  },

  'resource.create': {
    description:
      '[Gestión de Recursos] Crea un nuevo recurso físico para una organización. El recurso se crea activo por defecto. Valida todos los campos según el schema Resource (Dimensión 3.5b del protocolo).',
    schema: z.object({
      organization_id: z.string().describe('ID de la organización propietaria'),
      name: z.string().describe('Nombre del recurso (ej: "Box 3", "Sala Principal")'),
      type: z.enum(['room', 'box', 'chair', 'equipment']).optional()
        .describe('Tipo de recurso físico'),
      capacity: z.number().default(1)
        .describe('Capacidad simultánea del recurso'),
      buffer_minutes: z.number().default(0)
        .describe('Minutos de preparación entre sesiones'),
      equipment: z.array(z.string()).optional()
        .describe('Equipamiento disponible en el recurso'),
      location: z.string().optional()
        .describe('Ubicación física del recurso dentro de la organización'),
      rules: z.record(z.unknown()).optional()
        .describe('Reglas específicas del recurso'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: ServicialoAdapter, args: {
      organization_id: string;
      name: string;
      type?: string;
      capacity?: number;
      buffer_minutes?: number;
      equipment?: string[];
      location?: string;
      rules?: Record<string, unknown>;
      actor: z.infer<typeof ActorSchema>;
    }) => {
      return client.post('/coordinalo/resources', {
        organizationId: args.organization_id,
        name: args.name,
        type: args.type,
        capacity: args.capacity,
        bufferMinutes: args.buffer_minutes,
        equipment: args.equipment,
        location: args.location,
        rules: args.rules,
        actor: args.actor,
      });
    },
  },

  'resource.update': {
    description:
      '[Gestión de Recursos] Actualiza parcialmente un recurso físico existente (patch semantics). Solo se modifican los campos proporcionados; los demás permanecen sin cambio.',
    schema: z.object({
      resource_id: z.string().describe('ID del recurso a actualizar'),
      name: z.string().optional().describe('Nuevo nombre del recurso'),
      type: z.enum(['room', 'box', 'chair', 'equipment']).optional()
        .describe('Nuevo tipo de recurso'),
      capacity: z.number().optional()
        .describe('Nueva capacidad simultánea'),
      buffer_minutes: z.number().optional()
        .describe('Nuevos minutos de preparación entre sesiones'),
      equipment: z.array(z.string()).optional()
        .describe('Nuevo equipamiento disponible'),
      location: z.string().optional()
        .describe('Nueva ubicación física'),
      rules: z.record(z.unknown()).optional()
        .describe('Nuevas reglas específicas'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: ServicialoAdapter, args: {
      resource_id: string;
      name?: string;
      type?: string;
      capacity?: number;
      buffer_minutes?: number;
      equipment?: string[];
      location?: string;
      rules?: Record<string, unknown>;
      actor: z.infer<typeof ActorSchema>;
    }) => {
      return client.patch(`/coordinalo/resources/${args.resource_id}`, {
        name: args.name,
        type: args.type,
        capacity: args.capacity,
        bufferMinutes: args.buffer_minutes,
        equipment: args.equipment,
        location: args.location,
        rules: args.rules,
        actor: args.actor,
      });
    },
  },

  'resource.delete': {
    description:
      '[Gestión de Recursos] Desactiva un recurso físico (soft delete — establece is_active = false). El recurso nunca se elimina físicamente; solo se marca como inactivo y deja de aparecer en búsquedas y disponibilidad.',
    schema: z.object({
      resource_id: z.string().describe('ID del recurso a desactivar'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: ServicialoAdapter, args: { resource_id: string; actor: z.infer<typeof ActorSchema> }) => {
      return client.patch(`/coordinalo/resources/${args.resource_id}`, {
        isActive: false,
        actor: args.actor,
      });
    },
  },

  'resource.get_availability': {
    description:
      '[Gestión de Recursos] Consulta la disponibilidad de un recurso físico en un rango de fechas. Retorna los slots disponibles del recurso independiente de cualquier servicio — es una consulta pura al calendario del recurso. Útil para planificación de capacidad y verificación de conflictos.',
    schema: z.object({
      resource_id: z.string().describe('ID del recurso'),
      date_from: z.string().describe('Fecha de inicio del rango (ISO date, ej: 2026-03-15)'),
      date_to: z.string().describe('Fecha de fin del rango (ISO date, ej: 2026-03-22)'),
      timezone: z.string().optional().describe('Zona horaria IANA (ej: America/Santiago). Por defecto usa la del recurso.'),
    }),
    handler: async (client: ServicialoAdapter, args: { resource_id: string; date_from: string; date_to: string; timezone?: string }) => {
      return client.get(`/coordinalo/resources/${args.resource_id}/availability`, {
        dateFrom: args.date_from,
        dateTo: args.date_to,
        timezone: args.timezone,
      });
    },
  },
};
