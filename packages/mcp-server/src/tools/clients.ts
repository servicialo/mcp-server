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

export const clientsTools = {
  'clients.list': {
    description: 'Lista los clientes de la organización con búsqueda y paginación',
    schema: z.object({
      search: z.string().optional().describe('Texto para buscar por nombre, email o teléfono'),
      limit: z.number().default(20).describe('Cantidad de resultados por página'),
      page: z.number().default(1).describe('Número de página'),
    }),
    handler: async (client: CoordinaloClient, args: { search?: string; limit?: number; page?: number }) => {
      const result = await client.get('/api/v1/clients', {
        search: args.search,
        limit: args.limit ?? 20,
        page: args.page ?? 1,
      });
      return result;
    },
  },

  'clients.get': {
    description: 'Obtiene el detalle de un cliente incluyendo estadísticas (sesiones totales, monto gastado, última sesión)',
    schema: z.object({
      client_id: z.string().describe('ID del cliente'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string }) => {
      const result = await client.get(`/api/v1/clients/${args.client_id}`);
      return result;
    },
  },

  'clients.create': {
    description: 'Crea un nuevo cliente en la organización',
    schema: z.object({
      name: z.string().describe('Nombre del cliente'),
      last_name: z.string().describe('Apellido del cliente'),
      email: z.string().email().optional().describe('Email del cliente'),
      phone: z.string().optional().describe('Teléfono del cliente'),
      actor: ActorSchema.describe('Quién realiza la acción'),
    }),
    handler: async (client: CoordinaloClient, args: { name: string; last_name: string; email?: string; phone?: string; actor: z.infer<typeof ActorSchema> }) => {
      const result = await client.post('/api/v1/clients', {
        name: args.name,
        lastName: args.last_name,
        email: args.email,
        phone: args.phone,
        actor: args.actor,
      });
      return result;
    },
  },
};
