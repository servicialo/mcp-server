import { type NextRequest } from 'next/server';
import { withRateLimit, servicialoJson, servicialoError } from '@/lib/servicialo/response';
import { validateUrl } from '@/lib/servicialo/validation';
import { prisma } from '@/lib/prisma';
import { buildResolutionRecord } from '@/lib/servicialo/resolution';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ country: string; orgSlug: string }> },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { country, orgSlug } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return servicialoError(orgSlug, 'Invalid JSON body', 400);
  }

  const mcpUrl = typeof body.mcp_url === 'string' ? body.mcp_url : undefined;
  const restUrl = typeof body.rest_url === 'string' ? body.rest_url : undefined;
  const healthUrl = typeof body.health_url === 'string' ? body.health_url : undefined;
  const heartbeat = body.heartbeat === true;

  if (!mcpUrl && !restUrl && !healthUrl && !heartbeat) {
    return servicialoError(orgSlug, 'At least one field required: mcp_url, rest_url, health_url, or heartbeat', 400);
  }

  if (mcpUrl && !validateUrl(mcpUrl)) return servicialoError(orgSlug, 'Invalid mcp_url format', 400);
  if (restUrl && !validateUrl(restUrl)) return servicialoError(orgSlug, 'Invalid rest_url format', 400);
  if (healthUrl && !validateUrl(healthUrl)) return servicialoError(orgSlug, 'Invalid health_url format', 400);

  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, country },
  });

  if (!org) {
    return servicialoError(orgSlug, `Organization '${country}/${orgSlug}' not found`, 404);
  }

  const updateData: Record<string, unknown> = {
    lastSeen: new Date(),
  };
  if (mcpUrl !== undefined) updateData.mcpUrl = mcpUrl;
  if (restUrl !== undefined) updateData.restUrl = restUrl;
  if (healthUrl !== undefined) updateData.healthUrl = healthUrl;

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: updateData,
  });

  // Probe capabilities on heartbeat (await to ensure it completes on serverless)
  if (heartbeat && updated.restUrl) {
    const { probeCapabilities } = await import('@/lib/servicialo/capabilities');
    await probeCapabilities(updated.id, updated.restUrl, orgSlug);
  }

  // Re-read org to include fresh capabilities in response
  const fresh = heartbeat
    ? await prisma.organization.findUnique({ where: { id: org.id } })
    : updated;

  return servicialoJson(orgSlug, {
    resolution: buildResolutionRecord(fresh ?? updated),
    message: heartbeat ? 'Heartbeat recorded' : 'Endpoint updated',
  });
}
