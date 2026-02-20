#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CoordinaloClient } from './client.js';
import { schedulingTools } from './tools/scheduling.js';
import { clientsTools } from './tools/clients.js';
import { paymentsTools } from './tools/payments.js';
import { notificationsTools } from './tools/notifications.js';
import type { z } from 'zod';

// --- Validate env vars ---
const API_KEY = process.env.SERVICIALO_API_KEY;
const ORG_ID = process.env.SERVICIALO_ORG_ID;
const BASE_URL = process.env.SERVICIALO_BASE_URL || 'https://coordinalo.com';

if (!API_KEY) {
  console.error('Error: SERVICIALO_API_KEY is required. Set it as an environment variable.');
  process.exit(1);
}

if (!ORG_ID) {
  console.error('Error: SERVICIALO_ORG_ID is required. Set it as an environment variable.');
  process.exit(1);
}

// --- Init client ---
const apiClient = new CoordinaloClient({
  baseUrl: BASE_URL,
  apiKey: API_KEY,
  orgId: ORG_ID,
});

// --- Init MCP server ---
const server = new McpServer({
  name: 'servicialo',
  version: '0.1.0',
});

// --- Register all tools ---
type ToolDef = {
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (client: CoordinaloClient, args: any) => Promise<unknown>;
};

const allTools: Record<string, ToolDef> = {
  ...schedulingTools as unknown as Record<string, ToolDef>,
  ...clientsTools as unknown as Record<string, ToolDef>,
  ...paymentsTools as unknown as Record<string, ToolDef>,
  ...notificationsTools as unknown as Record<string, ToolDef>,
};

for (const [name, tool] of Object.entries(allTools)) {
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

// --- Connect via stdio ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
