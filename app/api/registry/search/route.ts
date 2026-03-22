import { type NextRequest, NextResponse } from 'next/server';
import { searchEntries } from '@/lib/registry-db';
import { CORS_HEADERS } from '@/lib/registry-auth';

/**
 * GET /api/registry/search?country=cl&vertical=kinesiologia&q=mama&locale=es
 *
 * Public search endpoint for the Servicialo registry.
 * All parameters are optional — returns all entries if no filters.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const country = url.searchParams.get('country') ?? undefined;
  const vertical = url.searchParams.get('vertical') ?? undefined;
  const q = url.searchParams.get('q') ?? undefined;
  const locale = url.searchParams.get('locale') ?? undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20;

  try {
    const entries = await searchEntries({ country, vertical, q, locale, limit });

    // Strip ownership_token from public response
    const data = entries.map((entry) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ownership_token, ...rest } = entry;
      return rest;
    });

    return NextResponse.json(
      { total: data.length, data },
      { headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60, s-maxage=120' } },
    );
  } catch (error) {
    console.error('[registry/search] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
