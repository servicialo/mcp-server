import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/servicialo/response';
import { proxyToUpstream } from '@/lib/servicialo/proxy';
import { detectIntent, buildClarificationMessage } from '@/lib/servicialo/a2a-intent';
import { type NextRequest } from 'next/server';

interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: {
    message?: {
      role?: string;
      parts?: Array<{ kind: string; text?: string }>;
    };
  };
}

function jsonRpcError(id: string | number | null, code: number, message: string) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  });
}

function jsonRpcResult(id: string | number, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

function a2aTask(
  id: string | number,
  state: 'completed' | 'input-required' | 'failed',
  text: string,
) {
  return jsonRpcResult(id, {
    id: `task-${Date.now()}`,
    status: { state, ...(state !== 'completed' ? { message: { role: 'agent', parts: [{ kind: 'text', text }] } } : {}) },
    artifacts: state === 'completed'
      ? [{ id: `art-${Date.now()}`, parts: [{ kind: 'text', text }] }]
      : [],
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } },
) {
  const blocked = withRateLimit(request);
  if (blocked) return blocked;

  const { orgSlug } = params;

  // Parse JSON-RPC 2.0
  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, 'Parse error');
  }

  if (body.jsonrpc !== '2.0' || !body.id) {
    return jsonRpcError(body?.id ?? null, -32600, 'Invalid request — must be JSON-RPC 2.0 with an id');
  }

  // Only support message/send
  if (body.method !== 'message/send') {
    return jsonRpcError(body.id, -32601, `Method "${body.method}" not found. Supported: message/send`);
  }

  // Extract text from message parts
  const parts = body.params?.message?.parts ?? [];
  const textPart = parts.find((p) => p.kind === 'text' && p.text);
  if (!textPart?.text) {
    return jsonRpcError(body.id, -32602, 'No text part found in message');
  }

  // Resolve org
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { name: true, discoverable: true, restUrl: true },
  });

  if (!org || !org.discoverable) {
    return a2aTask(body.id, 'failed', `Organization "${orgSlug}" not found`);
  }

  // Detect intent
  const { intent } = detectIntent(textPart.text);

  if (intent === 'unknown') {
    return a2aTask(body.id, 'input-required', buildClarificationMessage(org.name));
  }

  if (intent === 'availability') {
    const result = await proxyToUpstream(orgSlug, 'availability');
    if (!result.ok) {
      return a2aTask(body.id, 'failed', `Could not fetch availability: ${JSON.stringify(result.data)}`);
    }
    return a2aTask(body.id, 'completed', JSON.stringify(result.data, null, 2));
  }

  if (intent === 'booking') {
    // Booking requires structured data — ask for details
    return a2aTask(
      body.id,
      'input-required',
      [
        `Para reservar en ${org.name}, necesito los siguientes datos:`,
        '',
        '- **Servicio** (ej: "Kinesiología", "Evaluación dental")',
        '- **Fecha y hora** preferida (ej: "mañana a las 10:00", "2026-03-20 15:30")',
        '- **Nombre completo** del paciente/cliente',
        '- **Email** de contacto',
        '',
        'Envíalos en un mensaje y procesaré la reserva.',
      ].join('\n'),
    );
  }

  return a2aTask(body.id, 'failed', 'Unexpected intent');
}
