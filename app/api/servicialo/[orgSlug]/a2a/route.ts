/**
 * A2A (Agent-to-Agent) JSON-RPC 2.0 endpoint for an organization.
 *
 * Supported methods:
 *  - message/send   — turn-by-turn conversation, creates/advances an A2ATask
 *  - tasks/get      — fetch a persisted task by id
 *  - tasks/cancel   — cancel a non-terminal task
 *
 * Spec reference: https://a2a-protocol.org/ (v0.3)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/servicialo/response';
import { proxyToUpstream } from '@/lib/servicialo/proxy';
import {
  detectIntent,
  extractBookingFields,
  mergeBookingDraft,
  missingBookingFields,
  buildClarificationMessage,
  buildBookingPrompt,
  type BookingDraft,
  type Intent,
} from '@/lib/servicialo/a2a-intent';

// ── Types ──

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface MessageSendParams {
  message?: {
    role?: string;
    parts?: Array<{ kind: string; text?: string }>;
    contextId?: string;
    taskId?: string;
  };
}

type TaskState = 'pending' | 'input-required' | 'completed' | 'canceled' | 'failed';

// ── JSON-RPC helpers ──

function rpcError(id: string | number | null, code: number, message: string, data?: unknown) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  });
}

function rpcResult(id: string | number, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

// ── Task shape (A2A v0.3) ──

interface PersistedTask {
  id: string;
  contextId: string;
  state: string;
  agentText: string;
  artifact: unknown;
  errorMessage: string;
}

function shapeTask(task: PersistedTask) {
  const status: Record<string, unknown> = { state: task.state };
  if (task.state !== 'completed' && task.agentText) {
    status.message = { role: 'agent', parts: [{ kind: 'text', text: task.agentText }] };
  }
  if (task.state === 'failed' && task.errorMessage) {
    status.message = { role: 'agent', parts: [{ kind: 'text', text: task.errorMessage }] };
  }
  const artifacts: Array<{ id: string; parts: Array<{ kind: string; text: string }> }> = [];
  if (task.state === 'completed' && task.artifact != null) {
    artifacts.push({
      id: `art-${task.id}`,
      parts: [{ kind: 'text', text: typeof task.artifact === 'string' ? task.artifact : JSON.stringify(task.artifact, null, 2) }],
    });
  }
  return { id: task.id, contextId: task.contextId, status, artifacts };
}

// ── Org resolution ──

async function resolveOrgOrFail(orgSlug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, slug: true, name: true, discoverable: true, restUrl: true },
  });
  if (!org || !org.discoverable) return null;
  return org;
}

// ── Optional API key validation ──

function optionalApiKeyCheck(request: NextRequest): { ok: true } | { ok: false; reason: string } {
  const provided = request.headers.get('x-servicialo-api-key');
  const expected = process.env.SERVICIALO_A2A_API_KEY;
  if (!expected) return { ok: true }; // anonymous allowed
  if (provided && provided === expected) return { ok: true };
  if (!provided) return { ok: false, reason: 'missing_api_key' };
  return { ok: false, reason: 'invalid_api_key' };
}

// ── Method handlers ──

async function handleMessageSend(
  rpcId: string | number,
  orgSlug: string,
  params: MessageSendParams,
) {
  const parts = params.message?.parts ?? [];
  const textPart = parts.find((p) => p.kind === 'text' && typeof p.text === 'string' && p.text.length > 0);
  if (!textPart?.text) {
    return rpcError(rpcId, -32602, 'No text part found in message');
  }

  const org = await resolveOrgOrFail(orgSlug);
  if (!org) {
    return rpcError(rpcId, -32000, `Organization "${orgSlug}" not found or not discoverable`);
  }

  const userText = textPart.text;
  const existingTaskId = params.message?.taskId;
  const incomingContextId = params.message?.contextId;

  // Continuation: existing taskId
  if (existingTaskId) {
    const existing = await prisma.a2ATask.findUnique({ where: { id: existingTaskId } });
    if (!existing || existing.organizationId !== org.id) {
      return rpcError(rpcId, -32000, `Task "${existingTaskId}" not found for this organization`);
    }
    if (existing.state !== 'input-required') {
      return rpcError(rpcId, -32000, `Task "${existingTaskId}" is in state "${existing.state}" — cannot accept more input`);
    }
    if (existing.intent === 'booking') {
      return advanceBookingTask(rpcId, org, existing, userText);
    }
    // Other intents shouldn't be in input-required; treat as new turn
    return startNewTask(rpcId, org, userText, existing.contextId);
  }

  // New task
  return startNewTask(rpcId, org, userText, incomingContextId);
}

async function startNewTask(
  rpcId: string | number,
  org: { id: string; slug: string; name: string; restUrl: string },
  userText: string,
  contextId?: string,
) {
  const intent: Intent = detectIntent(userText).intent;
  const ctxId = contextId ?? randomUUID();

  if (intent === 'unknown') {
    const task = await prisma.a2ATask.create({
      data: {
        contextId: ctxId,
        organizationId: org.id,
        state: 'input-required',
        intent: 'unknown',
        userText,
        agentText: buildClarificationMessage(org.name),
      },
    });
    return rpcResult(rpcId, shapeTask(task));
  }

  if (intent === 'availability' || intent === 'services') {
    const upstreamPath = intent === 'availability' ? 'availability' : 'services';
    return runProxyTask(rpcId, org, ctxId, intent, userText, upstreamPath);
  }

  // booking
  const draft = await loadKnownServicesAndExtract(org.id, userText);
  const missing = missingBookingFields(draft);
  if (missing.length === 0) {
    return executeBooking(rpcId, org, ctxId, userText, draft);
  }
  const task = await prisma.a2ATask.create({
    data: {
      contextId: ctxId,
      organizationId: org.id,
      state: 'input-required',
      intent: 'booking',
      userText,
      agentText: buildBookingPrompt(org.name, missing),
      bookingDraft: draft as object,
    },
  });
  return rpcResult(rpcId, shapeTask(task));
}

async function runProxyTask(
  rpcId: string | number,
  org: { id: string; slug: string; name: string; restUrl: string },
  contextId: string,
  intent: Intent,
  userText: string,
  upstreamPath: string,
) {
  const result = await proxyToUpstream(org.slug, upstreamPath);
  if (!result.ok) {
    const task = await prisma.a2ATask.create({
      data: {
        contextId,
        organizationId: org.id,
        state: 'failed',
        intent,
        userText,
        errorMessage: `Upstream ${upstreamPath} failed (${result.status}): ${JSON.stringify(result.data)}`,
      },
    });
    return rpcResult(rpcId, shapeTask(task));
  }
  const task = await prisma.a2ATask.create({
    data: {
      contextId,
      organizationId: org.id,
      state: 'completed',
      intent,
      userText,
      artifact: result.data as object,
    },
  });
  return rpcResult(rpcId, shapeTask(task));
}

async function loadKnownServicesAndExtract(orgId: string, text: string): Promise<BookingDraft> {
  const services = await prisma.service.findMany({
    where: { organizationId: orgId, isActive: true },
    select: { name: true },
  });
  const names = services.map((s) => s.name);
  return extractBookingFields(text, names);
}

async function advanceBookingTask(
  rpcId: string | number,
  org: { id: string; slug: string; name: string; restUrl: string },
  existing: { id: string; contextId: string; bookingDraft: unknown },
  userText: string,
) {
  const currentDraft = (existing.bookingDraft as BookingDraft) ?? {};
  const incoming = await loadKnownServicesAndExtract(org.id, userText);
  const merged = mergeBookingDraft(currentDraft, incoming);
  const missing = missingBookingFields(merged);

  if (missing.length > 0) {
    const updated = await prisma.a2ATask.update({
      where: { id: existing.id },
      data: {
        userText,
        bookingDraft: merged as object,
        agentText: buildBookingPrompt(org.name, missing),
      },
    });
    return rpcResult(rpcId, shapeTask(updated));
  }

  return executeBooking(rpcId, org, existing.contextId, userText, merged, existing.id);
}

async function executeBooking(
  rpcId: string | number,
  org: { id: string; slug: string; name: string; restUrl: string },
  contextId: string,
  userText: string,
  draft: BookingDraft,
  existingTaskId?: string,
) {
  const bookingPayload = {
    requesterName: draft.requesterName,
    requesterEmail: draft.email,
    serviceHint: draft.serviceHint,
    startsAt: draft.startsAt,
    bookedByAgent: true,
  };

  const result = await proxyToUpstream(org.slug, 'book', {
    method: 'POST',
    body: JSON.stringify(bookingPayload),
  });

  const baseData = {
    contextId,
    organizationId: org.id,
    intent: 'booking' as const,
    userText,
    bookingDraft: draft as object,
  };

  if (!result.ok) {
    const data = result.status === 502 || result.status === 404
      ? {
          ...baseData,
          state: 'failed' as TaskState,
          errorMessage: `Booking failed: ${typeof result.data === 'object' ? JSON.stringify(result.data) : String(result.data)}`,
        }
      : {
          ...baseData,
          state: 'failed' as TaskState,
          errorMessage: `Booking rejected (${result.status}): ${JSON.stringify(result.data)}`,
        };

    const task = existingTaskId
      ? await prisma.a2ATask.update({ where: { id: existingTaskId }, data })
      : await prisma.a2ATask.create({ data });
    return rpcResult(rpcId, shapeTask(task));
  }

  const completedData = {
    ...baseData,
    state: 'completed' as TaskState,
    artifact: result.data as object,
    agentText: '',
  };
  const task = existingTaskId
    ? await prisma.a2ATask.update({ where: { id: existingTaskId }, data: completedData })
    : await prisma.a2ATask.create({ data: completedData });
  return rpcResult(rpcId, shapeTask(task));
}

async function handleTasksGet(rpcId: string | number, orgSlug: string, params: { id?: string } = {}) {
  if (!params.id) return rpcError(rpcId, -32602, 'Missing "id" in params');
  const org = await resolveOrgOrFail(orgSlug);
  if (!org) return rpcError(rpcId, -32000, `Organization "${orgSlug}" not found`);

  const task = await prisma.a2ATask.findUnique({ where: { id: params.id } });
  if (!task || task.organizationId !== org.id) {
    return rpcError(rpcId, -32000, `Task "${params.id}" not found for this organization`);
  }
  return rpcResult(rpcId, shapeTask(task));
}

async function handleTasksCancel(rpcId: string | number, orgSlug: string, params: { id?: string } = {}) {
  if (!params.id) return rpcError(rpcId, -32602, 'Missing "id" in params');
  const org = await resolveOrgOrFail(orgSlug);
  if (!org) return rpcError(rpcId, -32000, `Organization "${orgSlug}" not found`);

  const existing = await prisma.a2ATask.findUnique({ where: { id: params.id } });
  if (!existing || existing.organizationId !== org.id) {
    return rpcError(rpcId, -32000, `Task "${params.id}" not found for this organization`);
  }

  const terminal = ['completed', 'failed', 'canceled'];
  if (terminal.includes(existing.state)) {
    return rpcResult(rpcId, shapeTask(existing));
  }

  const updated = await prisma.a2ATask.update({
    where: { id: params.id },
    data: { state: 'canceled', agentText: 'Task canceled by client.' },
  });
  return rpcResult(rpcId, shapeTask(updated));
}

// ── Entry point ──

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const authCheck = optionalApiKeyCheck(request);
  if (!authCheck.ok) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: `Authentication failed: ${authCheck.reason}` } },
      { status: 401 },
    );
  }

  const { orgSlug } = params;

  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }

  const rpcId = body?.id ?? null;

  if (body.jsonrpc !== '2.0' || rpcId === null || rpcId === undefined) {
    return rpcError(rpcId, -32600, 'Invalid request — must be JSON-RPC 2.0 with a non-null id');
  }

  if (!body.method) {
    return rpcError(rpcId, -32600, 'Missing method');
  }

  switch (body.method) {
    case 'message/send':
      return handleMessageSend(rpcId, orgSlug, (body.params ?? {}) as MessageSendParams);
    case 'tasks/get':
      return handleTasksGet(rpcId, orgSlug, body.params as { id?: string });
    case 'tasks/cancel':
      return handleTasksCancel(rpcId, orgSlug, body.params as { id?: string });
    default:
      return rpcError(
        rpcId,
        -32601,
        `Method "${body.method}" not found. Supported: message/send, tasks/get, tasks/cancel`,
      );
  }
}
