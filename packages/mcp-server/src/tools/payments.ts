import { z } from 'zod';
import type { CoordinaloClient } from '../client.js';

export const paymentsTools = {
  'payments.get_balance': {
    description: 'Consulta el saldo de un cliente: sesiones disponibles y monto pendiente',
    schema: z.object({
      client_id: z.string().describe('ID del cliente'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string }) => {
      const data = await client.get(`/api/v1/clients/${args.client_id}`) as Record<string, unknown>;
      const stats = data.stats as Record<string, unknown> | undefined;
      const balance = data.balance as Record<string, unknown> | undefined;
      return {
        client_id: args.client_id,
        sessions_available: balance?.available ?? null,
        pending_amount: balance?.pending ?? null,
        total_sessions: stats?.total_sessions ?? null,
        total_spent: stats?.total_spent ?? null,
      };
    },
  },

  'payments.charge': {
    description: 'Crea una venta (cargo) para un cliente por un servicio',
    schema: z.object({
      client_id: z.string().describe('ID del cliente'),
      service_id: z.string().describe('ID del servicio'),
      provider_id: z.string().describe('ID del proveedor'),
      amount: z.number().describe('Monto unitario del cargo'),
    }),
    handler: async (client: CoordinaloClient, args: { client_id: string; service_id: string; provider_id: string; amount: number }) => {
      const result = await client.post('/api/v1/sales', {
        clientId: args.client_id,
        serviceId: args.service_id,
        providerId: args.provider_id,
        quantity: 1,
        unitPrice: args.amount,
      });
      return result;
    },
  },

  'payments.record': {
    description: 'Registra un cobro (pago recibido) contra una venta existente',
    schema: z.object({
      venta_id: z.string().describe('ID de la venta a la que se aplica el cobro'),
      amount: z.number().describe('Monto cobrado'),
      method: z.enum(['efectivo', 'transferencia', 'mercadopago', 'tarjeta']).describe('Método de pago'),
      reference: z.string().optional().describe('Referencia o número de transacción'),
    }),
    handler: async (client: CoordinaloClient, args: { venta_id: string; amount: number; method: string; reference?: string }) => {
      const result = await client.post('/api/v1/cobros', {
        ventaId: args.venta_id,
        amount: args.amount,
        paymentMethod: args.method,
        reference: args.reference,
      });
      return result;
    },
  },
};
