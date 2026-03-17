import { type NextRequest } from 'next/server';
import { resolveAndProxy } from '@/lib/servicialo/proxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const { orgSlug } = params;
  return resolveAndProxy(orgSlug, 'book', request);
}
