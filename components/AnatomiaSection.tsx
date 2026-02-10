import { SectionTitle } from "./SectionTitle";
import { ANATOMY } from "@/lib/data";

export function AnatomiaSection() {
  return (
    <section id="anatomia" className="mb-16">
      <SectionTitle
        tag="03 — Anatomía"
        title="Las 8 dimensiones de un servicio"
        subtitle="Para que un agente AI pueda coordinar un servicio, necesita entender estas 8 dimensiones. Para que un humano pueda diseñar un buen servicio, también."
      />

      <div className="flex flex-col gap-1.5">
        {ANATOMY.map((item, i) => (
          <div
            key={item.field}
            className={`rounded-[10px] py-3 px-4 md:py-4 md:px-5 items-start ${
              i % 2 === 0
                ? "bg-surface border border-border-light"
                : "border border-transparent"
            }`}
          >
            {/* Desktop: 3 columnas */}
            <div className="hidden md:grid grid-cols-[120px_1fr_1fr] gap-4">
              <div className="font-mono text-[13px] font-semibold text-accent">
                {item.field}
              </div>
              <div className="text-sm text-text-body leading-relaxed">
                {item.desc}
              </div>
              <div className="text-xs text-text-muted italic leading-snug">
                {item.example}
              </div>
            </div>

            {/* Mobile: card con dimensión como header */}
            <div className="md:hidden">
              <div className="font-mono text-[13px] font-semibold text-accent mb-1.5">
                {item.field}
              </div>
              <div className="text-sm text-text-body leading-relaxed mb-1">
                {item.desc}
              </div>
              <div className="text-xs text-text-muted italic leading-snug">
                {item.example}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
