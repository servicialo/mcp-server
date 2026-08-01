import { SectionTitle } from "./SectionTitle";
import { DarkCard } from "./DarkCard";
import { Line, Pre, K, T, C, A, H, TREE } from "./CodeBlock";

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
    title: "Auditoría previa en 3 fases",
    order: "Alcance definido por hitos",
    pricing: "Monto fijo por fase",
    schedule: "Pago por hito aprobado",
    borderColor: "border-l-[#C678DD]",
  },
];

function ObjectsBlock() {
  return (
    <Pre>
      <Line><span className={H}># Los objetos que estandariza el protocolo</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={A}>Service Offer</span>          <span className={C}># lo ofrecido — catálogo de la organización</span></Line>
      <Line><span className={A}>Service Order</span>          <span className={C}># lo acordado — alcance, partes, precio, políticas</span></Line>
      <Line><span className={TREE}>└──</span> <span className={A}>Service Delivery</span>   <span className={C}># la instancia atómica ejecutada — 8 dimensiones</span></Line>
      <Line>    <span className={TREE}>├──</span> <span className={K}>evidence_events:</span> <span className={T}>evidencia[]</span>  <span className={C}># confirmaciones, firmas, timestamps</span></Line>
      <Line>    <span className={TREE}>└──</span> <span className={K}>settlement_events:</span> <span className={T}>cobro[]</span>  <span className={C}># factura, pago, devolución, conciliación</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={A}>Proof of Service</span>       <span className={C}># expediente que vincula lo anterior — extensión draft</span></Line>
    </Pre>
  );
}

function LedgerBlock() {
  return (
    <Pre>
      <Line><span className={H}># Libro mayor — proyección calculada, no un saldo editable</span></Line>
      <Line><span className={H}># entregas + términos comerciales + eventos de liquidación</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={A}>ledger:</span>                          <span className={C}># solo lectura</span></Line>
      <Line>  <span className={K}>servicios_verificados:</span> <span className={T}>entero</span>   <span className={C}># entregas en estado Verificado</span></Line>
      <Line>  <span className={K}>horas_consumidas:</span> <span className={T}>número</span>       <span className={C}># consumo derivado de las entregas</span></Line>
      <Line>  <span className={K}>monto_consumido:</span> <span className={T}>número</span>        <span className={C}># consumo valorizado a tarifa</span></Line>
      <Line>  <span className={K}>monto_facturado:</span> <span className={T}>número</span>        <span className={C}># según términos comerciales de la Orden</span></Line>
      <Line>  <span className={K}>monto_cobrado:</span> <span className={T}>número</span>          <span className={C}># eventos de liquidación: pagos recibidos</span></Line>
      <Line>  <span className={K}>monto_restante:</span> <span className={T}>número</span>         <span className={C}># alcance no consumido aún</span></Line>
    </Pre>
  );
}

export function ObjetosSection() {
  return (
    <section id="objetos" className="mb-16">
      {/* Anchor de compatibilidad con la IA anterior */}
      <span id="entidades" className="block scroll-mt-20" aria-hidden="true" />
      <SectionTitle
        tag="03 — Objetos"
        title="Qué estandariza el protocolo"
        subtitle="Objetos y eventos legibles por máquinas: la oferta, el acuerdo, la entrega, la evidencia y la liquidación — y el expediente que los vincula."
      />

      <blockquote className="border-l-[3px] border-l-accent pl-4 md:pl-6 py-1 mb-6">
        <p className="font-serif text-xl md:text-2xl text-text leading-[1.5]">
          La Service Delivery es la instancia atómica ejecutada. La Orden de
          Servicio es el acuerdo que agrupa entregas bajo un alcance, un
          precio y un esquema de pagos.
        </p>
      </blockquote>

      <DarkCard label="Objetos canónicos" className="mb-4">
        <ObjectsBlock />
        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="text-[12px] text-white/40 leading-[1.7]">
            <span className="text-white/55">Service Order</span> y{" "}
            <span className="text-white/55">Evidence</span> tienen JSON Schema
            publicado en el repositorio;{" "}
            <span className="text-white/55">Service Offer</span>,{" "}
            <span className="text-white/55">Settlement</span> y{" "}
            <span className="text-white/55">Proof of Service</span> se expresan
            hoy a través del catálogo, la dimensión de cobro y una extensión en
            borrador, respectivamente. En el wire format actual, la Service
            Delivery se representa con el objeto{" "}
            <span className="text-white/55">Service</span> — el nombre se
            conserva por compatibilidad. “Servicio” a secas es el término
            general del dominio, no un cuarto objeto. Cuando una entrega
            pertenece a una Orden, su dimensión{" "}
            <span className="text-white/55">cobro</span> es informativa — la
            facturación es responsabilidad exclusiva de la Orden, según su
            propio esquema de pagos.
          </div>
        </div>
      </DarkCard>

      {/* Tres ejes de una Orden */}
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
            <div className="font-serif text-lg text-text mb-2">{ax.title}</div>
            <div className="text-[13px] text-text-muted leading-relaxed">
              {ax.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Ledger */}
      <DarkCard label="Libro mayor computado" className="mb-4">
        <div className="font-mono text-[10px] text-white/40 -mt-2 mb-4">
          El ledger de la Orden se deriva de las entregas, los términos
          comerciales y los eventos de liquidación asociados — un prepago
          puede existir antes de cualquier entrega acreditada
        </div>
        <LedgerBlock />
      </DarkCard>

      {/* Ejemplos cross-vertical */}
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
