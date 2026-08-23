/**
 * Opt-in node identity for the telemetry ping.
 *
 * A node is anonymous unless the operator sets these variables. Setting them
 * changes exactly one thing: three extra fields on the ping that already
 * leaves the host. No new emission, no new frequency, no new endpoint.
 *
 * The contact email is hashed **here**, on the operator's machine, and only the
 * digest travels. The raw value is never sent, never logged, and never returned
 * by anything in this module. `normalizeContact` is bit-compatible with the
 * ingest endpoint's own normalization so that a digest computed here matches
 * one computed there for clients that predate this release.
 */

import { createHash } from 'node:crypto';

type Env = Record<string, string | undefined>;

/** Identity fields as they appear on the wire. Absent keys are simply not sent. */
export interface ImplIdentity {
  impl_name?: string;
  impl_url?: string;
  impl_contact_hash?: string;
}

/**
 * Read an environment variable as an optional trimmed value.
 *
 * An unset variable and one set to the empty string (or whitespace) are the
 * same thing: not configured. `.env.example` ships the keys with empty values,
 * so this distinction is load-bearing.
 */
function optional(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Canonical form of a contact email before hashing: lowercase, trimmed.
 *
 * Must stay identical to the ingest endpoint's normalization. If the two ever
 * diverge, the same operator produces two different digests and verification
 * silently stops matching.
 */
export function normalizeContact(raw: string): string {
  return raw.toLowerCase().trim();
}

/** SHA-256 of the normalized contact, lowercase hex. */
export function hashContact(raw: string): string {
  return createHash('sha256').update(normalizeContact(raw), 'utf8').digest('hex');
}

/** True when at least one identity variable is configured. */
export function hasIdentity(env: Env = process.env): boolean {
  return Boolean(
    optional(env.SERVICIALO_IMPL_NAME) ||
      optional(env.SERVICIALO_IMPL_URL) ||
      optional(env.SERVICIALO_IMPL_CONTACT),
  );
}

/**
 * Build the identity fields for the telemetry ping.
 *
 * Returns an empty object for an unconfigured node — spreading it into the
 * payload adds nothing, which is what keeps an anonymous node byte-identical
 * to how it behaved before this release.
 */
export function resolveIdentity(env: Env = process.env): ImplIdentity {
  const name = optional(env.SERVICIALO_IMPL_NAME);
  const url = optional(env.SERVICIALO_IMPL_URL);
  const contact = optional(env.SERVICIALO_IMPL_CONTACT);

  return {
    ...(name ? { impl_name: name } : {}),
    ...(url ? { impl_url: url } : {}),
    ...(contact ? { impl_contact_hash: hashContact(contact) } : {}),
  };
}
