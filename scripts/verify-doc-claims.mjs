#!/usr/bin/env node
/**
 * Guardrail: documentation claims must match the surface derived from
 * protocol/manifest.yaml.
 *
 * History: the repo accumulated NINE different public tool counts
 * (9/10/12/20/23/34/35/37/40) and several "9 universal states" claims that
 * contradicted PROTOCOL.md §6 (6 core + 3 optional financial states). This
 * script fails CI when a known-bad claim reappears on a maintained surface.
 *
 * Checks:
 *   1. "<N> public/discovery tools" must equal the derived public count.
 *   2. "<N> authenticated tools" must equal the derived authenticated count.
 *   3. Any "<N> tools/herramientas" where N is a historical wrong total
 *      (8, 9, 10, 12, 20, 23, 34, 35, 37, 41) → fail.
 *   4. Forbidden phrases: "9 estados universales", "nueve estados
 *      universales", "implement the 9 lifecycle states".
 *   5. docs/spec/ must contain nothing but the README.md relocation stub
 *      (the mirror was consolidated into public/spec/).
 *
 * Intentionally NOT scanned (historical records / archived snapshots):
 *   - CHANGELOG.md, DOCS_CHANGELOG.md (append-only history)
 *   - docs/whitepaper.md + app/whitepaper/ (archived v0.9 snapshot, bannered)
 *   - distribution/registries.yaml (record of what was submitted upstream)
 *   - PROTOCOL.md Appendix B (version history)
 *
 * Exit code 0 = clean, 1 = stale claim detected.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const manifest = parse(readFileSync(join(repoRoot, 'protocol', 'manifest.yaml'), 'utf8'));
const COUNTS = {
  total: manifest.tools.length,
  public: manifest.tools.filter((t) => t.tier === 'public').length,
  authenticated: manifest.tools.filter((t) => t.tier === 'authenticated').length,
};
const VALID_TOTALS = new Set([COUNTS.total, COUNTS.public, COUNTS.authenticated]);
const HISTORICAL_BAD_TOTALS = new Set([8, 9, 10, 12, 20, 23, 34, 35, 37, 41]);

// Fixed files (maintained surfaces)
const FILES = [
  'README.md',
  'README.en.md',
  'SPEC.md',
  'PROTOCOL.md',
  'IMPLEMENTORS.md',
  'IMPLEMENTING.md',
  'IMPLEMENTING.en.md',
  'ROADMAP.md',
  'GOVERNANCE.md',
  'GLOSSARY.md',
  'MCP_REGISTRY.md',
  'DIRECTORIES.md',
  'CONTRIBUTING.md',
  'CONTRIBUTION.md',
  'smithery.yaml',
  'public/llms.txt',
  'packages/mcp-server/server.json',
  'packages/mcp-server/README.md',
  'packages/mcp-server/README.en.md',
];

// Directories walked recursively for the given extensions
const DIRS = [
  { dir: 'app', exts: ['.tsx', '.ts'], skip: ['app/whitepaper'] },
  { dir: 'components', exts: ['.tsx', '.ts'], skip: [] },
  { dir: 'lib', exts: ['.ts'], skip: [] },
  { dir: 'public/spec', exts: ['.md'], skip: [] },
];

// Allowlist: { file (repo-relative, /-separated), match (exact matched text) }
// Every entry needs a justification comment.
const ALLOWLIST = [
  // PROTOCOL.md §13.2 documents the HTTP-profile tool families including
  // counts of specified-but-unimplemented service_orders.* operations.
];

function isAllowed(file, match) {
  return ALLOWLIST.some((a) => a.file === file && a.match === match);
}

function* walk(dir, exts, skip) {
  const abs = join(repoRoot, dir);
  if (!existsSync(abs)) return;
  for (const entry of readdirSync(abs)) {
    const rel = `${dir}/${entry}`;
    if (skip.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
    const absEntry = join(abs, entry);
    if (statSync(absEntry).isDirectory()) {
      yield* walk(rel, exts, skip);
    } else if (exts.some((e) => entry.endsWith(e))) {
      yield rel;
    }
  }
}

function stripHistoricalSections(file, body) {
  if (file === 'PROTOCOL.md') {
    // Appendix B is the version-history changelog — historical claims stay.
    const start = body.indexOf('## Appendix B');
    const end = body.indexOf('## Appendix C');
    if (start !== -1 && end !== -1) {
      return body.slice(0, start) + body.slice(end);
    }
  }
  return body;
}

const targets = [...FILES];
for (const { dir, exts, skip } of DIRS) {
  targets.push(...walk(dir, exts, skip));
}

const TOOL_WORD = String.raw`(?:MCP\s+)?(?:tools?|herramientas?)`;
const RULES = [
  {
    name: `public tool count must be ${COUNTS.public}`,
    re: new RegExp(String.raw`\b(\d+)\s+(?:public|discovery)\s+${TOOL_WORD}`, 'gi'),
    bad: (n) => n !== COUNTS.public,
  },
  {
    name: `public tool count must be ${COUNTS.public}`,
    re: new RegExp(String.raw`\b(\d+)\s+herramientas?\s+p[uú]blicas`, 'gi'),
    bad: (n) => n !== COUNTS.public,
  },
  {
    name: `authenticated tool count must be ${COUNTS.authenticated}`,
    re: new RegExp(String.raw`\b(\d+)\s+(?:authenticated|auth)\s+${TOOL_WORD}`, 'gi'),
    bad: (n) => n !== COUNTS.authenticated,
  },
  {
    name: `authenticated tool count must be ${COUNTS.authenticated}`,
    re: new RegExp(String.raw`\b(\d+)\s+herramientas?\s+autenticadas`, 'gi'),
    bad: (n) => n !== COUNTS.authenticated,
  },
  {
    name: 'historical wrong tool total',
    re: new RegExp(String.raw`\b(\d+)\s+${TOOL_WORD}\b`, 'gi'),
    bad: (n) => HISTORICAL_BAD_TOTALS.has(n) && !VALID_TOTALS.has(n),
  },
  {
    name: 'forbidden phrase (states are 6 core + 3 optional, dimensions are orthogonal)',
    re: /(?:9|nueve)\s+(?:estados|states)\s+universal(?:es)?/gi,
    bad: () => true,
  },
  {
    name: 'forbidden phrase (only 6 core states are required)',
    re: /implement (?:the )?9 lifecycle states/gi,
    bad: () => true,
  },
];

const failures = [];

for (const file of targets) {
  const abs = join(repoRoot, file);
  if (!existsSync(abs)) continue;
  const body = stripHistoricalSections(file, readFileSync(abs, 'utf8'));
  const lines = body.split('\n');
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(body)) !== null) {
      const n = m[1] !== undefined ? Number(m[1]) : NaN;
      if (!rule.bad(n)) continue;
      if (isAllowed(file, m[0])) continue;
      const lineNo = body.slice(0, m.index).split('\n').length;
      failures.push(`${file}:${lineNo}: "${m[0].trim()}" — ${rule.name}`);
      void lines;
    }
  }
}

// Guard: docs/spec must stay a relocation stub
const docsSpec = join(repoRoot, 'docs', 'spec');
if (existsSync(docsSpec)) {
  const extras = readdirSync(docsSpec).filter((f) => f !== 'README.md');
  if (extras.length > 0) {
    failures.push(
      `docs/spec/ must contain only the README.md relocation stub (spec is served from public/spec/); found: ${extras.join(', ')}`
    );
  }
}

console.log(`[+] derived counts: ${COUNTS.total} total = ${COUNTS.public} public + ${COUNTS.authenticated} authenticated`);
console.log(`[+] surfaces scanned: ${targets.length}`);

if (failures.length > 0) {
  console.error('');
  console.error(`FAIL  ${failures.length} stale claim(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  console.error('Fix the claim, or (only for historical records) add an ALLOWLIST entry with justification.');
  process.exit(1);
}

console.log('');
console.log('PASS  No stale tool-count or state claims on maintained surfaces.');
process.exit(0);
