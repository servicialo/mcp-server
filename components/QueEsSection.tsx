import { SectionTitle } from "./SectionTitle";

const comparisons = [
  {
    title: "Producto",
    emoji: "\u{1F4E6}",
    traits: [
      "Se almacena",
      "Se revende",
      "Se devuelve",
      "Se envía",
      "Existe sin el creador",
    ],
    highlight: false,
  },
  {
    title: "Servicio",
    emoji: "\u{26A1}",
    traits: [
      "Se consume al entregarse",
      "Cada instancia es única",
      "Requiere presencia",
      "Se verifica, no se rastrea",
      "Existe solo en el momento",
    ],
    highlight: true,
  },
  {
    title: "Experiencia",
    emoji: "\u{2728}",
    traits: [
      "Se diseña para ser memorable",
      "Involucra los sentidos",
      "Genera conexión emocional",
      "Viajes, gastronomía, eventos",
      "Todo servicio puede serlo",
    ],
    highlight: false,
  },
];

export function QueEsSection() {
  return (
    <section id="que-es" className="mb-16">
      <SectionTitle
        tag="01 — Definición"
        title="¿Qué es un servicio?"
        subtitle="Antes de crear uno, hay que entender qué es realmente."
      />

      {/* Definición — blockquote */}
      <blockquote className="border-l-[3px] border-l-accent pl-4 md:pl-6 py-1 mb-6">
        <p className="font-serif text-xl md:text-2xl text-text leading-[1.5]">
          Un servicio es una promesa de transformación entregada en un momento y
          lugar específico.
        </p>
      </blockquote>

      {/* Explicación */}
      <p className="text-sm md:text-[15px] text-text-body leading-[1.8] mb-8 md:mb-10">
        A diferencia de un producto, un servicio no se puede almacenar,
        revender ni devolver. Se consume en el momento en que se entrega. Eso
        lo hace fundamentalmente diferente — y es por eso que necesita su
        propio estándar.
      </p>

      {/* Comparación 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
