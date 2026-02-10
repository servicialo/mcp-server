export function HeroSection() {
  return (
    <section className="mb-16 md:mb-20">
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
        El estándar abierto para servicios
      </div>
      <h1 className="font-serif text-[36px] md:text-[52px] font-normal text-text leading-[1.1] tracking-[-0.02em] mb-5">
        Cualquier persona puede
        <br />
        crear un servicio.
        <br />
        <span className="text-accent">
          Cualquier agente puede
          <br />
          coordinarlo.
        </span>
      </h1>
      <p className="text-base md:text-lg text-text-muted leading-[1.7] max-w-[540px]">
        Servicialo define el lenguaje universal para crear, entregar y verificar
        servicios — para humanos y para agentes AI.
      </p>
      <div className="flex flex-wrap gap-4 md:gap-6 mt-8 font-mono text-xs text-text-dim">
        <span>◆ Estándar abierto</span>
        <span>◆ Machine-readable</span>
        <span>◆ Human-first</span>
      </div>
    </section>
  );
}
