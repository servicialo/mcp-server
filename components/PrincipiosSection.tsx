import { SectionTitle } from "./SectionTitle";
import { PRINCIPLES } from "@/lib/data";

export function PrincipiosSection() {
  return (
    <section id="principios" className="mb-16">
      <SectionTitle
        tag="05 — Principios"
        title="Las reglas del estándar"
        subtitle="Servicialo se construye sobre 6 principios que aplican a cualquier servicio en cualquier industria."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRINCIPLES.map((p, i) => (
          <div
            key={i}
            className="bg-surface rounded-[14px] py-4 px-4 md:py-[22px] md:px-6 border border-border transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="font-mono text-[10px] text-accent mb-2 uppercase tracking-[0.1em]">
              Principio {String(i + 1).padStart(2, "0")}
            </div>
            <div className="font-serif text-lg text-text mb-2.5 leading-[1.3]">
              {p.title}
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7]">
              {p.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
