import { getNetworkStats } from "@/lib/telemetry-stats";

export async function HeroSection() {
  const stats = await getNetworkStats();
  const nodeCount = stats.totalInstances;
  const countryCount = stats.countryBreakdown.length;

  return (
    <section className="mb-14 md:mb-20">
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
        El estándar abierto para servicios profesionales
      </div>
      <h1 className="font-serif text-[32px] md:text-[52px] font-normal text-text leading-[1.12] tracking-[-0.02em] mb-5">
        Donde los agentes encuentran servicios reales.{" "}
        <span className="text-accent">
          MCP y A2A son el transporte — Servicialo es el destino.
        </span>
      </h1>
      <p className="text-[15px] md:text-lg text-text-body leading-[1.7] max-w-[600px] mb-3">
        HTTP le dio una dirección a cada documento. Servicialo le da una dirección a cada servicio.
      </p>
      <p className="text-[14px] md:text-[15px] text-text-muted leading-[1.7] max-w-[540px]">
        El protocolo abierto que coordina servicios profesionales
        — para humanos y para agentes de inteligencia artificial. Construido sobre MCP y A2A, los estándares emergentes de comunicación entre agentes.
      </p>
      <div className="flex flex-wrap gap-3 md:gap-6 mt-6 md:mt-8 font-mono text-[11px] text-text-dim">
        <span>◆ Estándar abierto</span>
        <span>◆ Legible por máquinas</span>
        <span>◆ Diseñado para humanos</span>
      </div>
      {nodeCount > 0 && (
        <a
          href="/network"
          className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 rounded-full border border-border bg-surface-alt hover:border-accent transition-colors group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="font-mono text-[11px] text-text-muted group-hover:text-accent transition-colors">
            {nodeCount} nodos en {countryCount} {countryCount === 1 ? "país" : "países"}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim group-hover:text-accent transition-colors">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      )}
      <div className="mt-6 md:mt-8">
        <a
          href="/whitepaper"
          className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Leer el whitepaper
        </a>
      </div>
    </section>
  );
}
