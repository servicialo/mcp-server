import { SectionTitle } from "./SectionTitle";

const publicTools = [
  { tool: "registry.search", desc: "Buscar organizaciones por vertical y ubicación" },
  { tool: "registry.get_organization", desc: "Detalle público de una organización" },
  { tool: "scheduling.check_availability", desc: "Consultar horarios disponibles" },
  { tool: "services.list", desc: "Catálogo público de servicios" },
];

const authenticatedTools = [
  { tool: "service.get", desc: "9 dimensiones del servicio" },
  { tool: "contract.get", desc: "Contrato pre-acordado" },
  { tool: "clients.get_or_create", desc: "Buscar o crear cliente" },
  { tool: "scheduling.book", desc: "Agendar → Solicitado" },
  { tool: "scheduling.confirm", desc: "Confirmar → Confirmado" },
  { tool: "lifecycle.get_state", desc: "Estado + transiciones" },
  { tool: "lifecycle.transition", desc: "Ejecutar transición" },
  { tool: "scheduling.reschedule", desc: "Reagendar (excepción)" },
  { tool: "scheduling.cancel", desc: "Cancelar con política" },
  { tool: "delivery.checkin", desc: "Check-in → En Curso" },
  { tool: "delivery.checkout", desc: "Check-out → Completado" },
  { tool: "delivery.record_evidence", desc: "Evidencia por vertical" },
  { tool: "documentation.create", desc: "Registro del servicio" },
  { tool: "payments.create_sale", desc: "Crear venta/cargo" },
  { tool: "payments.record_payment", desc: "Registrar pago" },
  { tool: "payments.get_status", desc: "Estado de pago" },
];

const agentPhases = [
  {
    num: "1",
    label: "Descubrimiento",
    desc: "Qué hay disponible",
    tools: "registry.* · check_availability · services.list",
    color: "text-[#7EC8E3]",
    bg: "bg-[#7EC8E3]/10",
  },
  {
    num: "2",
    label: "Entender",
    desc: "Dimensiones y reglas del servicio",
    tools: "service.get · contract.get",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    num: "3",
    label: "Comprometer",
    desc: "Identidad del cliente y booking",
    tools: "clients.get_or_create · scheduling.book · confirm",
    color: "text-[#98C379]",
    bg: "bg-[#98C379]/10",
  },
  {
    num: "4",
    label: "Ciclo de vida",
    desc: "Estado y transiciones",
    tools: "lifecycle.get_state · transition · reschedule · cancel",
    color: "text-[#E5C07B]",
    bg: "bg-[#E5C07B]/10",
  },
  {
    num: "5",
    label: "Verificar entrega",
    desc: "Evidencia de que ocurrió",
    tools: "delivery.checkin · checkout · record_evidence",
    color: "text-[#C678DD]",
    bg: "bg-[#C678DD]/10",
  },
  {
    num: "6",
    label: "Cerrar",
    desc: "Documentación y cobro",
    tools: "documentation.create · payments.*",
    color: "text-[#E06C75]",
    bg: "bg-[#E06C75]/10",
  },
];

// Syntax highlighting colors (matching EstandarSection)
const k = "text-[#7EC8E3]";
const s = "text-[#98C379]";
const c = "text-[#5C6370]";

function DiscoveryBlock() {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      <div><span className={c}>{"// Sin credenciales — modo descubrimiento"}</span></div>
      <div><span className={s}>npx -y @servicialo/mcp-server</span></div>
    </pre>
  );
}

function AuthenticatedBlock() {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      <div><span className={c}>{"// Configuración en Claude Desktop"}</span></div>
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

function ToolRow({ tool, desc }: { tool: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] md:text-[11px] text-white/60 shrink-0">
        {tool}
      </span>
      <span className="font-mono text-[10px] md:text-[11px] text-white/35 leading-relaxed">
        {desc}
      </span>
    </div>
  );
}

export function ConectateSection() {
  return (
    <section id="mcp-server" className="mb-16">
      <SectionTitle
        tag="11 — Servidor MCP"
        title="Hecho para agentes"
        subtitle="Servicialo expone sus herramientas como un servidor MCP, permitiendo que agentes de IA descubran y coordinen servicios profesionales de forma nativa."
      />

      {/* Intro block */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border mb-4">
        <div className="text-[13px] text-text-body leading-relaxed mb-3">
          Diseñado para developers que construyen agentes AI sobre negocios de servicios
          profesionales en LATAM. Si tu agente necesita agendar, verificar entrega o cobrar
          un servicio — sin importar la plataforma — este es el protocolo.
        </div>
        <div className="text-[13px] text-text-dim leading-relaxed">
          No es para usuarios finales de plataformas Servicialo-compatible — esas
          plataformas gestionan la conexión internamente.
        </div>
      </div>

      {/* Agent flow — 6 lifecycle phases */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-3">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-1">
          Flujo del agente
        </div>
        <div className="font-mono text-[10px] text-white/40 mb-5">
          Seis fases del ciclo de vida del servicio — 20 herramientas
        </div>

        <div className="grid gap-2.5">
          {agentPhases.map((phase) => (
            <div key={phase.num} className="flex items-start gap-3">
              <div
                className={`shrink-0 w-6 h-6 rounded-full ${phase.bg} flex items-center justify-center`}
              >
                <span className={`font-mono text-[11px] font-semibold ${phase.color}`}>
                  {phase.num}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-[11px] font-semibold ${phase.color}`}>
                    {phase.label}
                  </span>
                  <span className="font-mono text-[10px] text-white/35">
                    {phase.desc}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-white/50 mt-0.5">
                  {phase.tools}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="text-[12px] text-white/40 leading-[1.7]">
            Un agente bien diseñado sigue este orden:{" "}
            <span className="text-white/55">
              Descubrir &rarr; Entender &rarr; Comprometer &rarr; Gestionar &rarr; Verificar &rarr; Cerrar.
            </span>{" "}
            Cada fase tiene sus tools. El estándar garantiza que cualquier agente pueda
            completar el ciclo completo con cualquier implementación compatible.
          </div>
        </div>
      </div>

      {/* Discovery mode */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-3">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-1">
          Modo descubrimiento
        </div>
        <div className="font-mono text-[10px] text-white/40 mb-4">
          Sin credenciales — 4 herramientas públicas
        </div>
        <DiscoveryBlock />
        <div className="mt-5 pt-5 border-t border-white/10 grid gap-1.5">
          {publicTools.map((t) => (
            <ToolRow key={t.tool} tool={t.tool} desc={t.desc} />
          ))}
        </div>
      </div>

      {/* Authenticated mode */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em]">
            Modo autenticado
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
          Con credenciales — 20 herramientas totales
        </div>
        <AuthenticatedBlock />
        <div className="mt-3 font-mono text-[10px] text-white/35 leading-relaxed">
          Las credenciales las obtiene cada organización desde la plataforma
          Servicialo-compatible que utilice.
        </div>
        <div className="mt-5 pt-5 border-t border-white/10 grid gap-1.5">
          {authenticatedTools.map((t) => (
            <ToolRow key={t.tool} tool={t.tool} desc={t.desc} />
          ))}
        </div>
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
          href="https://github.com/servicialo/mcp-server"
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
