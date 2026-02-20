import { SectionTitle } from "./SectionTitle";

const steps = [
  {
    icon: "\u{1F4E6}",
    label: "Instalar",
    title: "Un comando",
    desc: "npx descarga y ejecuta el servidor MCP. Sin configuraciones complejas.",
  },
  {
    icon: "\u{1F511}",
    label: "Configurar",
    title: "Dos variables",
    desc: "Obtén tu API key y org ID desde digitalo.app. Eso es todo lo que necesitas.",
  },
  {
    icon: "\u{1F916}",
    label: "Conectar",
    title: "19 herramientas",
    desc: "Agendamiento, clientes, pagos, profesionales y nóminas. Listas para tu agente AI.",
  },
];

const tools = [
  { group: "scheduling", items: ["check_availability", "list_sessions", "book", "reschedule", "cancel"] },
  { group: "clients", items: ["list", "get", "create", "history"] },
  { group: "payments", items: ["list_sales", "create_sale", "record_payment", "client_balance"] },
  { group: "providers", items: ["list", "get", "get_commission"] },
  { group: "payroll", items: ["calculate", "history", "settlement_detail", "vacations", "request_vacation"] },
  { group: "notifications", items: ["session_reminder", "payment_reminder"] },
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

function ToolsList() {
  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-3">
        19 Tools disponibles
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tools.map((group) => (
          <div key={group.group}>
            <div className="font-mono text-[11px] text-white/60 mb-1">{group.group}</div>
            {group.items.map((item) => (
              <div key={item} className="font-mono text-[10px] md:text-[11px] text-white/40 leading-relaxed">
                .{item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConectateSection() {
  return (
    <section id="conectate" className="mb-16">
      <SectionTitle
        tag="07 — Conéctate"
        title="MCP Server"
        subtitle="Conecta tu agente AI al protocolo Servicialo en 30 segundos."
      />

      {/* Config block */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em]">
            @servicialo/mcp-server
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
        <ConfigBlock />
        <ToolsList />
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className="bg-surface rounded-[14px] py-[22px] px-6 border border-border text-center transition-shadow duration-200 hover:shadow-sm"
          >
            <span className="text-[28px]">{step.icon}</span>
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mt-2 mb-1.5">
              {step.label}
            </div>
            <div className="font-serif text-lg text-text mb-2">
              {step.title}
            </div>
            <div className="text-[13px] text-text-muted leading-relaxed">
              {step.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
