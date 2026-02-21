#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CoordinaloClient } from './client.js';
import { detectMode } from './mode.js';
import type { z } from 'zod';

// --- Public tools ---
import { registryTools } from './tools/public/registry.js';
import { publicAvailabilityTools } from './tools/public/availability.js';
import { publicServicesTools } from './tools/public/services.js';

// --- Authenticated tools ---
import { schedulingTools } from './tools/authenticated/scheduling.js';
import { clientsTools } from './tools/authenticated/clients.js';
import { paymentsTools } from './tools/authenticated/payments.js';
import { notificationsTools } from './tools/authenticated/notifications.js';
import { providersTools } from './tools/authenticated/providers.js';
import { payrollTools } from './tools/authenticated/payroll.js';
import { contractsTools } from './tools/authenticated/contracts.js';

// --- Detect mode ---
const mode = detectMode();
const BASE_URL = process.env.SERVICIALO_BASE_URL || 'https://coordinalo.com';

if (mode === 'authenticated') {
  console.error(`Servicialo MCP — modo autenticado [org: ${process.env.SERVICIALO_ORG_ID}]`);
} else {
  console.error('Servicialo MCP — modo discovery (sin credenciales)');
}

// --- Init client ---
const apiClient = new CoordinaloClient({
  baseUrl: BASE_URL,
  apiKey: process.env.SERVICIALO_API_KEY,
  orgId: process.env.SERVICIALO_ORG_ID,
});

// --- Init MCP server ---
const server = new McpServer({
  name: 'servicialo',
  version: '0.3.0',
});

// --- Tool type ---
type ToolDef = {
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (client: CoordinaloClient, args: any) => Promise<unknown>;
};

// --- Public tools (always registered) ---
const publicTools: Record<string, ToolDef> = {
  ...registryTools as unknown as Record<string, ToolDef>,
  ...publicAvailabilityTools as unknown as Record<string, ToolDef>,
  ...publicServicesTools as unknown as Record<string, ToolDef>,
};

// --- Authenticated tools (only in authenticated mode) ---
const authenticatedTools: Record<string, ToolDef> = {
  ...schedulingTools as unknown as Record<string, ToolDef>,
  ...clientsTools as unknown as Record<string, ToolDef>,
  ...paymentsTools as unknown as Record<string, ToolDef>,
  ...notificationsTools as unknown as Record<string, ToolDef>,
  ...providersTools as unknown as Record<string, ToolDef>,
  ...payrollTools as unknown as Record<string, ToolDef>,
  ...contractsTools as unknown as Record<string, ToolDef>,
};

// --- Register tools ---
function registerTools(tools: Record<string, ToolDef>) {
  for (const [name, tool] of Object.entries(tools)) {
    server.tool(
      name,
      tool.description,
      tool.schema.shape,
      async (args) => {
        try {
          const result = await tool.handler(apiClient, args as Record<string, unknown>);
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
  // Register authenticated tools
  registerTools(authenticatedTools);
} else {
  // Register stubs for authenticated tools that return a descriptive error
  for (const [name, tool] of Object.entries(authenticatedTools)) {
    server.tool(
      name,
      tool.description,
      tool.schema.shape,
      async () => ({
        content: [
          {
            type: 'text' as const,
            text: 'Esta operación requiere autenticación. Configura SERVICIALO_API_KEY y SERVICIALO_ORG_ID para operar en nombre de una organización.',
          },
        ],
        isError: true,
      }),
    );
  }
}

// --- Connect via stdio ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
