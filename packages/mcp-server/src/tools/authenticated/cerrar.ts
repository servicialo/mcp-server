import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';
import { ActorSchema } from '../schemas.js';

export const cerrarTools = {
  'documentation.create': {
    description:
      '[Fase 6 — Cerrar] Genera el registro/documentación del servicio entregado (nota clínica, reporte de inspección, acta de clase, etc.). Mueve la sesión a "Documentado".',
    schema: z.object({
      session_id: z.string().describe('ID de la sesión'),
      content: z.string().describe('Contenido del registro/documentación'),
      template_id: z.string().optional().describe('ID de plantilla de documentación (si aplica)'),
      actor: ActorSchema.describe('Quién genera la documentación (típicamente el proveedor)'),
    }),
    handler: async (client: CoordinaloClient, args: { session_id: string; content: string; template_id?: string; actor: z.infer<typeof ActorSchema> }) => {
      return client.post(`/coordinalo/sessions/${args.session_id}/documentation`, {
        content: args.content,
        templateId: args.template_id,
        actor: args.actor,
      });
    },
  },

  'payments.create_sale': {
    description:
      '[Fase 6 — Cerrar] Crea una venta (cargo) asociada a un servicio documentado. Mueve la sesión a "Cobrado". Debe llamarse después de documentation.create.',
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
    description:
      '[Fase 6 — Cerrar] Registra un pago recibido contra una venta existente. El pago es independiente del ciclo de vida — billing.status transiciona de charged → invoiced → paid.',
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

  'payments.get_status': {
    description:
      '[Fase 6 — Cerrar] Consulta el estado de pago de una venta específica o el estado de cuenta de un cliente. Provee sale_id para una venta o client_id para el estado de cuenta completo.',
    schema: z.object({
      sale_id: z.string().optional().describe('ID de la venta (para consultar una venta específica)'),
      client_id: z.string().optional().describe('ID del cliente (para consultar estado de cuenta)'),
    }),
    handler: async (client: CoordinaloClient, args: { sale_id?: string; client_id?: string }) => {
      if (args.sale_id) {
        return client.get(`/planificalo/sales/${args.sale_id}`);
      }
      if (args.client_id) {
        return client.get(`/planificalo/clients/${args.client_id}/account-history`);
      }
      throw new Error('Debe proveer sale_id o client_id');
    },
  },
};
