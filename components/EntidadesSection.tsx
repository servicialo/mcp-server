import { SectionTitle } from "./SectionTitle";

const axes = [
  {
    icon: "\u{1F3AF}",
    label: "Alcance",
    title: "Qué se entrega",
    desc: "Qué servicios están autorizados, cuántos, de qué tipo. Puede ser episódico (12 sesiones), por horas (40h de consultoría) o permanente (contrato de retención mensual).",
  },
  {
    icon: "\u{1F4B0}",
    label: "Precio",
    title: "Cómo se valora",
    desc: "El modelo de tarificación: monto fijo, tiempo y materiales, tarifa por nivel profesional, o mixto. La moneda y las tarifas se definen una vez.",
  },
  {
    icon: "\u{1F4C5}",
    label: "Esquema de pagos",
    title: "Cuándo se mueve el dinero",
    desc: "Anticipado, por hitos, periódico, contra entrega, o un esquema personalizado con cuotas y disparadores definidos.",
  },
];

const examples = [
  {
    vertical: "Salud",
    icon: "\u{1F3E5}",
    title: "Plan de kinesiología",
    order: "12 sesiones de kinesiología",
    pricing: "Precio fijo por sesión",
    schedule: "Pago por sesión, cliente gestiona reembolso ISAPRE",
    borderColor: "border-l-[#7EC8E3]",
  },
  {
    vertical: "Consultoría",
    icon: "\u{1F4BC}",
    title: "Contrato por horas",
    order: "40 horas de asesoría legal",
    pricing: "Tiempo y materiales con tarifa por nivel",
    schedule: "Pago mensual según horas consumidas",
    borderColor: "border-l-[#E5C07B]",
  },
  {
    vertical: "Proyectos",
    icon: "\u{1F3D7}\u{FE0F}",
    title: "Due diligence en 3 fases",
    order: "Alcance definido por hitos",
    pricing: "Monto fijo por fase",
    schedule: "Pago por hito aprobado",
    borderColor: "border-l-[#C678DD]",
  },
];

// Syntax highlighting colors (matching EstandarSection)
const k = "text-[#7EC8E3]";  // keys — celeste
const t = "text-[#E5C07B]";  // types — amarillo suave
const c = "text-[#5C6370] hidden md:inline";  // comments — gris, ocultos en mobile
const a = "text-accent";      // section keys — accent
const h = "text-[#5C6370]";  // header comments — siempre visibles

function Line({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function HierarchyBlock() {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      <Line><span className={h}># Las dos entidades del protocolo</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={a}>Organización</span></Line>
      <Line><span className="text-white/40">└──</span> <span className={a}>Orden de Servicio</span> <span className={c}># opcional — acuerdo comercial</span></Line>
      <Line>    <span className="text-white/40">├──</span> <span className={k}>alcance:</span> <span className={t}>qué servicios, cuántos, de qué tipo</span></Line>
      <Line>    <span className="text-white/40">├──</span> <span className={k}>precio:</span> <span className={t}>cómo se calcula el valor</span></Line>
      <Line>    <span className="text-white/40">├──</span> <span className={k}>esquema_de_pagos:</span> <span className={t}>cuándo se mueve el dinero</span></Line>
      <Line>    <span className="text-white/40">└──</span> <span className={a}>Servicios</span> <span className={c}># unidades atómicas de entrega</span></Line>
      <Line>        <span className="text-white/40">└──</span> <span className={t}>8 dimensiones cada uno</span></Line>
    </pre>
  );
}

function LedgerBlock() {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      <Line><span className={h}># Libro mayor — calculado desde Servicios verificados</span></Line>
      <Line><span className={h}># Nunca se edita manualmente</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={a}>ledger:</span>                          <span className={c}># solo lectura</span></Line>
      <Line>  <span className={k}>servicios_verificados:</span> <span className={t}>entero</span>   <span className={c}># servicios en estado Verificado</span></Line>
      <Line>  <span className={k}>horas_consumidas:</span> <span className={t}>número</span>       <span className={c}># total horas verificadas</span></Line>
      <Line>  <span className={k}>monto_consumido:</span> <span className={t}>número</span>        <span className={c}># valor consumido a tarifa</span></Line>
      <Line>  <span className={k}>monto_facturado:</span> <span className={t}>número</span>        <span className={c}># total facturado a la fecha</span></Line>
      <Line>  <span className={k}>monto_cobrado:</span> <span className={t}>número</span>          <span className={c}># total pagos recibidos</span></Line>
      <Line>  <span className={k}>monto_restante:</span> <span className={t}>número</span>         <span className={c}># alcance no consumido aún</span></Line>
    </pre>
  );
}

