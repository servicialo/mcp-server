import { describe, it, expect } from 'vitest';
import { ActorSchema, LocationSchema } from '../tools/schemas.js';

describe('ActorSchema', () => {
  it('accepts valid actor with all fields', () => {
    const result = ActorSchema.safeParse({
      type: 'agent',
      id: 'agent_claude',
      on_behalf_of: { type: 'client', id: 'cli_1' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts actor without on_behalf_of', () => {
    const result = ActorSchema.safeParse({ type: 'provider', id: 'prov_1' });
    expect(result.success).toBe(true);
  });

  it('accepts all valid actor types', () => {
    for (const type of ['client', 'provider', 'organization', 'agent']) {
      const result = ActorSchema.safeParse({ type, id: 'test' });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid actor type', () => {
    const result = ActorSchema.safeParse({ type: 'admin', id: 'test' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const result = ActorSchema.safeParse({ type: 'client' });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = ActorSchema.safeParse({ id: 'test' });
    expect(result.success).toBe(false);
  });
});

describe('LocationSchema', () => {
  it('accepts valid coordinates', () => {
    const result = LocationSchema.safeParse({ lat: -33.4265, lng: -70.6155 });
    expect(result.success).toBe(true);
  });

  it('rejects missing lat', () => {
    const result = LocationSchema.safeParse({ lng: -70.6155 });
    expect(result.success).toBe(false);
  });

  it('rejects missing lng', () => {
    const result = LocationSchema.safeParse({ lat: -33.4265 });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric values', () => {
    const result = LocationSchema.safeParse({ lat: 'abc', lng: 'def' });
    expect(result.success).toBe(false);
  });
});
