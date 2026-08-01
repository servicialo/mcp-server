#!/usr/bin/env node
/**
 * Guardrail: protocol/manifest.yaml `tools` must mirror the real MCP tool
 * surface in packages/mcp-server/src/tools/{public,authenticated}/ exactly.
 *
 * The manifest is the single source of truth the site and docs derive tool
 * counts from — if it drifts from the code, every derived number lies.
 *
 * Checks:
 *   1. Symmetric diff per tier (tool in code without a manifest row, or a
 *      manifest row without code) → fail.
 *   2. Declared tier must match the directory the tool lives in → fail.
 *   3. Every tool's `profile` must exist in `profiles[].id` → fail.
 *   4. No `specified_unimplemented_tools` entry may exist in code — if it
 *      ships, it must be promoted to `tools` → fail.
 *
 * Exit code 0 = consistent, 1 = drift detected.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import { collectToolNames } from './lib/tool-keys.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const MANIFEST_PATH = join(repoRoot, 'protocol', 'manifest.yaml');
const TOOLS_ROOT = join(repoRoot, 'packages', 'mcp-server', 'src', 'tools');

const manifest = parse(readFileSync(MANIFEST_PATH, 'utf8'));

const codeTools = {
  public: collectToolNames(join(TOOLS_ROOT, 'public')),
  authenticated: collectToolNames(join(TOOLS_ROOT, 'authenticated')),
};

const manifestTools = { public: new Set(), authenticated: new Set() };
const errors = [];

const profileIds = new Set((manifest.profiles ?? []).map((p) => p.id));

for (const tool of manifest.tools ?? []) {
  if (tool.tier !== 'public' && tool.tier !== 'authenticated') {
    errors.push(`manifest: tool "${tool.name}" has invalid tier "${tool.tier}"`);
    continue;
  }
  if (manifestTools[tool.tier].has(tool.name)) {
    errors.push(`manifest: tool "${tool.name}" is listed twice`);
  }
  manifestTools[tool.tier].add(tool.name);
  if (!profileIds.has(tool.profile)) {
    errors.push(`manifest: tool "${tool.name}" references unknown profile "${tool.profile}"`);
  }
}

for (const tier of ['public', 'authenticated']) {
  for (const name of codeTools[tier]) {
    if (!manifestTools[tier].has(name)) {
      const otherTier = tier === 'public' ? 'authenticated' : 'public';
      if (manifestTools[otherTier].has(name)) {
        errors.push(`tier mismatch: "${name}" is ${tier} in code but ${otherTier} in manifest`);
      } else {
        errors.push(`missing from manifest: "${name}" (${tier}) exists in code`);
      }
    }
  }
  for (const name of manifestTools[tier]) {
    if (!codeTools[tier].has(name) && !codeTools.public.has(name) && !codeTools.authenticated.has(name)) {
      errors.push(`missing from code: manifest lists "${name}" (${tier}) but no tool exists`);
    }
  }
}

for (const entry of manifest.specified_unimplemented_tools ?? []) {
  if (codeTools.public.has(entry.name) || codeTools.authenticated.has(entry.name)) {
    errors.push(
      `"${entry.name}" is listed as specified_unimplemented but exists in code — promote it to \`tools\``
    );
  }
}

const pub = manifestTools.public.size;
const auth = manifestTools.authenticated.size;
console.log(`[+] manifest tools: ${pub + auth} = ${pub} public + ${auth} authenticated`);
console.log(`[+] code tools:     ${codeTools.public.size + codeTools.authenticated.size} = ${codeTools.public.size} public + ${codeTools.authenticated.size} authenticated`);

if (errors.length > 0) {
  console.error('');
  console.error(`FAIL  ${errors.length} inconsistency(ies) between protocol/manifest.yaml and the tool source:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('');
console.log('PASS  protocol/manifest.yaml mirrors the implemented tool surface.');
process.exit(0);
