import { SectionTitle } from "./SectionTitle";

const toolTable = [
  { tool: "scheduling.check_availability", desc: "Consultar horarios disponibles" },
  { tool: "scheduling.book", desc: "Agendar una sesión" },
  { tool: "scheduling.reschedule", desc: "Reagendar sesión existente" },
  { tool: "scheduling.cancel", desc: "Cancelar sesión" },
  { tool: "clients.list", desc: "Listar clientes de la organización" },
  { tool: "clients.get", desc: "Obtener detalle de un cliente" },
  { tool: "clients.create", desc: "Crear nuevo cliente" },
  { tool: "payments.get_balance", desc: "Consultar saldo de un cliente" },
  { tool: "payments.charge", desc: "Registrar cobro" },
  { tool: "payments.record", desc: "Registrar pago recibido" },
  { tool: "notifications.send", desc: "Enviar notificación por WhatsApp o email" },
];

// Syntax highlighting colors (matching EstandarSection)
const k = "text-[#7EC8E3]";
const s = "text-[#98C379]";
const c = "text-[#5C6370]";

function ConfigBlock() {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      <div><span className={c}>{"// claude_desktop_config.json"}</span></div>
      <div>{"{"}</div>
      <div>  <span className={k}>&quot;mcpServers&quot;</span>: {"{"}</div>
      <div>    <span className={k}>&quot;servicialo&quot;</span>: {"{"}</div>
      <div>      <span className={k}>&quot;command&quot;</span>: <span className={s}>&quot;npx&quot;</span>,</div>
      <div>      <span className={k}>&quot;args&quot;</span>: [<span className={s}>&quot;-y&quot;</span>, <span className={s}>&quot;@servicialo/mcp-server&quot;</span>],</div>
      <div>      <span className={k}>&quot;env&quot;</span>: {"{"}</div>
      <div>        <span className={k}>&quot;SERVICIALO_API_KEY&quot;</span>: <span className={s}>&quot;tu_api_key&quot;</span>,</div>
      <div>        <span className={k}>&quot;SERVICIALO_ORG_ID&quot;</span>:  <span className={s}>&quot;tu_org_id&quot;</span></div>
      <div>      {"}"}</div>
      <div>    {"}"}</div>
      <div>  {"}"}</div>
      <div>{"}"}</div>
    </pre>
  );
}

function ToolsTable() {
  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-3">
        Herramientas disponibles
      </div>
      <div className="grid gap-1">
        {toolTable.map((row) => (
          <div key={row.tool} className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] md:text-[11px] text-white/60 shrink-0">
              {row.tool}
            </span>
            <span className="font-mono text-[10px] md:text-[11px] text-white/35 leading-relaxed">
              {row.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConectateSection() {
  return (
    <section id="mcp-server" className="mb-16">
      <SectionTitle
        tag="07 — Servidor MCP"
        title="AI-native por diseño"
        subtitle="Servicialo expone sus herramientas como un servidor MCP, permitiendo que agentes de IA descubran y coordinen servicios profesionales de forma nativa."
      />

      {/* Intro block */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border mb-4">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mb-2">
          Namespace
        </div>
        <div className="font-mono text-[13px] text-text mb-4">
          com.servicialo/professional-services
        </div>
        <div className="text-[13px] text-text-muted leading-relaxed mb-3">
          Para developers que construyen AI agents que necesitan interactuar con
          organizaciones de servicios profesionales: agendar citas, consultar
          disponibilidad, gestionar clientes.
        </div>
        <div className="text-[13px] text-text-dim leading-relaxed">
          No es para usuarios finales de plataformas Servicialo-compatible — esas
          plataformas gestionan la conexión internamente.
        </div>
      </div>

      {/* Config + tools block */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em]">
            Configuración
          </div>
          <a
            href="https://www.npmjs.com/package/@servicialo/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-white/40 hover:text-white/70 transition-colors"
          >
            npm &rarr;
          </a>
        </div>
        <div className="font-mono text-[10px] text-white/40 mb-4">
          npm install -g @servicialo/mcp-server
        </div>
        <ConfigBlock />
        <div className="mt-4 font-mono text-[10px] text-white/35 leading-relaxed">
          Las credenciales las obtiene cada organización desde la plataforma
          Servicialo-compatible que utilice.
        </div>
        <ToolsTable />
      </div>

      {/* Compatible implementations */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border text-center">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mb-2">
          Implementaciones compatibles
        </div>
        <div className="text-[13px] text-text-muted leading-relaxed mb-3">
          Cualquier plataforma que implemente la especificación Servicialo puede
          conectarse a este servidor MCP.
        </div>
        <a
          href="https://github.com/danioni/servicialo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-mono text-[11px] text-accent hover:text-text transition-colors"
        >
          Ver lista en GitHub &rarr;
        </a>
      </div>
    </section>
  );
}
