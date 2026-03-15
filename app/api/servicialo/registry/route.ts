import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RegistryOrg {
  slug: string;
  name: string;
  description: string | null;
  vertical: string | null;
  location: string | null;
  country: string | null;
}

// --- In-memory rate limiter: 100 req/min per IP ---

const RATE_LIMIT = 100;
const WINDOW_MS = 60_000;

const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Periodically clean up stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  hits.forEach((_entry, ip) => {
    const e = hits.get(ip);
    if (e && now >= e.resetAt) hits.delete(ip);
  });
}, 5 * 60_000);

// --- Route handler ---

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Limit: 100 requests per minute.' },
      { status: 429 },
    );
  }

  const { searchParams } = request.nextUrl;

  const vertical = searchParams.get('vertical');
  const location = searchParams.get('location');
  const country = searchParams.get('country');
  const q = searchParams.get('q');
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
  const offset = Number(searchParams.get('offset')) || 0;

  // Build Prisma where clause
  const where: Record<string, unknown> = { discoverable: true };

  if (vertical) where.vertical = vertical;
  if (location) where.location = { contains: location };
  if (country) where.country = country;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { vertical: { contains: q } },
    ];
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      select: {
        slug: true,
        name: true,
        description: true,
        vertical: true,
        location: true,
        country: true,
      },
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    }),
    prisma.organization.count({ where }),
  ]);

  return NextResponse.json({
    data: organizations.map((org: RegistryOrg) => ({
      ...org,
      endpoints: {
        services: `/api/servicialo/${org.slug}/services`,
        availability: `/api/servicialo/${org.slug}/availability`,
      },
    })),
    meta: {
      total,
      limit,
      offset,
    },
  });
}
