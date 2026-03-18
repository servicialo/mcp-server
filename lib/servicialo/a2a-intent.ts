/**
 * Rule-based intent detection for A2A task endpoint.
 * No LLM — keyword matching only.
 */

const AVAILABILITY_PATTERN =
  /disponib|availab|cu[aá]ndo|horario|slot|hora|agenda|when|schedule|free/i;

const BOOKING_PATTERN =
  /reserv|book|agend|cita|appointment|pedir|tomar|agendar|solicitar/i;

export interface DetectedIntent {
  intent: 'availability' | 'booking' | 'unknown';
  params: Record<string, string>;
}

/**
 * Detect user intent from free-text message.
 * Returns the most specific match (booking > availability > unknown).
 */
export function detectIntent(text: string): DetectedIntent {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (BOOKING_PATTERN.test(normalized)) {
    return { intent: 'booking', params: {} };
  }

  if (AVAILABILITY_PATTERN.test(normalized)) {
    return { intent: 'availability', params: {} };
  }

  return { intent: 'unknown', params: {} };
}

/**
 * Build the "input-required" clarification message for unknown intents.
 */
export function buildClarificationMessage(orgName: string): string {
  return [
    `Soy el agente de ${orgName}. Puedo ayudarte con:`,
    '',
    '1. **Ver disponibilidad** — horarios disponibles para agendar',
    '2. **Reservar una hora** — agendar una cita con un profesional',
    '',
    '¿Qué necesitas?',
  ].join('\n');
}
