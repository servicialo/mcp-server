import { type NextRequest, NextResponse } from 'next/server';
import { servicialoJson, servicialoError, withRateLimit } from '@/lib/servicialo/response';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { validateSlot } from '@/lib/servicialo/slots';

interface BookRequest {
  service_id: string;
  provider_id: string;
  start: string;
  end: string;
  requester: {
    name: string;
    email: string;
    agent: boolean;
  };
  notes?: string;
}

function validateBody(body: unknown): { ok: true; data: BookRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  if (!b.service_id || typeof b.service_id !== 'string') return { ok: false, error: 'Missing or invalid field: service_id' };
  if (!b.provider_id || typeof b.provider_id !== 'string') return { ok: false, error: 'Missing or invalid field: provider_id' };
  if (!b.start || typeof b.start !== 'string') return { ok: false, error: 'Missing or invalid field: start (ISO datetime)' };
  if (!b.end || typeof b.end !== 'string') return { ok: false, error: 'Missing or invalid field: end (ISO datetime)' };
  if (isNaN(Date.parse(b.start as string))) return { ok: false, error: 'start must be a valid ISO datetime' };
  if (isNaN(Date.parse(b.end as string))) return { ok: false, error: 'end must be a valid ISO datetime' };

  if (!b.requester || typeof b.requester !== 'object') return { ok: false, error: 'Missing or invalid field: requester' };
  const req = b.requester as Record<string, unknown>;
  if (!req.name || typeof req.name !== 'string') return { ok: false, error: 'Missing or invalid field: requester.name' };
  if (!req.email || typeof req.email !== 'string') return { ok: false, error: 'Missing or invalid field: requester.email' };

  return {
    ok: true,
    data: {
      service_id: b.service_id as string,
      provider_id: b.provider_id as string,
      start: b.start as string,
      end: b.end as string,
      requester: { name: req.name as string, email: req.email as string, agent: req.agent === true },
      notes: typeof b.notes === 'string' ? b.notes : '',
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { orgSlug } = params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return servicialoError(orgSlug, 'Invalid JSON body', 400);
  }

  const validation = validateBody(body);
  if (!validation.ok) return servicialoError(orgSlug, validation.error, 400);
  const { data } = validation;

  // Validate org
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug, discoverable: true },
  });
  if (!org) return servicialoError(orgSlug, `Organization "${orgSlug}" not found or not discoverable`, 404);

  // Validate service belongs to org
  const service = await prisma.service.findFirst({
    where: { id: data.service_id, organizationId: org.id, isActive: true },
  });
  if (!service) return servicialoError(orgSlug, `Service "${data.service_id}" not found in org "${orgSlug}"`, 400);

  // Validate provider belongs to org and offers this service
  const sp = await prisma.serviceProvider.findUnique({
    where: { serviceId_providerId: { serviceId: data.service_id, providerId: data.provider_id } },
    include: { provider: true },
  });
  if (!sp || sp.provider.organizationId !== org.id) {
    return servicialoError(orgSlug, `Provider "${data.provider_id}" does not offer service "${data.service_id}"`, 400);
  }

  // Validate slot against provider availability and conflicts
  const slotCheck = await validateSlot({
    providerId: data.provider_id,
    startUtc: new Date(data.start),
    endUtc: new Date(data.end),
    durationMinutes: service.durationMinutes,
  });

  if (!slotCheck.valid) {
    const messages: Record<string, string> = {
      NO_AVAILABILITY_CONFIGURED: 'Provider has no availability configured',
      OUTSIDE_PROVIDER_HOURS: 'Requested slot is outside provider availability hours',
      SLOT_CONFLICT: 'This slot was just booked. Please query availability again.',
    };
    const status = slotCheck.reason === 'SLOT_CONFLICT' ? 409 : 400;
    return servicialoError(orgSlug, messages[slotCheck.reason!] ?? 'Invalid slot', status);
  }

  // Atomic booking inside a transaction
  // The @@unique([providerId, start]) constraint prevents double-booking at the DB level
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      // Optimistic read: check for existing booking at this slot
      const existing = await tx.appointment.findUnique({
        where: { providerId_start: { providerId: data.provider_id, start: new Date(data.start) } },
      });
      if (existing) {
        throw new Error('SLOT_TAKEN');
      }

      return tx.appointment.create({
        data: {
          start: new Date(data.start),
          end: new Date(data.end),
          status: 'confirmed',
          notes: data.notes ?? '',
          bookedByAgent: data.requester.agent,
          requesterName: data.requester.name,
          requesterEmail: data.requester.email,
          serviceId: data.service_id,
          providerId: data.provider_id,
        },
      });
    });

    return servicialoJson(orgSlug, {
      booking_id: appointment.id,
      status: appointment.status,
      service_id: appointment.serviceId,
      start: appointment.start.toISOString(),
      end: appointment.end.toISOString(),
      provider_id: appointment.providerId,
    }, 201);
  } catch (err) {
    // Handle double-booking: explicit check or DB unique constraint violation
    if (
      (err instanceof Error && err.message === 'SLOT_TAKEN') ||
      (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
    ) {
      return NextResponse.json(
        {
          servicialo_version: '1.0',
          org: orgSlug,
          error: 'slot_unavailable',
          message: 'This slot was just booked. Please query availability again.',
        },
        { status: 409, headers: { 'X-Servicialo-Version': '1.0' } },
      );
    }
    throw err;
  }
}
