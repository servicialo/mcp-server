#!/usr/bin/env node
/**
 * Guardrail: one CORE list, one contract.
 *
 * `protocol/manifest.yaml` → `conformance.core.required_operations` is the
 * single machine-readable statement of what CORE requires. Before this script
 * existed the repo carried five mutually inconsistent lists — the HTTP
 * Profile's §3.1 table, its own per-endpoint REQUIRED markers (which
 * contradicted that table), IMPLEMENTORS.md, IMPLEMENTING.md, and a manifest
 * comment pointing at "Core profiles". Nothing failed.
 *
 * Checks:
 *   [1] Every required operation exists in `tools`.
 *   [2] The HTTP Profile marks exactly that set REQUIRED — in §3.1 and in
 *       Appendix A, which must also agree with each other.
 *   [3] IMPLEMENTORS.md and IMPLEMENTING.md list exactly that set.
 *   [4] openapi.yaml defines a path for every required operation.
 *   [5] The compatibility suite tags a test REQUIRED for every required
 *       operation.
 *   [6] Contract parity, not just list parity: every documented path that maps
 *       to an implemented tool must be the path that tool actually sends,
 *       after translatePath.
 *
 * A pattern that fails to match is a failure, not a pass: it means the surface
 * changed shape and this script went blind.
 *
 * Exit code 0 = consistent, 1 = drift.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import { collectToolWire, normalizePath } from './lib/tool-wire.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

const manifest = parse(read('protocol/manifest.yaml'));
const errors = [];
const ok = (msg) => console.log(`[+] ${msg}`);

const core = manifest.conformance?.core;
if (!core || !Array.isArray(core.required_operations)) {
  console.error('FAIL  protocol/manifest.yaml: conformance.core.required_operations is missing.');
  console.error('      That block is the canonical CORE list; without it nothing here can be checked.');
  process.exit(1);
}
const REQUIRED = [...core.required_operations].sort();
const requiredSet = new Set(REQUIRED);

const sameSet = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const fmt = (list) => list.length ? list.join(', ') : '(none)';

function compare(label, found) {
  const sorted = [...new Set(found)].sort();
  if (sameSet(sorted, REQUIRED)) {
    ok(`${label}: ${sorted.length} required operations match the manifest`);
    return;
  }
  const missing = REQUIRED.filter((o) => !sorted.includes(o));
  const extra = sorted.filter((o) => !requiredSet.has(o));
  errors.push(
    `${label}: disagrees with conformance.core.required_operations` +
    (missing.length ? `\n      missing: ${fmt(missing)}` : '') +
    (extra.length ? `\n      unexpected: ${fmt(extra)}` : ''),
  );
}

// ── [1] Required operations exist as tools ─────────────────────────────────
const toolNames = new Set((manifest.tools ?? []).map((t) => t.name));
for (const op of REQUIRED) {
  if (!toolNames.has(op)) {
    errors.push(`[1] required operation "${op}" is not in manifest.tools — it cannot be required if it does not exist`);
  }
}
if (!errors.length) ok(`[1] all ${REQUIRED.length} required operations exist in tools`);

// Conveniences and non-node operations must not also be required.
for (const c of core.expressible_conveniences ?? []) {
  if (requiredSet.has(c.operation)) {
    errors.push(`[1] "${c.operation}" is listed both as required and as an expressible convenience`);
  }
}
for (const n of core.not_node_requirements ?? []) {
  if (requiredSet.has(n)) {
    errors.push(`[1] "${n}" is listed both as required and as not a node requirement`);
  }
}

// ── [2] HTTP Profile — §3.1 table and Appendix A ───────────────────────────
const profile = read('spec/HTTP_PROFILE.md');

// §3.1: | # | `tool` | `path` | clause |
const s31 = profile.match(/### 3\.1 REQUIRED[\s\S]*?\n### 3\.2 /);
if (!s31) {
  errors.push('[2] spec/HTTP_PROFILE.md: §3.1 REQUIRED section not found (surface changed shape?)');
} else {
  const rows = [...s31[0].matchAll(/^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm)];
  if (!rows.length) {
    errors.push('[2] spec/HTTP_PROFILE.md §3.1: no operation rows parsed (surface changed shape?)');
  } else {
    compare('[2] HTTP Profile §3.1', rows.map((r) => r[1]));
  }
}

// Appendix A: | # | `tool` | METHOD | `path` | COMPLIANCE |
const appendix = profile.match(/## Appendix A: Endpoint Summary[\s\S]*$/);
let appendixRows = [];
if (!appendix) {
  errors.push('[2] spec/HTTP_PROFILE.md: Appendix A not found (surface changed shape?)');
} else {
  appendixRows = [...appendix[0].matchAll(
    /^\|\s*\d+[a-z]?\s*\|\s*`([^`]+)`[^|]*\|\s*([A-Z]+)\s*\|\s*`([^`]+)`\s*\|\s*(REQUIRED|OPTIONAL)\s*\|/gm,
  )].map((m) => ({ tool: m[1], method: m[2], path: m[3], compliance: m[4] }));
  if (!appendixRows.length) {
    errors.push('[2] spec/HTTP_PROFILE.md Appendix A: no rows parsed (surface changed shape?)');
  } else {
    compare('[2] HTTP Profile Appendix A',
      appendixRows.filter((r) => r.compliance === 'REQUIRED').map((r) => r.tool));
  }
}

// Per-endpoint markers must agree with Appendix A — 1.0.0's did not.
const sectionMarkers = [...profile.matchAll(
  /^### \d+\.\d+ `([^`]+)`[\s\S]*?^\| \*\*Compliance\*\* \| (REQUIRED|OPTIONAL) \|/gm,
)].map((m) => ({ tool: m[1], compliance: m[2] }));
if (!sectionMarkers.length) {
  errors.push('[2] spec/HTTP_PROFILE.md: no per-endpoint Compliance markers parsed (surface changed shape?)');
} else {
  compare('[2] HTTP Profile per-endpoint markers',
    sectionMarkers.filter((s) => s.compliance === 'REQUIRED').map((s) => s.tool));
}

// ── [3] Implementer guides ─────────────────────────────────────────────────
// Both guides delimit their required-operation list with HTML comments so this
// check reads a declared list rather than guessing at prose.
function guideOps(rel) {
  const text = read(rel);
  const block = text.match(
    /<!--\s*conformance:required:start\s*-->([\s\S]*?)<!--\s*conformance:required:end\s*-->/,
  );
  if (!block) {
    errors.push(
      `[3] ${rel}: no <!-- conformance:required:start/end --> block found. ` +
      'The required-operation list must be delimited so CI can read it.',
    );
    return null;
  }
  const ops = [...block[1].matchAll(/`([a-z][a-z0-9]*\.[a-z0-9_]+)`/g)].map((m) => m[1]);
  if (!ops.length) {
    errors.push(`[3] ${rel}: conformance block contains no operations (surface changed shape?)`);
    return null;
  }
  return ops;
}
for (const rel of ['IMPLEMENTORS.md', 'IMPLEMENTING.md']) {
  const ops = guideOps(rel);
  if (ops) compare(`[3] ${rel}`, ops);
}

// ── [4] + [6] openapi ──────────────────────────────────────────────────────
const openapi = parse(read('spec/openapi.yaml'));
const VERBS = ['get', 'post', 'put', 'patch', 'delete'];

/** tool → set of "<METHOD> <normalized /v1 path>" as openapi declares it. */
const openapiWire = new Map();
for (const [path, ops] of Object.entries(openapi.paths ?? {})) {
  for (const verb of VERBS) {
    const op = ops?.[verb];
    if (!op) continue;
    for (const key of ['x-mcp-tool', 'x-mcp-tool-also']) {
      const tool = op[key];
      if (!tool) continue;
      const entry = `${verb.toUpperCase()} ${normalizePath('/v1' + path)}`;
      openapiWire.set(tool, (openapiWire.get(tool) ?? new Set()).add(entry));
    }
  }
}
if (!openapiWire.size) {
  errors.push('[4] spec/openapi.yaml: no x-mcp-tool annotations found (surface changed shape?)');
}
for (const op of REQUIRED) {
  if (!openapiWire.has(op)) {
    errors.push(`[4] spec/openapi.yaml defines no path for required operation "${op}"`);
  }
}
if (!errors.some((e) => e.startsWith('[4]'))) {
  ok(`[4] openapi defines a path for all ${REQUIRED.length} required operations`);
}

