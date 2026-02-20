import { z } from 'zod';
import type { CoordinaloClient } from '../client.js';

export const paymentsTools = {
  'payments.list_sales': {
    description: 'Lista las ventas con filtros por cliente, servicio, proveedor o estado',
    schema: z.object({
      client_id: z.string().optional().describe('Filtrar por cliente'),
      provider_id: z.string().optional().describe('Filtrar por proveedor'),
      service_id: z.string().optional().describe('Filtrar por servicio'),
      status: z.string().optional().describe('Filtrar por estado (pending, paid, partial)'),
      limit: z.number().default(20).describe('Resultados por página'),
      page: z.number().default(1).describe('Número de página'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id?: string; provider_id?: string; service_id?: string; status?: string; limit?: number; page?: number }) => {
      return client.get('/planificalo/sales', {
        clientId: args.client_id,
        providerId: args.provider_id,
        serviceId: args.service_id,
        status: args.status,
        limit: args.limit ?? 20,
        page: args.page ?? 1,
      });
    },
  },

  'payments.create_sale': {
    description: 'Crea una venta (cargo) para un cliente por un servicio',
    schema: z.object({
      client_id: z.string().describe('ID del cliente'),
      service_id: z.string().describe('ID del servicio'),
      provider_id: z.string().describe('ID del proveedor'),
      quantity: z.number().default(1).describe('Cantidad de sesiones'),
      unit_price: z.number().describe('Precio unitario'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string; service_id: string; provider_id: string; quantity?: number; unit_price: number }) => {
      return client.post('/planificalo/sales', {
        clientId: args.client_id,
        serviceId: args.service_id,
        providerId: args.provider_id,
        quantity: args.quantity ?? 1,
        unitPrice: args.unit_price,
      });
    },
  },

  'payments.record_payment': {
    description: 'Registra un cobro (pago recibido) contra una venta existente',
    schema: z.object({
      venta_id: z.string().describe('ID de la venta'),
      amount: z.number().describe('Monto cobrado'),
      method: z.enum(['efectivo', 'transferencia', 'mercadopago', 'tarjeta']).describe('Método de pago'),
      reference: z.string().optional().describe('Referencia o número de transacción'),
    }),
    handler: async (client: CoordinaloClient, args: { venta_id: string; amount: number; method: string; reference?: string }) => {
      return client.post('/planificalo/payments', {
        ventaId: args.venta_id,
        amount: args.amount,
        paymentMethod: args.method,
        reference: args.reference,
      });
    },
  },

  'payments.client_balance': {
    description: 'Consulta el estado de cuenta de un cliente: sesiones disponibles, saldo pendiente',
    schema: z.object({
      client_id: z.string().describe('ID del cliente'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string }) => {
      return client.get(`/planificalo/clients/${args.client_id}/account-history`);
    },
  },
};
