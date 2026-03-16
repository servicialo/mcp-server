import { type NextRequest } from 'next/server';
import { servicialoJson, servicialoError, withRateLimit } from '@/lib/servicialo/response';
import { prisma } from '@/lib/prisma';

const WORK_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri (ISO: 1=Mon … 7=Sun)
const DAY_START = 9;
const DAY_END = 18;
const SLOT_MINUTES = 60;
const TZ = 'America/Santiago';

/**
 * Convert a local datetime string (e.g. "2026-03-16T09:00:00") in a timezone to UTC Date.
 * Uses Intl to discover the offset — no external deps needed.
 */
function zonedToUtc(localIso: string, tz: string): Date {
  const asUtc = new Date(localIso + 'Z');
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(asUtc);
  const g = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
  const inTzStr = `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}Z`;
  const inTz = new Date(inTzStr);
  const offsetMs = asUtc.getTime() - inTz.getTime();
  return new Date(asUtc.getTime() + offsetMs);
}

/** Get ISO weekday (1=Mon…7=Sun) for a date in the Santiago timezone */
function isoWeekDaySantiago(d: Date): number {
  const dayStr = d.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short' });
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[dayStr] ?? 0;
}

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

  // Query range: convert Santiago day boundaries to UTC
  const rangeStartUtc = zonedToUtc(`${dateFrom}T00:00:00`, TZ);
  const rangeEndUtc = zonedToUtc(`${effectiveDateTo}T23:59:59`, TZ);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      providerId: { in: providerIds },
      start: { gte: rangeStartUtc, lte: rangeEndUtc },
    },
    select: { providerId: true, start: true },
  });

  const bookedSet = new Set(
    existingAppointments.map((a: { providerId: string; start: Date }) => `${a.providerId}|${a.start.toISOString()}`),
  );

  // Generate slots day by day
  const days: { date: string; slots: { start: string; end: string; provider_id: string }[] }[] = [];

  // Iterate calendar days
  const fromMs = new Date(dateFrom + 'T12:00:00Z').getTime();
  const toMs = new Date(effectiveDateTo + 'T12:00:00Z').getTime();

  for (let ms = fromMs; ms <= toMs; ms += 86_400_000) {
    const probe = new Date(ms);
    const dateStr = dateFrom === effectiveDateTo
      ? dateFrom
      : probe.toISOString().slice(0, 10);

    const dow = isoWeekDaySantiago(probe);
    if (!WORK_DAYS.includes(dow)) continue;

    const daySlots: { start: string; end: string; provider_id: string }[] = [];

    for (const providerId of providerIds) {
      for (let hour = DAY_START; hour * 60 + SLOT_MINUTES <= DAY_END * 60; hour++) {
        const localStart = `${dateStr}T${String(hour).padStart(2, '0')}:00:00`;
        const slotUtc = zonedToUtc(localStart, TZ);

        const key = `${providerId}|${slotUtc.toISOString()}`;
        if (bookedSet.has(key)) continue;

        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endMinutes = hour * 60 + SLOT_MINUTES;
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

        daySlots.push({ start: startTime, end: endTime, provider_id: providerId });
      }
    }

    if (daySlots.length > 0) {
      days.push({ date: dateStr, slots: daySlots });
    }
  }

  return servicialoJson(orgSlug, { service_id: serviceId, data: days });
}
