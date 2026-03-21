import { SectionTitle } from "./SectionTitle";

const roadmapItems = [
  {
    phase: "a",
    title: "Suite de tests objetivos",
    desc: "Mecanismo de certificación basado en resultados: si una implementación pasa los tests, está certificada. Sin aprobación discrecional, sin gatekeepers.",
    borderColor: "border-l-[#2B8A3E]",
  },
  {
    phase: "b",
    title: "Reputación bottom-up",
    desc: "Sistema de reputación basado en entregas reales verificadas — no en governance tokens ni en votos delegados. La confianza se gana entregando servicios, no acumulando tokens.",
    borderColor: "border-l-accent",
  },
  {
    phase: "c",
    title: "Comité multi-stakeholder",
    desc: "Cuando existan 3+ implementadores independientes en producción, la maintainership se transfiere a un comité representativo. El criterio es adopción real, no promesas.",
    borderColor: "border-l-[#7EC8E3]",
  },
];

export function GobernanzaSection() {
  return (
    <section id="gobernanza" className="mb-16">
      <SectionTitle
        tag="13 — Gobernanza"
        title="Gobernanza del protocolo"
        subtitle="Un protocolo abierto requiere gobernanza transparente. Servicialo documenta su estado actual y su hoja de ruta hacia la descentralización."
      />

      {/* Estado actual */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border mb-4">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
          Estado actual
        </div>
        <div className="font-serif text-lg text-text mb-2">
          Centralización temporal y transparente
        </div>
        <div className="text-[13px] text-text-body leading-[1.7]">
          Servicialo es mantenido actualmente por su autor como maintainer único.
          Esta centralización es temporal, documentada de forma transparente, y
          existe porque el protocolo está en fase de diseño activo donde la
          velocidad de iteración es crítica. No es un modelo de gobernanza
          definitivo — es un punto de partida honesto.
        </div>
      </div>

      {/* Hoja de ruta */}
      <div className="mb-4">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          Hoja de ruta hacia la descentralización
        </div>
        <div className="grid grid-cols-1 gap-3">
          {roadmapItems.map((item) => (
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
