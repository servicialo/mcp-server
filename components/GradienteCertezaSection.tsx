import { SectionTitle } from "./SectionTitle";
import { CERTAINTY_LEVELS } from "@/lib/data";

export function GradienteCertezaSection() {
  return (
    <section id="gradiente-certeza" className="mb-16">
      <SectionTitle
        tag="Gradiente de certeza"
        title="Cuánto vale una Prueba de Servicio"
        subtitle="La Prueba de Servicio no es binaria: es una gradiente de cuatro niveles acumulativos. El pagador define el nivel de certeza que exige para priorizar, auditar o liquidar una prestación."
      />

      <div className="bg-surface rounded-xl py-4 px-5 border-l-[3px] border-l-accent mb-6">
        <div className="font-serif text-lg md:text-[20px] text-text leading-[1.4]">
          La Prueba de Servicio es el vínculo verificable entre lo entregado y
          lo liquidado.
        </div>
        <div className="text-[13px] text-text-muted leading-[1.7] mt-2.5">
          Las redes de pago no procesan compras: poseen el vínculo confiable
          entre quien autoriza y quien liquida, con disputa y garantía encima.
          Servicialo ocupa el rol análogo en la mitad del problema que esas
          redes no cubren — la entrega. Hoy el pagador liquida contra una
          declaración. Con Servicialo, liquida contra una Prueba de Servicio
          del nivel de certeza que él mismo defina.
        </div>
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
          Regla de honestidad
        </div>
        <div className="text-sm text-text-body leading-[1.8]">
          La Prueba de Servicio nunca se muestra desnuda. Cualquier componente
          que la represente muestra a la vez su nivel (L1–L4) y su estado
          (Verificando o Acreditable). No es una convención de estilo: es una
          restricción de diseño del estándar. Un componente que permite mostrar
          la prueba sin su nivel está mal hecho.
        </div>
      </div>

      <div className="mt-4 text-[12px] text-text-muted leading-[1.7]">
        En la especificación, a la Prueba de Servicio técnicamente la llamamos
        el Nexo: el objeto que enlaza la prestación entregada con su
        liquidación. En el esquema, su instancia es el campo{" "}
        <code className="font-mono text-[11px] bg-surface-alt px-1.5 py-0.5 rounded">
          prueba_de_entrega
        </code>
        .
      </div>
    </section>
  );
}
