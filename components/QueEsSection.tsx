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
        tag="01 — Definición"
        title="¿Qué significa coordinar un servicio?"
        subtitle="Agendar, confirmar, verificar, resolver excepciones, cobrar."
      />

      {/* Definición — blockquote */}
      <blockquote className="border-l-[3px] border-l-accent pl-4 md:pl-6 py-1 mb-6">
        <p className="font-serif text-xl md:text-2xl text-text leading-[1.5]">
          Coordinar un servicio es garantizar que lo prometido ocurra
          — y tener un protocolo claro cuando no ocurre.
        </p>
      </blockquote>

      {/* Explicación */}
      <p className="text-sm md:text-[15px] text-text-body leading-[1.8] mb-8 md:mb-10">
        Un servicio no se almacena, no se devuelve y no deja rastro
        automático de que ocurrió. Coordinar implica cubrir ese vacío:
        agendar la cita, confirmar asistencia, registrar evidencia de
        entrega, resolver lo que falla y cerrar el cobro. Es un problema
        operacional — y necesita un estándar operacional.
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
