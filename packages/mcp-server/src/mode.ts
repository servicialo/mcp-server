/**
 * Detects the operating mode based on environment variables.
 *
 * - discovery: no credentials, only public tools available
 * - authenticated: full credentials, all tools available
 */

export type Mode = 'discovery' | 'authenticated';

export function detectMode(): Mode {
  const hasKey = !!process.env.SERVICIALO_API_KEY;
  const hasOrg = !!process.env.SERVICIALO_ORG_ID;

  if (hasKey && hasOrg) return 'authenticated';

  if (!hasKey && !hasOrg) return 'discovery';

  // Only one of the two is set — warn and fall back to discovery
  console.error(
    'WARN: Se requieren ambas variables (SERVICIALO_API_KEY y SERVICIALO_ORG_ID) para modo autenticado. Operando en modo discovery.',
  );
  return 'discovery';
}
