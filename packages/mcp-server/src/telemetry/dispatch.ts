/**
 * Operational telemetry dispatch — observes successful tool invocations
 * and emits anonymized events. Strictly conservative: if the data needed
 * for a faithful event isn't available in args or result, nothing is emitted.
 *
 * Hooked from src/index.ts after every tool handler returns.
 */

import {
  buildBookingCreatedEvent,
  buildServiceCompletedEvent,
  buildPaymentSettledEvent,
  emitOperational,
} from './operational.js';

interface DispatchContext {
  protocolVersion: string;
  nodeVersion: string;
  vertical: string;
  region: string;
  orgSlug?: string;
}

type PaymentMethod =
  | 'cash' | 'transfer' | 'card_credit' | 'card_debit'
  | 'insurance' | 'voucher' | 'subscription' | 'other';

const PAYMENT_METHOD_MAP: Record<string, PaymentMethod> = {
  efectivo: 'cash',
  cash: 'cash',
  transferencia: 'transfer',
  transfer: 'transfer',
  mercadopago: 'other',
  tarjeta: 'card_credit',
  card: 'card_credit',
  card_credit: 'card_credit',
  card_debit: 'card_debit',
  insurance: 'insurance',
  voucher: 'voucher',
  subscription: 'subscription',
  other: 'other',
};

function readString(o: unknown, key: string): string | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const v = (o as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

function readNumber(o: unknown, key: string): number | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const v = (o as Record<string, unknown>)[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function dispatchOperationalTelemetry(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown,
  ctx: DispatchContext,
): void {
  try {
    switch (toolName) {
      case 'scheduling.book': {
        const startsAt = readString(args, 'starts_at') ?? readString(args, 'startsAt');
        if (!startsAt) return;
        emitOperational(buildBookingCreatedEvent(ctx, { startsAt, channel: 'agent' }));
        return;
      }

      case 'delivery.checkout': {
        const dur =
          readNumber(result, 'duration_minutes') ??
          readNumber(result, 'actual_duration_min') ??
          readNumber(result, 'actualDurationMin');
        if (dur == null) return;
        emitOperational(
          buildServiceCompletedEvent(ctx, {
            durationMinutes: dur,
            outcome: 'completed',
            evidenceCompleteness:
              (readString(result, 'evidence_completeness') as 'complete' | 'partial' | 'missing' | undefined),
          }),
        );
        return;
      }

      case 'lifecycle.transition': {
        const target = (readString(args, 'target_state') ?? '').toLowerCase();
        if (['cancelado', 'canceled', 'cancelled'].includes(target)) {
          emitOperational(
            buildServiceCompletedEvent(ctx, {
              durationMinutes: 0,
              outcome: 'canceled_late',
            }),
          );
        }
        if (['inasistencia_cliente', 'no_show_client'].includes(target)) {
          emitOperational(
            buildServiceCompletedEvent(ctx, {
              durationMinutes: 0,
              outcome: 'no_show_client',
            }),
          );
        }
        if (['inasistencia_proveedor', 'no_show_provider'].includes(target)) {
          emitOperational(
            buildServiceCompletedEvent(ctx, {
              durationMinutes: 0,
              outcome: 'no_show_provider',
            }),
          );
        }
        return;
      }

      case 'payments.record_payment': {
        const amount = readNumber(args, 'amount');
        if (amount == null) return;
        const methodRaw = (readString(args, 'method') ?? 'other').toLowerCase();
        const paymentMethod = PAYMENT_METHOD_MAP[methodRaw] ?? 'other';
        const completedAt =
          readString(result, 'completed_at') ??
          readString(result, 'completedAt') ??
          new Date().toISOString();
        emitOperational(
          buildPaymentSettledEvent(ctx, {
            completedAt,
            amountCLP: amount,
            currency: readString(result, 'currency') ?? 'CLP',
            paymentMethod,
          }),
        );
        return;
      }

      default:
        return;
    }
  } catch {
    // Telemetry must never affect the tool's user-facing behavior.
  }
}
