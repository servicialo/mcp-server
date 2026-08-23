import { IMPLEMENTATIONS, PROTOCOL_VERSION } from "@/lib/manifest";

// Índice de la portada: refleja las secciones numeradas de la página.
// El orden abre por el rol y el porqué; el modelo de datos entra después.
const TOC = [
  { num: "01", label: "El problema", anchor: "#problema" },
  { num: "02", label: "Por qué un protocolo", anchor: "#por-que" },
  { num: "03", label: "Fuera de alcance", anchor: "#fuera-de-alcance" },
  { num: "04", label: "El modelo", anchor: "#que-estandariza" },
  { num: "05", label: "Un ejemplo", anchor: "#ejemplo" },
  { num: "06", label: "Estado y honestidad epistémica", anchor: "#estado-actual" },
  { num: "07", label: "Siguiente paso", anchor: "#empezar" },
];

export function HeroSection() {
  const independentCount = IMPLEMENTATIONS.filter(
    (i) => i.role !== "reference"
  ).length;

  return (
    <section className="mb-16 md:mb-24">
      <div className="border-y border-border py-2.5 mb-9 md:mb-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
        <span>Protocolo abierto para servicios</span>
        <span>v{PROTOCOL_VERSION} — Borrador</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span aria-hidden className="h-px w-7 bg-accent" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          Declaración de rol
        </span>
      </div>

      <h1 className="font-serif text-[26px] md:text-[38px] font-normal text-text leading-[1.25] tracking-[-0.01em] mb-6 md:mb-7 max-w-[820px]">
        Servicialo define qué significa que un servicio fue{" "}
        <em className="text-accent">prometido, entregado y probado</em>, para
        que dos sistemas que no se conocen puedan estar de acuerdo sin depender
        de un intermediario que lo garantice.
      </h1>

      <p className="font-serif text-[17px] md:text-[19px] text-text-body leading-[1.65] max-w-[620px]">
        Es una especificación, no una plataforma: define la semántica —
        oferta, acuerdo, entrega, evidencia y liquidación — y deja a cada
        implementación el resto.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="/spec"
          className="inline-flex items-center gap-2.5 bg-text text-bg hover:bg-accent hover:text-white font-mono text-[12px] font-semibold px-5 py-3 transition-colors"
        >
          Leer la especificación
          <span aria-hidden>→</span>
        </a>
        <a
          href="/implementors"
          className="inline-flex items-center gap-2.5 border border-text text-text hover:bg-text hover:text-bg font-mono text-[12px] font-semibold px-5 py-3 transition-colors"
        >
          Cómo implementarlo
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-1.5 font-mono text-[11px] text-text-dim">
        <span>Especificación abierta (Apache-2.0)</span>
        <span>Independiente del transporte — HTTP · MCP · A2A</span>
      </div>

      {/* Estado, arriba y sin adornos: el lector debe saber qué está leyendo
          antes de leerlo. El detalle vive en §06. */}
      <a
        href="#estado-actual"
        className="group block mt-7 border-l-2 border-border hover:border-text-dim pl-4 transition-colors"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1.5">
          Estado
        </div>
        <div className="text-[13px] text-text-body leading-[1.7] max-w-[620px]">
          Borrador de especificación, mantenido por un autor único. Una
          implementación de referencia, escrita por el mismo autor.{" "}
          {independentCount === 0
            ? "Ninguna implementación independiente verificada todavía."
            : `${independentCount} implementaciones independientes verificadas.`}{" "}
          <span className="text-text-muted underline decoration-border group-hover:decoration-accent underline-offset-4 transition-colors">
            Cómo leer esto →
          </span>
        </div>
      </a>

      <nav aria-label="Índice" className="mt-12 md:mt-14">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Índice
          </span>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>
        <ol className="list-none space-y-2.5">
          {TOC.map((item) => (
            <li key={item.anchor}>
              <a
                href={item.anchor}
                className="group flex items-baseline gap-3 font-mono text-[12px]"
              >
                <span className="text-text-dim tabular-nums">{item.num}</span>
                <span className="text-text group-hover:text-accent transition-colors">
                  {item.label}
                </span>
                <span
                  aria-hidden
                  className="flex-1 border-b border-dotted border-border -translate-y-[3px] group-hover:border-text-dim transition-colors"
                />
                <span className="text-[11px] text-text-dim group-hover:text-accent transition-colors">
                  {item.anchor}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
