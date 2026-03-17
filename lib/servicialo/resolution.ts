/**
 * Builds a Servicialo resolution record from an Organization row.
 */
export function buildResolutionRecord(org: {
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
}) {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const isActive =
    (org.lastSeen && now - org.lastSeen.getTime() < SEVEN_DAYS) ||
    (org.registeredAt && now - org.registeredAt.getTime() < SEVEN_DAYS) ||
    (!org.lastSeen && !org.registeredAt); // grace for pre-resolver orgs

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
      registered_at: org.registeredAt?.toISOString() ?? org.registeredAt,
    },
    status: isActive ? 'active' : 'inactive',
  };
}
