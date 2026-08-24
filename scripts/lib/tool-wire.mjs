/**
 * Shared extractor for the wire contract each MCP tool actually sends.
 *
 * For every tool in packages/mcp-server/src/tools/{public,authenticated}/*.ts
 * this returns the set of "<METHOD> <path>" pairs the handler produces, with
 * `translatePath` applied — i.e. the path a second implementer must serve.
 *
 * `translatePath` here MIRRORS packages/mcp-server/src/adapter-http.ts. If that
 * file changes, this must change with it; verify-conformance-parity.mjs fails
 * when the mirror stops matching what documents claim, which is the signal.
 *
 * Used by verify-conformance-parity.mjs.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Mirror of HttpAdapter#translatePath (packages/mcp-server/src/adapter-http.ts). */
export function translatePath(path) {
  if (path === '/api/servicialo/manifest') return '/v1/manifest';
  if (path === '/api/servicialo/registry') return '/v1/registry';
  if (path.startsWith('/api/servicialo/resolve')) {
    return '/v1/resolve' + path.slice('/api/servicialo/resolve'.length);
  }
  const pub = path.match(/^\/api\/servicialo\/([^/]+)\/(.+)$/);
  if (pub) return `/v1/organizations/${pub[1]}/${pub[2]}`;
  if (path === '/relacionalo/clients/upsert') return '/v1/clients';
  if (path.startsWith('/coordinalo/')) return '/v1/' + path.slice('/coordinalo/'.length);
  if (path.startsWith('/planificalo/')) return '/v1/' + path.slice('/planificalo/'.length);
  if (path.startsWith('/api/')) return path;
  return '/v1' + path;
}

/**
 * Compare path shape, not parameter spelling: the tool writes `${args.session_id}`
 * where a document writes `{session_id}`, and a document may legitimately name a
 * parameter differently from the tool's argument.
 */
export function normalizePath(path) {
  return path.replace(/\$\{[^}]*\}/g, '{}').replace(/\{[^}]*\}/g, '{}').replace(/\/+$/, '');
}

const TOOL_KEY_RE = /^\s+['"]([a-z][a-z0-9]*\.[a-z0-9_]+)['"]\s*:\s*\{/gm;
const CALL_RE = /client\.(?:(pub)\.)?(get|post|put|patch|delete)\(\s*(`[^`]*`|'[^']*'|"[^"]*")/g;

const METHOD = { get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE' };

/**
 * @returns {Map<string, Set<string>>} tool name → set of "<METHOD> <normalized path>"
 */
export function collectToolWire(dirs) {
  const wire = new Map();

  for (const dir of dirs) {
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

      // Split the file into per-tool blocks so each call is attributed correctly.
      const marks = [];
      TOOL_KEY_RE.lastIndex = 0;
      let m;
      while ((m = TOOL_KEY_RE.exec(body)) !== null) marks.push({ name: m[1], at: m.index });

      for (let i = 0; i < marks.length; i++) {
        const block = body.slice(marks[i].at, i + 1 < marks.length ? marks[i + 1].at : body.length);
        const calls = new Set();
        CALL_RE.lastIndex = 0;
        let c;
        while ((c = CALL_RE.exec(block)) !== null) {
          const raw = c[3].slice(1, -1);
          calls.add(`${METHOD[c[2]]} ${normalizePath(translatePath(raw))}`);
        }
        const prev = wire.get(marks[i].name) ?? new Set();
        for (const call of calls) prev.add(call);
        wire.set(marks[i].name, prev);
      }
    }
  }

  return wire;
}
