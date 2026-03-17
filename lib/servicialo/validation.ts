/**
 * Shared validation utilities for Servicialo protocol routes.
 */

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;
export const COUNTRY_RE = /^[a-z]{2}$/;

export function validateSlug(slug: unknown): string | null {
  if (!slug || typeof slug !== 'string') return 'Missing or invalid field: slug';
  if (slug.length < 3 || slug.length > 48) return 'slug must be between 3 and 48 characters';
  if (!SLUG_RE.test(slug)) return 'slug must be lowercase alphanumeric with hyphens only (no leading/trailing hyphens)';
  return null;
}

export function validateCountry(country: unknown): string | null {
  if (!country || typeof country !== 'string') return 'Missing or invalid field: country';
  if (!COUNTRY_RE.test(country)) return 'country must be a 2-letter lowercase ISO 3166-1 alpha-2 code';
  return null;
}

export function validateUrl(url: unknown): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
