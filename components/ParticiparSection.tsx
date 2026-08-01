import { SectionTitle } from "./SectionTitle";

const cards = [
  {
    title: "Implementadores",
    desc: "Implementa el protocolo en tu plataforma. La especificación, los schemas y la guía paso a paso están en GitHub.",
    icon: "\u{1F528}",
    label: "Construir",
    link: "/implementors",
    linkText: "Cómo implementar →",
  },
  {
    title: "Proveedores",
    desc: "Ofrece servicios en un formato que agentes IA entienden y pueden coordinar, a través de una plataforma compatible.",
    icon: "\u{1F3AF}",
    label: "Ofrecer",
    link: "https://coordinalo.com",
    linkText: "Implementación de referencia →",
  },
  {
    title: "Agentes IA",
    desc: "Descubre, agenda y verifica servicios con una semántica estandarizada, vía MCP, HTTP o A2A.",
    icon: "\u{1F916}",
    label: "Conectar",
    link: "/spec",
    linkText: "Ver la especificación →",
  },
];

export function ParticiparSection() {
  return (
    <section id="participar" className="mb-16">
      <SectionTitle
        tag="10 — Participa"
        title="Implementa el protocolo"
        subtitle="Cualquier plataforma puede implementar Servicialo. La especificación es abierta (Apache-2.0) y la red es opcional: una implementación es conforme sin depender de una autoridad central ni compartir datos."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-surface rounded-[14px] py-[22px] px-6 border border-border transition-shadow duration-200 hover:shadow-sm"
          >
            <span className="text-[28px]">{card.icon}</span>
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mt-2 mb-1.5">
              {card.label}
            </div>
            <div className="font-serif text-lg text-text mb-2">{card.title}</div>
            <div className="text-[13px] text-text-muted leading-relaxed mb-3">
              {card.desc}
            </div>
            {card.link && (
              <a
                href={card.link}
                className="font-mono text-[11px] text-accent hover:text-text transition-colors"
              >
                {card.linkText}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Gobernanza compacta */}
      <div className="bg-surface rounded-[14px] py-5 px-6 border border-border">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
          Gobernanza
        </div>
        <div className="font-serif text-lg text-text mb-2">
          Maintainer único, especificación abierta
        </div>
        <div className="text-[13px] text-text-body leading-[1.7] mb-3">
          Servicialo es mantenido por su autor, en fase de diseño activo donde
          la velocidad de iteración es prioritaria. Esto es explícito y
          documentado. El principio rector es la indiferencia al implementador:
          el protocolo no privilegia a ninguna implementación, incluida la de
          referencia.
        </div>
        <div className="text-[13px] text-text-body leading-[1.7] mb-4">
          <span className="font-semibold text-text">
            La verificación de implementaciones es manual hoy
          </span>{" "}
          — pull request + revisión contra los requisitos de conformance. Una
          suite de certificación automatizada, sin gatekeepers, es el objetivo
          del roadmap; no una capacidad actual.
        </div>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://github.com/servicialo/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-accent hover:text-text transition-colors"
          >
            GitHub →
          </a>
          <a
            href="https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-accent hover:text-text transition-colors"
          >
            Guía IMPLEMENTING.md →
          </a>
          <a
            href="https://github.com/servicialo/mcp-server/blob/main/GOVERNANCE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-accent hover:text-text transition-colors"
          >
            GOVERNANCE.md →
          </a>
        </div>
      </div>
    </section>
  );
}
