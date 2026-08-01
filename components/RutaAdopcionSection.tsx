import { SectionTitle } from "./SectionTitle";
import { ADOPTION_PATH } from "@/lib/data";

export function RutaAdopcionSection() {
  return (
    <section id="ruta-adopcion" className="mb-16">
      <SectionTitle
        tag="Ruta de adopción"
        title="El valor no espera al pagador"
        subtitle="No esperamos a que el pagador adopte el estándar. Cada parte captura valor por su cuenta, en este orden."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ADOPTION_PATH.map((step) => (
          <div
            key={step.step}
            className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border"
          >
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
              {step.step} · {step.actor}
            </div>
            <div className="font-serif text-lg text-text mb-2.5 leading-[1.3]">
              {step.title}
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7]">
              {step.desc}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-surface rounded-[14px] py-4 px-4 md:py-5 md:px-6 border border-border">
        <div className="text-[13px] text-text-muted leading-[1.7]">
          <span className="font-semibold text-text">
            El costo alto es sistémico:
          </span>{" "}
          errores, rechazos, duplicidades, sobrecodificación y prestaciones
          difíciles de verificar. Quien paga absorbe la pérdida; el prestador
          legítimo cobra tarde, atrapado en la misma fila de sospecha. El
          enemigo es la ausencia de evidencia estructurada — no una de las
          partes.
        </div>
      </div>
    </section>
  );
}
