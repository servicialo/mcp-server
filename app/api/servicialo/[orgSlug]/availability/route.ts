import { type NextRequest } from 'next/server';
import { servicialoJson, servicialoError, withRateLimit } from '@/lib/servicialo/response';
import { prisma } from '@/lib/prisma';
import { generateAvailableSlots } from '@/lib/servicialo/slots';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { orgSlug } = params;
  const url = new URL(request.url);
  const serviceId = url.searchParams.get('service_id');
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');

  if (!serviceId) return servicialoError(orgSlug, 'Missing required query param: service_id', 400);
  if (!dateFrom) return servicialoError(orgSlug, 'Missing required query param: date_from', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) return servicialoError(orgSlug, 'date_from must be ISO date (YYYY-MM-DD)', 400);
  if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) return servicialoError(orgSlug, 'date_to must be ISO date (YYYY-MM-DD)', 400);

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug, discoverable: true },
  });
  if (!org) return servicialoError(orgSlug, `Organization "${orgSlug}" not found or not discoverable`, 404);

  const service = await prisma.service.findFirst({
    where: { id: serviceId, organizationId: org.id, isActive: true },
    include: { serviceProviders: { select: { providerId: true } } },
  });
  if (!service) return servicialoError(orgSlug, `Service "${serviceId}" not found in org "${orgSlug}"`, 400);

  let effectiveDateTo = dateTo;
  if (!effectiveDateTo) {
    const d = new Date(dateFrom);
    d.setDate(d.getDate() + 7);
    effectiveDateTo = d.toISOString().slice(0, 10);
  }

  const providerIds = service.serviceProviders.map((sp: { providerId: string }) => sp.providerId);

  const result = await generateAvailableSlots({
    providerIds,
    dateFrom,
    dateTo: effectiveDateTo,
    slotDurationMinutes: service.durationMinutes,
  });

  if (result.reason) {
    return servicialoJson(orgSlug, {
      service_id: serviceId,
      data: [],
      reason: result.reason,
    });
  }

  return servicialoJson(orgSlug, { service_id: serviceId, data: result.days });
}
