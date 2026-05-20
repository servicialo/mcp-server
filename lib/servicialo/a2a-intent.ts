/**
 * Rule-based intent detection and field extraction for the A2A task endpoint.
 * Pure functions, no LLM, no I/O.
 */

export type Intent = 'availability' | 'booking' | 'services' | 'unknown';

const PATTERNS: Record<Exclude<Intent, 'unknown'>, RegExp> = {
  services:
    /servici|catalog|cat[aá]log|qu[eé]\s+ofrec|qu[eé]\s+hace|lista|men[uú]|atien|categori|what(?:\s+do|s)\s+you\s+offer|available\s+services?/i,
  booking:
    /reserv|book|agend|cita|appointment|pedir\s+hora|tomar\s+hora|solicitar\s+hora/i,
  availability:
    /disponib|availab|cu[aá]ndo|horario|slot|libre|hueco|when|schedule(?!s)|free\s+slot/i,
};

export interface DetectedIntent {
  intent: Intent;
}

export function detectIntent(text: string): DetectedIntent {
  const normalized = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  if (PATTERNS.services.test(normalized)) return { intent: 'services' };
  if (PATTERNS.booking.test(normalized)) return { intent: 'booking' };
  if (PATTERNS.availability.test(normalized)) return { intent: 'availability' };
  return { intent: 'unknown' };
}

// ── Booking field extraction ──

export interface BookingDraft {
  requesterName?: string;
  email?: string;
  startsAt?: string; // ISO 8601
  serviceHint?: string;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const ISO_DATETIME_RE = /\d{4}-\d{2}-\d{2}(?:[T\s]\d{1,2}:\d{2})?/;

export function extractBookingFields(
  text: string,
  knownServiceNames: string[] = [],
): BookingDraft {
  const draft: BookingDraft = {};

  const emailMatch = text.match(EMAIL_RE);
  if (emailMatch) draft.email = emailMatch[0];

  const isoMatch = text.match(ISO_DATETIME_RE);
  if (isoMatch) {
    let iso = isoMatch[0].replace(' ', 'T');
    if (!iso.includes('T')) iso = `${iso}T10:00`;
    if (!/T\d{1,2}:\d{2}$/.test(iso) && !/T\d{1,2}:\d{2}:\d{2}/.test(iso)) {
      // Pad single-digit hour
      iso = iso.replace(/T(\d):/, 'T0$1:');
    }
    draft.startsAt = iso;
  }

  const lower = text.toLowerCase();
  for (const svc of knownServiceNames) {
    if (svc && lower.includes(svc.toLowerCase())) {
      draft.serviceHint = svc;
      break;
    }
  }

  const labeled = text.match(/(?:nombre|name)\s*[:=]\s*([^,;\n]+)/i);
  if (labeled) {
    draft.requesterName = labeled[1].trim();
  } else {
    const firstChunk = text.split(/[,;\n]/)[0]?.trim() ?? '';
    let candidate = firstChunk
      .replace(EMAIL_RE, '')
      .replace(ISO_DATETIME_RE, '')
      .trim();
    if (draft.serviceHint) {
      candidate = candidate.replace(new RegExp(escapeRegex(draft.serviceHint), 'gi'), '').trim();
    }
    const words = candidate.split(/\s+/).filter((w) => w.length > 1);
    if (words.length >= 1 && words.length <= 5 && candidate.length > 2 && candidate.length < 100) {
      draft.requesterName = candidate;
    }
  }

  return draft;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function mergeBookingDraft(existing: BookingDraft, incoming: BookingDraft): BookingDraft {
  return {
    requesterName: incoming.requesterName ?? existing.requesterName,
    email: incoming.email ?? existing.email,
    startsAt: incoming.startsAt ?? existing.startsAt,
    serviceHint: incoming.serviceHint ?? existing.serviceHint,
  };
}

const REQUIRED_BOOKING_FIELDS = ['requesterName', 'email', 'startsAt', 'serviceHint'] as const;

export function missingBookingFields(draft: BookingDraft): string[] {
  return REQUIRED_BOOKING_FIELDS.filter((f) => !draft[f]);
}

// ── Clarification messages ──

export function buildClarificationMessage(orgName: string): string {
  return [
    `Soy el agente de ${orgName}. Puedo ayudarte con:`,
    '',
    '1. **Listar servicios** — ver el catálogo disponible',
    '2. **Ver disponibilidad** — horarios para agendar',
    '3. **Reservar una hora** — agendar una cita con un profesional',
    '',
    '¿Qué necesitas?',
  ].join('\n');
}

const FIELD_LABELS: Record<string, string> = {
  requesterName: 'tu nombre completo',
  email: 'tu email',
  startsAt: 'fecha y hora (formato ISO, ej: 2026-05-20T10:00)',
  serviceHint: 'el servicio (ej: "kinesiología")',
};

export function buildBookingPrompt(orgName: string, missing: string[]): string {
  if (missing.length === 0) {
    return `Procesando tu reserva en ${orgName}.`;
  }
  const labels = missing.map((f) => `- ${FIELD_LABELS[f] ?? f}`).join('\n');
  return [
    `Para completar tu reserva en ${orgName}, aún necesito:`,
    '',
    labels,
    '',
    'Puedes enviar todo en un mensaje (ej: "Juan Pérez, juan@example.com, kinesiología, 2026-05-20T10:00").',
  ].join('\n');
}
