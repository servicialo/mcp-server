/**
 * Proxy helper: resolves an org slug via the DNS resolver DB
 * and forwards the request to the implementation's rest_url.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from './response';

const SERVICIALO_VERSION = '1.0';

/**
 * Resolve an org's rest_url from the resolver DB and proxy the request.
 *
 * @param orgSlug - The organization slug to resolve
 * @param path - The path to append after /api/servicialo/{orgSlug}/
 * @param request - The incoming NextRequest (method, headers, body, query forwarded)
 */
export async function resolveAndProxy(
  orgSlug: string,
  path: string,
  request: NextRequest,
): Promise<NextResponse> {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { restUrl: true, discoverable: true },
  });

  if (!org) {
    return NextResponse.json(
      { servicialo_version: SERVICIALO_VERSION, org: orgSlug, error: `Organization "${orgSlug}" not found in resolver` },
      { status: 404, headers: { 'X-Servicialo-Version': SERVICIALO_VERSION } },
    );
  }

  if (!org.restUrl) {
    return NextResponse.json(
      { servicialo_version: SERVICIALO_VERSION, org: orgSlug, error: `Organization "${orgSlug}" has no registered REST endpoint` },
      { status: 502, headers: { 'X-Servicialo-Version': SERVICIALO_VERSION } },
    );
  }

  // Build target URL: {restUrl}/api/servicialo/{orgSlug}/{path}
  const baseUrl = org.restUrl.replace(/\/$/, '');
  const targetPath = `/api/servicialo/${orgSlug}/${path}`;
  const queryString = new URL(request.url).search;
  const targetUrl = `${baseUrl}${targetPath}${queryString}`;

  try {
    const proxyHeaders: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (request.headers.get('content-type')) {
      proxyHeaders['Content-Type'] = request.headers.get('content-type')!;
    }

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: proxyHeaders,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = await request.text();
    }

    const upstream = await fetch(targetUrl, fetchOptions);
    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'X-Servicialo-Version': SERVICIALO_VERSION,
        'X-Servicialo-Proxy': 'true',
        'X-Servicialo-Upstream': baseUrl,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        servicialo_version: SERVICIALO_VERSION,
        org: orgSlug,
        error: 'upstream_unavailable',
        message: `Could not reach implementation at ${baseUrl}: ${(err as Error).message}`,
      },
      { status: 502, headers: { 'X-Servicialo-Version': SERVICIALO_VERSION } },
    );
  }
}
