import { SectionTitle } from "./SectionTitle";

const antiCaptureItems = [
  {
    phase: "a",
    title: "Certificación objetiva y automatizada",
    desc: "Si una implementación pasa la suite de tests, está certificada. No hay aprobación discrecional, no hay gatekeepers, no hay procesos de revisión subjetivos.",
    borderColor: "border-l-[#2B8A3E]",
  },
  {
    phase: "b",
    title: "Reputación basada en entregas verificadas",
    desc: "La reputación en la red se deriva de entregas reales verificadas a través del protocolo — no de governance tokens, votos delegados ni métricas de participación.",
    borderColor: "border-l-accent",
  },
];

export function GobernanzaSection() {
  return (
    <section id="gobernanza" className="mb-16">
      <SectionTitle
        tag="13 — Gobernanza"
        title="Gobernanza del protocolo"
        subtitle="Servicialo es una especificación abierta. Cualquier plataforma que cumpla la especificación es un nodo válido de la red. Esta sección documenta los mecanismos que lo garantizan."
      />

      {/* Estado actual */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border mb-4">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
          Estado actual
        </div>
        <div className="font-serif text-lg text-text mb-2">
          Maintainer único, especificación abierta
        </div>
        <div className="text-[13px] text-text-body leading-[1.7]">
          Servicialo es mantenido por su autor. El protocolo está en fase de
          diseño activo donde la velocidad de iteración es prioritaria. Las
          decisiones están concentradas en un maintainer único. Esto es explícito
          y documentado.
        </div>
      </div>

      {/* Hoja de ruta */}
      <div className="mb-4">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          Diseño anti-captura
        </div>
        <div className="grid grid-cols-1 gap-3">
          {antiCaptureItems.map((item) => (
            <div
              key={item.phase}
              className={`bg-surface rounded-xl py-4 px-5 border border-border-light border-l-[3px] ${item.borderColor}`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-[11px] font-semibold text-accent">
                  ({item.phase})
                </span>
                <span className="font-mono text-[13px] font-semibold text-text">
                  {item.title}
                </span>
              </div>
              <div className="text-[13px] text-text-body leading-relaxed">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Principio rector */}
      <div className="bg-dark rounded-[14px] py-5 px-6 text-white">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
          Principio rector
        </div>
        <div className="font-serif text-lg text-white mb-2">
          Indiferencia al implementador
        </div>
        <div className="text-[13px] text-white/70 leading-[1.7]">
          El protocolo debe ser indiferente a quién lo implementa — igual que
          HTTP es indiferente a si usas Apache o Nginx, y SMTP es indiferente a
          si usas Gmail o Fastmail. Si cumples la especificación, eres un nodo
          válido de la red. Sin permisos, sin aprobaciones, sin excepciones.
        </div>
      </div>
    </section>
  );
}
