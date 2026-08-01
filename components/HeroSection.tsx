import { getNetworkStats } from "@/lib/telemetry-stats";
import { IMPLEMENTATIONS, PROTOCOL_VERSION } from "@/lib/manifest";

export async function HeroSection() {
  const stats = await getNetworkStats();
  const hostCount = stats.uniqueHosts;
  const countryCount = stats.countryBreakdown.length;
  const liveCount = IMPLEMENTATIONS.filter((i) => i.status === "live").length;

  return (
    <section className="mb-14 md:mb-20">
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
        Protocolo abierto para servicios
      </div>
      <h1 className="font-serif text-[32px] md:text-[52px] font-normal text-text leading-[1.12] tracking-[-0.02em] mb-5">
        Una semántica común para{" "}
        <span className="text-accent">acordar, entregar y compensar</span>{" "}
        servicios
      </h1>
      <p className="text-[15px] md:text-lg text-text-body leading-[1.7] max-w-[620px]">
        Servicialo conecta lo ofrecido, lo acordado, lo entregado, la
        evidencia de la entrega y su liquidación, para que plataformas,
        sistemas y agentes operen servicios con un lenguaje compartido.
      </p>
      <div className="flex flex-wrap gap-3 md:gap-6 mt-6 md:mt-8 font-mono text-[11px] text-text-dim">
        <span>◆ Especificación abierta (Apache-2.0)</span>
        <span>◆ Independiente del transporte — HTTP · MCP · A2A</span>
        <span>◆ v{PROTOCOL_VERSION} (borrador)</span>
      </div>
      {hostCount > 0 && (
        <a
          href="/network"
          title="Hosts únicos del servidor MCP detectados por telemetría anónima. Una instalación técnica no equivale a una organización operando servicios."
          className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 rounded-full border border-border bg-surface-alt hover:border-accent transition-colors group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="font-mono text-[11px] text-text-muted group-hover:text-accent transition-colors">
            {liveCount}{" "}
            {liveCount === 1
              ? "implementación en producción"
              : "implementaciones en producción"}{" "}
            · {hostCount} instalaciones técnicas detectadas en {countryCount}{" "}
            {countryCount === 1 ? "país" : "países"}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim group-hover:text-accent transition-colors">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      )}
      <div className="mt-6 md:mt-8 flex flex-wrap gap-3">
        <a
          href="/spec"
          className="inline-flex items-center gap-2 bg-accent text-white hover:bg-accent-dark font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          Leer la especificación
        </a>
        <a
          href="/implementors"
          className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          Cómo implementarlo
        </a>
      </div>
    </section>
  );
}
