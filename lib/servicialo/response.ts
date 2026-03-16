/**
 * Servicialo protocol response helpers.
 */

import { NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';

const SERVICIALO_VERSION = '1.0';

export function servicialoJson(org: string, body: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { servicialo_version: SERVICIALO_VERSION, org, ...body },
    { status, headers: { 'X-Servicialo-Version': SERVICIALO_VERSION } },
  );
}

export function servicialoError(org: string, message: string, status: number) {
  return NextResponse.json(
    { servicialo_version: SERVICIALO_VERSION, org, error: message },
    { status, headers: { 'X-Servicialo-Version': SERVICIALO_VERSION } },
  );
}

export function withRateLimit(request: Request): NextResponse | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1';
  const { allowed, resetMs } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retry_after_ms: resetMs },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetMs / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  // Return null = allowed; caller adds remaining header to their response
  // We store it in a header the caller can read
  return null;
}

