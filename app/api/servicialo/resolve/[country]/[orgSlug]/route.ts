import { type NextRequest } from 'next/server';
import { withRateLimit, servicialoJson, servicialoError } from '@/lib/servicialo/response';
import { buildResolutionRecord } from '@/lib/servicialo/resolution';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string; orgSlug: string }> },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { country, orgSlug } = await params;

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, country, discoverable: true },
  });

  if (!org) {
    return servicialoError(orgSlug, `Organization '${country}/${orgSlug}' not found in resolver`, 404);
  }

  return servicialoJson(orgSlug, { resolution: buildResolutionRecord(org) });
}
