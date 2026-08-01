import { SectionTitle } from "./SectionTitle";

const PATHS = [
  {
    label: "Entender",
    title: "Quiero entender el protocolo",
    desc: "La especificación de lectura: objetos, estados, bindings y requisitos de conformance en una página.",
    link: "/spec",
    linkText: "Leer la especificación →",
  },
  {
    label: "Implementar",
    title: "Quiero implementarlo",
    desc: "Niveles de conformidad, guía de implementación paso a paso y cómo verificar tu implementación.",
    link: "/implementors",
    linkText: "Cómo implementar →",
  },
  {
    label: "Ver en operación",
    title: "Quiero ver una implementación operando",
    desc: "Coordinalo, la implementación de referencia, opera en producción en la vertical salud.",
    link: "https://coordinalo.com",
    linkText: "Ver Coordinalo →",
  },
];

export function AudienciasSection() {
  return (
    <section id="empezar" className="mb-16">
      <SectionTitle
        tag="06 — Siguiente paso"
        title="Tres caminos de entrada"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {PATHS.map((path) => (
          <div
            key={path.label}
            className="bg-surface rounded-[14px] py-[22px] px-6 border border-border transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.1em] mb-1.5">
              {path.label}
            </div>
            <div className="font-serif text-lg text-text mb-2">
              {path.title}
            </div>
            <div className="text-[13px] text-text-muted leading-relaxed mb-3">
              {path.desc}
            </div>
            <a
              href={path.link}
              className="font-mono text-[11px] text-accent hover:text-text transition-colors"
              {...(path.link.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {path.linkText}
            </a>
          </div>
        ))}
      </div>

      <p className="text-[12px] text-text-muted leading-[1.7]">
        Servicialo es mantenido por su autor, con especificación abierta
        (Apache-2.0). El código, el proceso de cambios y la gobernanza están
        documentados en{" "}
        <a
          href="https://github.com/servicialo/mcp-server"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          GitHub
        </a>{" "}
        y{" "}
        <a
          href="https://github.com/servicialo/mcp-server/blob/main/GOVERNANCE.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          GOVERNANCE.md
        </a>
        .
      </p>
    </section>
  );
}
