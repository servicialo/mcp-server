import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/servicialo/response';
import { type NextRequest } from 'next/server';

const A2A_VERSION = '0.3.0';
const SERVICIALO_PROTOCOL_VERSION = '0.9';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { orgSlug } = params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      name: true,
      description: true,
      slug: true,
      discoverable: true,
      capServices: true,
      capAvailability: true,
      capBooking: true,
    },
  });

  if (!org || !org.discoverable) {
    return NextResponse.json(
      { error: `Organization "${orgSlug}" not found or not discoverable` },
      { status: 404 },
    );
  }

  // Build skills based on verified capabilities
  const skills: Array<{ id: string; name: string; description: string; tags: string[] }> = [];

  if (org.capServices === 'verified') {
    skills.push({
      id: 'list-services',
      name: 'List services',
      description: 'View the catalog of available professional services',
      tags: ['catalog', 'discovery'],
    });
  }

  if (org.capAvailability === 'verified') {
    skills.push({
      id: 'check-availability',
      name: 'Check availability',
      description: 'Query available time slots for scheduling',
      tags: ['scheduling', 'availability'],
    });
  }

  if (org.capBooking === 'verified') {
    skills.push({
      id: 'book-session',
      name: 'Book session',
      description: 'Reserve an appointment with a professional',
      tags: ['booking', 'appointment'],
    });
  }

  // Always include at least a discovery skill
  if (skills.length === 0) {
    skills.push({
      id: 'discover',
      name: 'Discover',
      description: 'Learn about available services at this organization',
      tags: ['discovery'],
    });
  }

  const baseUrl = 'https://servicialo.com';
  const orgBase = `${baseUrl}/api/servicialo/${org.slug}`;

  const agentCard = {
    name: org.name,
    description: org.description || `Professional services at ${org.name}`,
    url: `${orgBase}/a2a`,
    protocolVersion: A2A_VERSION,
    provider: {
      organization: 'Servicialo',
      url: baseUrl,
    },
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    skills,
    authentication: {
      schemes: [],
    },
    // Servicialo-specific extensions
    'x-servicialo': {
      protocolVersion: SERVICIALO_PROTOCOL_VERSION,
      implementer: {
        name: 'Coordinalo',
        url: 'https://coordinalo.com',
        status: 'verified',
        type: 'reference-implementation',
      },
      endpoints: {
        mcp: `${baseUrl}/api/mcp`,
        rest: `${orgBase}`,
        agentCard: `${orgBase}/.well-known/agent.json`,
        a2a: `${orgBase}/a2a`,
      },
      registry: `${baseUrl}/.well-known/agents.json`,
    },
  };

  return NextResponse.json(agentCard, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
