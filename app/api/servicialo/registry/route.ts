import { NextResponse } from 'next/server';
import { searchEntries } from '@/lib/registry-db';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/servicialo/response';
import { type NextRequest } from 'next/server';

/**
 * GET /api/servicialo/registry
 *
 * Lists discoverable organizations globally.
 * Primary: canonical registry DB. Fallback: local resolver DB.
 */
export async function GET(request: NextRequest) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  try {
    // Primary: canonical registry
    const entries = await searchEntries({ limit: 50 });

    return NextResponse.json(
      {
        servicialo_version: '1.0',
        total: entries.length,
        data: entries.map((e) => ({
          slug: e.slug,
          name: e.display_name,
          description: (e.metadata as Record<string, unknown>)?.description ?? '',
          vertical: e.verticals[0] ?? '',
          location: (e.metadata as Record<string, unknown>)?.location ?? '',
          country: e.country,
        })),
      },
      { headers: { 'X-Servicialo-Version': '1.0' } },
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
        _source: 'local_fallback',
      },
      { headers: { 'X-Servicialo-Version': '1.0' } },
    );
  }
}
