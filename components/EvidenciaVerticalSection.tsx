"use client";

import { useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { EVIDENCE_BY_VERTICAL } from "@/lib/data";

const colorMap = {
  blue: {
    soft: "bg-blue-soft",
    border: "border-blue/25",
    text: "text-blue",
    borderLeft: "border-l-blue",
  },
  purple: {
    soft: "bg-purple-soft",
    border: "border-purple/25",
    text: "text-purple",
    borderLeft: "border-l-purple",
  },
  green: {
    soft: "bg-green-soft",
    border: "border-green/25",
    text: "text-green",
    borderLeft: "border-l-green",
  },
  accent: {
    soft: "bg-accent-soft",
    border: "border-accent/25",
    text: "text-accent",
    borderLeft: "border-l-accent",
  },
} as const;

export function EvidenciaVerticalSection() {
  const [expanded, setExpanded] = useState<string | null>("salud");

  return (
    <section id="evidencia-vertical" className="mb-16">
      <SectionTitle
        tag="Evidence Profiles — Evidencia por vertical"
        title="Qué constituye prueba"
        subtitle="Cada política define qué evidencia se necesita para acreditar una Prueba de Servicio. Los perfiles por vertical son ejemplos configurables — no requisitos universales del protocolo. Resolver disputas sin intervención humana es un caso de uso — no el fin."
      />

      <div className="flex flex-col gap-2.5">
        {EVIDENCE_BY_VERTICAL.map((vertical) => {
          const isExpanded = expanded === vertical.vertical;
          const colors = colorMap[vertical.color];

          return (
            <div
              key={vertical.vertical}
              onClick={() =>
                setExpanded(isExpanded ? null : vertical.vertical)
              }
              className={`rounded-none cursor-pointer transition-all duration-300 ${
                isExpanded
                  ? `${colors.soft} ${colors.border} border p-4 md:p-6`
                  : "bg-surface border border-border p-4 md:p-5"
              }`}
            >
              <div
                className={`flex items-center gap-3.5 ${
                  isExpanded ? "mb-4" : ""
                }`}
              >
                <span className="text-2xl md:text-[32px]">{vertical.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-lg md:text-[22px] text-text">
                    {vertical.label}
                  </div>
                  <div className="text-sm text-text-muted mt-0.5">
                    Ejemplo de política: {vertical.required.length} evidencias posibles
                  </div>
                </div>
                <div
                  className={`w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center text-xs transition-all duration-300 ${
                    isExpanded
                      ? `${colors.border} ${colors.text} rotate-90`
                      : "border-border text-text-dim"
                  }`}
                >
                  &rarr;
                </div>
              </div>

              {isExpanded && (
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="text-[12px] text-text-muted leading-[1.6] mb-3">
                    Posibles evidencias según el tipo de servicio, el acuerdo,
                    la política aplicable y la regulación correspondiente.
                  </div>
                  {/* Tabla de evidencia */}
                  <div className="flex flex-col gap-1.5 mb-4">
                    {vertical.required.map((ev, i) => (
                      <div
                        key={ev.type}
                        className={`rounded-none py-3 px-3.5 md:px-4 ${
                          i % 2 === 0
                            ? "bg-surface border border-border-light"
                            : "border border-transparent"
                        }`}
                      >
                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-[160px_1fr_auto] gap-3 items-start">
                          <div className="font-mono text-[12px] font-semibold text-text">
                            {ev.label}
                          </div>
                          <div className="text-[13px] text-text-body leading-relaxed">
                            {ev.desc}
                          </div>
                          <div
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                              ev.auto
                                ? "bg-green/15 text-green"
                                : "bg-surface-alt text-text-dim"
                            }`}
                          >
                            {ev.auto ? "auto" : "manual"}
                          </div>
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-mono text-[12px] font-semibold text-text">
                              {ev.label}
                            </div>
                            <div
                              className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                                ev.auto
                                  ? "bg-green/15 text-green"
                                  : "bg-surface-alt text-text-dim"
                              }`}
                            >
                              {ev.auto ? "auto" : "manual"}
                            </div>
                          </div>
                          <div className="text-[13px] text-text-body leading-relaxed">
                            {ev.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Regla de resolución */}
                  <div
                    className={`bg-surface rounded-none py-4 px-5 border-l-[3px] ${colors.borderLeft}`}
                  >
                    <div
                      className={`font-mono text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 ${colors.text}`}
                    >
                      Regla de acreditación ilustrativa
                    </div>
                    <div className="text-[13px] text-text-body leading-[1.7]">
                      {vertical.resolution_rule}
                    </div>
                    <div className="mt-1.5 text-[12px] text-text-dim leading-[1.6]">
                      Esto no determina por sí solo la calidad del servicio ni
                      la verdad absoluta de cada afirmación.
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dato clave */}
      <div className="mt-6 bg-surface rounded-none py-4 px-4 md:py-5 md:px-6 border border-border">
        <div className="font-mono text-[11px] text-text-muted font-semibold uppercase tracking-[0.08em] mb-3">
          ¿Por qué separar por vertical?
        </div>
        <div className="text-sm text-text-body leading-[1.8]">
          Un kinesiólogo y un electricista entregan servicios radicalmente distintos.
          Pedirle a ambos la misma evidencia no funciona. Cada perfil puede
          definir políticas configurables según el tipo de servicio, el acuerdo,
          la sensibilidad de los datos y la regulación aplicable. La
          verificación comprueba de forma reproducible si la evidencia
          satisface esos requisitos explícitos; no convierte una señal aislada
          en verdad objetiva ni reemplaza el juicio sobre la calidad.
        </div>
      </div>
    </section>
  );
}
