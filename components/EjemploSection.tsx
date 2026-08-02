import { SectionTitle } from "./SectionTitle";

// Un solo ejemplo de punta a punta, mapeado a los cinco elementos del
// protocolo. La vertical salud coincide con la implementación de referencia.
const STEPS = [
  {
    element: "Oferta",
    text: "Un centro publica “Sesión de kinesiología — 45 minutos”. Una persona, o su agente, descubre el servicio y consulta disponibilidad.",
  },
  {
    element: "Acuerdo",
    text: "Se agenda una hora. Quedan registrados el precio, la política de cancelación y quién paga — que no siempre es quien recibe.",
  },
  {
    element: "Entrega",
    text: "El profesional ejecuta la sesión. La entrega queda registrada con su propio estado, independiente del pago.",
  },
  {
    element: "Evidencia",
    text: "Según la política acordada, los sistemas registran confirmaciones, marcas de tiempo, documentación o atestaciones: evidencia asociada a esa entrega, no una declaración suelta.",
  },
  {
    element: "Liquidación",
    text: "El cobro queda vinculado a la entrega. Puede ocurrir antes (prepago), después (facturación mensual) o no existir (servicio sin costo).",
  },
];

export function EjemploSection() {
  return (
    <section id="ejemplo" className="mb-16 md:mb-24">
      <SectionTitle
        tag="03 — Un ejemplo"
        title="Una sesión de kinesiología, de punta a punta"
        subtitle="El mismo recorrido aplica a cualquier servicio profesional programado."
      />

      <ol className="relative list-none ml-1 md:ml-2 border-l border-border">
        {STEPS.map((step, i) => (
          <li key={step.element} className="relative pl-6 md:pl-9 pb-7 last:pb-1">
            <span
              aria-hidden
              className="absolute left-0 top-[6px] -translate-x-1/2 w-[7px] h-[7px] bg-text"
            />
            <div className="font-mono text-[11px] mb-1.5">
              <span className="text-text-dim tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-semibold text-text ml-2.5 uppercase tracking-[0.08em]">
                {step.element}
              </span>
            </div>
            <p className="font-serif text-[15px] md:text-[16px] text-text-body leading-[1.7] max-w-[580px]">
              {step.text}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-6 font-serif text-[15px] text-text-muted leading-[1.7]">
        La misma estructura cubre una orden de 12 sesiones, un contrato por
        horas o un proyecto por hitos —{" "}
        <a
          href="/spec#states"
          className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
        >
          estados y ciclo de vida en la especificación
        </a>
        .
      </p>
    </section>
  );
}
