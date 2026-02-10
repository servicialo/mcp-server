"use client";

import { useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { SERVICE_ORIGINS } from "@/lib/data";

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
} as const;

export function OrigenSection() {
  const [expanded, setExpanded] = useState<string | null>("asset");

  return (
    <section id="origen" className="mb-16">
      <SectionTitle
        tag="02 — Origen"
        title="Todo servicio nace de tres fuentes"
        subtitle="No necesitas una idea revolucionaria. Necesitas reconocer qué ya tienes."
      />

      <div className="flex flex-col gap-2.5">
        {SERVICE_ORIGINS.map((origin) => {
          const isExpanded = expanded === origin.id;
          const colors = colorMap[origin.color];

          return (
            <div
              key={origin.id}
              onClick={() =>
                setExpanded(isExpanded ? null : origin.id)
              }
              className={`rounded-2xl cursor-pointer transition-all duration-300 ${
                isExpanded
                  ? `${colors.soft} ${colors.border} border p-6`
                  : "bg-surface border border-border p-5"
              }`}
            >
              <div
                className={`flex items-center gap-3.5 ${
                  isExpanded ? "mb-4" : ""
                }`}
              >
                <span className="text-[32px]">{origin.emoji}</span>
                <div className="flex-1">
                  <div className="font-serif text-[22px] text-text">
                    {origin.title}
                  </div>
                  <div className="text-sm text-text-muted mt-0.5">
                    {origin.subtitle}
                  </div>
                </div>
                <div
                  className={`w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center text-xs transition-all duration-300 ${
                    isExpanded
                      ? `${colors.border} ${colors.text} rotate-90`
                      : "border-border text-text-dim"
                  }`}
                >
                  →
                </div>
              </div>

              {isExpanded && (
                <div>
                  <p className="text-[15px] text-text-body leading-[1.7] mb-5">
                    {origin.desc}
                  </p>

                  {/* Pregunta clave */}
                  <div
                    className={`bg-surface rounded-xl py-4 px-5 mb-4 border-l-[3px] ${colors.borderLeft}`}
                  >
                    <div
                      className={`font-mono text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 ${colors.text}`}
                    >
                      Pregunta clave
                    </div>
                    <div className="font-serif text-xl text-text leading-[1.4]">
                      {origin.keyQuestion}
                    </div>
                  </div>

                  {/* Fórmula */}
                  <div className="font-mono text-[13px] text-text-body bg-surface-alt rounded-lg py-3 px-4 text-center mb-5 tracking-[0.02em]">
                    {origin.formula}
                  </div>

                  {/* Ejemplos — grid 2 columnas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {origin.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="bg-surface rounded-[10px] py-3 px-3.5 border border-border-light"
                      >
                        <div className="text-xs text-text-muted mb-1">
                          {ex.asset}
                        </div>
                        <div className="text-[13px] font-semibold text-text">
                          → {ex.service}
                        </div>
                        {ex.ref && (
                          <div
                            className={`text-[11px] mt-1 italic ${colors.text}`}
                          >
                            {ex.ref}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insight final */}
      <div className="mt-6 bg-accent-soft rounded-xl py-5 px-6 border-l-[3px] border-l-accent">
        <div className="font-mono text-[11px] text-accent font-semibold uppercase tracking-[0.08em] mb-2">
          Insight
        </div>
        <div className="text-[15px] text-text-body leading-[1.7]">
          Los servicios más valiosos combinan dos o tres fuentes. Un kinesiólogo
          usa su <strong>ventaja</strong> (certificación + experiencia) aplicada
          en su <strong>tiempo</strong>, a veces con un{" "}
          <strong>activo</strong> (equipamiento especializado). Mientras más
          fuentes combines, más difícil de replicar y más valioso el servicio.
        </div>
      </div>
    </section>
  );
}
