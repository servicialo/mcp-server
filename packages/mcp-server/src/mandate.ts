/**
 * Servicialo v0.8 — Delegated Agency Model
 * Mandate validation middleware for the MCP server.
 *
 * This module provides:
 * 1. Zod schemas for ServiceMandate and audit entries
 * 2. A validation function that enforces the 8 mandate checks (§10.3.2)
 * 3. A middleware wrapper for tool handlers
 * 4. Audit logging on every agent action
 */

import { z } from 'zod';
import type { ServicialoAdapter } from './adapter.js';

// ---------------------------------------------------------------------------
// 1. Schemas
// ---------------------------------------------------------------------------

export const MandatePrincipalType = z.enum(['professional', 'patient', 'organization']);
export const MandateActingFor = z.enum(['professional', 'patient', 'organization']);
export const MandateStatus = z.enum(['active', 'expired', 'revoked', 'suspended']);

export const MandateConstraintsSchema = z.object({
  max_actions_per_day: z.number().int().positive().optional(),
  allowed_hours: z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    timezone: z.string(),
  }).optional(),
  ip_allowlist: z.array(z.string()).optional(),
  require_confirmation_above: z.object({
    amount: z.number().min(0),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }).optional(),
  service_types: z.array(z.string()).optional(),
}).optional();

export const ServiceMandateSchema = z.object({
  mandate_id: z.string().uuid(),
  principal_id: z.string(),
  principal_type: MandatePrincipalType,
  agent_id: z.string(),
  agent_name: z.string().optional(),
  acting_for: MandateActingFor,
  context: z.string().regex(/^[a-z_]+:.+$/),
  scopes: z.array(z.string().regex(/^[a-z_]+:[a-z_]+$/)).min(1),
  constraints: MandateConstraintsSchema,
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  revoked_at: z.string().datetime().optional(),
  revocation_reason: z.string().optional(),
  status: MandateStatus,
  metadata: z.record(z.unknown()).optional(),
});

export type ServiceMandate = z.infer<typeof ServiceMandateSchema>;

export const AuditResultType = z.enum(['success', 'failure', 'rejected', 'halted']);

export const AuditEntrySchema = z.object({
  audit_id: z.string().uuid().optional(), // generated server-side
  mandate_id: z.string().uuid(),
  agent_id: z.string(),
  principal_id: z.string(),
  acting_for: MandateActingFor,
  action: z.string(),
  action_input: z.record(z.unknown()).optional(),
  action_result: AuditResultType,
  failure_reason: z.string().optional(),
  resource_id: z.string().optional(),
  context: z.string(),
  ip_address: z.string().optional(),
  request_id: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

// Extended actor schema for v0.8 — adds mandate_id
export const ActorWithMandateSchema = z.object({
  type: z.enum(['client', 'provider', 'organization', 'agent']),
  id: z.string(),
  mandate_id: z.string().uuid().optional()
    .describe('Required when type = agent. References a valid ServiceMandate.'),
  on_behalf_of: z.object({
    type: z.string(),
    id: z.string(),
  }).optional(),
});

export type ActorWithMandate = z.infer<typeof ActorWithMandateSchema>;

// ---------------------------------------------------------------------------
// 2. Scope mapping — maps tool names to required scopes
// ---------------------------------------------------------------------------

/**
 * Maps MCP tool names to the scope(s) required to execute them.
 * An agent must hold at least one of the listed scopes in its mandate.
 */
export const TOOL_SCOPE_MAP: Record<string, string[]> = {
  // Phase 1 — Discovery (no mandate required for public tools)
  'registry.search':             [],
  'registry.get_organization':   [],
  'scheduling.check_availability': [],
  'services.list':               [],

  // Phase 2 — Entender
  'service.get':                 ['service:read'],
  'contract.get':                ['service:read', 'order:read'],

  // Phase 3 — Comprometer
  'clients.get_or_create':       ['patient:write'],
  'scheduling.book':             ['schedule:write'],
  'scheduling.confirm':          ['schedule:write'],

  // Phase 4 — Ciclo de Vida
  'lifecycle.get_state':         ['service:read'],
  'lifecycle.transition':        ['service:write'],
  'scheduling.reschedule':       ['schedule:write'],
  'scheduling.cancel':           ['schedule:write'],

  // Phase 5 — Verificar Entrega
  'delivery.checkin':            ['evidence:write'],
  'delivery.checkout':           ['evidence:write'],
  'delivery.record_evidence':    ['evidence:write'],

  // Phase 6 — Cerrar
  'documentation.create':       ['document:write'],
  'payments.create_sale':       ['payment:write'],
  'payments.record_payment':    ['payment:write'],
  'payments.get_status':        ['payment:read'],

  // Service Orders
  'service_orders.list':        ['order:read'],
  'service_orders.get':         ['order:read'],
  'service_orders.create':      ['order:write'],
  'service_orders.propose':     ['order:write'],
  'service_orders.activate':    ['order:write'],
  'service_orders.get_ledger':  ['order:read'],

  // Mandate management
  'mandates.list':              ['mandate:read'],
  'mandates.get':               ['mandate:read'],
  'mandates.suspend':           ['mandate:admin'],
};

// ---------------------------------------------------------------------------
// 3. Validation errors
// ---------------------------------------------------------------------------

export class MandateValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly mandate_id?: string,
  ) {
    super(message);
    this.name = 'MandateValidationError';
  }
}