// ── [5] Compatibility suite ────────────────────────────────────────────────
const SUITE = 'packages/mcp-server/src/__tests__/http-compat.test.ts';
const suite = read(SUITE);
const tagged = [...suite.matchAll(/@conformance:(REQUIRED|OPTIONAL)\s+([a-z][a-z0-9]*\.[a-z0-9_]+)/g)]
  .map((m) => ({ level: m[1], op: m[2] }));
if (!tagged.length) {
  errors.push(
    `[5] ${SUITE}: no "@conformance:REQUIRED <operation>" markers found. ` +
    'Every test must declare which operation it exercises and at what level.',
  );
} else {
  compare('[5] compatibility suite', tagged.filter((t) => t.level === 'REQUIRED').map((t) => t.op));
  for (const t of tagged) {
    if (!toolNames.has(t.op)) {
      errors.push(`[5] ${SUITE} tags unknown operation "${t.op}"`);
    }
  }
}

// ── [6] Contract parity — documented paths must be the paths tools send ────
const toolWire = collectToolWire([
  join(repoRoot, 'packages', 'mcp-server', 'src', 'tools', 'public'),
  join(repoRoot, 'packages', 'mcp-server', 'src', 'tools', 'authenticated'),
]);
const unimplemented = new Set((manifest.specified_unimplemented_tools ?? []).map((t) => t.name));

let checked = 0;
function parity(source, tool, entry) {
  if (unimplemented.has(tool)) return;          // specified, no running code to compare against
  const actual = toolWire.get(tool);
  if (!actual) {
    errors.push(`[6] ${source} documents "${tool}", which is not an implemented tool`);
    return;
  }
  if (actual.size === 0) return;                // e.g. docs.quickstart makes no call
  checked++;
  if (!actual.has(entry)) {
    errors.push(
      `[6] ${source}: "${tool}" documented as "${entry}" but the tool sends ` +
      `${[...actual].map((a) => `"${a}"`).join(' or ')}`,
    );
  }
}
for (const [tool, entries] of openapiWire) {
  for (const entry of entries) parity('spec/openapi.yaml', tool, entry);
}
for (const row of appendixRows) {
  parity('spec/HTTP_PROFILE.md Appendix A', row.tool, `${row.method} ${normalizePath(row.path)}`);
}
if (!errors.some((e) => e.startsWith('[6]'))) {
  ok(`[6] contract parity: ${checked} documented path(s) match what the tools send`);
}

// ── Report ─────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error('');
  console.error(`FAIL  ${errors.length} conformance parity problem(s).`);
  console.error(`      Canonical list (protocol/manifest.yaml → conformance.core.required_operations):`);
  console.error(`      ${REQUIRED.join(', ')}`);
  console.error('');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('');
console.log(`PASS  One CORE list, honoured by every surface: ${REQUIRED.join(', ')}.`);
process.exit(0);
