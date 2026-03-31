import { type NextRequest, NextResponse } from 'next/server';
import { createEntry, ConflictError } from '@/lib/registry-db';
import { requireApiKey, CORS_HEADERS } from '@/lib/registry-auth';
import { validateSlug, validateCountry, validateUrl } from '@/lib/servicialo/validation';

/**
 * POST /api/registry/register
 *
 * Register a new organization in the Servicialo registry.
 * Requires X-Registry-Api-Key header.
 *
 * Body: {
 *   country: "cl",
 *   slug: "clinica-demo",
 *   displayName: "Clínica Demo",
 *   endpointUrl: "https://coordinalo.com/api/servicialo",
 *   implementer: "coordinalo",
 *   verticals?: ["kinesiologia"],
 *   locale?: "es",
 *   metadata?: { service_count, provider_count, description, location, logo_url }
 * }
 */
export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Validate required fields
  const slugError = validateSlug(body.slug);
  if (slugError) {
    return NextResponse.json({ error: slugError }, { status: 400, headers: CORS_HEADERS });
  }

  const countryError = validateCountry(body.country);
  if (countryError) {
    return NextResponse.json({ error: countryError }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.displayName || typeof body.displayName !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid field: displayName' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!body.endpointUrl || typeof body.endpointUrl !== 'string' || !validateUrl(body.endpointUrl)) {
    return NextResponse.json(
      { error: 'Missing or invalid field: endpointUrl' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (!body.implementer || typeof body.implementer !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid field: implementer' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const verticals = Array.isArray(body.verticals)
    ? body.verticals.filter((v): v is string => typeof v === 'string')
    : [];

  const metadata = body.metadata && typeof body.metadata === 'object'
    ? body.metadata as Record<string, unknown>
    : {};

  try {
    const entry = await createEntry({
      country: body.country as string,
      slug: body.slug as string,
      display_name: body.displayName as string,
      endpoint_url: body.endpointUrl as string,
      implementer: body.implementer as string,
      verticals,
      locale: typeof body.locale === 'string' ? body.locale : 'es',
      metadata,
    });

    return NextResponse.json(
      {
        country: entry.country,
        slug: entry.slug,
        displayName: entry.display_name,
        endpointUrl: entry.endpoint_url,
        implementer: entry.implementer,
        ownershipToken: entry.ownership_token,
        isVerified: entry.is_verified,
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: 'already_exists', message: error.message },
        { status: 409, headers: CORS_HEADERS },
      );
    }
    console.error('[registry/register] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
