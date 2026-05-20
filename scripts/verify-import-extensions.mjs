#!/usr/bin/env node
/**
 * Enforce the import-extension convention for the two TypeScript domains
 * in this repo:
 *
 *   - lib/ and app/   (Next.js, moduleResolution=bundler)  → NO `.js` suffix on relative imports
 *   - packages/mcp-server/src/   (plain Node ESM via tsc)  → `.js` suffix REQUIRED on relative imports
 *
 * Mixing these breaks the Vercel build (Next's webpack rejects unknown
 * `.js`-suffixed sources of `.ts` files). The bug bit once already —
 * lib/webhooks/dispatch.ts shipped with `import from './signing.js'` and
 * Vercel failed to compile until the suffix was dropped (commit 447021a).
 *
 * This script catches that class of mistake before it ships.
 *
 * Exit code 0 = clean, 1 = violations found, 2 = could not read tree.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const RULES = [
  {
    label: 'Next.js side (lib/, app/) — must NOT end imports with .js',
    roots: ['lib', 'app'],
    /** Relative path ending in .js — violation */
    pattern: /from\s+['"](\.{1,2}\/[^'"]*)\.js['"]/g,
    skipDirs: new Set(['node_modules', '.next', '__tests__']),
  },
  {
    label: 'MCP server (packages/mcp-server/src/) — must end relative imports with .js',
    roots: ['packages/mcp-server/src'],
    /** Relative path NOT ending in .js — violation (capture group 1 is the path) */
    pattern: /from\s+['"](\.{1,2}\/[^'"]*?)(?<!\.js)(?<!\.json)['"]/g,
    skipDirs: new Set(['node_modules', 'dist']),
  },
];

function* walkTsFiles(root, skipDirs) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const entry of entries) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      yield* walkTsFiles(fullPath, skipDirs);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Skip declaration files
      if (entry.name.endsWith('.d.ts')) continue;
      yield fullPath;
    }
  }
}

let totalViolations = 0;

for (const rule of RULES) {
  console.log(`[+] ${rule.label}`);
  for (const root of rule.roots) {
    const fullRoot = join(repoRoot, root);
    for (const file of walkTsFiles(fullRoot, rule.skipDirs)) {
      let body;
      try {
        body = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      const rel = relative(repoRoot, file).replace(/\\/g, '/');
      // Re-create regex per file to reset lastIndex
      const re = new RegExp(rule.pattern.source, rule.pattern.flags);
      let m;
      while ((m = re.exec(body)) !== null) {
        const importPath = m[1];
        console.error(`  FAIL  ${rel}: import "${importPath}${rule === RULES[0] ? '.js' : ''}"`);
        totalViolations++;
      }
    }
  }
}

console.log('');
if (totalViolations > 0) {
  console.error(`${totalViolations} violation(s) found.\n`);
  console.error('Convention:');
  console.error('  - lib/, app/       — imports go WITHOUT .js (Next.js bundler resolver)');
  console.error('  - packages/mcp-server/src/ — imports go WITH .js (Node ESM)');
  process.exit(1);
}
console.log(`PASS  Import-extension convention is consistent across the repo.`);
process.exit(0);
