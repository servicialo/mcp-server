import { SectionTitle } from "./SectionTitle";
import { MaturityBadge } from "./MaturityBadge";
import { CERTAINTY_LEVELS } from "@/lib/data";

export function PruebaSection() {
  return (
    <section id="prueba-de-servicio" className="mb-16">
      {/* Anchor de compatibilidad con la IA anterior */}
      <span id="gradiente-certeza" className="block scroll-mt-20" aria-hidden="true" />
      <SectionTitle
        tag="05 — Prueba de Servicio"
        title="El expediente verificable"
        subtitle="Una Prueba de Servicio vincula lo acordado, lo entregado, la evidencia disponible y la situación de liquidación de una entrega."
      />

      <div className="bg-surface rounded-xl py-4 px-5 border-l-[3px] border-l-accent mb-6">
        <div className="font-serif text-lg md:text-[20px] text-text leading-[1.4]">
          La Prueba de Servicio no declara mágicamente la verdad del mundo ni
          garantiza por sí sola la calidad del resultado.
        </div>
        <div className="text-[13px] text-text-muted leading-[1.7] mt-2.5">
          Registra afirmaciones, evidencia, atestaciones y niveles de certeza.
          Puede acreditar la entrega aunque el pago ocurra después — la
          liquidación está vinculada al expediente, pero no determina la
          existencia de la entrega. Hoy el pagador liquida contra una
          declaración; con Servicialo, liquida contra un expediente del nivel
          de certeza que él mismo defina.
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em]">
          Gradiente de certeza
        </div>
        <MaturityBadge maturity="draft" />
      </div>

      <div className="flex flex-col gap-2.5">
        {CERTAINTY_LEVELS.map((l) => (
          <div
            key={l.level}
            className="bg-surface rounded-[14px] py-4 px-4 md:px-6 border border-border"
          >
            <div className="flex items-center gap-3.5">
              <div className="font-mono text-[12px] font-semibold text-accent w-8 shrink-0">
                {l.level}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-base md:text-lg text-text leading-[1.3]">
                  {l.name}
                </div>
                <div className="text-[13px] text-text-muted leading-[1.7] mt-1">
                  {l.desc}
                </div>
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full shrink-0 ${
                  l.estado === "Acreditable"
                    ? "bg-green/15 text-green"
                    : "bg-surface-alt text-text-dim"
                }`}
              >
                {l.estado}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-surface rounded-xl py-4 px-4 md:py-5 md:px-6 border border-border">
        <div className="font-mono text-[11px] text-text-muted font-semibold uppercase tracking-[0.08em] mb-3">
          Regla de presentación
        </div>
        <div className="text-sm text-text-body leading-[1.8]">
          La Prueba de Servicio nunca se muestra desnuda. Cualquier componente
          que la represente muestra a la vez su nivel (L1–L4) y su estado
          (Verificando o Acreditable). Mostrar la prueba sin su nivel
          tergiversa el expediente.
        </div>
      </div>

      <div className="mt-4 text-[12px] text-text-muted leading-[1.7]">
        La Prueba de Servicio está especificada como{" "}
        <a
          href="/extensions#proof-of-service"
          className="text-accent hover:underline"
        >
          extensión en borrador
        </a>{" "}
        — todavía no existe como objeto wire del Core; todo lo que el
        expediente vincula ya es derivable de los objetos actuales del
        protocolo.
      </div>
    </section>
  );
}
