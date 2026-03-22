/**
 * Registry API key validation.
 *
 * Write endpoints (register, update, heartbeat) require authentication.
 * Read endpoints (search, lookup, agents.json) are public.
 */

import { type NextRequest, NextResponse } from 'next/server';

const REGISTRY_API_KEY = process.env.REGISTRY_API_KEY;

/**
 * Validates the API key from the X-Registry-Api-Key header.
 * Returns null if valid, or a NextResponse error if invalid.
 */
export function requireApiKey(request: NextRequest): NextResponse | null {
  if (!REGISTRY_API_KEY) {
    console.error('[registry-auth] REGISTRY_API_KEY not configured');
    return NextResponse.json(
      { error: 'Registry API key not configured on server' },
      { status: 500 },
    );
  }

  const key = request.headers.get('x-registry-api-key');
  if (!key || key !== REGISTRY_API_KEY) {
    return NextResponse.json(
      { error: 'Invalid or missing API key. Provide X-Registry-Api-Key header.' },
      { status: 401 },
    );
  }

  return null;
}

/**
 * Extracts ownership token from Authorization header.
 * Format: Bearer <token>
 */
export function getOwnershipToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;

  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

/**
 * CORS headers for public protocol API.
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Registry-Api-Key, Authorization',
  'Access-Control-Max-Age': '86400',
};
