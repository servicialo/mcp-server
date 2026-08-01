/**
 * Shared extractor for MCP tool names declared in
 * packages/mcp-server/src/tools/{public,authenticated}/*.ts.
 *
 * Tool keys are declared as  '<dotted.name>': {  inside an
 * `export const ...Tools = {` block.
 *
 * Used by verify-server-instructions.mjs and verify-manifest-tools.mjs.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const TOOL_KEY_RE = /^\s+['"]([a-z][a-z0-9]*\.[a-z0-9_]+)['"]\s*:\s*\{/gm;

/** Collect tool names from every .ts file in a tools directory. */
export function collectToolNames(dir) {
  const names = new Set();
  let files;
  try {
    files = readdirSync(dir);
  } catch (err) {
    console.error(`FAIL  could not read ${dir}: ${err.message}`);
    process.exit(1);
  }
  for (const file of files) {
    if (!file.endsWith('.ts') || file.endsWith('.d.ts')) continue;
    const body = readFileSync(join(dir, file), 'utf8');
    let m;
    TOOL_KEY_RE.lastIndex = 0;
    while ((m = TOOL_KEY_RE.exec(body)) !== null) {
      names.add(m[1]);
    }
  }
  return names;
}
