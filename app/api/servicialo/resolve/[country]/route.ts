import { type NextRequest } from 'next/server';
import { withRateLimit, servicialoJson, servicialoError } from '@/lib/servicialo/response';
import { validateCountry } from '@/lib/servicialo/validation';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { country } = await params;

  const countryError = validateCountry(country);
  if (countryError) {
    return servicialoError(country, countryError, 400);
  }

  const url = new URL(request.url);
  const vertical = url.searchParams.get('vertical');
  const limitParam = parseInt(url.searchParams.get('limit') ?? '20', 10);
  const limit = Math.min(Math.max(limitParam, 1), 100);

  const where: Record<string, unknown> = { country, discoverable: true };
  if (vertical) {
    where.vertical = { contains: vertical };
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: [{ trustScore: 'desc' }, { name: 'asc' }],
      take: limit,
      select: {
        slug: true,
        name: true,
        vertical: true,
        country: true,
        mcpUrl: true,
        restUrl: true,
        healthUrl: true,
        trustScore: true,
        trustLevel: true,
        lastSeen: true,
        registeredAt: true,
      },
    }),
    prisma.organization.count({ where }),
  ]);

  const data = orgs.map((org) => ({
    org_slug: org.slug,
    name: org.name,
    country: org.country,
    verticals: org.vertical ? org.vertical.split(',').map((v) => v.trim()) : [],
    endpoint: {
      mcp: org.mcpUrl || null,
      rest: org.restUrl || null,
    },
    trust: {
      score: org.trustScore,
      level: org.trustLevel,
    },
  }));

  return servicialoJson(country, { total, limit, data });
}
