import { type NextRequest } from 'next/server';
import { servicialoJson, servicialoError, withRateLimit } from '@/lib/servicialo/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { orgSlug } = params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug, discoverable: true },
    include: {
      services: {
        where: { isActive: true },
        include: {
          serviceProviders: true,
        },
      },
    },
  });

  if (!org) {
    return servicialoError(orgSlug, `Organization "${orgSlug}" not found or not discoverable`, 404);
  }

  return servicialoJson(orgSlug, {
    total: org.services.length,
    data: org.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      duration_minutes: s.durationMinutes,
      price: s.priceAmount != null
        ? { amount: s.priceAmount, currency: s.priceCurrency ?? 'CLP' }
        : null,
      provider_count: s.serviceProviders.length,
    })),
  });
}
