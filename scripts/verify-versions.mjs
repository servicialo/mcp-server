#!/usr/bin/env node
/**
 * Guardrail: version unification (v2).
 *
 * v1 checked six header lines and three package fields. That left every
 * document body, every example block and every code default unguarded — the
 * reason 14 real drifts sat in CI green. v2 keeps all v1 checks and adds the
 * surfaces that actually mislead an implementer.
 *
 * ── The three versions, deliberately distinct ───────────────────────────────
 *
 *   protocol.version              (0.10, draft)  — the protocol itself
 *   bindings.http.profile_version (1.1.0)        — the HTTP Profile *document*
 *   bindings.http.resolver_api_version (1.0)     — the X-Servicialo-Version wire value
 *
 * These are NOT expected to converge. `X-Servicialo-Version` identifies a
 * compatible family of the observable HTTP contract; it does not track the
 * protocol's maturity nor the profile document's editorial revision. A change
 * that bumps one MUST NOT be assumed to bump the others.
 *
 * ── What is checked ────────────────────────────────────────────────────────
 *
 *   [A] Protocol version on header surfaces        (v1)
 *   [B] MCP package version                        (v1)
 *   [C] Document bodies — no version pinned inside a normative scoping clause
 *   [D] Examples inside spec documents
 *   [E] Code defaults that declare a protocol version
 *   [F] Wire constants (X-Servicialo-Version) and their documented value
 *   [G] Header semantics — the profile must define what the header versions
 *   [H] Document-owned versions declared in the manifest (A2A, Webhooks)
 *
 * ── What is deliberately NOT checked ───────────────────────────────────────
 *
 *   - FINGERPRINT_SALT ("servicialo-op-v0.9"). A wire value; changing it
 *     re-buckets every telemetry fingerprint. Covered by verify-salt-parity.
 *   - Appendix B changelog headings, bannered historical snapshots
 *     (docs/whitepaper.md, docs/SERVICIALO_AUDIT.md), package CHANGELOG
 *     history, docs/issue-templates/** and "since vX" provenance notes.
 *     These record when something happened and are correct as written.
 *
 * Exit code 0 = unified, 1 = drift. A pattern that fails to match is also a
 * failure: it means the surface changed shape and this script went blind.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

const manifest = parse(read('protocol/manifest.yaml'));
const V = manifest.protocol.version;                        // 0.10
const P = manifest.bindings.mcp.package_version;            // 0.9.14
const PROFILE = manifest.bindings.http.profile_version;     // 1.1.0
const WIRE = manifest.bindings.http.resolver_api_version;   // 1.0

const errors = [];
const SEMVERISH = String.raw`(\d+(?:\.\d+)*)`;

function check(label, actual, expected) {
  if (actual === null || actual === undefined) {
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

/**
 * Prohibition check: the pattern MUST NOT appear. Used where pinning a
 * version is itself the defect (a normative scoping clause that will drift
 * again next release), so there is no "correct value" to compare against.
 */
function forbid(label, rel, re, remedy) {
  const text = read(rel);
  const m = text.match(re);
  if (m) {
    const line = text.slice(0, m.index).split('\n').length;
    errors.push(`${label}: ${rel}:${line} matched "${m[0].trim()}" — ${remedy}`);
  } else {
    console.log(`[+] ${label}: clean`);
  }
}

// ── [A] Protocol version on header surfaces (v1 checks, unchanged) ──────────
check('PROTOCOL.md header', extract('PROTOCOL.md', new RegExp(String.raw`\|\s*\*\*Version\*\*\s*\|\s*${SEMVERISH}\s*\|`)), V);
check('SPEC.md source line', extract('SPEC.md', new RegExp(String.raw`Source of truth:.*?PROTOCOL\.md.*?v${SEMVERISH}`)), V);
check('CHANGELOG.md newest', extract('CHANGELOG.md', new RegExp(String.raw`^## \[Protocol v${SEMVERISH}\]`, 'm')), V);
check('spec/HTTP_PROFILE.md protocol row', extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`\|\s*\*\*Protocol Version\*\*\s*\|\s*${SEMVERISH}\s*\|`)), V);
check('IMPLEMENTING.md header', extract('IMPLEMENTING.md', new RegExp(String.raw`\*\*Versión del protocolo:\*\*\s*${SEMVERISH}`)), V);
check('IMPLEMENTING.en.md header', extract('IMPLEMENTING.en.md', new RegExp(String.raw`\*\*Protocol version:\*\*\s*${SEMVERISH}`)), V);

// ── [B] MCP package version (v1 checks, unchanged) ─────────────────────────
const pkg = JSON.parse(read('packages/mcp-server/package.json'));
check('mcp-server package.json', pkg.version ?? null, P);