// ---------------------------------------------------------------------------
// 4. Mandate validator
// ---------------------------------------------------------------------------

export interface MandateValidationContext {
  mandate: ServiceMandate;
  agent_id: string;
  tool_name: string;
  context: string;
  /** For conflict-of-interest check: the acting_for of the counterparty agent, if any */
  counterparty_acting_for?: string;
  /** Current time override for testing */
  now?: Date;
}

/**
 * Validates a ServiceMandate against the 8 checks defined in §10.3.2.
 * Throws MandateValidationError on failure.
 */
export function validateMandate(ctx: MandateValidationContext): void {
  const { mandate, agent_id, tool_name, context } = ctx;
  const now = ctx.now ?? new Date();

  // 1. Status check
  if (mandate.status !== 'active') {
    throw new MandateValidationError(
      'MANDATE_INACTIVE',
      `Mandate ${mandate.mandate_id} status is '${mandate.status}'`,
      mandate.mandate_id,
    );
  }

  // 2. Temporal validity
  const issuedAt = new Date(mandate.issued_at);
  const expiresAt = new Date(mandate.expires_at);

  if (now < issuedAt) {
    throw new MandateValidationError(
      'MANDATE_NOT_YET_VALID',
      `Mandate ${mandate.mandate_id} is not yet valid (issued_at: ${mandate.issued_at})`,
      mandate.mandate_id,
    );
  }

  if (now >= expiresAt) {
    throw new MandateValidationError(
      'MANDATE_EXPIRED',
      `Mandate ${mandate.mandate_id} has expired (expires_at: ${mandate.expires_at})`,
      mandate.mandate_id,
    );
  }

  if (mandate.revoked_at) {
    throw new MandateValidationError(
      'MANDATE_REVOKED',
      `Mandate ${mandate.mandate_id} was revoked at ${mandate.revoked_at}`,
      mandate.mandate_id,
    );
  }

  // 3. Agent identity
  if (mandate.agent_id !== agent_id) {
    throw new MandateValidationError(
      'AGENT_MISMATCH',
      `Agent '${agent_id}' does not match mandate agent '${mandate.agent_id}'`,
      mandate.mandate_id,
    );
  }

  // 4. Scope coverage
  // Normalize: MCP registration uses underscores, scope map uses dots
  const normalizedToolName = tool_name.replace(/_/g, '.');
  const requiredScopes = TOOL_SCOPE_MAP[tool_name] ?? TOOL_SCOPE_MAP[normalizedToolName];
  if (requiredScopes === undefined) {
    throw new MandateValidationError(
      'UNKNOWN_TOOL',
      `Tool '${tool_name}' is not registered in the scope map`,
      mandate.mandate_id,
    );
  }

  // Public tools (empty scope array) don't require mandate validation
  if (requiredScopes.length > 0) {
    const hasScope = requiredScopes.some(scope => mandate.scopes.includes(scope));
    if (!hasScope) {
      throw new MandateValidationError(
        'SCOPE_INSUFFICIENT',
        `Mandate lacks required scope(s): ${requiredScopes.join(' | ')}. Granted: ${mandate.scopes.join(', ')}`,
        mandate.mandate_id,
      );
    }
  }

  // 5. Context match
  if (context && mandate.context !== context && !context.startsWith(mandate.context + ':')) {
    throw new MandateValidationError(
      'CONTEXT_MISMATCH',
      `Context '${context}' does not match mandate context '${mandate.context}'`,
      mandate.mandate_id,
    );
  }

  // 6. Conflict-of-interest check
  if (ctx.counterparty_acting_for && ctx.counterparty_acting_for === mandate.acting_for) {
    // Same agent acting for both sides — protocol violation
    throw new MandateValidationError(
      'CONFLICT_OF_INTEREST',
      `Agent cannot act for '${mandate.acting_for}' when counterparty agent also acts for '${ctx.counterparty_acting_for}'`,
      mandate.mandate_id,
    );
  }

  // 7. Constraints
  if (mandate.constraints) {
    validateConstraints(mandate, now);
  }
}

