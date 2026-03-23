import { SectionTitle } from "./SectionTitle";
import { GENESIS_SKILLS, REST_ENDPOINTS } from "@/lib/data";

const publicTools = [
  { tool: "registry.search", desc: "Buscar organizaciones por vertical y ubicación" },
  { tool: "registry.get_organization", desc: "Detalle público de una organización" },
  { tool: "scheduling.check_availability", desc: "Consultar horarios disponibles" },
  { tool: "services.list", desc: "Catálogo público de servicios" },
];

const authenticatedTools = [
  { tool: "service.get", desc: "8 dimensiones del servicio" },
  { tool: "contract.get", desc: "Contrato pre-acordado" },
  { tool: "clients.get_or_create", desc: "Buscar o crear cliente" },
  { tool: "scheduling.book", desc: "Agendar → Solicitado" },
  { tool: "scheduling.confirm", desc: "Confirmar → Confirmado" },
  { tool: "lifecycle.get_state", desc: "Estado + transiciones" },
  { tool: "lifecycle.transition", desc: "Ejecutar transición" },
  { tool: "scheduling.reschedule", desc: "Reagendar (excepción)" },
  { tool: "scheduling.cancel", desc: "Cancelar con política" },
  { tool: "delivery.checkin", desc: "Registro entrada → En Curso" },
  { tool: "delivery.checkout", desc: "Registro salida → Entregado" },
  { tool: "delivery.record_evidence", desc: "Evidencia por vertical" },
  { tool: "documentation.create", desc: "Registro del servicio" },
  { tool: "payments.create_sale", desc: "Crear venta/cargo" },
  { tool: "payments.record_payment", desc: "Registrar pago" },
  { tool: "payments.get_status", desc: "Estado de pago" },
  { tool: "mandates.list", desc: "Listar mandatos del principal" },
  { tool: "mandates.get", desc: "Detalle de un mandato" },
  { tool: "mandates.suspend", desc: "Suspender mandato activo" },
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

function MethodBadge({ method }: { method: string }) {
  const color = method === "GET" ? "text-[#98C379] bg-[#98C379]/10" : "text-[#E5C07B] bg-[#E5C07B]/10";
  return (
    <span className={`font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded ${color} shrink-0`}>
      {method}
    </span>
  );
}

const endpointGroups = Object.values(REST_ENDPOINTS);
const totalEndpoints = endpointGroups.reduce((sum, g) => sum + g.endpoints.length, 0);

export function ConectateSection() {
  return (
    <section id="mcp-server" className="mb-16">
      <SectionTitle
        tag="12 — Servidor MCP"
        title="Hecho para agentes"
        subtitle="Servicialo expone sus herramientas como un servidor MCP, permitiendo que agentes de IA descubran y coordinen servicios profesionales de forma nativa."
      />

      {/* Intro block */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border mb-4">
        <div className="text-[13px] text-text-body leading-relaxed mb-3">
          Un implementador que adopta Servicialo obtiene un asistente IA completo gratis.
          No solo booking — gestión completa del ciclo de vida del servicio: agendar, gestionar,
          pagar y verificar. Todo desde el primer día.
        </div>
        <div className="text-[13px] text-text-dim leading-relaxed">
          El skill <span className="text-text-body font-medium">Génesis</span> es la prueba:
          5 habilidades que cubren el 100% de lo que un cliente necesita hacer con sus citas.
        </div>
      </div>

      {/* Genesis Skills — 5 capabilities */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-3">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-1">
          Génesis — 5 habilidades
        </div>
        <div className="font-mono text-[10px] text-white/40 mb-5">
          Lo que un agente IA puede hacer con cualquier implementación compatible
        </div>

        <div className="grid gap-3">
          {GENESIS_SKILLS.map((skill) => (
            <div key={skill.num} className="flex items-start gap-3">
              <div
                className={`shrink-0 w-6 h-6 rounded-full ${skill.bg} flex items-center justify-center`}
              >
                <span className={`font-mono text-[11px] font-semibold ${skill.color}`}>
                  {skill.num}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`font-mono text-[11px] font-semibold ${skill.color}`}>
                    {skill.label}
                  </span>
                  <span className="font-mono text-[10px] text-white/35">
                    {skill.desc}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-white/50 mt-0.5 leading-relaxed">
                  {skill.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="text-[12px] text-white/40 leading-[1.7]">
            Flujo completo:{" "}
            <span className="text-white/55">
              Descubrir &rarr; Agendar &rarr; Gestionar &rarr; Pagar &rarr; Verificar.
            </span>{" "}
            Cualquier agente puede completar el ciclo completo con cualquier implementación compatible.
          </div>
        </div>
      </div>

      {/* REST API Endpoints — 17 endpoints */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-3">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-1">
          API REST pública
        </div>
        <div className="font-mono text-[10px] text-white/40 mb-5">
          {totalEndpoints} endpoints — 0 requieren autenticación
        </div>

        <div className="grid gap-4">
          {endpointGroups.map((group) => (
            <div key={group.label}>
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-wider mb-2">
                {group.label}
              </div>
              <div className="grid gap-1.5">
                {group.endpoints.map((ep) => (
                  <div key={ep.path + ep.method} className="flex items-baseline gap-2">
                    <MethodBadge method={ep.method} />
                    <span className="font-mono text-[10px] md:text-[11px] text-white/60 shrink-0">
                      {ep.path}
                    </span>
                    <span className="font-mono text-[10px] text-white/30 leading-relaxed hidden md:inline">
                      {ep.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
          Con credenciales — 23 herramientas totales
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
          Coordinalo es la implementación de referencia en producción.
          El segundo nodo es una oportunidad abierta.
        </div>
        <a
          href="https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTORS.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-mono text-[11px] text-accent hover:text-text transition-colors"
        >
          Guía para implementadores &rarr;
        </a>
      </div>
    </section>
  );
}
