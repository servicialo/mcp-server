import { NextResponse } from 'next/server';
import { listAllEntries } from '@/lib/registry-db';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/servicialo/response';
import { type NextRequest } from 'next/server';

/**
 * GET /api/a2a-directory (rewritten from /.well-known/agents.json)
 *
 * A2A global agent index. Queries the canonical registry first,
 * falls back to the local resolver DB.
 */
export async function GET(request: NextRequest) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  try {
    // Primary: query canonical registry
    const entries = await listAllEntries();

    const agents = entries.map((entry) => {
      const skills: string[] = ['discovery'];
      const metadata = entry.metadata as Record<string, unknown>;
      if ((metadata?.service_count as number) > 0) skills.push('catalog');
      // Skill announcement composes two orthogonal facts: what the node
      // declares (supported_profiles) and whether the listing passed manual
      // review (review_status). The old is_verified coupled both in one bit.
      const reviewed = entry.review_status === 'reviewed';
      const profiles = entry.supported_profiles ?? [];
      if (reviewed && profiles.includes('coordination')) skills.push('scheduling');
      if (reviewed && profiles.includes('ordering')) skills.push('booking');

      return {
        name: entry.display_name,
        url: `${entry.endpoint_url}/${entry.slug}/a2a`,
        description: (metadata?.description as string) || `Professional services — ${entry.verticals[0] || 'general'}`,
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
  } catch {
    // Fallback: local resolver DB
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
}