function validateConstraints(mandate: ServiceMandate, now: Date): void {
  const constraints = mandate.constraints;
  if (!constraints) return;

  // Allowed hours
  if (constraints.allowed_hours) {
    const { start, end, timezone } = constraints.allowed_hours;
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    });

    if (currentTime < start || currentTime >= end) {
      throw new MandateValidationError(
        'OUTSIDE_ALLOWED_HOURS',
        `Action at ${currentTime} (${timezone}) is outside allowed hours ${start}-${end}`,
        mandate.mandate_id,
      );
    }
  }

  // max_actions_per_day is checked asynchronously via the database counter
  // (see incrementDailyActionCount below)
}

// ---------------------------------------------------------------------------
// 5. Audit logger
// ---------------------------------------------------------------------------

export async function logAuditEntry(
  client: ServicialoAdapter,
  entry: Omit<AuditEntry, 'audit_id' | 'timestamp'>,
): Promise<void> {
  try {
    await client.post('/api/coordinalo/mandate-audit', {
      ...entry,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Audit logging failure should not block the operation,
    // but must be reported. In production, send to error tracking.
    console.error('[mandate-audit] Failed to log audit entry:', err);
  }
}

// ---------------------------------------------------------------------------
// 6. Daily action counter
// ---------------------------------------------------------------------------

export async function checkAndIncrementDailyActions(
  client: ServicialoAdapter,
  mandate: ServiceMandate,
): Promise<void> {
  if (!mandate.constraints?.max_actions_per_day) return;

  try {
    const result = await client.post('/api/coordinalo/mandate-actions/increment', {
      mandateId: mandate.mandate_id,
    });

    const count = (result as { actionCount?: number })?.actionCount ?? 0;
    if (count > mandate.constraints.max_actions_per_day) {
      throw new MandateValidationError(
        'DAILY_LIMIT_EXCEEDED',
        `Daily action limit (${mandate.constraints.max_actions_per_day}) exceeded for mandate ${mandate.mandate_id}`,
        mandate.mandate_id,
      );
    }
  } catch (err) {
    if (err instanceof MandateValidationError) throw err;
    // If the counter service is unavailable, fail open with warning
    console.warn('[mandate] Daily action counter unavailable:', err);
  }
}

// ---------------------------------------------------------------------------
// 7. Mandate resolution — fetch mandate from backend
// ---------------------------------------------------------------------------

export async function resolveMandate(
  client: ServicialoAdapter,
  mandateId: string,
): Promise<ServiceMandate> {
  const result = await client.get(`/api/coordinalo/mandates/${mandateId}`);
  const parsed = ServiceMandateSchema.safeParse(result);

  if (!parsed.success) {
    throw new MandateValidationError(
      'MANDATE_INVALID',
      `Mandate ${mandateId} failed schema validation: ${parsed.error.message}`,
      mandateId,
    );
  }

  return parsed.data;
}

// ---------------------------------------------------------------------------
// 8. Middleware wrapper — wraps a tool handler with mandate validation + audit
// ---------------------------------------------------------------------------

export interface MandateMiddlewareOptions {
  /** Extract the organization context from tool args */
  extractContext?: (args: Record<string, unknown>) => string;
  /** Extract the primary resource ID for audit */
  extractResourceId?: (args: Record<string, unknown>) => string | undefined;
}

/**
 * Wraps a tool handler with mandate validation and audit logging.
 *
 * For tools where `actor.type === 'agent'`, validates the mandate before
 * executing and logs an audit entry after. For non-agent actors, passes
 * through without mandate checks.
 */
export function withMandateValidation<TArgs extends Record<string, unknown>>(
  toolName: string,
  handler: (client: ServicialoAdapter, args: TArgs) => Promise<unknown>,
  options?: MandateMiddlewareOptions,
): (client: ServicialoAdapter, args: TArgs) => Promise<unknown> {
  return async (client: ServicialoAdapter, args: TArgs) => {
    const actor = args.actor as ActorWithMandate | undefined;

    // Non-agent actors bypass mandate validation
    if (!actor || actor.type !== 'agent') {
      return handler(client, args);
    }

    // Agent actors require a mandate
    if (!actor.mandate_id) {
      throw new MandateValidationError(
        'MANDATE_REQUIRED',
        `Agent '${actor.id}' must provide a mandate_id to execute '${toolName}'`,
      );
    }

    // Resolve and validate mandate
    const mandate = await resolveMandate(client, actor.mandate_id);
    const context = options?.extractContext?.(args)
      ?? (client as unknown as { orgId?: string }).orgId
      ? `org:${(client as unknown as { orgId?: string }).orgId}`
      : mandate.context;

    validateMandate({
      mandate,
      agent_id: actor.id,
      tool_name: toolName,
      context,
    });

    // Check daily action limit
    await checkAndIncrementDailyActions(client, mandate);

    // Write-ahead audit entry (action_result = 'success' will be updated on failure)
    const resourceId = options?.extractResourceId?.(args);

    try {
      const result = await handler(client, args);

      // Log success
      await logAuditEntry(client, {
        mandate_id: mandate.mandate_id,
        agent_id: mandate.agent_id,
        principal_id: mandate.principal_id,
        acting_for: mandate.acting_for,
        action: toolName,
        action_input: sanitizeInput(args),
        action_result: 'success',
        resource_id: resourceId,
        context: mandate.context,
      });

      return result;
    } catch (err) {
      // Log failure
      await logAuditEntry(client, {
        mandate_id: mandate.mandate_id,
        agent_id: mandate.agent_id,
        principal_id: mandate.principal_id,
        acting_for: mandate.acting_for,
        action: toolName,
        action_input: sanitizeInput(args),
        action_result: err instanceof MandateValidationError ? 'rejected' : 'failure',
        failure_reason: err instanceof Error ? err.message : String(err),
        resource_id: resourceId,
        context: mandate.context,
      });

      throw err;
    }
  };
}

// ---------------------------------------------------------------------------
// 9. Input sanitization — redact sensitive fields before audit logging
// ---------------------------------------------------------------------------

const SENSITIVE_FIELDS = new Set([
  'password', 'token', 'api_key', 'secret', 'credential',
  'clinical_notes', 'diagnosis', 'medical_history',
  'rut', 'ssn', 'national_id',
]);

function sanitizeInput(args: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if this object is an evidence envelope with restricted sensitivity
      const obj = value as Record<string, unknown>;
      if (obj.data_sensitivity === 'restricted' && obj.data !== undefined) {
        sanitized[key] = { ...sanitizeInput(obj), data: { redacted: true, reason: 'restricted_evidence' } };
      } else {
        sanitized[key] = sanitizeInput(obj);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeEvidence(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes an array of evidence objects. If any evidence item has
 * `data_sensitivity: "restricted"`, its `data` payload is redacted.
 */
export function sanitizeEvidence(evidence: unknown[]): unknown[] {
  return evidence.map((item) => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>;
      if (obj.data_sensitivity === 'restricted' && obj.data !== undefined) {
        return { ...sanitizeInput(obj), data: { redacted: true, reason: 'restricted_evidence' } };
      }
      return sanitizeInput(obj);
    }
    return item;
  });
}
