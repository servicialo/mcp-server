import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      servicialo_version: '1.0',
      name: 'Coordinalo',
      registry: 'https://coordinalo.com/api/servicialo/registry',
      endpoints: {
        discovery: {
          manifest: 'GET /api/servicialo/manifest',
          registry: 'GET /api/servicialo/registry',
          org_manifest: 'GET /api/servicialo/{org}/manifest',
          services: 'GET /api/servicialo/{org}/services',
        },
        booking: {
          availability: 'GET /api/servicialo/{org}/availability',
          book: 'POST /api/servicialo/{org}/book',
          checkout: 'POST /api/servicialo/{org}/checkout',
          checkout_status: 'GET /api/servicialo/{org}/checkout/{id}',
        },
        appointments: {
          bookings: 'GET /api/servicialo/{org}/bookings?email={email}&status={status}',
        },
        lifecycle: {
          session: 'GET /api/servicialo/{org}/sessions/{id}',
          confirm: 'POST /api/servicialo/{org}/sessions/{id}/confirm',
          start: 'POST /api/servicialo/{org}/sessions/{id}/start',
          complete: 'POST /api/servicialo/{org}/sessions/{id}/complete',
          deliver: 'POST /api/servicialo/{org}/sessions/{id}/deliver',
          cancel: 'POST /api/servicialo/{org}/sessions/{id}/cancel',
          reschedule: 'POST /api/servicialo/{org}/sessions/{id}/reschedule',
        },
        orders: {
          order: 'GET /api/servicialo/{org}/orders/{id}',
        },
      },
    },
    { headers: { 'X-Servicialo-Version': '1.0' } },
  );
}
