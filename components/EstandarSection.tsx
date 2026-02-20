import { SectionTitle } from "./SectionTitle";

const cards = [
  {
    title: "Implementadores",
    desc: "Implementa el estándar en tu plataforma. La especificación completa está disponible en GitHub. Para certificación, escríbenos a hola@grupodigitalo.com.",
    icon: "\u{1F528}",
    label: "Construir",
    link: "https://github.com/danioni/servicialo",
    linkText: "Ver especificación en GitHub",
  },
  {
    title: "Proveedores",
    desc: "Ofrece servicios en un formato que agentes AI entienden y pueden coordinar.",
    icon: "\u{1F3AF}",
    label: "Ofrecer",
  },
  {
    title: "Agentes AI",
    desc: "Descubre, agenda y verifica servicios con un protocolo estandarizado.",
    icon: "\u{1F916}",
    label: "Conectar",
  },
];

// Syntax highlighting colors
const k = "text-[#7EC8E3]";  // keys — celeste
const t = "text-[#E5C07B]";  // types — amarillo suave
const c = "text-[#5C6370] hidden md:inline";  // comments — gris, ocultos en mobile
const a = "text-accent";      // section keys — accent

function Line({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function SchemaBlock() {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      <Line><span className={a}>service:</span></Line>
      <Line>  <span className={k}>id:</span> <span className={t}>string</span>                  <span className={c}># Identificador único</span></Line>
      <Line>  <span className={k}>type:</span> <span className={t}>string</span>                <span className={c}># Categoría del servicio</span></Line>
      <Line>  <span className={k}>vertical:</span> <span className={t}>string</span>            <span className={c}># salud | legal | hogar | educación | ...</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>provider:</span></Line>
      <Line>    <span className={k}>id:</span> <span className={t}>string</span></Line>
      <Line>    <span className={k}>credentials:</span> <span className={t}>string[]</span>     <span className={c}># Certificaciones requeridas</span></Line>
      <Line>    <span className={k}>trust_score:</span> <span className={t}>number</span>       <span className={c}># 0-100 calculado por historial</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>client:</span></Line>
      <Line>    <span className={k}>id:</span> <span className={t}>string</span></Line>
      <Line>    <span className={k}>payer_id:</span> <span className={t}>string</span>          <span className={c}># Puede diferir del cliente</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>scheduling:</span></Line>
      <Line>    <span className={k}>requested_at:</span> <span className={t}>datetime</span></Line>
      <Line>    <span className={k}>scheduled_for:</span> <span className={t}>datetime</span></Line>
      <Line>    <span className={k}>duration_expected:</span> <span className={t}>minutes</span></Line>
      <Line>    <span className={k}>location:</span> <span className={t}>physical | virtual</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>lifecycle:</span></Line>
      <Line>    <span className={k}>current_state:</span> <span className={t}>enum[9]</span>    <span className={c}># Los 9 estados universales</span></Line>
      <Line>    <span className={k}>transitions:</span> <span className={t}>transition[]</span> <span className={c}># Historial de cambios</span></Line>
      <Line>    <span className={k}>exceptions:</span> <span className={t}>exception[]</span>   <span className={c}># Inasistencias, disputas, etc</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>delivery_proof:</span></Line>
      <Line>    <span className={k}>checkin:</span> <span className={t}>datetime</span></Line>
      <Line>    <span className={k}>checkout:</span> <span className={t}>datetime</span></Line>
      <Line>    <span className={k}>duration_actual:</span> <span className={t}>minutes</span></Line>
      <Line>    <span className={k}>evidence:</span> <span className={t}>evidence[]</span>      <span className={c}># GPS, firma, fotos, documentos</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>documentation:</span></Line>
      <Line>    <span className={k}>record_type:</span> <span className={t}>string</span>       <span className={c}># Ficha clínica, minuta, reporte</span></Line>
      <Line>    <span className={k}>generated_at:</span> <span className={t}>datetime</span></Line>
      <Line>    <span className={k}>signed_by:</span> <span className={t}>string[]</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>billing:</span></Line>
      <Line>    <span className={k}>amount:</span> <span className={t}>money</span></Line>
      <Line>    <span className={k}>payer:</span> <span className={t}>reference</span></Line>
      <Line>    <span className={k}>status:</span> <span className={t}>pending | billed | paid | disputed</span></Line>
      <Line>    <span className={k}>tax_document:</span> <span className={t}>reference</span></Line>
    </pre>
  );
}

export function EstandarSection() {
  return (
    <section id="estandar" className="mb-16">
      <SectionTitle
        tag="06 — El estándar"
        title="Protocolo de Entrega de Servicios"
        subtitle="Cualquiera puede implementarlo."
      />

      {/* Schema block */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-4">
          Protocolo de Entrega de Servicios v0.1
        </div>
        <SchemaBlock />
      </div>

      {/* Audience cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-surface rounded-[14px] py-[22px] px-6 border border-border text-center transition-shadow duration-200 hover:shadow-sm"
          >
            <span className="text-[28px]">{card.icon}</span>
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mt-2 mb-1.5">
              {card.label}
            </div>
            <div className="font-serif text-lg text-text mb-2">
              {card.title}
            </div>
            <div className="text-[13px] text-text-muted leading-relaxed">
              {card.desc}
            </div>
            {"link" in card && card.link && (
              <a
                href={card.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 font-mono text-[11px] text-accent hover:text-text transition-colors"
              >
                {card.linkText} &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
