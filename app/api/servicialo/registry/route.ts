import { NextRequest, NextResponse } from 'next/server';
import registryData from '@/data/registry.json';

interface Organization {
  slug: string;
  name: string;
  description: string;
  vertical: string;
  location: string;
  country: string;
  discoverable: boolean;
  endpoints: {
    services: string;
    availability: string;
  };
}

/**
 * GET /api/servicialo/registry?vertical=&location=&q=&country=&limit=&offset=
 *
 * Public endpoint — no authentication required.
 * Returns discoverable organizations from the Servicialo registry.
 *
 * Query parameters:
 *   vertical  — filter by service vertical (e.g. kinesiologia, dental)
 *   location  — filter by city/commune
 *   country   — filter by ISO 3166-1 alpha-2 country code (default: cl)
 *   q         — free-text search across name and description
 *   limit     — max results (default: 20, max: 100)
 *   offset    — pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const vertical = searchParams.get('vertical')?.toLowerCase();
  const location = searchParams.get('location')?.toLowerCase();
  const country = searchParams.get('country')?.toLowerCase() || 'cl';
  const q = searchParams.get('q')?.toLowerCase();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

  // Filter: only discoverable orgs
  let orgs: Organization[] = (registryData.organizations as Organization[]).filter(
    (org) => org.discoverable,
  );

  // Filter by country
  orgs = orgs.filter((org) => org.country === country);

  // Filter by vertical
  if (vertical) {
    orgs = orgs.filter((org) => org.vertical?.toLowerCase() === vertical);
  }

  // Filter by location
  if (location) {
    orgs = orgs.filter((org) => org.location?.toLowerCase().includes(location));
  }

  // Free-text search
  if (q) {
    orgs = orgs.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.description.toLowerCase().includes(q) ||
        org.vertical?.toLowerCase().includes(q),
    );
  }

  const total = orgs.length;

  // Paginate
  const paginated = orgs.slice(offset, offset + limit);

  // Project safe fields only (no emails, no RUT, no internal config)
  const results = paginated.map((org) => ({
    slug: org.slug,
    name: org.name,
    description: org.description,
    vertical: org.vertical || null,
    location: org.location || null,
    country: org.country,
    endpoints: org.endpoints,
  }));

  return NextResponse.json({
    data: results,
    meta: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
}
