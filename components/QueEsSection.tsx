import { SectionTitle } from "./SectionTitle";

const comparisons = [
  {
    title: "Producto",
    emoji: "\u{1F4E6}",
    traits: [
      "Tiene inventario",
      "Se despacha y rastrea",
      "Se devuelve si falla",
      "Prueba de entrega = firma de recepción",
      "Pagador = receptor",
    ],
    highlight: false,
  },
  {
    title: "Servicio",
    emoji: "\u{26A1}",
    traits: [
      "Sin inventario — se agenda",
      "Se confirma y se ejecuta en sitio",
      "No se devuelve — se resuelve o compensa",
      "Prueba de entrega = evidencia verificable",
      "Pagador ≠ cliente frecuentemente",
    ],
    highlight: true,
  },
];

export function QueEsSection() {
  return (
    <section id="que-es" className="mb-16">
      <SectionTitle
        tag="01 — Qué es"
        title="¿Qué es Servicialo?"
        subtitle="Un protocolo de dominio: define qué significa coordinar un servicio, con independencia de la plataforma o el transporte."
      />

      {/* Definición canónica — blockquote */}
      <blockquote className="border-l-[3px] border-l-accent pl-4 md:pl-6 py-1 mb-6">
        <p className="font-serif text-xl md:text-2xl text-text leading-[1.5]">
          Servicialo es el protocolo abierto de dominio para coordinar
          servicios. Define objetos y eventos legibles por máquinas para que
          plataformas, personas y agentes puedan publicar una oferta,
          establecer una Orden de Servicio, coordinar una entrega, registrar
          evidencia de lo ocurrido y conectar esa entrega con su facturación y
          liquidación.
        </p>
      </blockquote>

      <p className="text-sm md:text-[15px] text-text-body leading-[1.8] mb-4">
        El protocolo separa explícitamente <strong>lo acordado</strong>,{" "}
        <strong>lo entregado</strong>, <strong>la evidencia disponible</strong>{" "}
        y <strong>los movimientos financieros</strong>. Cada elemento conserva
        su propio ciclo de vida. Una Prueba de Servicio es el expediente
        verificable que vincula esos elementos: no reemplaza el juicio sobre la
        calidad ni declara automáticamente la verdad del mundo — registra las
        afirmaciones, evidencias, atestaciones y niveles de certeza asociados a
        una entrega.
      </p>
      <p className="text-sm md:text-[15px] text-text-body leading-[1.8] mb-8 md:mb-10">
        Coordinar un servicio es <strong>establecer el compromiso, facilitar
        su ejecución y registrar qué ocurrió</strong> — y tener un protocolo
        claro cuando algo falla. Servicialo es independiente del transporte:
        puede exponerse mediante HTTP, MCP, A2A u otros bindings compatibles.{" "}
        <a href="https://coordinalo.com" className="text-accent hover:underline">
          Coordínalo
        </a>{" "}
        es la implementación de referencia del protocolo — no el protocolo.
      </p>

      {/* Comparación 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {comparisons.map((col) => (
          <div
            key={col.title}
            className={`rounded-xl p-5 border transition-shadow duration-200 hover:shadow-sm ${
              col.highlight
                ? "bg-accent-soft border-accent/20"
                : "bg-surface border-border"
            }`}
          >
            <div className="text-2xl mb-2">{col.emoji}</div>
            <div className="font-mono text-[13px] font-semibold text-text mb-3">
              {col.title}
            </div>
            {col.traits.map((t) => (
              <div key={t} className="text-[13px] text-text-body leading-8">
                <span
                  className={`mr-2 ${
                    col.highlight ? "text-accent" : "text-text-dim"
                  }`}
                >
                  —
                </span>
                {t}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
