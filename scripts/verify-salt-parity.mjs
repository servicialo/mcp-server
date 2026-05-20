#!/usr/bin/env node
/**
 * Guardrail for the org_fingerprint salt.
 *
 * The salt that hashes a slug into an opaque per-contributor identifier
 * MUST be identical in two files:
 *
 *   - lib/servicialo/contribution.ts  (backend tier resolver)
 *   - packages/mcp-server/src/telemetry/operational.ts  (client emitter)
 *
 * If they diverge, the backend computes a different fingerprint than the
 * client, every emitted event lands "unattributed" from the backend's
 * point of view, and every contributing node silently falls to tier 0.
 *
 * This script reads both files, extracts the FINGERPRINT_SALT literal,
 * and exits non-zero if they don't match. Run it locally before commits
 * and in CI to make divergence visible.
 *
 * Usage:
 *   node scripts/verify-salt-parity.mjs
 *
 * Exit code 0 = match, 1 = mismatch, 2 = could not parse one of the files.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const sources = [
  {
    label: 'backend',
    path: join(repoRoot, 'lib', 'servicialo', 'contribution.ts'),
  },
  {
    label: 'mcp-server',
    path: join(repoRoot, 'packages', 'mcp-server', 'src', 'telemetry', 'operational.ts'),
  },
];

// Match either:  const FINGERPRINT_SALT = 'value'
//          or:   const FINGERPRINT_SALT = "value"
const RE = /\bFINGERPRINT_SALT\s*=\s*(['"])([^'"]+)\1/;

const found = [];
for (const src of sources) {
  let body;
  try {
    body = readFileSync(src.path, 'utf8');
  } catch (err) {
    console.error(`  FAIL  could not read ${src.label} at ${src.path}: ${err.message}`);
    process.exit(2);
  }
  const m = body.match(RE);
  if (!m) {
    console.error(`  FAIL  could not find FINGERPRINT_SALT in ${src.label} (${src.path})`);
    process.exit(2);
  }
  found.push({ label: src.label, value: m[2] });
}

const allSame = found.every((f) => f.value === found[0].value);

if (allSame) {
  console.log(`PASS  FINGERPRINT_SALT matches across ${found.length} files: "${found[0].value}"`);
  process.exit(0);
}

console.error('FAIL  FINGERPRINT_SALT mismatch — fingerprints will diverge and every contributor falls to tier 0:');
for (const f of found) {
  console.error(`  ${f.label.padEnd(14)} → "${f.value}"`);
}
console.error('\nFix: rotate both files together. Coordinate any change with a CHANGELOG entry — every node that emitted under the old salt becomes unmatchable from the backend.');
process.exit(1);
