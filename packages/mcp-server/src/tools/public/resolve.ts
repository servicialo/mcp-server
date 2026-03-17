import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const resolveTools = {
  'resolve.lookup': {
    description:
      'Resuelve un orgSlug a su endpoint MCP/REST, nivel de confianza e identidad. ' +
      'Es el equivalente a un DNS lookup: dado un nombre único global, devuelve dónde ' +
      'están los servicios de esa organización.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización (ej: clinica-dental-sur)'),
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2 (ej: cl, mx, ar). Default: cl'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string; country?: string }) => {
      const country = args.country ?? 'cl';
      return client.pub.get(`/api/servicialo/resolve/${country}/${args.org_slug}`);
    },
  },

  'resolve.search': {
    description:
      'Busca organizaciones registradas en el resolver Servicialo por país y vertical. ' +
      'Devuelve una lista con slug, nombre, endpoints y nivel de confianza. ' +
      'Útil para descubrimiento: "¿qué clínicas dentales hay en Chile?"',
    schema: z.object({
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2 (ej: cl, mx, ar). Default: cl'),
      vertical: z.string().optional().describe('Vertical del servicio (ej: salud, hogar, legal, educacion)'),
      limit: z.number().default(20).describe('Cantidad máxima de resultados (1-100). Default: 20'),
    }),
    handler: async (client: ServicialoAdapter, args: { country?: string; vertical?: string; limit?: number }) => {
      const country = args.country ?? 'cl';
      const params: Record<string, string | number | undefined> = {};
      if (args.vertical) params.vertical = args.vertical;
      if (args.limit) params.limit = args.limit;
      return client.pub.get(`/api/servicialo/resolve/${country}`, params);
    },
  },

  'trust.get_score': {
    description:
      'Obtiene el puntaje de confianza de una organización en el resolver Servicialo. ' +
      'Devuelve score (0-100), nivel (unverified/declared/vouched/verified), y última actividad. ' +
      'El trust es pasivo: se acumula con historial de servicios verificados.',
    schema: z.object({
      org_slug: z.string().describe('Slug de la organización (ej: clinica-dental-sur)'),
      country: z.string().default('cl').describe('País ISO 3166-1 alpha-2. Default: cl'),
    }),
    handler: async (client: ServicialoAdapter, args: { org_slug: string; country?: string }) => {
      const country = args.country ?? 'cl';
      const result = await client.pub.get(`/api/servicialo/resolve/${country}/${args.org_slug}`);
      // Extract trust portion from resolution record
      const resolution = (result as Record<string, unknown>)?.resolution as Record<string, unknown> | undefined;
      if (resolution?.trust) {
        return {
          org_slug: args.org_slug,
          country,
          trust: resolution.trust,
          status: resolution.status,
        };
      }
      return result;
    },
  },
};
