import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { resolveIdentity, hasIdentity, hashContact, normalizeContact } from '../identity.js';

/** Reference vector, independent of the implementation under test. */
const EMAIL = 'admin@example.com';
const EMAIL_SHA256 = '258d8dc916db8cea2cafb6c3cd0cb0246efe061421dbd83ec3a350428cabda4f';

describe('hashContact', () => {
  it('produces the SHA-256 hex digest of the address', () => {
    expect(hashContact(EMAIL)).toBe(EMAIL_SHA256);
  });

  it('normalizes case and surrounding whitespace before hashing', () => {
    expect(hashContact('  ADMIN@Example.COM  ')).toBe(EMAIL_SHA256);
  });

  it('matches the ingest endpoint normalization exactly', () => {
    // app/api/telemetry/instance/route.ts hashes `impl_contact.toLowerCase().trim()`
    // for pre-0.9.14 clients. If the two ever diverge, the same operator produces
    // two different digests across an upgrade and verification stops matching.
    const asIngestDoes = createHash('sha256')
      .update('  ADMIN@Example.COM  '.toLowerCase().trim(), 'utf8')
      .digest('hex');
    expect(hashContact('  ADMIN@Example.COM  ')).toBe(asIngestDoes);
    expect(normalizeContact('  ADMIN@Example.COM  ')).toBe(EMAIL);
  });

  it('emits 64 lowercase hex characters, the shape the endpoint accepts', () => {
    expect(hashContact(EMAIL)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('resolveIdentity — fields appear only when configured', () => {
  it('contributes nothing for an unconfigured node', () => {
    expect(resolveIdentity({})).toEqual({});
  });

  it('treats empty and whitespace-only variables as unset', () => {
    // .env.example ships these keys with empty values.
    expect(
      resolveIdentity({
        SERVICIALO_IMPL_NAME: '',
        SERVICIALO_IMPL_URL: '   ',
        SERVICIALO_IMPL_CONTACT: '',
      }),
    ).toEqual({});
  });

  it('includes only the variables that are set', () => {
    expect(resolveIdentity({ SERVICIALO_IMPL_NAME: 'MyClinic Platform' })).toEqual({
      impl_name: 'MyClinic Platform',
    });
  });

  it('sends the contact as a digest, under the hashed field name', () => {
    expect(
      resolveIdentity({
        SERVICIALO_IMPL_NAME: 'MyClinic Platform',
        SERVICIALO_IMPL_URL: 'https://myclinic.example',
        SERVICIALO_IMPL_CONTACT: EMAIL,
      }),
    ).toEqual({
      impl_name: 'MyClinic Platform',
      impl_url: 'https://myclinic.example',
      impl_contact_hash: EMAIL_SHA256,
    });
  });

  it('trims the values it does send', () => {
    expect(resolveIdentity({ SERVICIALO_IMPL_URL: '  https://myclinic.example  ' })).toEqual({
      impl_url: 'https://myclinic.example',
    });
  });
});

describe('resolveIdentity — the raw email never leaves the host', () => {
  const identity = resolveIdentity({
    SERVICIALO_IMPL_NAME: 'MyClinic Platform',
    SERVICIALO_IMPL_CONTACT: EMAIL,
  });
  const wire = JSON.stringify(identity);

  it('carries no impl_contact field', () => {
    expect(Object.keys(identity)).not.toContain('impl_contact');
  });

  it('does not contain the address anywhere in the serialized payload', () => {
    expect(wire).not.toContain(EMAIL);
    expect(wire).not.toContain('example.com');
    expect(wire).not.toContain('@');
  });

  it('carries the digest instead', () => {
    expect(wire).toContain(EMAIL_SHA256);
  });
});

describe('hasIdentity', () => {
  it('is false for an unconfigured node', () => {
    expect(hasIdentity({})).toBe(false);
    expect(hasIdentity({ SERVICIALO_IMPL_NAME: '  ' })).toBe(false);
  });

  it.each([
    ['SERVICIALO_IMPL_NAME', 'MyClinic Platform'],
    ['SERVICIALO_IMPL_URL', 'https://myclinic.example'],
    ['SERVICIALO_IMPL_CONTACT', EMAIL],
  ])('is true when %s alone is set', (key, value) => {
    expect(hasIdentity({ [key]: value })).toBe(true);
  });
});
