export function HeroSection() {
  return (
    <section className="mb-14 md:mb-20">
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
        El estándar abierto para servicios
      </div>
      <h1 className="font-serif text-[32px] md:text-[52px] font-normal text-text leading-[1.12] tracking-[-0.02em] mb-5">
        Cualquier persona puede crear un servicio.{" "}
        <span className="text-accent">
          Cualquier agente puede coordinarlo.
        </span>
      </h1>
      <p className="text-[15px] md:text-lg text-text-muted leading-[1.7] max-w-[540px]">
        El protocolo abierto que coordina servicios profesionales
        — para humanos y para agentes de inteligencia artificial.
      </p>
      <div className="flex flex-wrap gap-3 md:gap-6 mt-6 md:mt-8 font-mono text-[11px] text-text-dim">
        <span>◆ Estándar abierto</span>
        <span>◆ Legible por máquinas</span>
        <span>◆ Diseñado para humanos</span>
      </div>
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
