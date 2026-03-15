import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    protocol: 'servicialo',
    version: '0.7',
    name: 'Coordinalo',
    endpoints: {
      registry: '/api/servicialo/registry',
      manifest: '/api/servicialo/manifest',
    },
  });
}
