import { getNetworkStats } from "@/lib/telemetry-stats";
import { IMPLEMENTATIONS, PROTOCOL_VERSION } from "@/lib/manifest";

// Índice de la portada: refleja las secciones numeradas de la página.
const TOC = [
  { num: "01", label: "El problema", anchor: "#problema" },
  { num: "02", label: "Qué estandariza", anchor: "#que-estandariza" },
  { num: "03", label: "Un ejemplo", anchor: "#ejemplo" },
  { num: "04", label: "Estado actual", anchor: "#estado-actual" },
  { num: "05", label: "Implementaciones y red", anchor: "#implementaciones" },
  { num: "06", label: "Siguiente paso", anchor: "#empezar" },
];

export async function HeroSection() {
  const stats = await getNetworkStats();
  const hostCount = stats.uniqueHosts;
  const countryCount = stats.countryBreakdown.length;
  const liveCount = IMPLEMENTATIONS.filter((i) => i.status === "live").length;

  return (
    <section className="mb-16 md:mb-24">
      <div className="border-y border-border py-2.5 mb-9 md:mb-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
        <span>Protocolo abierto para servicios</span>
        <span>v{PROTOCOL_VERSION} — Borrador</span>
      </div>

      <h1 className="font-serif text-[36px] md:text-[58px] font-normal text-text leading-[1.08] tracking-[-0.01em] mb-5 md:mb-6">
        Una semántica común para{" "}
        <em className="text-accent">acordar, entregar y compensar</em>{" "}
        servicios
      </h1>
      <p className="font-serif text-[17px] md:text-[19px] text-text-body leading-[1.65] max-w-[600px]">
        Servicialo conecta lo ofrecido, lo acordado, lo entregado, la
        evidencia de la entrega y su liquidación, para que plataformas,
        sistemas y agentes operen servicios con un lenguaje compartido.
      </p>

      {(liveCount > 0 || hostCount > 0) && (
        <a
          href="/network"
          title="Hosts únicos del servidor MCP detectados por telemetría anónima. Una instalación técnica no equivale a una organización operando servicios."
          className="group inline-flex items-center gap-2.5 mt-6 font-mono text-[11px] text-text-muted hover:text-accent transition-colors"
        >
          <span aria-hidden className="inline-block w-[7px] h-[7px] bg-green" />
          <span className="underline decoration-border group-hover:decoration-accent underline-offset-4 transition-colors">
            {liveCount > 0 && (
              <>
                {liveCount}{" "}
                {liveCount === 1
                  ? "implementación en producción"
                  : "implementaciones en producción"}
              </>
            )}
            {liveCount > 0 && hostCount > 0 && " · "}
            {hostCount > 0 && (
              <>
                {hostCount} instalaciones técnicas detectadas en {countryCount}{" "}
                {countryCount === 1 ? "país" : "países"}
              </>
            )}
          </span>
        </a>
      )}

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