export function EntidadesSection() {
  return (
    <section id="entidades" className="mb-16">
      <SectionTitle
        tag="04 — Las dos entidades"
        title="Servicio y Orden de Servicio"
        subtitle="El protocolo se construye sobre dos objetos y su relación."
      />

      {/* Block 1: Concepto + jerarquía */}
      <blockquote className="border-l-[3px] border-l-accent pl-4 md:pl-6 py-1 mb-6">
        <p className="font-serif text-xl md:text-2xl text-text leading-[1.5]">
          El Servicio es la unidad atómica de entrega. La Orden de Servicio es
          el acuerdo comercial que agrupa servicios bajo un alcance, un precio y
          un esquema de pagos.
        </p>
      </blockquote>

      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-4">
          Jerarquía
        </div>
        <HierarchyBlock />
        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="text-[12px] text-white/40 leading-[1.7]">
            Cuando un Servicio pertenece a una Orden, su dimensión{" "}
            <span className="text-white/55">cobro</span> es{" "}
            <span className="text-white/55">informativa</span> — registra el
            valor económico de la sesión individual, pero{" "}
            <span className="text-white/55">no genera factura</span>. La
            facturación es responsabilidad exclusiva de la Orden, que la
            dispara según su propio esquema de pagos.
          </div>
        </div>
      </div>

      {/* Block 2: Tres ejes de una Orden */}
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
        Los tres ejes de una Orden
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {axes.map((ax) => (
          <div
            key={ax.label}
            className="bg-surface rounded-[14px] py-[22px] px-6 border border-border text-center transition-shadow duration-200 hover:shadow-sm"
          >
            <span className="text-[28px]">{ax.icon}</span>
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mt-2 mb-1.5">
              {ax.label}
            </div>
            <div className="font-serif text-lg text-text mb-2">
              {ax.title}
            </div>
            <div className="text-[13px] text-text-muted leading-relaxed">
              {ax.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Block 3: Ledger */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-1">
          Libro mayor computado
        </div>
        <div className="font-mono text-[10px] text-white/40 mb-4">
          El estado financiero de la Orden se calcula automáticamente desde los servicios verificados
        </div>
        <LedgerBlock />
      </div>

      {/* Block 4: Ejemplos cross-vertical */}
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
        Un objeto, múltiples verticales
      </div>
      <p className="text-sm text-text-muted mb-4 max-w-[560px]">
        La misma estructura de Orden de Servicio funciona para una autorización
        médica, un contrato de consultoría o un proyecto por hitos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {examples.map((ex) => (
          <div
            key={ex.vertical}
            className={`bg-surface rounded-xl py-4 px-5 border border-border-light border-l-[3px] transition-shadow duration-200 hover:shadow-sm ${ex.borderColor}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{ex.icon}</span>
              <div className="font-mono text-[10px] text-text-muted uppercase tracking-[0.08em]">
                {ex.vertical}
              </div>
            </div>
            <div className="font-mono text-[13px] font-semibold text-text mb-2">
              {ex.title}
            </div>
            <div className="text-[12px] text-text-body leading-relaxed space-y-1">
              <div><span className="text-text-muted">Alcance:</span> {ex.order}</div>
              <div><span className="text-text-muted">Precio:</span> {ex.pricing}</div>
              <div><span className="text-text-muted">Pagos:</span> {ex.schedule}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
