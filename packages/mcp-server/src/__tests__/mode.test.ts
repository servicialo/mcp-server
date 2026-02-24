import { describe, it, expect, beforeEach } from 'vitest';
import { detectMode } from '../mode.js';

describe('detectMode', () => {
  beforeEach(() => {
    delete process.env.SERVICIALO_API_KEY;
    delete process.env.SERVICIALO_ORG_ID;
  });

  it('returns "discovery" when no credentials are set', () => {
    expect(detectMode()).toBe('discovery');
  });

  it('returns "authenticated" when both API_KEY and ORG_ID are set', () => {
    process.env.SERVICIALO_API_KEY = 'test_key';
    process.env.SERVICIALO_ORG_ID = 'test_org';
    expect(detectMode()).toBe('authenticated');
  });

  it('falls back to "discovery" when only API_KEY is set', () => {
    process.env.SERVICIALO_API_KEY = 'test_key';
    expect(detectMode()).toBe('discovery');
  });

  it('falls back to "discovery" when only ORG_ID is set', () => {
    process.env.SERVICIALO_ORG_ID = 'test_org';
    expect(detectMode()).toBe('discovery');
  });
});
