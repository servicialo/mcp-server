import { SectionTitle } from "./SectionTitle";
import { DarkCard } from "./DarkCard";
import { GENESIS_SKILLS, OWN_HTTP_SURFACE } from "@/lib/data";
import { MANIFEST, TOOL_COUNTS, toolsByTier } from "@/lib/manifest";

// Descripciones ES por tool. Los nombres y counts vienen del manifest;
// esto es solo prosa de apoyo (una tool sin entrada muestra su perfil).
const TOOL_DESC: Record<string, string> = {
  "resolve.lookup": "Resolver orgSlug → endpoint + confianza",
  "resolve.search": "Buscar en el resolver global",
  "trust.get_score": "Puntaje de confianza (0–100)",
  "registry.search": "Buscar organizaciones por vertical y ubicación",
  "registry.get_organization": "Detalle público de una organización",
  "registry.manifest": "Manifest del servidor: capacidades y versión",
  "registry.list_verticals": "Verticales presentes en el registry",
  "registry.list_regions": "Regiones presentes en el registry",
  "registry.list_event_types": "Catálogo de tipos de evento de telemetría",
  "services.list": "Catálogo público de servicios",
  "scheduling.check_availability": "Consultar horarios disponibles",
  "a2a.get_agent_card": "Agent Card A2A para descubrimiento entre agentes",
  "docs.quickstart": "Quickstart legible por máquinas",
  "market.list_segments": "Segmentos de benchmark con tamaño de muestra",
  "market.get_benchmark": "Benchmarks agregados (k-anonimato ≥ 5)",
  "service.get": "8 dimensiones del servicio",
  "contract.get": "Contrato pre-acordado",
  "clients.get_or_create": "Buscar o crear cliente",
  "scheduling.book": "Agendar → Solicitado",
  "scheduling.confirm": "Confirmar → Confirmado",
  "lifecycle.get_state": "Estado + transiciones",
  "lifecycle.transition": "Ejecutar transición",
  "scheduling.reschedule": "Reagendar (excepción)",
  "scheduling.cancel": "Cancelar con política",
  "delivery.checkin": "Registro entrada → En Curso",
  "delivery.checkout": "Registro salida → completado",
  "delivery.record_evidence": "Evidencia por vertical",
  "documentation.create": "Registro del servicio → Documentado",
  "payments.create_sale": "Crear venta/cargo",
  "payments.record_payment": "Registrar pago",
  "payments.get_status": "Estado de pago",
  "resource.list": "Listar recursos físicos",
  "resource.get": "Detalle de recurso + disponibilidad",
  "resource.create": "Crear recurso",
  "resource.update": "Actualizar recurso",
  "resource.delete": "Desactivar recurso",
  "resource.get_availability": "Disponibilidad por rango de fechas",
  "resolve.register": "Alta en el resolver global",
  "resolve.update_endpoint": "Portabilidad de endpoints",
  "telemetry.heartbeat": "Heartbeat del nodo",
};

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

export function AgentesSection() {
  const publicTools = toolsByTier("public");
  const authenticatedTools = toolsByTier("authenticated");
  const reference = MANIFEST.implementations.find((i) => i.role === "reference");

  return (
    <section id="mcp-server" className="mb-16">
      {/* Anchor nuevo de la IA */}
      <span id="agentes" className="block scroll-mt-20" aria-hidden="true" />
      <SectionTitle
        tag="08 — Bindings y agentes"
        title="Cómo lo usan plataformas y agentes"
        subtitle="Servicialo es independiente del transporte: puede exponerse mediante HTTP, MCP, A2A u otros bindings compatibles. El servidor MCP y el perfil HTTP son bindings de los mismos perfiles de capacidades — no el protocolo."
      />

      {/* Intro block */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border mb-4">
        <div className="text-[13px] text-text-body leading-relaxed mb-3">
          La implementación de referencia expone el protocolo como servidor MCP
          (con transporte stdio y Streamable HTTP) y como perfil HTTP REST. Un
          agente que habla Servicialo puede descubrir, agendar, verificar
          entrega y consultar cobros sin redefinir la semántica del servicio
          para cada plataforma.
        </div>
        <div className="text-[13px] text-text-dim leading-relaxed">
          El skill <span className="text-text-body font-medium">Génesis</span>:
          cinco habilidades cubren el ciclo básico de coordinación de citas en
          la implementación de referencia.
        </div>
      </div>

      {/* Genesis Skills */}
      <DarkCard label="Génesis — 5 habilidades" className="mb-3">
        <div className="font-mono text-[10px] text-white/40 -mt-2 mb-5">
          Lo que un agente IA puede hacer hoy con la implementación de referencia
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
            </span>
          </div>
        </div>
      </DarkCard>

      {/* HTTP surface (real, propia) */}
      <DarkCard label="Superficie HTTP de servicialo.com" className="mb-3">
        <div className="font-mono text-[10px] text-white/40 -mt-2 mb-5">
          Resolver + descubrimiento. El protocolo no prescribe rutas HTTP — el
          binding normativo es spec/HTTP_PROFILE.md
        </div>

        <div className="grid gap-1.5">
          {OWN_HTTP_SURFACE.map((ep) => (
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

        <div className="mt-5 pt-5 border-t border-white/10">
          <a
            href="https://github.com/servicialo/mcp-server/blob/main/spec/HTTP_PROFILE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-white/40 hover:text-white/70 transition-colors"
          >
            Perfil HTTP normativo (spec/HTTP_PROFILE.md) &rarr;
          </a>
        </div>
      </DarkCard>

      {/* Discovery mode */}
      <DarkCard label="Modo descubrimiento" className="mb-3">
        <div className="font-mono text-[10px] text-white/40 -mt-2 mb-4">
          Sin credenciales — {TOOL_COUNTS.public} herramientas públicas
        </div>
        <DiscoveryBlock />
        <div className="mt-5 pt-5 border-t border-white/10 grid gap-1.5">
          {publicTools.map((t) => (
            <ToolRow key={t.name} tool={t.name} desc={TOOL_DESC[t.name] ?? t.profile} />
          ))}
        </div>
      </DarkCard>

      {/* Authenticated mode */}
      <DarkCard className="mb-4">
        <div className="flex items-center justify-between mb-1 -mt-1">
          <div className="font-mono text-[10px] font-semibold text-accent uppercase tracking-[0.12em]">
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
          Con credenciales — {TOOL_COUNTS.total} herramientas totales
        </div>
        <AuthenticatedBlock />
        <div className="mt-3 font-mono text-[10px] text-white/35 leading-relaxed">
          Las credenciales las obtiene cada organización desde la plataforma
          Servicialo-compatible que utilice.
        </div>
        <div className="mt-5 pt-5 border-t border-white/10 grid gap-1.5">
          {authenticatedTools.map((t) => (
            <ToolRow key={t.name} tool={t.name} desc={TOOL_DESC[t.name] ?? t.profile} />
          ))}
        </div>
      </DarkCard>

      {/* Compatible implementations */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border text-center">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mb-2">
          Implementaciones
        </div>
        <div className="text-[13px] text-text-muted leading-relaxed mb-3">
          Coordinalo es la implementación de referencia del protocolo — no el
          protocolo mismo. Es el primer despliegue en producción, en operación
          desde {reference?.since ?? "2026"}. El segundo nodo es una
          oportunidad abierta.
        </div>
        <a
          href="/implementors"
          className="inline-block font-mono text-[11px] text-accent hover:text-text transition-colors"
        >
          Implementadores y proceso de verificación &rarr;
        </a>
      </div>
    </section>
  );
}
