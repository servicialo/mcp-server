import { SectionTitle } from "./SectionTitle";
import { MaturityBadge } from "./MaturityBadge";
import { CERTAINTY_LEVELS, DOSSIER_STATES, SETTLEMENT_STATES } from "@/lib/data";

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
          El nivel de certeza describe qué evidencia respalda una entrega. La
          acreditación indica si esa evidencia satisface una política
          determinada. La liquidación registra los movimientos financieros
          relacionados.
        </div>
        <div className="text-[13px] text-text-muted leading-[1.7] mt-2.5">
          Son dimensiones conectadas, pero independientes. Una entrega puede
          acreditarse antes del pago, sin pago o sin conciliación financiera,
          si satisface la política de evidencia aplicable. Hoy el pagador
          liquida contra una declaración; con Servicialo, liquida contra un
          expediente del nivel de certeza que él mismo defina.
        </div>
      </div>

      {/* Dimensión A — Nivel de certeza */}
      <div className="flex items-center gap-2 mb-3">
        <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em]">
          A · Nivel de certeza — qué evidencia existe
        </div>
        <MaturityBadge maturity="draft" />
      </div>

      <div className="flex flex-col gap-2.5 mb-3">
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
                  <span className="font-mono text-[11px] text-text-dim ml-2">
                    {l.key}
                  </span>
                </div>
                <div className="text-[13px] text-text-muted leading-[1.7] mt-1">
                  {l.desc}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[12px] text-text-muted leading-[1.7] mb-8">
        Los niveles son acumulativos en evidencia, no en verdad: L4 significa
        que existe evidencia financiera adicional — no que la entrega sea más
        real. Una entrega gratuita puede alcanzar certeza suficiente sin L4.
      </div>

      {/* Dimensión B — Estado del expediente */}
      <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-3">
        B · Estado del expediente — acreditación según política
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
        {DOSSIER_STATES.map((s) => (
          <div
            key={s.id}
            className={`bg-surface rounded-[14px] py-3.5 px-4 border ${
              s.id === "accredited" ? "border-green/40" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-mono text-[11px] font-semibold ${
                  s.id === "accredited"
                    ? "text-green"
                    : s.exception
                      ? "text-text-dim"
                      : "text-accent"
                }`}
              >
                {s.id}
              </span>
              <span className="font-serif text-[15px] text-text">{s.name}</span>
            </div>
            <div className="text-[12px] text-text-muted leading-[1.6]">
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl py-4 px-4 md:px-6 border border-border mb-8">
        <div className="font-mono text-[11px] text-text-muted font-semibold uppercase tracking-[0.08em] mb-2">
          La acreditación depende de una política
        </div>
        <pre className="font-mono text-[12px] text-text-body leading-[1.9] overflow-x-auto">
{`accreditation_policy
→ evidencia requerida
→ atestaciones requeridas
→ nivel mínimo de certeza
→ excepciones`}
        </pre>
        <div className="text-[12px] text-text-muted leading-[1.7] mt-2">
          Una Prueba de Servicio puede quedar acreditada en L1, L2, L3 o L4
          según el contexto y la política aplicable. El pago no es
          prerrequisito de la acreditación.
        </div>
      </div>

      {/* Dimensión C — Estado de liquidación */}
      <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-3">
        C · Estado de liquidación — los movimientos financieros
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {SETTLEMENT_STATES.map((s) => (
          <span
            key={s.id}
            title={s.desc}
            className="font-mono text-[11px] text-text-body bg-surface border border-border rounded-full px-3 py-1.5 cursor-help"
          >
            {s.id}
          </span>
        ))}
      </div>
      <div className="text-[12px] text-text-muted leading-[1.7] mb-8">
        La liquidación corre en su propio ciclo — puede ocurrir antes, después
        o nunca respecto de la entrega. Un pago conciliado no prueba por sí
        solo la calidad ni el alcance entregado, y una devolución no des-hace
        la entrega. Los estados son los de la dimensión{" "}
        <code className="font-mono text-[11px]">financial</code> de la
        extensión{" "}
        <a href="/extensions#state-dimensions" className="text-accent hover:underline">
          state-dimensions
        </a>
        .
      </div>

      <div className="bg-surface rounded-xl py-4 px-4 md:py-5 md:px-6 border border-border">
        <div className="font-mono text-[11px] text-text-muted font-semibold uppercase tracking-[0.08em] mb-3">
          Regla de presentación
        </div>
        <div className="text-sm text-text-body leading-[1.8]">
          La Prueba de Servicio nunca se muestra desnuda. Cualquier componente
          que la represente muestra a la vez su nivel de certeza (L1–L4) y su
          estado de expediente. Mostrar la prueba sin esas dos dimensiones
          tergiversa el expediente — y presentar la liquidación como si fuera
          la certeza sugiere que más pago equivale a más verdad.
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
