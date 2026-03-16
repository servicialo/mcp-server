import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/servicialo/response';
import { prisma } from '@/lib/prisma';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const orgs = await prisma.organization.findMany({
    where: { discoverable: true },
    select: {
      slug: true,
      name: true,
      description: true,
      vertical: true,
      location: true,
      country: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    {
      servicialo_version: '1.0',
      total: orgs.length,
      data: orgs,
    },
    { headers: { 'X-Servicialo-Version': '1.0' } },
  );
}
