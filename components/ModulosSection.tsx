import { SectionTitle } from "./SectionTitle";
import { MODULES } from "@/lib/data";

const statusStyles = {
  green: "bg-[#2B8A3E]/10 text-[#2B8A3E] dark:bg-[#2B8A3E]/20 dark:text-[#4ADE80]",
  accent: "bg-accent/10 text-accent",
} as const;

export function ModulosSection() {
  return (
    <section id="modulos" className="mb-16">
      <SectionTitle
        tag="08 — Módulos"
        title="Arquitectura por capas"
        subtitle="Adopta solo lo que necesitas. Core cubre el ciclo completo de un servicio. Los módulos agregan capacidades para operaciones más complejas."
      />

      <div className="grid grid-cols-1 gap-3">
        {MODULES.map((mod) => (
          <div
            key={mod.id}
            className="bg-surface rounded-[14px] py-4 px-4 md:py-[22px] md:px-6 border border-border transition-shadow duration-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="font-mono text-[13px] md:text-sm font-semibold text-text">
                {mod.name}
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${
                  statusStyles[mod.statusColor]
                }`}
              >
                {mod.status}
              </span>
            </div>

            <div className="text-[13px] text-text-muted leading-[1.7] mb-3">
              {mod.desc}
            </div>

            <div className="text-[12px] text-text-muted leading-[1.7] mb-3">
              <span className="font-mono text-[10px] text-accent uppercase tracking-[0.08em]">
                Para quién
              </span>
              <br />
              {mod.audience}
            </div>

            <div>
              <span className="font-mono text-[10px] text-accent uppercase tracking-[0.08em]">
                Incluye
              </span>
              <ul className="mt-1.5 space-y-1">
                {mod.includes.map((item, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-text-body leading-[1.6] flex items-start gap-2"
                  >
                    <span className="text-accent mt-[3px] shrink-0">
                      &bull;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-surface rounded-[14px] py-4 px-4 md:py-5 md:px-6 border border-border">
        <div className="text-[13px] text-text-muted leading-[1.7]">
          <span className="font-semibold text-text">Un implementador puede ser Servicialo Core certified sin adoptar los módulos opcionales.</span>{" "}
          Los módulos están diseñados para agregarse de forma independiente según la complejidad de tu operación.
        </div>
      </div>
    </section>
  );
}
