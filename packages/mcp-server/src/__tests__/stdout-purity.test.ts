/**
 * stdout is the JSON-RPC channel. Anything else written there corrupts the
 * stream for every client, so this suite spawns the *built* server — the
 * artifact that actually ships — and proves that the first bytes on stdout are
 * a protocol message, while the startup notices land on stderr.
 *
 * Telemetry is disabled for every spawn: it keeps the test off the network and
 * out of the production telemetry table, and it stops the run from writing to
 * ~/.servicialo.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, '..', '..');
const ENTRY = resolve(PKG_ROOT, 'dist', 'index.js');

const INITIALIZE =
  JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'stdout-purity-test', version: '0.0.0' },
    },
  }) + '\n';

interface Run {
  stdout: string;
  stderr: string;
}

/** Spawn the built server, send `initialize`, and capture both streams. */
function runServer(extraEnv: Record<string, string> = {}): Promise<Run> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [ENTRY], {
      cwd: PKG_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        SERVICIALO_TELEMETRY: 'false',
        SERVICIALO_OPERATIONAL_TELEMETRY: 'false',
        SERVICIALO_API_KEY: '',
        SERVICIALO_ORG_ID: '',
        SERVICIALO_QUIET: '',
        SERVICIALO_IMPL_NAME: '',
        SERVICIALO_IMPL_URL: '',
        SERVICIALO_IMPL_CONTACT: '',
        ...extraEnv,
      },
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      child.kill('SIGKILL');
      if (error) rejectRun(error);
      else resolveRun({ stdout, stderr });
    };

    const deadline = setTimeout(
      () => finish(new Error(`no protocol message within 15s.\nstderr:\n${stderr}`)),
      15_000,
    );

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
      // A full line means the response is in. Give stderr a moment to drain
      // before asserting on it — the two pipes are independent.
      if (stdout.includes('\n')) setTimeout(() => finish(), 300);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', finish);

    child.stdin.write(INITIALIZE);
  });
}

beforeAll(() => {
  // Test what ships, not what the sources imply.
  execFileSync('npm', ['run', 'build'], { cwd: PKG_ROOT, stdio: 'pipe' });
}, 180_000);

describe('stdout carries protocol messages and nothing else', () => {
  it('opens with a JSON-RPC message — nothing precedes it', async () => {
    const { stdout } = await runServer();

    expect(stdout.length).toBeGreaterThan(0);
    expect(stdout[0]).toBe('{');

    const firstLine = stdout.split('\n')[0];
    const message = JSON.parse(firstLine);
    expect(message.jsonrpc).toBe('2.0');
    expect(message.id).toBe(1);
  }, 30_000);

  it('keeps every human-facing string off stdout', async () => {
    const { stdout } = await runServer();

    for (const humanText of ['RFC-005', 'Servicialo MCP —', 'modo discovery', 'anonymous']) {
      expect(stdout).not.toContain(humanText);
    }
  }, 30_000);

  it('puts the window notice on stderr', async () => {
    const { stderr } = await runServer();

    expect(stderr).toContain('RFC-005');
    expect(stderr).toContain('https://github.com/servicialo/mcp-server/pull/21');
    expect(stderr).toContain('SERVICIALO_QUIET=true');
  }, 30_000);

  it('honors SERVICIALO_QUIET without disturbing the protocol stream', async () => {
    const { stdout, stderr } = await runServer({ SERVICIALO_QUIET: 'true' });

    expect(stderr).not.toContain('RFC-005');
    expect(stdout[0]).toBe('{');
    expect(JSON.parse(stdout.split('\n')[0]).id).toBe(1);
  }, 30_000);
});
