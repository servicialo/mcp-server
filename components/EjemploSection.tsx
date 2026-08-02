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
    <section id="ejemplo" className="mb-16">
      <SectionTitle
        tag="03 — Un ejemplo"
        title="Una sesión de kinesiología, de punta a punta"
        subtitle="El mismo recorrido aplica a cualquier servicio profesional programado."
      />

      <ol className="flex flex-col gap-2 list-none">
        {STEPS.map((step, i) => (
          <li
            key={step.element}
            className="bg-surface rounded-[14px] py-4 px-4 md:px-6 border border-border flex items-start gap-4"
          >
            <div className="shrink-0 w-16 md:w-24">
              <div className="font-mono text-[10px] text-text-dim mb-0.5">
                {i + 1}
              </div>
              <div className="font-mono text-[11px] font-semibold text-accent leading-tight">
                {step.element}
              </div>
            </div>
            <div className="text-[13px] md:text-sm text-text-body leading-[1.7]">
              {step.text}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-[13px] text-text-muted leading-[1.7]">
        La misma estructura cubre una orden de 12 sesiones, un contrato por
        horas o un proyecto por hitos —{" "}
        <a href="/spec#states" className="text-accent hover:underline">
          estados y ciclo de vida en la especificación
        </a>
        .
      </p>
    </section>
  );
}
