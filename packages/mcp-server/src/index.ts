#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createAdapter, type ServicialoAdapter } from './adapter.js';
import { detectMode } from './mode.js';
import type { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'),
) as { version: string };

// --- Public tools ---
import { registryTools } from './tools/public/registry.js';
import { publicAvailabilityTools } from './tools/public/availability.js';
import { publicServicesTools } from './tools/public/services.js';
import { resolveTools } from './tools/public/resolve.js';
import { a2aTools } from './tools/public/a2a.js';
import { docsQuickstartTools } from './tools/public/docs-quickstart.js';

// --- Authenticated tools (Phases 2–6) ---
import { entenderTools } from './tools/authenticated/entender.js';
import { comprometerTools } from './tools/authenticated/comprometer.js';
import { lifecycleTools } from './tools/authenticated/lifecycle.js';
import { deliveryTools } from './tools/authenticated/delivery.js';
import { cerrarTools } from './tools/authenticated/cerrar.js';
import { resourceTools } from './tools/authenticated/resource.js';
import { resolveAuthTools } from './tools/authenticated/resolve-auth.js';

// --- Tool type ---
type ToolDef = {
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (client: ServicialoAdapter, args: any) => Promise<unknown>;
};

// --- Public tools (always registered) ---
const publicTools: Record<string, ToolDef> = {
  ...registryTools as unknown as Record<string, ToolDef>,
  ...publicAvailabilityTools as unknown as Record<string, ToolDef>,
  ...publicServicesTools as unknown as Record<string, ToolDef>,
  ...resolveTools as unknown as Record<string, ToolDef>,
  ...a2aTools as unknown as Record<string, ToolDef>,
  ...docsQuickstartTools as unknown as Record<string, ToolDef>,
};

// --- Authenticated tools (only in authenticated mode) ---
const authenticatedTools: Record<string, ToolDef> = {
  ...entenderTools as unknown as Record<string, ToolDef>,
  ...comprometerTools as unknown as Record<string, ToolDef>,
  ...lifecycleTools as unknown as Record<string, ToolDef>,
  ...deliveryTools as unknown as Record<string, ToolDef>,
  ...cerrarTools as unknown as Record<string, ToolDef>,
  ...resourceTools as unknown as Record<string, ToolDef>,
  ...resolveAuthTools as unknown as Record<string, ToolDef>,
};

// --- Connect via stdio ---
async function main() {
  // --- Detect mode ---
  const mode = detectMode();
  const adapterType = process.env.SERVICIALO_ADAPTER || 'coordinalo';

  if (mode === 'authenticated') {
    console.error(`Servicialo MCP — modo autenticado [org: ${process.env.SERVICIALO_ORG_ID}, adapter: ${adapterType}]`);
  } else {
    console.error(`Servicialo MCP — modo discovery (adapter: ${adapterType})`);
  }

  // --- Init adapter ---
  const adapter = await createAdapter();

  // --- Init MCP server ---
  const server = new McpServer({
    name: 'servicialo',
    version: pkg.version,
  });

  // --- Register tools ---
  function registerTools(tools: Record<string, ToolDef>) {
    for (const [name, tool] of Object.entries(tools)) {
      // MCP spec requires tool names to match [a-zA-Z0-9_-]{1,64}
      const safeName = name.replace(/\./g, '_');
      server.tool(
        safeName,
        tool.description,
        tool.schema.shape,
        async (args) => {
          try {
            const result = await tool.handler(adapter, args as Record<string, unknown>);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: ${message}`,
                },
              ],
              isError: true,
            };
          }
        },
      );
    }
  }

  // Always register public tools
  registerTools(publicTools);

  if (mode === 'authenticated') {
    // Register authenticated tools only when credentials are present
    registerTools(authenticatedTools);
  }
  // Discovery mode: only the 9 public tools are exposed

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // --- Telemetry (fire-and-forget, respects SERVICIALO_TELEMETRY=false) ---
  if (process.env.SERVICIALO_TELEMETRY?.toLowerCase() !== 'false') {
    // 1. Persistent node_id: read or create ~/.servicialo/node_id
    let nodeId: string | undefined;
    const servicialoDir = join(homedir(), '.servicialo');
    try {
      const file = join(servicialoDir, 'node_id');
      if (existsSync(file)) {
        nodeId = readFileSync(file, 'utf-8').trim();
      }
      if (!nodeId) {
        nodeId = randomUUID();
        mkdirSync(servicialoDir, { recursive: true });
        writeFileSync(file, nodeId, 'utf-8');
      }
    } catch {
      // Non-critical — proceed without node_id
    }

    // 1b. First-run notice (shown once, then sentinel file prevents repeat)
    try {
      const sentinelFile = join(servicialoDir, '.telemetry-notice-shown');
      if (!existsSync(sentinelFile)) {
        console.error(
          '\n  Servicialo sends anonymous usage telemetry (node_id + version).\n' +
          '  To opt out, set SERVICIALO_TELEMETRY=false\n' +
          '  Details: https://servicialo.com/docs/telemetry\n',
        );
        try {
          mkdirSync(servicialoDir, { recursive: true });
          writeFileSync(sentinelFile, new Date().toISOString(), 'utf-8');
        } catch { /* non-critical */ }
      }
    } catch {
      // Non-critical — proceed without notice
    }

    // 2. Anonymous telemetry instance registration
    fetch('https://servicialo.com/api/telemetry/instance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'node_initialized',
        version: pkg.version,
        node_id: nodeId,
        ts: Date.now(),
      }),
    }).catch(() => {});

    // 3. Registry heartbeat (authenticated nodes only)
    const apiKey = process.env.SERVICIALO_API_KEY;
    const orgSlug = process.env.SERVICIALO_ORG_ID;
    const country = process.env.SERVICIALO_COUNTRY || 'cl';
    const baseUrl = process.env.SERVICIALO_BASE_URL || 'https://servicialo.com';
    if (apiKey && orgSlug) {
      fetch(`${baseUrl}/api/registry/${country}/${orgSlug}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }).catch(() => {});
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// --- Smithery sandbox (for registry scanning) ---
export function createSandboxServer() {
  const sandbox = new McpServer({ name: 'servicialo', version: pkg.version });
  const allTools = { ...publicTools, ...authenticatedTools };
  for (const [name, tool] of Object.entries(allTools)) {
    const safeName = name.replace(/\./g, '_');
    sandbox.tool(safeName, tool.description, tool.schema.shape, async () => ({
      content: [{ type: 'text' as const, text: '{}' }],
    }));
  }
  return sandbox;
}
