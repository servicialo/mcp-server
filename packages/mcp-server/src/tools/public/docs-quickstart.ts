import { z } from 'zod';
import type { ServicialoAdapter } from '../../adapter.js';

export const docsQuickstartTools = {
  'docs.quickstart': {
    description:
      'Get the complete 5-step onboarding guide as structured JSON data. ' +
      'Use this when helping a new organization join the Servicialo network — ' +
      'covers installation, signup, credentials, MCP client config, and publishing. ' +
      'Do NOT use for searching services (use registry.search) or checking availability (use scheduling.check_availability). ' +
      'Returns step-by-step instructions, config templates, and links. No parameters required.',
    schema: z.object({}),
    handler: async (_client: ServicialoAdapter, _args: Record<string, never>) => {
      return {
        steps: [
          {
            step: 1,
            title: 'Instalar el servidor MCP',
            action: 'npx -y @servicialo/mcp-server',
            note: 'Modo descubrimiento — 15 herramientas públicas, sin credenciales',
          },
          {
            step: 2,
            title: 'Crear tu organización',
            action: 'Signup en coordinalo.com/signup',
            url: 'https://coordinalo.com/signup',
          },
          {
            step: 3,
            title: 'Obtener credenciales MCP',
            action:
              'En Coordinalo: Settings → Servicialo → Generar credenciales MCP',
            credentials: ['SERVICIALO_ORG_ID', 'SERVICIALO_API_KEY'],
          },
          {
            step: 4,
            title: 'Configurar el cliente MCP',
            config: {
              mcpServers: {
                servicialo: {
                  command: 'npx',
                  args: ['-y', '@servicialo/mcp-server'],
                  env: {
                    SERVICIALO_API_KEY: '<tu_api_key>',
                    SERVICIALO_ORG_ID: '<tu_org_slug>',
                  },
                },
              },
            },
          },
          {
            step: 5,
            title: 'Publicar en la red Servicialo',
            action: 'En Coordinalo: Settings → Servicialo → Publicar',
            result:
              'Tu org aparece en servicialo.com/network y es descubrible por otros agentes',
          },
        ],
        tools: {
          public: [
            { name: 'resolve.lookup', description: 'Resolve orgSlug to endpoints and trust level' },
            { name: 'resolve.search', description: 'Search organizations by country and vertical' },
            { name: 'trust.get_score', description: 'Get organization trust score (0-100)' },
            { name: 'registry.search', description: 'Search organizations by vertical, location, country' },
            { name: 'registry.get_organization', description: 'Get public organization details' },
            { name: 'registry.manifest', description: 'Get node manifest (protocol version, endpoints) — CORE required' },
            { name: 'services.list', description: 'List catalog of services for an organization (CORE required)' },
            { name: 'scheduling.check_availability', description: 'Query availability (provider ∧ client ∧ resource) — CORE required' },
            { name: 'a2a.get_agent_card', description: 'Get A2A Agent Card for inter-agent discovery' },
            { name: 'docs.quickstart', description: 'Get this getting-started guide as structured data' },
            { name: 'registry.list_verticals', description: 'List the network-wide vertical taxonomy' },
            { name: 'registry.list_regions', description: 'List the network-wide region taxonomy' },
            { name: 'registry.list_event_types', description: 'List the network-wide event-type taxonomy' },
            { name: 'market.list_segments', description: 'List benchmark segments (network intelligence)' },
            { name: 'market.get_benchmark', description: 'Get an aggregate benchmark for a segment' },
          ],
          authenticated: [
            { name: 'service.get', description: 'Get 8 dimensions of a service' },
            { name: 'contract.get', description: 'Get contract terms (evidence, cancellation, dispute)' },
            { name: 'clients.get_or_create', description: 'Resolve or create client identity' },
            { name: 'scheduling.book', description: 'Create new session → requested state (CORE required)' },
            { name: 'scheduling.confirm', description: 'Confirm booked session → confirmed. Convenience — expressible via lifecycle.transition' },
            { name: 'lifecycle.get_state', description: 'Get current state, transitions, and history' },
            { name: 'lifecycle.transition', description: 'Execute state transition with evidence (CORE required). Canonical enum, except this tool still accepts delivered/charged for completed/invoiced — known divergence, see protocol/manifest.yaml' },
            { name: 'scheduling.reschedule', description: 'Reschedule to new date/time' },
            { name: 'scheduling.cancel', description: 'Cancel with cancellation policy applied' },
            { name: 'delivery.checkin', description: 'Check-in with GPS + timestamp → in_progress. Convenience — expressible via lifecycle.transition + record_evidence' },
            { name: 'delivery.checkout', description: 'Check-out with GPS + timestamp → delivered (reference vocabulary; canonical is completed). Convenience — expressible via lifecycle.transition + record_evidence' },
            { name: 'delivery.record_evidence', description: 'Record evidence (gps, signature, photo, document, duration, notes) — CORE required' },
            { name: 'documentation.create', description: 'Generate service record → documented state' },
            { name: 'payments.create_sale', description: 'Create a settlement object linked to a delivery. Settlement is decoupled from the lifecycle — creating a sale does not normatively advance the session' },
            { name: 'payments.record_payment', description: 'Record payment against sale' },
            { name: 'payments.get_status', description: 'Get payment status (sale or account)' },
            { name: 'resource.list', description: 'List physical resources (rooms, equipment)' },
            { name: 'resource.get', description: 'Get resource details with availability slots' },
            { name: 'resource.create', description: 'Create new physical resource' },
            { name: 'resource.update', description: 'Update resource (patch semantics)' },
            { name: 'resource.delete', description: 'Soft-delete resource' },
            { name: 'resource.get_availability', description: 'Query resource availability by date range' },
            { name: 'resolve.register', description: 'Register organization in global resolver' },
            { name: 'resolve.update_endpoint', description: 'Update endpoints (portability operation)' },
            { name: 'telemetry.heartbeat', description: 'Send heartbeat to resolver with metrics' },
          ],
        },
        links: {
          network: 'https://servicialo.com/network',
          signup: 'https://coordinalo.com/signup',
          npm: 'https://npmjs.com/package/@servicialo/mcp-server',
          spec: 'https://servicialo.com',
        },
      };
    },
  },
};
