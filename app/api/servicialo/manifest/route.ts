import { NextResponse } from 'next/server';

/**
 * GET /api/servicialo/manifest
 *
 * Public endpoint — no authentication required.
 * Returns metadata about this Servicialo-compatible server,
 * including protocol version and available endpoints.
 */
export async function GET() {
  return NextResponse.json({
    servicialo: '0.7',
    name: 'Coordinalo',
    description:
      'Plataforma abierta para la gestión integral de servicios profesionales. ' +
      'Coordinalo implementa el protocolo Servicialo para discovery, scheduling, ' +
      'lifecycle management y cierre de sesiones de servicio.',
    endpoints: {
      registry: '/api/servicialo/registry',
      services: '/api/servicialo/{orgSlug}/services',
      availability: '/api/servicialo/{orgSlug}/availability',
    },
  });
}
