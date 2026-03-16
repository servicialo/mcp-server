import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      servicialo_version: '1.0',
      name: 'Coordinalo',
      registry: 'https://coordinalo.com/api/servicialo/registry',
      endpoints: {
        manifest: 'GET /api/servicialo/manifest',
        registry: 'GET /api/servicialo/registry',
        claim: 'POST /api/servicialo/registry/claim',
        services: 'GET /api/servicialo/[orgSlug]/services',
        availability: 'GET /api/servicialo/[orgSlug]/availability',
        book: 'POST /api/servicialo/[orgSlug]/book',
      },
    },
    { headers: { 'X-Servicialo-Version': '1.0' } },
  );
}
