import { type NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/servicialo/response';
import { validateSlug, validateCountry, validateUrl } from '@/lib/servicialo/validation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { buildResolutionRecord } from '@/lib/servicialo/resolution';
import { probeCapabilities } from '@/lib/servicialo/capabilities';

const VERSION = '1.0';

function versionedJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { servicialo_version: VERSION, ...body },
    { status, headers: { 'X-Servicialo-Version': VERSION } },
  );
}

function versionedError(message: string, errorCode: string, status: number) {
  return NextResponse.json(
    { servicialo_version: VERSION, error: errorCode, message },
    { status, headers: { 'X-Servicialo-Version': VERSION } },
  );
}

interface RegisterRequest {
  slug: string;
  country: string;
  name: string;
  mcp_url?: string;
  rest_url?: string;
  health_url?: string;
  legal_name?: string;
  tax_id?: string;
  verticals?: string[];
  website?: string;
  contact_email?: string;
}

function validateBody(body: unknown): { ok: true; data: RegisterRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  const slugError = validateSlug(b.slug);
  if (slugError) return { ok: false, error: slugError };

  const countryError = validateCountry(b.country);
  if (countryError) return { ok: false, error: countryError };

  if (!b.name || typeof b.name !== 'string') return { ok: false, error: 'Missing or invalid field: name' };

  // At least one endpoint URL required
  const mcpUrl = typeof b.mcp_url === 'string' ? b.mcp_url : undefined;
  const restUrl = typeof b.rest_url === 'string' ? b.rest_url : undefined;

  if (!mcpUrl && !restUrl) {
    return { ok: false, error: 'At least one endpoint URL is required (mcp_url or rest_url)' };
  }

  if (mcpUrl && !validateUrl(mcpUrl)) return { ok: false, error: 'Invalid mcp_url format' };
  if (restUrl && !validateUrl(restUrl)) return { ok: false, error: 'Invalid rest_url format' };

  const healthUrl = typeof b.health_url === 'string' ? b.health_url : undefined;
  if (healthUrl && !validateUrl(healthUrl)) return { ok: false, error: 'Invalid health_url format' };

  return {
    ok: true,
    data: {
      slug: b.slug as string,
      country: b.country as string,
      name: b.name as string,
      mcp_url: mcpUrl,
      rest_url: restUrl,
      health_url: healthUrl,
      legal_name: typeof b.legal_name === 'string' ? b.legal_name : undefined,
      verticals: Array.isArray(b.verticals) ? b.verticals.filter((v): v is string => typeof v === 'string') : undefined,
      website: typeof b.website === 'string' ? b.website : undefined,
      contact_email: typeof b.contact_email === 'string' ? b.contact_email : undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return versionedError('Invalid JSON body', 'invalid_request', 400);
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return versionedError(validation.error, 'invalid_request', 400);
  }

  const { data } = validation;

  try {
    const org = await prisma.organization.create({
      data: {
        slug: data.slug,
        name: data.legal_name ?? data.name,
        description: '',
        vertical: data.verticals?.join(', ') ?? '',
        country: data.country,
        contactEmail: data.contact_email ?? '',
        mcpUrl: data.mcp_url ?? '',
        restUrl: data.rest_url ?? '',
        healthUrl: data.health_url ?? '',
        trustScore: 10,
        trustLevel: 'declared',
        discoverable: true,
        registeredAt: new Date(),
        claimedAt: new Date(),
      },
    });

    // Probe capabilities on registration (await to ensure it completes)
    if (org.restUrl) {
      await probeCapabilities(org.id, org.restUrl, org.slug);
    }

    // Re-read org to include fresh capabilities
    const fresh = await prisma.organization.findUnique({ where: { id: org.id } });
    const resolution = buildResolutionRecord(fresh ?? org);

    return versionedJson({ resolution, message: 'Organization registered in Servicialo resolver' }, 201);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return versionedError(
        'This slug is already registered in the Servicialo resolver.',
        'slug_taken',
        409,
      );
    }
    throw err;
  }
}
