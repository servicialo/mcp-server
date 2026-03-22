import { type NextRequest, NextResponse } from 'next/server';
import { heartbeat, AuthError } from '@/lib/registry-db';
import { getOwnershipToken, CORS_HEADERS } from '@/lib/registry-auth';

type Params = { params: Promise<{ country: string; slug: string }> };

/**
 * POST /api/registry/{country}/{slug}/heartbeat
 *
 * Keepalive signal for a registry entry.
 * Requires ownership token in Authorization header.
 */
export async function POST(
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

  try {
    const updated = await heartbeat(country, slug, token);
    if (!updated) {
      return NextResponse.json(
        { error: `Entry ${country}/${slug} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      {
        country: updated.country,
        slug: updated.slug,
        last_heartbeat: updated.last_heartbeat,
        message: 'Heartbeat recorded',
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: 'Invalid ownership token' },
        { status: 403, headers: CORS_HEADERS },
      );
    }
    console.error(`[registry/${country}/${slug}/heartbeat] Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
