import { SectionTitle } from "./SectionTitle";

const cards = [
  {
    title: "Implementadores",
    desc: "Implementa el estándar en tu plataforma. La especificación y el programa de certificación están en GitHub.",
    icon: "\u{1F528}",
    label: "Construir",
    link: "https://github.com/servicialo/mcp-server",
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
const h = "text-[#5C6370]";  // header comments — siempre visibles

function Line({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function SchemaBlock() {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      <Line><span className={h}># ── SERVICIALO v0.2 ──────────────────</span></Line>
      <Line><span className={h}># Las 8 dimensiones de un servicio</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={a}>servicio:</span></Line>
      <Line>  <span className={k}>id:</span> <span className={t}>texto</span>                   <span className={c}># Identificador único</span></Line>
      <Line>  <span className={k}>tipo:</span> <span className={t}>texto</span>                 <span className={c}># Categoría del servicio</span></Line>
      <Line>  <span className={k}>vertical:</span> <span className={t}>texto</span>             <span className={c}># salud | legal | hogar | educación | ...</span></Line>
      <Line>  <span className={k}>nombre:</span> <span className={t}>texto</span>               <span className={c}># Nombre legible</span></Line>
      <Line>  <span className={k}>duración_minutos:</span> <span className={t}>entero</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>proveedor:</span></Line>
      <Line>    <span className={k}>id:</span> <span className={t}>texto</span></Line>
      <Line>    <span className={k}>credenciales:</span> <span className={t}>texto[]</span>     <span className={c}># Certificaciones requeridas</span></Line>
      <Line>    <span className={k}>puntaje_confianza:</span> <span className={t}>número</span> <span className={c}># 0-100 calculado por historial</span></Line>
      <Line>    <span className={k}>organización_id:</span> <span className={t}>texto</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>cliente:</span>                             <span className={c}># Quién recibe el servicio</span></Line>
      <Line>    <span className={k}>id:</span> <span className={t}>texto</span></Line>
      <Line>    <span className={k}>pagador_id:</span> <span className={t}>texto</span>         <span className={c}># Puede diferir del cliente</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>agenda:</span></Line>
      <Line>    <span className={k}>solicitado_en:</span> <span className={t}>fecha_hora</span></Line>
      <Line>    <span className={k}>agendado_para:</span> <span className={t}>fecha_hora</span></Line>
      <Line>    <span className={k}>duración_esperada:</span> <span className={t}>minutos</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>ubicación:</span></Line>
      <Line>    <span className={k}>tipo:</span> <span className={t}>presencial | virtual | domicilio</span></Line>
      <Line>    <span className={k}>dirección:</span> <span className={t}>texto</span></Line>
      <Line>    <span className={k}>sala:</span> <span className={t}>texto</span></Line>
      <Line>    <span className={a}>coordenadas:</span></Line>
      <Line>      <span className={k}>lat:</span> <span className={t}>número</span></Line>
      <Line>      <span className={k}>lng:</span> <span className={t}>número</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>ciclo_de_vida:</span></Line>
      <Line>    <span className={k}>estado_actual:</span> <span className={t}>enum[8]</span>    <span className={c}># Los 8 estados universales</span></Line>
      <Line>    <span className={k}>transiciones:</span> <span className={t}>transición[]</span></Line>
      <Line>    <span className={k}>excepciones:</span> <span className={t}>excepción[]</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>prueba_de_entrega:</span></Line>
      <Line>    <span className={k}>entrada:</span> <span className={t}>fecha_hora</span></Line>
      <Line>    <span className={k}>salida:</span> <span className={t}>fecha_hora</span></Line>
      <Line>    <span className={k}>duración_real:</span> <span className={t}>minutos</span></Line>
      <Line>    <span className={k}>evidencia:</span> <span className={t}>evidencia[]</span>    <span className={c}># GPS, firma, fotos, documentos</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>cobro:</span></Line>
      <Line>    <span className={a}>monto:</span></Line>
      <Line>      <span className={k}>valor:</span> <span className={t}>número</span></Line>
      <Line>      <span className={k}>moneda:</span> <span className={t}>texto</span>           <span className={c}># ISO 4217</span></Line>
      <Line>    <span className={k}>pagador:</span> <span className={t}>referencia</span>       <span className={c}># Puede diferir del cliente</span></Line>
      <Line>    <span className={k}>estado:</span> <span className={t}>pendiente | cobrado | facturado | pagado | disputado</span></Line>
      <Line>    <span className={k}>cobrado_en:</span> <span className={t}>fecha_hora</span>    <span className={c}># 1:1 con estado Cobrado del ciclo</span></Line>
      <Line>    <span className={k}>pago_id:</span> <span className={t}>referencia</span>       <span className={c}># Paquete prepago o pago directo</span></Line>
      <Line>    <span className={k}>documento_tributario:</span> <span className={t}>ref</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={h}># ── MÓDULO: Servicialo/Finanzas (en diseño) ──</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>distribución:</span>                    <span className={c}># Servicialo/Finanzas</span></Line>
      <Line>    <span className={a}>profesional:</span></Line>
      <Line>      <span className={k}>tipo:</span> <span className={t}>porcentaje | monto_fijo | mixto</span></Line>
      <Line>      <span className={k}>valor:</span> <span className={t}>número</span></Line>
      <Line>      <span className={k}>liquidación:</span> <span className={t}>por_sesión | mensual</span></Line>
      <Line>    <span className={a}>organización:</span></Line>
      <Line>      <span className={k}>tipo:</span> <span className={t}>porcentaje | monto_fijo</span></Line>
      <Line>      <span className={k}>valor:</span> <span className={t}>número</span></Line>
      <Line>    <span className={a}>infraestructura:</span></Line>
      <Line>      <span className={k}>tipo:</span> <span className={t}>monto_fijo | porcentaje</span></Line>
      <Line>      <span className={k}>valor:</span> <span className={t}>número</span></Line>
      <Line>      <span className={k}>concepto:</span> <span className={t}>box | equipamiento | sala</span></Line>
      <Line>&nbsp;</Line>
      <Line><span className={h}># ── MÓDULO: Servicialo/Disputas (en diseño) ──</span></Line>
      <Line>&nbsp;</Line>
      <Line>  <span className={a}>resolución:</span>                      <span className={c}># Servicialo/Disputas</span></Line>
      <Line>    <span className={k}>estado:</span> <span className={t}>ninguna | en_revisión | en_arbitraje | resuelta</span></Line>
      <Line>    <span className={k}>evidencia_evaluada:</span> <span className={t}>evaluación[]</span></Line>
      <Line>    <span className={k}>resultado:</span> <span className={t}>a_favor_proveedor | a_favor_cliente | ambiguo</span></Line>
      <Line>    <span className={a}>arbitraje:</span></Line>
      <Line>      <span className={k}>árbitros:</span> <span className={t}>referencia[]</span></Line>
      <Line>      <span className={k}>votos:</span> <span className={t}>voto[]</span></Line>
      <Line>    <span className={k}>resolución_final:</span> <span className={t}>referencia</span></Line>
      <Line>    <span className={k}>resuelta_en:</span> <span className={t}>fecha_hora</span></Line>
    </pre>
  );
}

export function EstandarSection() {
  return (
    <section id="estandar" className="mb-16">
      <SectionTitle
        tag="09 — El estándar"
        title="Protocolo de Entrega de Servicios"
        subtitle="Cualquiera puede implementarlo."
      />

      {/* Schema block */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-4">
          Protocolo de Entrega de Servicios v0.2
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
