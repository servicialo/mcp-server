import { SectionTitle } from "./SectionTitle";
import { IMPLEMENTATIONS } from "@/lib/manifest";

export function RedSection() {
  const reference = IMPLEMENTATIONS.find((i) => i.role === "reference");
  const liveCount = IMPLEMENTATIONS.filter((i) => i.status === "live").length;
  const independentCount = IMPLEMENTATIONS.filter(
    (i) => i.role !== "reference"
  ).length;
  const sinceYear = reference?.since?.slice(0, 4) ?? "2026";

  return (
    <section id="implementaciones" className="mb-16">
      <SectionTitle
        tag="05 — Implementaciones y red"
        title="Una implementación de referencia, una red opt-in"
        subtitle="El protocolo no depende de una plataforma, de la red ni de una autoridad central."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="bg-surface rounded-[14px] py-5 px-5 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            Referencia
          </div>
          <div className="text-[13px] text-text-body leading-[1.7]">
            <a
              href={reference?.url ?? "https://coordinalo.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-text hover:text-accent transition-colors"
            >
              Coordinalo
            </a>{" "}
            es la implementación de referencia — no el protocolo ni la única
            forma de implementarlo. Opera en producción (vertical salud) desde{" "}
            {sinceYear}.
          </div>
        </div>
        <div className="bg-surface rounded-[14px] py-5 px-5 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            Implementaciones independientes
          </div>
          <div className="text-[13px] text-text-body leading-[1.7]">
            Cualquier plataforma puede implementar Servicialo desde la
            especificación. La conformidad se revisa manualmente hoy; la suite
            automatizada es objetivo del roadmap, no una capacidad actual.
          </div>
        </div>
        <div className="bg-surface rounded-[14px] py-5 px-5 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            La red es opt-in
          </div>
          <div className="text-[13px] text-text-body leading-[1.7]">
            El registro en el resolver y la telemetría son opcionales. Una
            implementación es conforme sin registrarse ni compartir datos.
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-4">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
          Cómo leer las cifras
        </div>
        <div className="text-[13px] md:text-sm text-text-body leading-[1.7]">
          La telemetría distingue cuatro cosas distintas:{" "}
          <strong>instalaciones técnicas detectadas</strong> (hosts únicos,
          anónimos), <strong>nodos recientemente activos</strong>,{" "}
          <strong>implementaciones verificadas</strong> y{" "}
          <strong>organizaciones operando en producción</strong>. Instalar el
          servidor no es operar servicios: hoy hay{" "}
          {liveCount === 1
            ? "una implementación en producción"
            : `${liveCount} implementaciones en producción`}{" "}
          y{" "}
          {independentCount === 0
            ? "ninguna implementación independiente verificada todavía"
            : `${independentCount} implementaciones independientes verificadas`}
          . Las instalaciones indican interés técnico, no adopción
          operacional.
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <a
          href="/network"
          className="font-mono text-[11px] text-accent hover:text-text transition-colors"
        >
          Telemetría en vivo →
        </a>
        <a
          href="/implementors"
          className="font-mono text-[11px] text-accent hover:text-text transition-colors"
        >
          Implementaciones y verificación →
        </a>
      </div>
    </section>
  );
}
