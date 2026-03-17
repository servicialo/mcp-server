import { type NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/servicialo/response';
import { validateSlug } from '@/lib/servicialo/validation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface ClaimRequest {
  slug: string;
  name: string;
  description?: string;
  vertical?: string;
  location?: string;
  country?: string;
  contact_email?: string;
}

function validateBody(body: unknown): { ok: true; data: ClaimRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  const slugError = validateSlug(b.slug);
  if (slugError) return { ok: false, error: slugError };
  if (!b.name || typeof b.name !== 'string') return { ok: false, error: 'Missing or invalid field: name' };

  return {
    ok: true,
    data: {
      slug: b.slug as string,
      name: b.name as string,
      description: typeof b.description === 'string' ? b.description : undefined,
      vertical: typeof b.vertical === 'string' ? b.vertical : undefined,
      location: typeof b.location === 'string' ? b.location : undefined,
      country: typeof b.country === 'string' ? b.country : undefined,
      contact_email: typeof b.contact_email === 'string' ? b.contact_email : undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { servicialo_version: '1.0', error: 'invalid_request', message: validation.error },
      { status: 400, headers: { 'X-Servicialo-Version': '1.0' } },
    );
  }

  const { data } = validation;

  try {
    const org = await prisma.organization.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description ?? '',
        vertical: data.vertical ?? '',
        location: data.location ?? '',
        country: data.country ?? '',
        contactEmail: data.contact_email ?? '',
        discoverable: false,
        claimedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        servicialo_version: '1.0',
        slug: org.slug,
        status: 'claimed',
        discoverable: false,
        message: 'Slug claimed. Org will become discoverable after verification.',
      },
      { status: 201, headers: { 'X-Servicialo-Version': '1.0' } },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        {
          servicialo_version: '1.0',
          error: 'slug_taken',
          message: 'This slug is already registered in the Servicialo registry.',
        },
        { status: 409, headers: { 'X-Servicialo-Version': '1.0' } },
      );
    }
    throw err;
  }
}
