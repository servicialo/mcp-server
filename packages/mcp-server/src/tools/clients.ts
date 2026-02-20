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
      search: z.string().optional().describe('Buscar por nombre, email o teléfono'),
      limit: z.number().default(20).describe('Resultados por página'),
      page: z.number().default(1).describe('Número de página'),
    }),
    handler: async (client: CoordinaloClient, args: { search?: string; limit?: number; page?: number }) => {
      return client.get('/relacionalo/clients', {
        search: args.search,
        limit: args.limit ?? 20,
        page: args.page ?? 1,
      });
    },
  },

  'clients.get': {
    description: 'Obtiene el detalle de un cliente incluyendo historial y pagos pendientes',
    schema: z.object({
      client_id: z.string().describe('ID del cliente'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string }) => {
      return client.get(`/relacionalo/clients/${args.client_id}`);
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
      return client.post('/relacionalo/clients', {
        name: args.name,
        lastName: args.last_name,
        email: args.email,
        phone: args.phone,
        actor: args.actor,
      });
    },
  },

  'clients.history': {
    description: 'Obtiene el historial de un cliente: sesiones pasadas, pagos y actividad',
    schema: z.object({
      client_id: z.string().describe('ID del cliente'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string }) => {
      return client.get(`/relacionalo/clients/${args.client_id}/history`);
    },
  },
};
