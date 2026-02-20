import { z } from 'zod';
import type { CoordinaloClient } from '../../client.js';

export const payrollTools = {
  'payroll.calculate': {
    description: 'Calcula la liquidación de sueldo de un profesional para un período',
    schema: z.object({
      provider_id: z.string().optional().describe('ID del profesional (opcional, calcula para todos si no se especifica)'),
      month: z.number().describe('Mes (1-12)'),
      year: z.number().describe('Año (ej: 2025)'),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id?: string; month: number; year: number }) => {
      return client.post('/planificalo/payroll/calculate', {
        providerId: args.provider_id,
        month: args.month,
        year: args.year,
      });
    },
  },

  'payroll.history': {
    description: 'Consulta el historial de liquidaciones de sueldo',
    schema: z.object({
      provider_id: z.string().optional().describe('Filtrar por profesional'),
      limit: z.number().default(12).describe('Cantidad de períodos'),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id?: string; limit?: number }) => {
      return client.get('/planificalo/payroll/historial', {
        providerId: args.provider_id,
        limit: args.limit ?? 12,
      });
    },
  },

  'payroll.settlement_detail': {
    description: 'Obtiene el detalle de una liquidación mensual (desglose de haberes y descuentos)',
    schema: z.object({
      provider_id: z.string().describe('ID del profesional'),
      month: z.number().describe('Mes (1-12)'),
      year: z.number().describe('Año'),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id: string; month: number; year: number }) => {
      return client.get('/planificalo/payroll/liquidacion-detalle', {
        providerId: args.provider_id,
        month: args.month,
        year: args.year,
      });
    },
  },

  'payroll.vacations': {
    description: 'Consulta las solicitudes de vacaciones de los profesionales',
    schema: z.object({
      provider_id: z.string().optional().describe('Filtrar por profesional'),
      status: z.string().optional().describe('Filtrar por estado (pending, approved, rejected)'),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id?: string; status?: string }) => {
      return client.get('/planificalo/vacaciones/solicitudes', {
        providerId: args.provider_id,
        status: args.status,
      });
    },
  },

  'payroll.request_vacation': {
    description: 'Crea una solicitud de vacaciones para un profesional',
    schema: z.object({
      provider_id: z.string().describe('ID del profesional'),
      date_from: z.string().describe('Fecha inicio vacaciones (ISO date)'),
      date_to: z.string().describe('Fecha fin vacaciones (ISO date)'),
      notes: z.string().optional().describe('Notas adicionales'),
    }),
    handler: async (client: CoordinaloClient, args: { provider_id: string; date_from: string; date_to: string; notes?: string }) => {
      return client.post('/planificalo/vacaciones/solicitudes', {
        providerId: args.provider_id,
        dateFrom: args.date_from,
        dateTo: args.date_to,
        notes: args.notes,
      });
    },
  },
};
