import { SectionTitle } from "./SectionTitle";

export function DerivacionesSection() {
  return (
    <section id="derivaciones" className="mb-16">
      <SectionTitle
        tag="06 — ¿Por qué un estándar?"
        title="Las derivaciones no pueden depender de un WhatsApp"
        subtitle="La interoperabilidad entre organizaciones y profesionales es el valor que ningún otro sistema en Latinoamérica ofrece hoy."
      />

      {/* Bloque problema */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border border-l-[3px] border-l-accent mb-4">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mb-2">
          El problema
        </div>
        <div className="text-[15px] text-text leading-relaxed mb-3">
          Hoy una derivación entre profesionales es un WhatsApp.
        </div>
        <div className="text-[13px] text-text-muted leading-relaxed">
          El paciente tiene que re-explicar su historia. El profesional de
          origen no queda registrado. El resultado de la derivación nunca se
          sabe. No hay trazabilidad, no hay atribución del cobro, no hay dato.
        </div>
      </div>

      {/* Bloque solución — dark card */}
      <div className="bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white mb-4">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-4">
          Con Servicialo
        </div>
        <div className="font-serif text-lg md:text-xl text-white mb-5 leading-[1.3]">
          Una derivación es un objeto digital con estructura, contexto y
          trazabilidad completa.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              label: "Origen y destino",
              desc: "Profesional y organización de origen → profesional y organización de destino. Ambos identificados.",
            },
            {
              label: "Contexto clínico",
              desc: "La información relevante viaja con la derivación. El paciente no re-explica su historia.",
            },
            {
              label: "Estado trazable",
              desc: "Solicitada → aceptada → agendada → completada. Cada transición queda registrada.",
            },
            {
              label: "Atribución del cobro",
              desc: "Quién derivó, quién atendió, quién paga. La cadena de valor queda clara.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/5 rounded-[12px] py-4 px-5 border border-white/10"
            >
              <div className="font-mono text-[11px] text-accent mb-1.5">
                {item.label}
              </div>
              <div className="text-[13px] text-white/60 leading-relaxed">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque interoperabilidad */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border text-center">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mb-2">
          Interoperabilidad
        </div>
        <div className="text-[13px] text-text-muted leading-relaxed">
          Esto funciona entre organizaciones con distintos sistemas, siempre que
          ambas implementen el estándar. Una clínica en Santiago puede derivar a
          un especialista en Concepción — con contexto, trazabilidad y
          atribución — sin que ambos usen la misma plataforma.
        </div>
      </div>
    </section>
  );
}
