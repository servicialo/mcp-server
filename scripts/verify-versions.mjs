#!/usr/bin/env node
/**
 * Guardrail: version unification.
 *
 * The protocol version lives in protocol/manifest.yaml (protocol.version)
 * and must match every surface that declares it:
 *   - PROTOCOL.md header table        (| **Version** | X |)
 *   - SPEC.md source-of-truth line    (Source of truth: PROTOCOL.md vX)
 *   - CHANGELOG.md newest entry       (## [Protocol vX])
 *   - spec/HTTP_PROFILE.md header     (| **Protocol Version** | X |)
 *   - IMPLEMENTING.md header          (**Versión del protocolo:** X)
 *   - IMPLEMENTING.en.md header       (**Protocol version:** X)
 *
 * The MCP package version lives in bindings.mcp.package_version and must
 * match packages/mcp-server/package.json and server.json (both spots).
 *
 * Wire values intentionally NOT checked (they version independent surfaces):
 *   - lib/servicialo/response.ts X-Servicialo-Version (resolver API, "1.0")
 *   - FINGERPRINT_SALT (covered by verify-salt-parity.mjs)
 *
 * Exit code 0 = unified, 1 = drift (a pattern that fails to match is also
 * a failure — it means the surface changed shape and this script is blind).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

const manifest = parse(read('protocol/manifest.yaml'));
const V = manifest.protocol.version;
const P = manifest.bindings.mcp.package_version;

const errors = [];

function check(label, actual, expected) {
  if (actual === null) {
    errors.push(`${label}: pattern not found (surface changed shape?)`);
  } else if (actual !== expected) {
    errors.push(`${label}: found "${actual}" ≠ expected "${expected}"`);
  } else {
    console.log(`[+] ${label}: ${actual}`);
  }
}

function extract(rel, re) {
  const m = read(rel).match(re);
  return m ? m[1] : null;
}

// Protocol version surfaces
const SEMVERISH = String.raw`(\d+(?:\.\d+)*)`;
check('PROTOCOL.md header', extract('PROTOCOL.md', new RegExp(String.raw`\|\s*\*\*Version\*\*\s*\|\s*${SEMVERISH}\s*\|`)), V);
check('SPEC.md source line', extract('SPEC.md', new RegExp(String.raw`Source of truth:.*?PROTOCOL\.md.*?v${SEMVERISH}`)), V);
check('CHANGELOG.md newest', extract('CHANGELOG.md', new RegExp(String.raw`^## \[Protocol v${SEMVERISH}\]`, 'm')), V);
check('spec/HTTP_PROFILE.md', extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`\|\s*\*\*Protocol Version\*\*\s*\|\s*${SEMVERISH}\s*\|`)), V);
check('IMPLEMENTING.md header', extract('IMPLEMENTING.md', new RegExp(String.raw`\*\*Versión del protocolo:\*\*\s*${SEMVERISH}`)), V);
check('IMPLEMENTING.en.md header', extract('IMPLEMENTING.en.md', new RegExp(String.raw`\*\*Protocol version:\*\*\s*${SEMVERISH}`)), V);

// Package version surfaces
const pkg = JSON.parse(read('packages/mcp-server/package.json'));
check('mcp-server package.json', pkg.version ?? null, P);

const serverJson = JSON.parse(read('packages/mcp-server/server.json'));
check('mcp-server server.json (root)', serverJson.version ?? null, P);
check('mcp-server server.json (packages[0])', serverJson.packages?.[0]?.version ?? null, P);

if (errors.length > 0) {
  console.error('');
  console.error(`FAIL  ${errors.length} version drift(s) against protocol/manifest.yaml (protocol=${V}, package=${P}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('');
console.log(`PASS  Versions unified: protocol v${V}, @servicialo/mcp-server ${P}.`);
process.exit(0);
