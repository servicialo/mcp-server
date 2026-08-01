#!/usr/bin/env node
/**
 * Guardrail: every public tool in @servicialo/mcp-server must have a
 * one-line tagline in the `serverInstructions` block of src/index.ts.
 *
 * The `serverInstructions` string is what AI agents read when the
 * server initializes — it's the agent's "menu". If a contributor adds
 * a new public tool to tools/public/*.ts but forgets to update the
 * tagline list, the agent never learns the tool exists and the new
 * surface goes invisible. (This is what the P8 entry in the tech-debt
 * list flagged.)
 *
 * The check is intentionally one-way: tools must appear in instructions.
 * It does not enforce that every line in instructions corresponds to a
 * tool — there are also non-tool lines describing flows and auth.
 *
 * Exit code 0 = consistent, 1 = drift detected.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { collectToolNames } from './lib/tool-keys.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const PUBLIC_TOOLS_DIR = join(repoRoot, 'packages', 'mcp-server', 'src', 'tools', 'public');
const INDEX_TS = join(repoRoot, 'packages', 'mcp-server', 'src', 'index.ts');

function collectPublicToolNames() {
  return collectToolNames(PUBLIC_TOOLS_DIR);
}

function collectInstructionsTaglines() {
  let body;
  try {
    body = readFileSync(INDEX_TS, 'utf8');
  } catch (err) {
    console.error(`FAIL  could not read ${INDEX_TS}: ${err.message}`);
    process.exit(1);
  }
  // The block lives inside `serverInstructions = [ ... ].join('\n')`.
  // Each tagline is a string item:  '- <tool_name_underscored> — <text>',
  const lineRe = /^\s+['"]- ([a-z][a-z0-9_]+) — /gm;
  const taglines = new Set();
  let m;
  while ((m = lineRe.exec(body)) !== null) {
    taglines.add(m[1]);
  }
  return taglines;
}

function toolToTaglineKey(name) {
  // tool names use `.`, instructions use `_` (MCP spec name constraint)
  return name.replace(/\./g, '_');
}

const toolNames = collectPublicToolNames();
const taglines = collectInstructionsTaglines();

const missing = [];
for (const tool of toolNames) {
  if (!taglines.has(toolToTaglineKey(tool))) {
    missing.push(tool);
  }
}

console.log(`[+] public tools found in tools/public/: ${toolNames.size}`);
console.log(`[+] taglines found in serverInstructions: ${taglines.size}`);

if (missing.length > 0) {
  console.error('');
  console.error(`FAIL  ${missing.length} public tool(s) have no tagline in serverInstructions:`);
  for (const t of missing) {
    console.error(`  - ${t}  (expected entry: '- ${toolToTaglineKey(t)} — ...')`);
  }
  console.error('');
  console.error(`Edit ${relative(repoRoot, INDEX_TS).replace(/\\/g, '/')} and add a line in the public-tools list.`);
  process.exit(1);
}

console.log('');
console.log('PASS  Every public tool has a tagline in serverInstructions.');
process.exit(0);
