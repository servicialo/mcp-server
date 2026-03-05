import { z } from 'zod';

export const ActorSchema = z.object({
  type: z.enum(['client', 'provider', 'organization', 'agent']),
  id: z.string(),
  on_behalf_of: z.object({
    type: z.string(),
    id: z.string(),
  }).optional(),
});

export const LocationSchema = z.object({
  lat: z.number().describe('Latitud'),
  lng: z.number().describe('Longitud'),
});

// --- Protocol v0.6.0: Resource (Dimension 3.5b) ---

export const ResourceSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string(),
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
  is_active: z.boolean(),
  rules: z.record(z.unknown()).optional()
    .describe('Reglas específicas del recurso'),
});

export const ResourceAvailabilitySchema = z.object({
  resource_id: z.string(),
  day_of_week: z.number().min(0).max(6)
    .describe('Día de la semana (0 = domingo, 6 = sábado)'),
  start_time: z.string().describe('Hora de inicio (HH:mm)'),
  end_time: z.string().describe('Hora de fin (HH:mm)'),
  block_order: z.number().optional()
    .describe('Orden del bloque para múltiples bloques por día'),
  is_available: z.boolean(),
  timezone: z.string().describe('Zona horaria IANA'),
});

export const ServiceLocationSchema = z.object({
  type: z.enum(['in_person', 'virtual', 'home_visit']),
  address: z.string().optional(),
  room: z.string().optional(),
  resource_id: z.string().optional()
    .describe('Referencia a un Resource (ver dimensión 3.5b)'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});
