import { type NextRequest } from 'next/server';
import { resolveAndProxy } from '@/lib/servicialo/proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const { orgSlug } = params;
  return resolveAndProxy(orgSlug, 'services', request);
}
