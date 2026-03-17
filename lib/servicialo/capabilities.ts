/**
 * Capabilities probing and readiness derivation for the Servicialo DNS Resolver.
 *
 * Probes an org's rest_url endpoints to verify what capabilities are actually working.
 * Rules:
 *   - Probes can promote or refresh, never downgrade (transient failures are ignored)
 *   - Booking is never probed actively — only marked "verified" via proxy success (201)
 */

import { prisma } from '@/lib/prisma';

const PROBE_TIMEOUT = 5_000; // 5 seconds

export type Readiness = 'declared' | 'catalog_ready' | 'bookable' | 'proven';

interface OrgCapabilities {
  capServices: string;
  capServicesCount: number;
  capServicesAt: Date | null;
  capAvailability: string;
  capAvailabilityAt: Date | null;
  capBooking: string;
  capBookingAt: Date | null;
}

/**
 * Derive readiness level from capability fields.
 */
export function deriveReadiness(org: OrgCapabilities): Readiness {
  if (org.capBooking === 'verified') return 'proven';
  if (org.capAvailability === 'verified') return 'bookable';
  if (org.capServices === 'verified') return 'catalog_ready';
  return 'declared';
}

/**
 * Probe an org's rest_url to check services and availability capabilities.
 * Fire-and-forget: errors are logged but never thrown.
 */
export async function probeCapabilities(
  orgId: string,
  restUrl: string,
  orgSlug: string,
): Promise<void> {
  try {
    const baseUrl = restUrl.replace(/\/$/, '');
    const now = new Date();

    // Step 1: Probe services
    const servicesUrl = `${baseUrl}/api/servicialo/${orgSlug}/services`;
    let serviceCount = 0;
    let servicesVerified = false;
    let firstServiceId: string | null = null;

    try {
      const res = await fetch(servicesUrl, {
        signal: AbortSignal.timeout(PROBE_TIMEOUT),
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json() as Record<string, unknown>;
        // Support both formats: { data: [...] } (servicialo standard) and { services: [...] } (coordinalo)
        const services = (data.data ?? data.services) as Array<{ id: string }> | undefined;

        if (services && services.length > 0) {
          serviceCount = services.length;
          servicesVerified = true;
          firstServiceId = services[0].id;

          await prisma.organization.update({
            where: { id: orgId },
            data: {
              capServices: 'verified',
              capServicesCount: serviceCount,
              capServicesAt: now,
            },
          });
        } else {
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              capServices: 'empty',
              capServicesCount: 0,
              capServicesAt: now,
            },
          });
        }
      }
      // Non-2xx: don't downgrade
    } catch {
      // Timeout or network error: don't downgrade
    }

    // Step 2: Probe availability (only if services verified)
    if (servicesVerified && firstServiceId) {
      const today = new Date().toISOString().slice(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
      // Support both param formats: serviceId (coordinalo) and service_id (standard)
      const availUrl = `${baseUrl}/api/servicialo/${orgSlug}/availability?serviceId=${firstServiceId}&service_id=${firstServiceId}&from=${today}&date_from=${today}&days=7&date_to=${nextWeek}`;

      try {
        const res = await fetch(availUrl, {
          signal: AbortSignal.timeout(PROBE_TIMEOUT),
          headers: { 'Accept': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json() as Record<string, unknown>;
          // Support both: { data: [{ slots: [...] }] } (servicialo standard) and { slots: [...] } (coordinalo)
          const slotsArray = data.slots as unknown[] | undefined;
          const daysArray = data.data as Array<{ slots?: unknown[] }> | undefined;
          const hasSlots =
            (slotsArray && slotsArray.length > 0) ||
            (daysArray && daysArray.some((d) => d.slots && (d.slots as unknown[]).length > 0));

          await prisma.organization.update({
            where: { id: orgId },
            data: {
              capAvailability: hasSlots ? 'verified' : 'unavailable',
              capAvailabilityAt: now,
            },
          });
        }
      } catch {
        // Don't downgrade
      }
    }
  } catch (err) {
    console.error(`[capabilities] probeCapabilities error for ${orgSlug}:`, err);
  }
}

/**
 * Opportunistically update capability timestamps after a successful proxy call.
 * Fire-and-forget: never throws.
 */
export async function updateCapabilityFromProxy(
  orgId: string,
  path: string,
  upstreamStatus: number,
): Promise<void> {
  try {
    const now = new Date();

    if (path === 'services' && upstreamStatus >= 200 && upstreamStatus < 300) {
      await prisma.organization.update({
        where: { id: orgId },
        data: { capServicesAt: now },
      });
    } else if (path === 'availability' && upstreamStatus >= 200 && upstreamStatus < 300) {
      await prisma.organization.update({
        where: { id: orgId },
        data: { capAvailabilityAt: now },
      });
    } else if (path === 'book' && upstreamStatus === 201) {
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          capBooking: 'verified',
          capBookingAt: now,
        },
      });
    }
  } catch (err) {
    console.error(`[capabilities] updateCapabilityFromProxy error:`, err);
  }
}
