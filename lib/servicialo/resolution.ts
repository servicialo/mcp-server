/**
 * Builds a Servicialo resolution record from an Organization row.
 */
import { deriveReadiness } from './capabilities';

interface OrgInput {
  slug: string;
  country: string;
  name: string;
  vertical: string;
  mcpUrl: string;
  restUrl: string;
  healthUrl: string;
  trustScore: number;
  trustLevel: string;
  lastSeen: Date | null;
  registeredAt: Date | null;
  // Capabilities (optional for backward compat — defaults to unverified)
  capServices?: string;
  capServicesCount?: number;
  capServicesAt?: Date | null;
  capAvailability?: string;
  capAvailabilityAt?: Date | null;
  capBooking?: string;
  capBookingAt?: Date | null;
}

export function buildResolutionRecord(org: OrgInput) {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const isActive =
    (org.lastSeen && now - org.lastSeen.getTime() < SEVEN_DAYS) ||
    (org.registeredAt && now - org.registeredAt.getTime() < SEVEN_DAYS) ||
    (!org.lastSeen && !org.registeredAt); // grace for pre-resolver orgs

  const capOrg = {
    capServices: org.capServices ?? 'unverified',
    capServicesCount: org.capServicesCount ?? 0,
    capServicesAt: org.capServicesAt ?? null,
    capAvailability: org.capAvailability ?? 'unverified',
    capAvailabilityAt: org.capAvailabilityAt ?? null,
    capBooking: org.capBooking ?? 'unverified',
    capBookingAt: org.capBookingAt ?? null,
  };

  return {
    org_slug: org.slug,
    country: org.country,
    addresses: {
      path: `/${org.country}/${org.slug}`,
      subdomain: org.country && org.slug ? `${org.slug}.${org.country}.servicialo.com` : null,
    },
    endpoint: {
      mcp: org.mcpUrl || null,
      rest: org.restUrl || null,
      health: org.healthUrl || null,
    },
    identity: {
      legal_name: org.name,
      verticals: org.vertical ? org.vertical.split(',').map((v) => v.trim()) : [],
    },
    trust: {
      score: org.trustScore,
      level: org.trustLevel,
      last_seen: org.lastSeen?.toISOString() ?? null,
      registered_at: org.registeredAt?.toISOString() ?? null,
    },
    capabilities: {
      catalog: {
        status: capOrg.capServices,
        count: capOrg.capServicesCount,
        checked_at: capOrg.capServicesAt?.toISOString() ?? null,
      },
      availability: {
        status: capOrg.capAvailability,
        checked_at: capOrg.capAvailabilityAt?.toISOString() ?? null,
      },
      booking: {
        status: capOrg.capBooking,
        checked_at: capOrg.capBookingAt?.toISOString() ?? null,
      },
    },
    readiness: deriveReadiness(capOrg),
    status: isActive ? 'active' : 'inactive',
  };
}
