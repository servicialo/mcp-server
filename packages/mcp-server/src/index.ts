#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createAdapter, type ServicialoAdapter } from './adapter.js';
import { detectMode } from './mode.js';
import type { z } from 'zod';

// --- Public tools ---
import { registryTools } from './tools/public/registry.js';
import { publicAvailabilityTools } from './tools/public/availability.js';
import { publicServicesTools } from './tools/public/services.js';
import { resolveTools } from './tools/public/resolve.js';
import { a2aTools } from './tools/public/a2a.js';

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
    version: '0.8.0',
  });

  // --- Register tools ---
  function registerTools(tools: Record<string, ToolDef>) {
    for (const [name, tool] of Object.entries(tools)) {
      server.tool(
        name,
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
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// --- Smithery sandbox (for registry scanning) ---
export function createSandboxServer() {
  const sandbox = new McpServer({ name: 'servicialo', version: '0.8.0' });
  const allTools = { ...publicTools, ...authenticatedTools };
  for (const [name, tool] of Object.entries(allTools)) {
    sandbox.tool(name, tool.description, tool.schema.shape, async () => ({
      content: [{ type: 'text' as const, text: '{}' }],
    }));
  }
  return sandbox;
}
