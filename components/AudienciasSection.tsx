import { SectionTitle } from "./SectionTitle";

const PATHS = [
  {
    label: "Entender",
    title: "Quiero entender el protocolo",
    desc: "La especificación de lectura: objetos, estados, bindings y requisitos de conformance en una página.",
    link: "/spec",
  },
  {
    label: "Implementar",
    title: "Quiero implementarlo",
    desc: "Niveles de conformidad, guía de implementación paso a paso y cómo verificar tu implementación.",
    link: "/implementors",
  },
  {
    label: "Ver en operación",
    title: "Quiero ver una implementación operando",
    desc: "Coordinalo, la implementación de referencia, opera en producción en la vertical salud.",
    link: "https://coordinalo.com",
  },
];

export function AudienciasSection() {
  return (
    <section id="empezar" className="mb-16 md:mb-24">
      <SectionTitle
        tag="06 — Siguiente paso"
        title="Tres caminos de entrada"
      />

      <div className="border-t border-border mb-8">
        {PATHS.map((path) => (
          <a
            key={path.label}
            href={path.link}
            className="group flex items-center gap-4 md:gap-6 border-b border-border py-5 md:py-6"
            {...(path.link.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <div className="hidden md:block w-32 shrink-0 font-mono text-[10px] text-text-muted uppercase tracking-[0.1em]">
              {path.label}
            </div>
            <div className="flex-1 min-w-0">
              <div className="md:hidden font-mono text-[10px] text-text-muted uppercase tracking-[0.1em] mb-1.5">
                {path.label}
              </div>
              <div className="font-serif text-lg md:text-xl font-medium text-text group-hover:text-accent transition-colors leading-snug">
                {path.title}
              </div>
              <div className="text-[13px] text-text-muted leading-relaxed mt-1">
                {path.desc}
              </div>
            </div>
            <div
              aria-hidden
              className="shrink-0 font-mono text-base text-text-dim group-hover:text-accent group-hover:translate-x-1 transition-all"
            >
              →
            </div>
          </a>
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
          className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
        >
          GitHub
        </a>{" "}
        y{" "}
        <a
          href="https://github.com/servicialo/mcp-server/blob/main/GOVERNANCE.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
        >
          GOVERNANCE.md
        </a>
        .
      </p>
    </section>
  );
}
