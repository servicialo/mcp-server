import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      servicialo_version: '1.0',
      name: 'Servicialo DNS Resolver',
      description: 'Global resolver for Servicialo-compatible service platforms. Resolve org slugs to implementation endpoints, discover services, and book appointments across any compliant platform.',
      resolver: 'https://www.servicialo.com/api/servicialo/resolve',
      registry: 'https://www.servicialo.com/api/servicialo/registry',
      endpoints: {
        resolver: {
          lookup: 'GET /api/servicialo/resolve/{country}/{orgSlug}',
          list: 'GET /api/servicialo/resolve/{country}?vertical={vertical}&limit={limit}',
          register: 'POST /api/servicialo/resolve/register',
          update_endpoint: 'PATCH /api/servicialo/resolve/{country}/{orgSlug}/endpoint',
        },
        discovery: {
          manifest: 'GET /api/servicialo/manifest',
          registry: 'GET /api/servicialo/registry',
          services: 'GET /api/servicialo/{org}/services → proxied to implementation rest_url',
        },
        booking: {
          availability: 'GET /api/servicialo/{org}/availability → proxied to implementation rest_url',
          book: 'POST /api/servicialo/{org}/book → proxied to implementation rest_url',
        },
      },
      how_it_works: 'Organizations register their rest_url via /resolve/register. All /api/servicialo/{org}/* requests are proxied to the registered implementation. The resolver acts as DNS — it maps slugs to endpoints.',
    },
    { headers: { 'X-Servicialo-Version': '1.0' } },
  );
}
