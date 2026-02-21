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
