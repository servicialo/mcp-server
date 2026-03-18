import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/servicialo/response';
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
      capServices: true,
      capAvailability: true,
      capBooking: true,
    },
    orderBy: { trustScore: 'desc' },
  });

  const agents = orgs.map((org) => {
    const skills: string[] = [];
    if (org.capServices === 'verified') skills.push('catalog');
    if (org.capAvailability === 'verified') skills.push('scheduling');
    if (org.capBooking === 'verified') skills.push('booking');
    if (skills.length === 0) skills.push('discovery');

    return {
      name: org.name,
      url: `https://servicialo.com/api/servicialo/${org.slug}/a2a`,
      description: org.description || `Professional services — ${org.vertical || 'general'}`,
      skills,
    };
  });

  return NextResponse.json(
    { agents },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
