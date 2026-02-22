"use client";

import { useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { DISPUTE_RESOLUTION_FLOW, CONTRATO_FIELDS } from "@/lib/data";

export function ResolucionSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="resolucion" className="mb-16">
      <SectionTitle
        tag="05 — Resolución de disputas"
        title="Cuando hay desacuerdo"
        subtitle="Un mecanismo que no depende de buena voluntad, no requiere un juez centralizado, y que un agente AI puede ejecutar con la misma confianza que un humano."
      />

      {/* Flujo de resolución — dark card con stepper vertical */}
      <div className="bg-dark rounded-2xl p-4 md:p-7 text-white mb-4">
        <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-5">
          Flujo de resolución
        </div>

        <div className="flex flex-col gap-0">
          {DISPUTE_RESOLUTION_FLOW.map((s, i) => {
            const isActive = i === activeStep;
            const isPast = i < activeStep;

            return (
              <div key={s.id} className="flex gap-3.5">
                {/* Indicador vertical */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setActiveStep(i)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold transition-all duration-200 border-2 shrink-0 ${
                      isActive
                        ? "bg-accent border-accent text-white"
                        : isPast
                        ? "bg-green/20 border-green text-green"
                        : "bg-dark-soft border-[#444] text-[#666]"
                    }`}
                  >
                    {isPast ? "\u2713" : s.step}
                  </button>
                  {i < DISPUTE_RESOLUTION_FLOW.length - 1 && (
                    <div
                      className={`w-0.5 h-full min-h-[24px] transition-colors duration-300 ${
                        isPast ? "bg-green/40" : "bg-[#333]"
                      }`}
                    />
                  )}
                </div>

                {/* Contenido del paso */}
                <div className={`pb-5 ${i === DISPUTE_RESOLUTION_FLOW.length - 1 ? "pb-0" : ""}`}>
                  <button
                    onClick={() => setActiveStep(i)}
                    className="text-left"
                  >
                    <div
                      className={`font-mono text-[13px] font-semibold transition-colors ${
                        isActive ? "text-white" : "text-[#888]"
                      }`}
                    >
                      {s.label}
                    </div>
                  </button>
                  {isActive && (
                    <div className="mt-1.5">
                      <div className="text-sm text-[#999] leading-[1.7]">
                        {s.desc}
                      </div>
                      <div className="font-mono text-[10px] text-accent/70 mt-1.5">
                        Actor: {s.actor}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navegación */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className={`font-mono text-xs py-2 px-4 rounded-lg border border-[#444] bg-transparent transition-colors ${
              activeStep === 0
                ? "text-[#444] cursor-default"
                : "text-[#999] cursor-pointer hover:border-[#666]"
            }`}
          >
            &larr; Anterior
          </button>
          <button
            onClick={() =>
              setActiveStep(
                Math.min(DISPUTE_RESOLUTION_FLOW.length - 1, activeStep + 1)
              )
            }
            disabled={activeStep === DISPUTE_RESOLUTION_FLOW.length - 1}
            className={`font-mono text-xs py-2 px-4 rounded-lg border-none text-white transition-colors ${
              activeStep === DISPUTE_RESOLUTION_FLOW.length - 1
                ? "bg-[#333] cursor-default"
                : "bg-accent cursor-pointer hover:bg-accent-dark"
            }`}
          >
            Siguiente &rarr;
          </button>
        </div>
      </div>

      {/* Contrato de servicio — surface card */}
      <div className="bg-surface rounded-xl py-4 px-4 md:py-5 md:px-6 border border-border mb-4">
        <div className="font-mono text-[11px] text-accent font-semibold uppercase tracking-[0.08em] mb-2">
          Contrato de servicio
        </div>
        <div className="text-sm text-text-body leading-[1.8] mb-4">
          Antes de que un servicio pase de &quot;Solicitado&quot; a
          &quot;Agendado&quot;, ambas partes aceptan un contrato que define las
          reglas del juego. Una vez aceptado, ninguna parte puede modificarlo
          unilateralmente — ni el proveedor, ni el cliente, ni la plataforma.
        </div>

        {/* Campos del contrato */}
        <div className="flex flex-col gap-1.5">
          {CONTRATO_FIELDS.map((item, i) => (
            <div
              key={item.field}
              className={`rounded-[10px] py-3 px-4 md:py-3.5 md:px-5 ${
                i % 2 === 0
                  ? "bg-surface-alt border border-border-light"
                  : "border border-transparent"
              }`}
            >
              {/* Desktop: 3 columnas */}
              <div className="hidden md:grid grid-cols-[180px_1fr_1fr] gap-4">
                <div className="font-mono text-[12px] font-semibold text-accent">
                  {item.field}
                </div>
                <div className="text-sm text-text-body leading-relaxed">
                  {item.desc}
                </div>
                <div className="text-xs text-text-muted italic leading-snug">
                  {item.example}
                </div>
              </div>

              {/* Mobile: stacked */}
              <div className="md:hidden">
                <div className="font-mono text-[12px] font-semibold text-accent mb-1.5">
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
      </div>

      {/* Callout 80/20 */}
      <div className="bg-accent-soft rounded-xl py-4 px-4 md:py-5 md:px-6 border-l-[3px] border-l-accent">
        <div className="font-mono text-[11px] text-accent font-semibold uppercase tracking-[0.08em] mb-2">
          80/20
        </div>
        <div className="text-sm md:text-[15px] text-text-body leading-[1.7]">
          El 80% de las disputas se resuelven automáticamente comparando evidencia
          registrada contra el contrato. Sin intervención humana, sin
          discrecionalidad, sin demora. El 20% restante — evidencia ambigua o
          contradictoria — escala a árbitros del mismo vertical profesional que
          votan en 48 horas. El mecanismo de confianza no depende de que alguien{" "}
          <em>elija</em> cumplir: las reglas se ejecutan porque fueron aceptadas
          antes.
        </div>
      </div>
    </section>
  );
}
