/**
 * Shared slot generation & validation logic.
 * Used by both /availability (to generate slots) and /book (to validate a requested slot).
 */
import { prisma } from '@/lib/prisma';

export interface ProviderSlotWindow {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  timezone: string;
}

export interface SlotInfo {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  provider_id: string;
}

// ── Timezone helpers ──

/**
 * Convert a local datetime string (e.g. "2026-03-16T09:00:00") in a timezone to UTC Date.
 */
export function zonedToUtc(localIso: string, tz: string): Date {
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

/** Get ISO weekday (1=Mon…7=Sun) for a date in the given timezone */
export function isoWeekDay(d: Date, tz: string): number {
  const dayStr = d.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[dayStr] ?? 0;
}

/** Parse "HH:MM" to total minutes since midnight */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Format total minutes to "HH:MM" */
function minutesToTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

// ── Availability fetching ──

const ACTIVE_BOOKING_STATUSES = ['scheduled', 'confirmed'];

/**
 * Get ProviderAvailability windows for given providers.
 * Returns null if no availability is configured for any provider.
 */
export async function getProviderAvailability(
  providerIds: string[],
): Promise<ProviderSlotWindow[] | null> {
  const rows = await prisma.providerAvailability.findMany({
    where: { providerId: { in: providerIds } },
    select: { providerId: true, dayOfWeek: true, startTime: true, endTime: true, timezone: true },
  });
  if (rows.length === 0) return null;
  return rows.map(r => ({
    providerId: r.providerId,
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    timezone: r.timezone,
  })) as (ProviderSlotWindow & { providerId: string })[];
}

/**
 * Get existing appointments that could conflict with slots in the given UTC range.
 * Only considers active statuses (scheduled, confirmed).
 */
export async function getConflictingAppointments(
  providerIds: string[],
  rangeStartUtc: Date,
  rangeEndUtc: Date,
): Promise<Set<string>> {
  const existing = await prisma.appointment.findMany({
    where: {
      providerId: { in: providerIds },
      status: { in: ACTIVE_BOOKING_STATUSES },
      start: { gte: rangeStartUtc, lte: rangeEndUtc },
    },
    select: { providerId: true, start: true, end: true },
  });

  // Key format: "providerId|startISO" for exact match
  const set = new Set<string>();
  for (const a of existing) {
    set.add(`${a.providerId}|${a.start.toISOString()}`);
  }
  return set;
}

// ── Slot generation ──

export interface DaySlots {
  date: string;
  slots: SlotInfo[];
}

/**
 * Generate available slots for a date range, respecting ProviderAvailability
 * and filtering out conflicting appointments.
 *
 * Returns { days, reason? } where reason is set if no availability is configured.
 */
export async function generateAvailableSlots(options: {
  providerIds: string[];
  dateFrom: string;          // "YYYY-MM-DD"
  dateTo: string;            // "YYYY-MM-DD"
  slotDurationMinutes: number;
}): Promise<{ days: DaySlots[]; reason?: string }> {
  const { providerIds, dateFrom, dateTo, slotDurationMinutes } = options;

  const availability = await getProviderAvailability(providerIds);
  if (!availability) {
    return { days: [], reason: 'NO_AVAILABILITY_CONFIGURED' };
  }

  // Group availability by providerId+dayOfWeek
  const windowsByProviderDay = new Map<string, (ProviderSlotWindow & { providerId: string })[]>();
  for (const w of availability as (ProviderSlotWindow & { providerId: string })[]) {
    const key = `${w.providerId}|${w.dayOfWeek}`;
    const list = windowsByProviderDay.get(key) ?? [];
    list.push(w);
    windowsByProviderDay.set(key, list);
  }

  // Determine timezone from first availability row (all should match per provider)
  const tz = (availability as (ProviderSlotWindow & { providerId: string })[])[0].timezone;

  // Get conflicting appointments
  const rangeStartUtc = zonedToUtc(`${dateFrom}T00:00:00`, tz);
  const rangeEndUtc = zonedToUtc(`${dateTo}T23:59:59`, tz);
  const conflictSet = await getConflictingAppointments(providerIds, rangeStartUtc, rangeEndUtc);

  const days: DaySlots[] = [];
  const fromMs = new Date(dateFrom + 'T12:00:00Z').getTime();
  const toMs = new Date(dateTo + 'T12:00:00Z').getTime();

  for (let ms = fromMs; ms <= toMs; ms += 86_400_000) {
    const probe = new Date(ms);
    const dateStr = probe.toISOString().slice(0, 10);
    const dow = isoWeekDay(probe, tz);

    const daySlots: SlotInfo[] = [];

    for (const providerId of providerIds) {
      const windows = windowsByProviderDay.get(`${providerId}|${dow}`);
      if (!windows) continue;

      for (const w of windows) {
        const windowStart = timeToMinutes(w.startTime);
        const windowEnd = timeToMinutes(w.endTime);

        for (let slotStart = windowStart; slotStart + slotDurationMinutes <= windowEnd; slotStart += slotDurationMinutes) {
          const slotStartTime = minutesToTime(slotStart);
          const slotEndTime = minutesToTime(slotStart + slotDurationMinutes);

          // Check conflict
          const localStartIso = `${dateStr}T${slotStartTime}:00`;
          const slotUtc = zonedToUtc(localStartIso, w.timezone);
          const conflictKey = `${providerId}|${slotUtc.toISOString()}`;
          if (conflictSet.has(conflictKey)) continue;

          daySlots.push({ start: slotStartTime, end: slotEndTime, provider_id: providerId });
        }
      }
    }

    if (daySlots.length > 0) {
      days.push({ date: dateStr, slots: daySlots });
    }
  }

  return { days };
}

// ── Slot validation (used by /book) ──

export interface SlotValidationResult {
  valid: boolean;
  reason?: 'NO_AVAILABILITY_CONFIGURED' | 'OUTSIDE_PROVIDER_HOURS' | 'SLOT_CONFLICT';
}

/**
 * Validate that a specific slot is bookable:
 * 1. Provider has ProviderAvailability configured
 * 2. Slot falls within a configured availability window for that day
 * 3. No conflicting active appointments
 */
export async function validateSlot(options: {
  providerId: string;
  startUtc: Date;
  endUtc: Date;
  durationMinutes: number;
}): Promise<SlotValidationResult> {
  const { providerId, startUtc, endUtc } = options;

  const availability = await getProviderAvailability([providerId]);
  if (!availability) {
    return { valid: false, reason: 'NO_AVAILABILITY_CONFIGURED' };
  }

  const providerWindows = availability as (ProviderSlotWindow & { providerId: string })[];
  const tz = providerWindows[0].timezone;

  // Get local day-of-week and time for the slot start
  const dow = isoWeekDay(startUtc, tz);
  const localTimeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  });
  const localTime = localTimeFmt.format(startUtc); // "HH:MM"
  const localEndTime = localTimeFmt.format(endUtc);

  const slotStartMins = timeToMinutes(localTime);
  const slotEndMins = timeToMinutes(localEndTime);

  // Check if slot falls within any availability window for this day
  const matchingWindow = providerWindows.find(w =>
    w.dayOfWeek === dow &&
    slotStartMins >= timeToMinutes(w.startTime) &&
    slotEndMins <= timeToMinutes(w.endTime)
  );

  if (!matchingWindow) {
    return { valid: false, reason: 'OUTSIDE_PROVIDER_HOURS' };
  }

  // Check for conflicts with active appointments
  const conflicts = await getConflictingAppointments([providerId], startUtc, endUtc);
  if (conflicts.size > 0) {
    return { valid: false, reason: 'SLOT_CONFLICT' };
  }

  return { valid: true };
}
