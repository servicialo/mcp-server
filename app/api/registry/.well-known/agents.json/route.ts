import { NextResponse } from 'next/server';
import { listAllEntries } from '@/lib/registry-db';
import { CORS_HEADERS } from '@/lib/registry-auth';

/**
 * GET /api/registry/.well-known/agents.json
 *
 * A2A global agent index. Aggregates ALL implementers' registry entries
 * into a list of agent cards. Public, no auth required.
 */
export async function GET() {
  try {
    const entries = await listAllEntries();

    const agents = entries.map((entry) => ({
      name: entry.display_name,
      description: (entry.metadata as Record<string, unknown>)?.description ?? null,
      vertical: entry.verticals[0] ?? null,
      implementer: entry.implementer,
      country: entry.country,
      url: `${entry.endpoint_url}/${entry.slug}/a2a`,
      agentCard: `${entry.endpoint_url}/${entry.slug}/.well-known/agent.json`,
      is_verified: entry.is_verified,
      last_heartbeat: entry.last_heartbeat,
    }));

    return NextResponse.json(
      { agents },
      {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        },
      },
    );
  } catch (error) {
    console.error('[registry/.well-known/agents.json] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