const serverJson = JSON.parse(read('packages/mcp-server/server.json'));
check('mcp-server server.json (root)', serverJson.version ?? null, P);
check('mcp-server server.json (packages[0])', serverJson.packages?.[0]?.version ?? null, P);

// ── [C] Document bodies: no version pinned in a normative scoping clause ────
// A version inside "claiming Servicialo vX compliance" scopes a MUST list.
// Bumping it only defers the drift, so the version is dropped entirely.
forbid(
  'PROTOCOL.md compliance clause unpinned',
  'PROTOCOL.md',
  /claiming Servicialo v[\d.]+ compliance/,
  'drop the version: "claiming Servicialo compliance"',
);
forbid(
  'delegated-agency-model.md compliance clause unpinned',
  'spec/delegated-agency-model.md',
  /claiming Servicialo v[\d.]+ compliance/,
  'drop the version: "claiming Servicialo compliance"',
);

// ── [D] Examples inside spec documents ──────────────────────────────────────
// The capabilities example in HTTP_PROFILE §3.3 advertises both versions.
check(
  'HTTP_PROFILE capabilities example protocol_version',
  extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`"protocol_version":\s*"${SEMVERISH}"`)),
  V,
);
check(
  'HTTP_PROFILE capabilities example profile_version',
  extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`"profile_version":\s*"${SEMVERISH}"`)),
  PROFILE,
);
// The registry.manifest example in HTTP_PROFILE §4.0 shows a node manifest.
check(
  'HTTP_PROFILE registry.manifest example',
  extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`"protocol_version":\s*"${SEMVERISH}"[\s\S]{0,400}?"endpoints"`)),
  V,
);
// The profile document declares its own version in the header table.
check('HTTP_PROFILE profile version row', extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`\|\s*\*\*Profile Version\*\*\s*\|\s*${SEMVERISH}\s*\|`)), PROFILE);
// …and repeats it in the closing line.
check('HTTP_PROFILE closing line', extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`End of HTTP Profile\s+v?${SEMVERISH}`)), PROFILE);

// ── [E] Code defaults that declare a protocol version ───────────────────────
check(
  'telemetry operational.ts default',
  extract('packages/mcp-server/src/telemetry/operational.ts', new RegExp(String.raw`SERVICIALO_PROTOCOL_VERSION\s*\|\|\s*'${SEMVERISH}'`)),
  V,
);
check(
  'agent card route protocol constant',
  extract('app/api/servicialo/[orgSlug]/.well-known/agent.json/route.ts', new RegExp(String.raw`const SERVICIALO_PROTOCOL_VERSION\s*=\s*'${SEMVERISH}'`)),
  V,
);
// Documented defaults for the same env var must agree with the code default.
check(
  'packages README.md documented env default',
  extract('packages/mcp-server/README.md', new RegExp(String.raw`\|\s*\`SERVICIALO_PROTOCOL_VERSION\`\s*\|[^|]*\|\s*\`${SEMVERISH}\`\s*\|`)),
  V,
);
check(
  'packages README.en.md documented env default',
  extract('packages/mcp-server/README.en.md', new RegExp(String.raw`\|\s*\`SERVICIALO_PROTOCOL_VERSION\`\s*\|[^|]*\|\s*\`${SEMVERISH}\`\s*\|`)),
  V,
);
check(
  'packages README.md stable version',
  extract('packages/mcp-server/README.md', new RegExp(String.raw`\*\*Versión estable actual:\*\*\s*${SEMVERISH}`)),
  V,
);
check(
  'packages README.en.md stable version',
  extract('packages/mcp-server/README.en.md', new RegExp(String.raw`\*\*Current stable version:\*\*\s*${SEMVERISH}`)),
  V,
);
// Schema illustration banners in the root READMEs.
const BANNER = String.raw`#[\s─-]*SERVICIALO v${SEMVERISH}`;
check('README.md schema banner', extract('README.md', new RegExp(BANNER)), V);
check('README.en.md schema banner', extract('README.en.md', new RegExp(BANNER)), V);

