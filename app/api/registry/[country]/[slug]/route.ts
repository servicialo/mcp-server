import { type NextRequest, NextResponse } from 'next/server';
import { getEntry, updateEntry, AuthError } from '@/lib/registry-db';
import { getOwnershipToken, CORS_HEADERS } from '@/lib/registry-auth';

type Params = { params: Promise<{ country: string; slug: string }> };

/**
 * GET /api/registry/{country}/{slug}
 *
 * Lookup a single registry entry. Public, no auth required.
 */
export async function GET(
  _request: NextRequest,
  { params }: Params,
) {
  const { country, slug } = await params;

  try {
    const entry = await getEntry(country, slug);
    if (!entry) {
      return NextResponse.json(
        { error: `Entry ${country}/${slug} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ownership_token, ...publicEntry } = entry;

    return NextResponse.json(publicEntry, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60, s-maxage=120' },
    });
  } catch (error) {
    console.error(`[registry/${country}/${slug}] GET error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * PATCH /api/registry/{country}/{slug}
 *
 * Update a registry entry. Requires ownership token in Authorization header.
 * Body: { endpointUrl?, displayName?, verticals?, metadata? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: Params,
) {
  const { country, slug } = await params;

  const token = getOwnershipToken(request);
  if (!token) {
    return NextResponse.json(
      { error: 'Missing Authorization header with ownership token' },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.endpointUrl === 'string') updateData.endpoint_url = body.endpointUrl;
  if (typeof body.displayName === 'string') updateData.display_name = body.displayName;
  if (Array.isArray(body.verticals)) updateData.verticals = body.verticals;
  if (body.metadata && typeof body.metadata === 'object') updateData.metadata = body.metadata;
  if (typeof body.discoverable === 'boolean') updateData.discoverable = body.discoverable;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    const updated = await updateEntry(country, slug, token, updateData);
    if (!updated) {
      return NextResponse.json(
        { error: `Entry ${country}/${slug} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ownership_token, ...publicEntry } = updated;

    return NextResponse.json(publicEntry, { headers: CORS_HEADERS });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: 'Invalid ownership token' },
        { status: 403, headers: CORS_HEADERS },
      );
    }
    console.error(`[registry/${country}/${slug}] PATCH error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