// ── [F] Wire constants: X-Servicialo-Version ────────────────────────────────
// The resolver emits this header. The value is a wire contract: it changes
// only when the observable HTTP contract breaks a consumer, never because the
// protocol or the profile document moved.
check('lib/servicialo/response.ts wire constant', extract('lib/servicialo/response.ts', new RegExp(String.raw`const SERVICIALO_VERSION\s*=\s*'${SEMVERISH}'`)), WIRE);
check('lib/servicialo/proxy.ts wire constant', extract('lib/servicialo/proxy.ts', new RegExp(String.raw`const SERVICIALO_VERSION\s*=\s*'${SEMVERISH}'`)), WIRE);
// The profile's §2.2 header table must document that same wire value.
check(
  'HTTP_PROFILE §2.2 header value',
  extract('spec/HTTP_PROFILE.md', new RegExp(String.raw`\|\s*\`X-Servicialo-Version\`\s*\|\s*\`${SEMVERISH}\`\s*\|`)),
  WIRE,
);
// openapi must pin the same value in the header parameter enum. Parsed
// structurally rather than by regex: openapi.yaml is machine-readable, and a
// reformat (flow vs block style) must not blind this check.
const openapi = parse(read('spec/openapi.yaml'));
const versionEnum = openapi?.components?.parameters?.ServicialoVersion?.schema?.enum;
if (!Array.isArray(versionEnum) || versionEnum.length !== 1) {
  errors.push(
    'openapi X-Servicialo-Version enum: components.parameters.ServicialoVersion.schema.enum ' +
    'is missing or not a single-value list (surface changed shape?)',
  );
} else {
  check('openapi X-Servicialo-Version enum', String(versionEnum[0]), WIRE);
}
// The document's own version must track the profile it binds.
check('openapi info.version', openapi?.info?.version ?? null, PROFILE);

// ── [G] Header semantics: the profile must say what the header versions ─────
// Mislabelling it "Protocol version" is what produced the 0.8 drift: a reader
// bumps it whenever the protocol moves. The label must name the binding.
forbid(
  'HTTP_PROFILE §2.2 header not mislabelled',
  'spec/HTTP_PROFILE.md',
  /\|\s*`X-Servicialo-Version`\s*\|[^|]*\|\s*Protocol version\./,
  'the header versions the HTTP binding, not the protocol — relabel it',
);
// A normative definition must exist, not just a table row.
const profileText = read('spec/HTTP_PROFILE.md');
if (/`X-Servicialo-Version` identifies a compatible family/.test(profileText)) {
  console.log('[+] HTTP_PROFILE header semantics: defined');
} else {
  errors.push(
    'HTTP_PROFILE header semantics: no normative definition of what ' +
    '`X-Servicialo-Version` versions (expected "identifies a compatible family…")',
  );
}
// The manifest must carry the same statement in one line, next to the value.
const manifestText = read('protocol/manifest.yaml');
if (/compatible family of the observable HTTP contract/.test(manifestText)) {
  console.log('[+] manifest header semantics: defined');
} else {
  errors.push(
    'protocol/manifest.yaml: resolver_api_version carries no semantics note ' +
    '(expected "compatible family of the observable HTTP contract")',
  );
}

// ── [H] Document-owned versions declared in the manifest ────────────────────
// A document that versions itself (A2A binding, Webhooks spec) must say so in
// the manifest, otherwise its number is a fourth unexplained version.
const a2aDeclared = manifest.bindings.a2a?.version ?? null;
const a2aCode = extract('app/api/servicialo/[orgSlug]/.well-known/agent.json/route.ts', new RegExp(String.raw`const A2A_VERSION\s*=\s*'${SEMVERISH}'`));
if (!a2aDeclared) {
  errors.push('protocol/manifest.yaml: bindings.a2a.version is not declared');
} else if (!a2aCode) {
  errors.push('agent card route: A2A_VERSION pattern not found (surface changed shape?)');
} else if (a2aCode !== a2aDeclared && !a2aCode.startsWith(`${a2aDeclared}.`)) {
  errors.push(`a2a binding version: code "${a2aCode}" is not within declared family "${a2aDeclared}"`);
} else {
  console.log(`[+] a2a binding version: manifest ${a2aDeclared}, code ${a2aCode}`);
}
const webhooksExt = (manifest.extensions ?? []).find((e) => e.id === 'webhooks');
const webhooksDocVersion = extract('WEBHOOKS.md', new RegExp(String.raw`\*\*Status:\*\*\s*v${SEMVERISH}`));
if (!webhooksDocVersion) {
  errors.push('WEBHOOKS.md: status version pattern not found (surface changed shape?)');
} else if (!webhooksExt?.version) {
  errors.push(
    `WEBHOOKS.md declares its own version v${webhooksDocVersion} but ` +
    'protocol/manifest.yaml extensions[webhooks] has no `version:` field — ' +
    'declare it as bindings.a2a.version does',
  );
} else {
  check('WEBHOOKS.md ↔ manifest version', webhooksDocVersion, webhooksExt.version);
}

// ── Report ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error('');
  console.error(
    `FAIL  ${errors.length} version drift(s) against protocol/manifest.yaml ` +
    `(protocol=${V}, package=${P}, http profile=${PROFILE}, wire header=${WIRE}):`,
  );
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('');
console.log(
  `PASS  Versions unified: protocol v${V}, @servicialo/mcp-server ${P}, ` +
  `HTTP Profile ${PROFILE}, X-Servicialo-Version ${WIRE}.`,
);
process.exit(0);
